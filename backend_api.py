import pandas as pd
from sqlalchemy import create_engine, text
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import urllib
import uvicorn

# ══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════

SERVER   = r'rakhal\RSQL'
DATABASE = 'SmartCampusDB'
params   = urllib.parse.quote_plus(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    f"Trusted_Connection=yes;"
)
DB_CONNECTION_STRING = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(DB_CONNECTION_STRING)

# ══════════════════════════════════════════════════════════════
#  AUTH CONFIG  —  Add / remove users here
# ══════════════════════════════════════════════════════════════

SECRET_KEY           = "smartcampus_iiit_dharwad_da264_secret_2025"
ALGORITHM            = "HS256"
TOKEN_EXPIRE_MINUTES = 480   # 8 hours

AUTHORIZED_USERS = {
    "rakhal": {
        "password":   "rakhal@admin123",
        "role":       "admin",
        "full_name":  "Rakhal",
        "can_insert": True,
        "can_view":   True,
    },
    "admin1": {
        "password":   "admin1@smart456",
        "role":       "admin",
        "full_name":  "vineel",
        "can_insert": True,
        "can_view":   True,
    },
    "rishikesh": {
        "password":   "admin2@smart789",
        "role":       "viewer",
        "full_name":  "Rishikesh",
        "can_insert": False,
        "can_view":   True,
    },
}
# ══════════════════════════════════════════════════════════════
#  AUTH HELPERS
# ══════════════════════════════════════════════════════════════

security = HTTPBearer()

def create_token(username: str, role: str):
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": username, "role": role, "exp": expire},
        SECRET_KEY, algorithm=ALGORITHM
    )

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload  = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username not in AUTHORIZED_USERS:
            raise HTTPException(status_code=401, detail="Invalid token")
        return AUTHORIZED_USERS[username]
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid — please login again")

# ══════════════════════════════════════════════════════════════
#  APP SETUP
# ══════════════════════════════════════════════════════════════

