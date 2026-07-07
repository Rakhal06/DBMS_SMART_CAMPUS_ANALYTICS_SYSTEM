import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime
import logging
import urllib

# Setup Logging - This will show you exactly what the script is doing in the console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- CONFIGURATION SECTION ---

# 1. Your Server Name has been updated here
SERVER = r'rakhal\RSQL' 
DATABASE = 'SmartCampusDB'

# 2. This part builds the connection string for SQL Server (SSMS)
# We use the raw string r'' for the server name to ensure the backslash is handled correctly
params = urllib.parse.quote_plus(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    f"Trusted_Connection=yes;"
)
DB_CONNECTION_STRING = f"mssql+pyodbc:///?odbc_connect={params}"

class SmartCampusETL:
    def __init__(self, connection_string):
        """Initializes the connection to the database."""
        try:
            self.engine = create_engine(connection_string)
            logger.info(f"Database engine created successfully. Connected to SQL Server: {SERVER}")
        except Exception as e:
            logger.error(f"Failed to create database engine. Check your Server Name: {e}")

    def get_watermark(self):
        """Step 1: Get the last processed date to avoid duplicates (Incremental Load)."""
        try:
            with self.engine.connect() as conn:
                # Check the most recent date already in the Warehouse Fact table
                # This ensures we only pull data that hasn't been loaded yet
                result = conn.execute(text("""
                    SELECT MAX(full_date) 
                    FROM dim_date 
                    WHERE date_key IN (SELECT DISTINCT date_key FROM fact_energy_consumption)
                """)).scalar()
                
                if result:
                    return result.strftime('%Y-%m-%d %H:%M:%S') if hasattr(result, 'strftime') else str(result)
                return '2000-01-01' # If Warehouse is empty, start from the beginning
        except Exception:
            # If the table doesn't exist or query fails, assume initial load
            return '2000-01-01'

    def extract_readings(self, watermark):
        """Step 2: Extract only NEW energy readings from OLTP."""
        logger.info(f"Extracting readings newer than {watermark}...")
        query = f"""
            SELECT reading_id, timestamp, kwh_consumed, voltage, peak_flag, meter_id 
            FROM ENERGY_READING 
            WHERE timestamp > '{watermark}'
        """
        return pd.read_sql(query, self.engine)

    def clean_data(self, df):
        """Step 3: Data Cleaning (IQR Outlier Detection - Required for Project Plan)."""
        if df.empty:
            return df
        
        initial_count = len(df)
        
        # 3.1 Handle Missing Values
        df['kwh_consumed'] = df['kwh_consumed'].fillna(df['kwh_consumed'].mean())
        
        # 3.2 Outlier Detection (IQR Method)
        # Filters out data that is statistically too high or too low (sensor errors)
        Q1 = df['kwh_consumed'].quantile(0.25)
        Q3 = df['kwh_consumed'].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        df = df[(df['kwh_consumed'] >= lower_bound) & (df['kwh_consumed'] <= upper_bound)]
        
        logger.info(f"Data Cleaning: Removed {initial_count - len(df)} outliers using IQR method.")
        return df

    def transform(self, df):
        """Step 4: Map IDs to Warehouse Keys and create Time Dimensions."""
        if df.empty:
            return df
        
        # Load dimension mapping tables from the Warehouse
        dim_room = pd.read_sql("SELECT room_id, room_key FROM dim_room", self.engine)
        dim_meter = pd.read_sql("SELECT meter_id, meter_key FROM dim_meter", self.engine)
        
        # Join readings with Meter data to find the associated Room
        meter_room_map = pd.read_sql("SELECT meter_id, room_id FROM ENERGY_METER", self.engine)
        df = df.merge(meter_room_map, on='meter_id')
        
        # Merge with dimensions to get Surrogate Keys (room_key, meter_key)
        df = df.merge(dim_room, on='room_id')
        df = df.merge(dim_meter, on='meter_id')
        
        # Generate the date_key (YYYYMMDD) required for the Star Schema
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['date_key'] = df['timestamp'].dt.strftime('%Y%m%d').astype(int)
        
        return df[['date_key', 'room_key', 'meter_key', 'kwh_consumed', 'voltage', 'peak_flag']]

    def load(self, df):
        """Step 5: Bulk load data into the Star Schema Fact Table."""
        if df.empty:
            logger.info("No new data to load.")
            return
        
        logger.info(f"Loading {len(df)} rows into fact_energy_consumption...")
        try:
            # Use to_sql with index=False because fact_id is an IDENTITY column
            df.to_sql('fact_energy_consumption', self.engine, if_exists='append', index=False)
            logger.info("Load to Warehouse successful.")
        except Exception as e:
            logger.error(f"Failed to load data to warehouse: {e}")

    def run(self):
        """Orchestrate the ETL Pipeline."""
        logger.info("--- SMART CAMPUS ETL START ---")
        
        watermark = self.get_watermark()
        raw_data = self.extract_readings(watermark)
        
        if not raw_data.empty:
            cleaned_data = self.clean_data(raw_data)
            transformed_data = self.transform(cleaned_data)
            self.load(transformed_data)
        else:
            logger.info("Warehouse is already up to date. No new records found.")
            
        logger.info("--- SMART CAMPUS ETL FINISHED ---")

if __name__ == "__main__":
    etl = SmartCampusETL(DB_CONNECTION_STRING)
    etl.run()