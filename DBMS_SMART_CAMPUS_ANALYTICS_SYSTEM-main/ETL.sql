USE SmartCampusDB;

-- ETL Step 2: dim_room
INSERT INTO dim_room (room_id, room_no, room_type, capacity, floor_label, building_name, building_type, dept_name)
SELECT R.room_id, R.room_no, R.room_type, R.capacity,
    F.floor_label, B.bld_name, B.bld_type, D.dept_name
FROM ROOM R
JOIN FLOOR F ON R.floor_id = F.floor_id
JOIN BUILDING B ON F.building_id = B.building_id
JOIN DEPARTMENT D ON B.dept_id = D.dept_id;

-- ETL Step 3: dim_meter
INSERT INTO dim_meter (meter_id, meter_type, room_no)
SELECT M.meter_id, M.meter_type, R.room_no
FROM ENERGY_METER M JOIN ROOM R ON M.room_id = R.room_id;

-- ETL Step 4: fact table
INSERT INTO fact_energy_consumption (date_key, room_key, meter_key, kwh_consumed, voltage, peak_flag)
SELECT
    CAST(FORMAT(CAST(E.timestamp AS DATE),'yyyyMMdd') AS INT),
    DR.room_key, DM.meter_key,
    E.kwh_consumed, E.voltage, E.peak_flag
FROM ENERGY_READING E
JOIN ENERGY_METER M ON E.meter_id = M.meter_id
JOIN dim_meter DM ON DM.meter_id = M.meter_id
JOIN dim_room DR ON DR.room_id = M.room_id;

-- Verify
SELECT COUNT(*) FROM dim_room;
SELECT COUNT(*) FROM dim_meter;
SELECT COUNT(*) FROM fact_energy_consumption;