app = FastAPI(title="SmartCampus API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════════════════════════════════════════
#  REQUEST MODELS
# ══════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    username: str
    password: str

class EnergyReadingIn(BaseModel):
    meter_id:     int
    kwh_consumed: float = Field(gt=0, le=100)
    voltage:      float = Field(ge=180, le=260)
    peak_flag:    int   = Field(ge=0, le=1)

class BookingIn(BaseModel):
    user_id:    int
    room_id:    int
    start_time: str
    end_time:   str
    purpose:    str
    status:     str = "Pending"

class MaintenanceTicketIn(BaseModel):
    room_id:     int
    reported_by: int
    description: str
    priority:    str = Field(pattern="^(Critical|High|Medium|Low)$")

class AccessLogIn(BaseModel):
    user_id:       int
    room_id:       int
    access_method: str = Field(pattern="^(RFID|Biometric|PIN|Manual)$")

class BookingStatusUpdate(BaseModel):
    booking_id: int
    status:     str = Field(pattern="^(Approved|Rejected|Cancelled|Completed)$")

class TicketStatusUpdate(BaseModel):
    ticket_id: int
    status:    str = Field(pattern="^(Open|In Progress|Resolved|Closed)$")

# ══════════════════════════════════════════════════════════════
#  POST — LOGIN  (public — no token needed)
# ══════════════════════════════════════════════════════════════

@app.post("/api/login")
def login(req: LoginRequest):
    user = AUTHORIZED_USERS.get(req.username)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Wrong username or password")
    token = create_token(req.username, user["role"])
    return {
        "token":      token,
        "username":   req.username,
        "full_name":  user["full_name"],
        "role":       user["role"],
        "can_insert": user["can_insert"],
    }

@app.get("/api/me")
def get_me(user=Depends(verify_token)):
    return user

# ══════════════════════════════════════════════════════════════
#  GET — DASHBOARD STATS  (protected)
# ══════════════════════════════════════════════════════════════

@app.get("/api/dashboard-stats")
def get_dashboard_stats(user=Depends(verify_token)):
    with engine.connect() as conn:

        total_energy  = conn.execute(text("SELECT SUM(kwh_consumed) FROM fact_energy_consumption")).scalar() or 0
        room_count    = conn.execute(text("SELECT COUNT(*) FROM dim_room")).scalar() or 0
        user_count    = conn.execute(text("SELECT COUNT(*) FROM USERS")).scalar() or 0
        booking_count = conn.execute(text("SELECT COUNT(*) FROM BOOKING")).scalar() or 0
        ticket_count  = conn.execute(text("SELECT COUNT(*) FROM MAINTENANCE_TICKET WHERE status IN ('Open','In Progress')")).scalar() or 0
        access_count  = conn.execute(text("SELECT COUNT(*) FROM ACCESS_LOG")).scalar() or 0
        equip_count   = conn.execute(text("SELECT COUNT(*) FROM EQUIPMENT WHERE status = 'Active'")).scalar() or 0
        meter_count   = conn.execute(text("SELECT COUNT(*) FROM ENERGY_METER WHERE is_active = 1")).scalar() or 0

        bld_data = pd.read_sql("""
            SELECT DR.building_name,
                   SUM(F.kwh_consumed)       AS total,
                   SUM(CASE WHEN F.peak_flag=1 THEN F.kwh_consumed ELSE 0 END) AS peak_kwh,
                   COUNT(DISTINCT F.room_key) AS rooms_monitored
            FROM fact_energy_consumption F
            JOIN dim_room DR ON F.room_key = DR.room_key
            GROUP BY DR.building_name
        """, conn).to_dict(orient='records')

        peak_data = pd.read_sql("""
            SELECT peak_flag, COUNT(*) AS count
            FROM fact_energy_consumption
            GROUP BY peak_flag
        """, conn).to_dict(orient='records')

        hourly_data = pd.read_sql("""
            SELECT DATEPART(HOUR, timestamp) AS hour,
                   AVG(kwh_consumed)          AS avg_kwh
            FROM ENERGY_READING
            GROUP BY DATEPART(HOUR, timestamp)
            ORDER BY hour
        """, conn).to_dict(orient='records')

        user_roles = pd.read_sql("""
            SELECT user_type AS label, COUNT(*) AS value
            FROM USERS GROUP BY user_type
        """, conn).to_dict(orient='records')

        room_energy = pd.read_sql("""
            SELECT room_no, room_type,
                   total_kwh, avg_kwh_per_hour, peak_kwh
            FROM vw_ROOM_ENERGY_USAGE
            ORDER BY total_kwh DESC
        """, conn).to_dict(orient='records')

        dept_energy = pd.read_sql("""
            SELECT D.dept_name, SUM(E.kwh_consumed) AS total_kwh
            FROM ENERGY_READING E
            JOIN ENERGY_METER M  ON E.meter_id    = M.meter_id
            JOIN ROOM R          ON M.room_id     = R.room_id
            JOIN FLOOR F         ON R.floor_id    = F.floor_id
            JOIN BUILDING B      ON F.building_id = B.building_id
            JOIN DEPARTMENT D    ON B.dept_id     = D.dept_id
            GROUP BY D.dept_id, D.dept_name
            ORDER BY total_kwh DESC
        """, conn).to_dict(orient='records')

        booking_status = pd.read_sql("""
            SELECT R.room_no,
                   COUNT(CASE WHEN BK.status='Approved'  THEN 1 END) AS approved,
                   COUNT(CASE WHEN BK.status='Pending'   THEN 1 END) AS pending,
                   COUNT(CASE WHEN BK.status='Cancelled' THEN 1 END) AS cancelled,
                   COUNT(CASE WHEN BK.status='Rejected'  THEN 1 END) AS rejected,
                   COUNT(BK.booking_id)                               AS total_bookings
            FROM ROOM R
            LEFT JOIN BOOKING BK ON R.room_id = BK.room_id
            GROUP BY R.room_id, R.room_no
            HAVING COUNT(BK.booking_id) > 0
            ORDER BY total_bookings DESC
        """, conn).to_dict(orient='records')

        tickets = pd.read_sql("""
            SELECT T.ticket_id, T.description, T.priority, T.status,
                   R.room_no, CONVERT(VARCHAR, T.reported_date, 23) AS reported_date
            FROM MAINTENANCE_TICKET T
            JOIN ROOM R ON T.room_id = R.room_id
            ORDER BY
                CASE T.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2
                                WHEN 'Medium'   THEN 3 WHEN 'Low'  THEN 4 ELSE 5 END,
                T.reported_date DESC
        """, conn).to_dict(orient='records')

        access_logs = pd.read_sql("""
            SELECT TOP 50
                A.log_id, U.name, R.room_no, A.access_method AS method,
                CONVERT(VARCHAR, A.entry_time, 120) AS entry_time,
                DATEDIFF(MINUTE, A.entry_time,
                    ISNULL(A.exit_time, A.entry_time)) AS duration_min
            FROM ACCESS_LOG A
            JOIN USERS U ON A.user_id = U.user_id
            JOIN ROOM  R ON A.room_id = R.room_id
            ORDER BY A.entry_time DESC
        """, conn).to_dict(orient='records')

        meter_types = pd.read_sql("""
            SELECT meter_type, COUNT(*) AS count
            FROM ENERGY_METER WHERE is_active = 1
            GROUP BY meter_type
        """, conn).to_dict(orient='records')

        equipment_status = pd.read_sql("""
            SELECT status, COUNT(*) AS count
            FROM EQUIPMENT GROUP BY status
        """, conn).to_dict(orient='records')

        anomaly_readings = pd.read_sql("""
            SELECT TOP 20
                meter_id,
                CONVERT(VARCHAR, timestamp, 120) AS timestamp,
                kwh_consumed,
                kwh_consumed - LAG(kwh_consumed) OVER (
                    PARTITION BY meter_id ORDER BY timestamp
                ) AS delta_kwh,
                CASE
                    WHEN kwh_consumed - LAG(kwh_consumed) OVER (
                        PARTITION BY meter_id ORDER BY timestamp) > 2
                    THEN 'SPIKE DETECTED' ELSE 'Normal'
                END AS anomaly_flag
            FROM ENERGY_READING
            ORDER BY timestamp DESC
        """, conn).to_dict(orient='records')

        live_feed = pd.read_sql("""
            SELECT TOP 20 event_type, description,
                   CONVERT(VARCHAR, event_time, 120) AS event_time,
                   severity
            FROM (
                SELECT 'Energy Reading' AS event_type,
                       CONCAT('Meter ', meter_id, ': ', ROUND(kwh_consumed,2), ' kWh') AS description,
                       timestamp AS event_time,
                       CASE WHEN peak_flag=1 THEN 'warning' ELSE 'info' END AS severity
                FROM ENERGY_READING
                UNION ALL
                SELECT 'Booking' AS event_type,
                       CONCAT('Room booking — ', status) AS description,
                       created_at AS event_time,
                       CASE WHEN status='Rejected' THEN 'error'
                            WHEN status='Approved' THEN 'success' ELSE 'info' END AS severity
                FROM BOOKING
                UNION ALL
                SELECT 'Maintenance' AS event_type,
                       CONCAT('[', priority, '] ', LEFT(description,60)) AS description,
                       reported_date AS event_time,
                       CASE WHEN priority='Critical' THEN 'error'
                            WHEN priority='High' THEN 'warning' ELSE 'info' END AS severity
                FROM MAINTENANCE_TICKET
            ) AS events
            ORDER BY event_time DESC
        """, conn).to_dict(orient='records')

        rooms  = pd.read_sql("SELECT room_id, room_no FROM ROOM ORDER BY room_no", conn).to_dict(orient='records')
        users  = pd.read_sql("SELECT user_id, name, user_type FROM USERS ORDER BY name", conn).to_dict(orient='records')
        meters = pd.read_sql("SELECT meter_id, meter_type, room_id FROM ENERGY_METER WHERE is_active=1 ORDER BY meter_id", conn).to_dict(orient='records')

    return {
        "kpis": {
            "energy":      round(total_energy / 1000, 2),
            "rooms":       room_count,
            "users":       user_count,
            "bookings":    booking_count,
            "tickets":     ticket_count,
            "access_logs": access_count,
            "equipment":   equip_count,
            "meters":      meter_count,
        },
        "buildings":        bld_data,
        "peak_ratio":       peak_data,
        "hourly_trend":     hourly_data,
        "user_roles":       user_roles,
        "room_energy":      room_energy,
        "dept_energy":      dept_energy,
        "booking_status":   booking_status,
        "tickets":          tickets,
        "access_logs":      access_logs,
        "meter_types":      meter_types,
        "equipment_status": equipment_status,
        "anomaly_readings": anomaly_readings,
        "live_feed":        live_feed,
        "lookups":          {"rooms": rooms, "users": users, "meters": meters},
    }

# ══════════════════════════════════════════════════════════════
#  GET — LIVE FEED POLL  (protected)
# ══════════════════════════════════════════════════════════════

@app.get("/api/live-feed")
def get_live_feed(user=Depends(verify_token)):
    try:
        with engine.connect() as conn:
            feed = pd.read_sql("""
                SELECT TOP 15 event_type, description,
                       CONVERT(VARCHAR, event_time, 120) AS event_time,
                       severity
                FROM (
                    SELECT 'Energy' AS event_type,
                           CONCAT('M-', meter_id, ': ', ROUND(kwh_consumed,2), ' kWh ',
                                  CASE WHEN peak_flag=1 THEN 'PEAK' ELSE '' END) AS description,
                           timestamp AS event_time,
                           CASE WHEN peak_flag=1 THEN 'warning' ELSE 'info' END AS severity
                    FROM ENERGY_READING
                    UNION ALL
                    SELECT 'Booking',
                           CONCAT('Booking -> ', status),
                           created_at,
                           CASE WHEN status='Rejected' THEN 'error'
                                WHEN status='Approved' THEN 'success' ELSE 'info' END
                    FROM BOOKING
                    UNION ALL
                    SELECT 'Ticket',
                           CONCAT('[', priority, '] ', LEFT(description, 50)),
                           reported_date,
                           CASE WHEN priority='Critical' THEN 'error'
                                WHEN priority='High' THEN 'warning' ELSE 'info' END
                    FROM MAINTENANCE_TICKET
                    UNION ALL
                    SELECT 'Access',
                           CONCAT(U.name, ' -> ', R.room_no, ' (', A.access_method, ')'),
                           A.entry_time, 'info'
                    FROM ACCESS_LOG A
                    JOIN USERS U ON A.user_id = U.user_id
                    JOIN ROOM  R ON A.room_id = R.room_id
                ) AS events
                ORDER BY event_time DESC
            """, conn).to_dict(orient='records')
        return {"feed": feed, "polled_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  POST — INSERT NEW ENERGY READING  (protected)
# ══════════════════════════════════════════════════════════════

@app.post("/api/energy-reading")
def add_energy_reading(r: EnergyReadingIn, user=Depends(verify_token)):
    if not user["can_insert"]:
        raise HTTPException(status_code=403, detail="Your account does not have insert permissions")
    try:
        with engine.begin() as conn:
            exists = conn.execute(
                text("SELECT COUNT(*) FROM ENERGY_METER WHERE meter_id=:m AND is_active=1"),
                {"m": r.meter_id}
            ).scalar()
            if not exists:
                raise HTTPException(status_code=404, detail=f"Meter {r.meter_id} not found or inactive")
            conn.execute(text("""
                INSERT INTO ENERGY_READING (meter_id, timestamp, kwh_consumed, voltage, peak_flag)
                VALUES (:meter_id, GETDATE(), :kwh, :voltage, :peak)
            """), {
                "meter_id": r.meter_id,
                "kwh":      r.kwh_consumed,
                "voltage":  r.voltage,
                "peak":     r.peak_flag,
            })
        return {"success": True, "message": f"Energy reading inserted for Meter {r.meter_id}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  POST — CREATE BOOKING  (protected)
# ══════════════════════════════════════════════════════════════

@app.post("/api/booking")
def create_booking(b: BookingIn, user=Depends(verify_token)):
    if not user["can_insert"]:
        raise HTTPException(status_code=403, detail="Your account does not have insert permissions")
    try:
        with engine.begin() as conn:
            conflict = conn.execute(text("""
                SELECT COUNT(*) FROM BOOKING
                WHERE room_id = :room
                  AND status NOT IN ('Cancelled','Rejected')
                  AND start_time < :end AND end_time > :start
            """), {"room": b.room_id, "start": b.start_time, "end": b.end_time}).scalar()
            if conflict:
                raise HTTPException(status_code=409, detail="Room already booked for this time slot")
            conn.execute(text("""
                INSERT INTO BOOKING (user_id, room_id, start_time, end_time, purpose, status, created_at)
                VALUES (:user, :room, :start, :end, :purpose, :status, GETDATE())
            """), {
                "user":    b.user_id,
                "room":    b.room_id,
                "start":   b.start_time,
                "end":     b.end_time,
                "purpose": b.purpose,
                "status":  b.status,
            })
        return {"success": True, "message": "Booking created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  PATCH — UPDATE BOOKING STATUS  (protected)
# ══════════════════════════════════════════════════════════════

@app.patch("/api/booking/status")
def update_booking_status(u: BookingStatusUpdate, user=Depends(verify_token)):
    if not user["can_insert"]:
        raise HTTPException(status_code=403, detail="Your account does not have insert permissions")
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE BOOKING SET status=:status WHERE booking_id=:id
            """), {"status": u.status, "id": u.booking_id})
        return {"success": True, "message": f"Booking {u.booking_id} updated to {u.status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  POST — RAISE MAINTENANCE TICKET  (protected)
# ══════════════════════════════════════════════════════════════

@app.post("/api/maintenance-ticket")
def raise_ticket(t: MaintenanceTicketIn, user=Depends(verify_token)):
    if not user["can_insert"]:
        raise HTTPException(status_code=403, detail="Your account does not have insert permissions")
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO MAINTENANCE_TICKET
                    (room_id, reported_by, description, priority, status, reported_date)
                VALUES (:room, :user, :desc, :priority, 'Open', GETDATE())
            """), {
                "room":     t.room_id,
                "user":     t.reported_by,
                "desc":     t.description,
                "priority": t.priority,
            })
        return {"success": True, "message": "Maintenance ticket raised successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  PATCH — UPDATE TICKET STATUS  (protected)
# ══════════════════════════════════════════════════════════════

@app.patch("/api/maintenance-ticket/status")
def update_ticket_status(u: TicketStatusUpdate, user=Depends(verify_token)):
    if not user["can_insert"]:
        raise HTTPException(status_code=403, detail="Your account does not have insert permissions")
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE MAINTENANCE_TICKET SET status=:status WHERE ticket_id=:id
            """), {"status": u.status, "id": u.ticket_id})
        return {"success": True, "message": f"Ticket {u.ticket_id} updated to {u.status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  POST — LOG ACCESS EVENT  (protected)
# ══════════════════════════════════════════════════════════════

@app.post("/api/access-log")
def log_access(a: AccessLogIn, user=Depends(verify_token)):
    if not user["can_insert"]:
        raise HTTPException(status_code=403, detail="Your account does not have insert permissions")
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO ACCESS_LOG (user_id, room_id, access_method, entry_time)
                VALUES (:user, :room, :method, GETDATE())
            """), {"user": a.user_id, "room": a.room_id, "method": a.access_method})
        return {"success": True, "message": "Access event logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  POST — TRIGGER ETL PIPELINE  (admin only)
# ══════════════════════════════════════════════════════════════

@app.post("/api/run-etl")
def run_etl(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can trigger the ETL pipeline")
    import subprocess, sys
    try:
        result = subprocess.run(
            [sys.executable, "etl_pipeline.py"],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            return {"success": True, "log": result.stdout}
        else:
            return {"success": False, "log": result.stderr}
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="ETL timed out after 120s")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════
#  RUN
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"Starting SmartCampus API v3.0 on {SERVER}...")
    uvicorn.run(app, host="0.0.0.0", port=8000)