/* =====================================================
   SMART CAMPUS RESOURCE & ENERGY ANALYTICS SYSTEM
   IIIT DHARWAD  |  DA264 – Database Management
   Full SQL Script v3.0  –  SSMS (SQL Server)
   =====================================================
   Sections:
     1.  Table Creation   (12 OLTP entities, BCNF)
     2.  Seed Data        (baseline rows)
     3.  Views            (3 reusable views)
     4.  Indexes          (5 performance indexes)
     5.  Advanced Queries (Unit II portfolio)
     6.  Transaction Demos(Unit III – ACID)
     7.  Stored Procedures(2 procedures)
     8.  Triggers         (3 triggers)
     9.  Data Warehouse   (Star + Snowflake schema)
     10. ETL Pipeline     (OLTP → Warehouse)
     11. OLAP Queries     (Roll-up, Drill-down, Slice,
                           Dice, Pivot)
     12. Verification     (row counts, FK check)
   ===================================================== */

CREATE DATABASE SmartCampusDB;
GO
USE SmartCampusDB;
GO


/* =====================================================
   SECTION 1 : TABLE CREATION
   Normalization note: All tables are in BCNF.
   Every non-key attribute is fully functionally
   dependent on the primary key only.
   ===================================================== */

-- FD: dept_id → dept_name, office_location, head_fac_id
-- head_fac_id FK added via ALTER after FACULTY is created (circular dep fix)
CREATE TABLE DEPARTMENT (
    dept_id         INT          PRIMARY KEY,
    dept_name       VARCHAR(100) NOT NULL,
    office_location VARCHAR(100),
    head_fac_id     INT          NULL     -- FK added after FACULTY
);
GO

-- FD: user_id → name, email, phone, user_type
CREATE TABLE USERS (
    user_id   INT          PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    email     VARCHAR(100) NOT NULL,
    phone     VARCHAR(20),
    user_type VARCHAR(20)  NOT NULL,
    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT chk_user_type CHECK (user_type IN ('Student','Faculty','Admin','Staff'))
);
GO

-- FD: student_id → user_id, roll_no, year_of_study, dept_id
CREATE TABLE STUDENT (
    student_id    INT         PRIMARY KEY,
    user_id       INT         NOT NULL,
    roll_no       VARCHAR(20) NOT NULL,
    year_of_study INT         NOT NULL,
    dept_id       INT         NOT NULL,
    CONSTRAINT uq_roll_no  UNIQUE (roll_no),
    CONSTRAINT chk_year    CHECK  (year_of_study BETWEEN 1 AND 5),
    CONSTRAINT fk_stu_user FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    CONSTRAINT fk_stu_dept FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id)
);
GO

-- FD: faculty_id → user_id, designation, employee_no, dept_id
CREATE TABLE FACULTY (
    faculty_id  INT          PRIMARY KEY,
    user_id     INT          NOT NULL,
    designation VARCHAR(100),
    employee_no VARCHAR(50)  NOT NULL,
    dept_id     INT          NOT NULL,
    CONSTRAINT uq_emp_no   UNIQUE (employee_no),
    CONSTRAINT fk_fac_user FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    CONSTRAINT fk_fac_dept FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id)
);
GO

-- Now safe to add circular FK: DEPARTMENT.head_fac_id → FACULTY
ALTER TABLE DEPARTMENT
    ADD CONSTRAINT fk_dept_head
    FOREIGN KEY (head_fac_id) REFERENCES FACULTY(faculty_id);
GO

-- FD: building_id → bld_name, total_floors, bld_type, year_built, dept_id
CREATE TABLE BUILDING (
    building_id  INT          PRIMARY KEY,
    bld_name     VARCHAR(100) NOT NULL,
    total_floors INT          NOT NULL,
    bld_type     VARCHAR(50),
    year_built   INT,
    dept_id      INT,
    CONSTRAINT chk_floors  CHECK (total_floors >= 1),
    CONSTRAINT fk_bld_dept FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id)
);
GO

-- FD: floor_id → floor_no, floor_label, building_id
CREATE TABLE FLOOR (
    floor_id    INT         PRIMARY KEY,
    floor_no    INT         NOT NULL,
    floor_label VARCHAR(50),
    building_id INT         NOT NULL,
    CONSTRAINT fk_floor_bld FOREIGN KEY (building_id) REFERENCES BUILDING(building_id)
);
GO

-- FD: room_id → room_no, capacity, room_type, area_sqft, floor_id
CREATE TABLE ROOM (
    room_id   INT         PRIMARY KEY,
    room_no   VARCHAR(50) NOT NULL,
    capacity  INT         NOT NULL,
    room_type VARCHAR(50),
    area_sqft INT,
    floor_id  INT         NOT NULL,
    CONSTRAINT chk_capacity  CHECK (capacity > 0),
    CONSTRAINT chk_area      CHECK (area_sqft > 0),
    CONSTRAINT fk_room_floor FOREIGN KEY (floor_id) REFERENCES FLOOR(floor_id)
);
GO

-- FD: type_id → type_name, power_kw, manufacturer
CREATE TABLE EQUIPMENT_TYPE (
    type_id      INT          PRIMARY KEY,
    type_name    VARCHAR(100) NOT NULL,
    power_kw     FLOAT,
    manufacturer VARCHAR(100),
    CONSTRAINT chk_power CHECK (power_kw >= 0)
);
GO

-- FD: equip_id → serial_no, purchase_date, status, room_id, type_id
CREATE TABLE EQUIPMENT (
    equip_id      INT          PRIMARY KEY,
    serial_no     VARCHAR(100) NOT NULL,
    purchase_date DATE,
    status        VARCHAR(50)  NOT NULL,
    room_id       INT,
    type_id       INT          NOT NULL,
    CONSTRAINT uq_serial     UNIQUE (serial_no),
    CONSTRAINT chk_eq_status CHECK (status IN ('Active','Inactive','Under Repair','Decommissioned')),
    CONSTRAINT fk_eq_room    FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
    CONSTRAINT fk_eq_type    FOREIGN KEY (type_id) REFERENCES EQUIPMENT_TYPE(type_id)
);
GO

-- FD: meter_id → meter_type, install_date, is_active, room_id
CREATE TABLE ENERGY_METER (
    meter_id     INT         PRIMARY KEY,
    meter_type   VARCHAR(50) NOT NULL,
    install_date DATE,
    is_active    BIT         NOT NULL DEFAULT 1,
    room_id      INT         NOT NULL,
    CONSTRAINT chk_mtype     CHECK (meter_type IN ('Electricity','Solar','Water','Gas')),
    CONSTRAINT fk_meter_room FOREIGN KEY (room_id) REFERENCES ROOM(room_id)
);
GO

-- FD: reading_id → timestamp, kwh_consumed, voltage, peak_flag, meter_id
-- IDENTITY(1,1) allows backend to INSERT without specifying reading_id
CREATE TABLE ENERGY_READING (
    reading_id   INT      IDENTITY(1,1) PRIMARY KEY,
    timestamp    DATETIME NOT NULL,
    kwh_consumed FLOAT    NOT NULL,
    voltage      FLOAT,
    peak_flag    BIT      NOT NULL DEFAULT 0,
    meter_id     INT      NOT NULL,
    CONSTRAINT chk_kwh     CHECK (kwh_consumed >= 0),
    CONSTRAINT chk_voltage CHECK (voltage IS NULL OR voltage > 0),
    CONSTRAINT fk_rdg_meter FOREIGN KEY (meter_id) REFERENCES ENERGY_METER(meter_id)
);
GO

-- TIME_SLOT: standalone lookup table for scheduling
CREATE TABLE TIME_SLOT (
    slot_id     INT         PRIMARY KEY,
    day_of_week VARCHAR(20) NOT NULL,
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    label       VARCHAR(50),
    CONSTRAINT chk_day   CHECK (day_of_week IN ('Monday','Tuesday','Wednesday',
                                                 'Thursday','Friday','Saturday','Sunday')),
    CONSTRAINT chk_times CHECK (end_time > start_time)
);
GO

-- FD: booking_id → start_time, end_time, purpose, status, room_id, user_id, slot_id
-- IDENTITY(1,1) allows backend POST /api/booking without specifying booking_id
CREATE TABLE BOOKING (
    booking_id INT          IDENTITY(1,1) PRIMARY KEY,
    start_time DATETIME     NOT NULL,
    end_time   DATETIME     NOT NULL,
    purpose    VARCHAR(200),
    status     VARCHAR(50)  NOT NULL DEFAULT 'Pending',
    room_id    INT          NOT NULL,
    user_id    INT          NOT NULL,
    slot_id    INT          NULL,
    created_at DATETIME     DEFAULT GETDATE(),
    CONSTRAINT chk_bk_times  CHECK (end_time > start_time),
    CONSTRAINT chk_bk_status CHECK (status IN ('Pending','Approved','Rejected','Cancelled','Completed')),
    CONSTRAINT fk_bk_room    FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
    CONSTRAINT fk_bk_user    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    CONSTRAINT fk_bk_slot    FOREIGN KEY (slot_id) REFERENCES TIME_SLOT(slot_id)
);
GO

-- Weak entity: ticket_id alone does not identify without room_id context
-- IDENTITY(1,1) allows backend POST /api/maintenance-ticket without specifying ticket_id
CREATE TABLE MAINTENANCE_TICKET (
    ticket_id     INT          IDENTITY(1,1) PRIMARY KEY,
    reported_date DATETIME     NOT NULL DEFAULT GETDATE(),
    description   VARCHAR(200),
    priority      VARCHAR(20)  NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    room_id       INT          NOT NULL,
    reported_by   INT          NOT NULL,
    CONSTRAINT chk_tk_priority CHECK (priority IN ('Low','Medium','High','Critical')),
    CONSTRAINT chk_tk_status   CHECK (status   IN ('Open','In Progress','Resolved','Closed')),
    CONSTRAINT fk_tk_room      FOREIGN KEY (room_id)     REFERENCES ROOM(room_id),
    CONSTRAINT fk_tk_user      FOREIGN KEY (reported_by) REFERENCES USERS(user_id)
);
GO

-- FD: log_id → entry_time, exit_time, access_method, room_id, user_id
-- IDENTITY(1,1) allows backend POST /api/access-log without specifying log_id
CREATE TABLE ACCESS_LOG (
    log_id        INT         IDENTITY(1,1) PRIMARY KEY,
    entry_time    DATETIME    NOT NULL,
    exit_time     DATETIME,
    access_method VARCHAR(50) NOT NULL,
    room_id       INT         NOT NULL,
    user_id       INT         NOT NULL,
    CONSTRAINT chk_acc_method CHECK (access_method IN ('RFID','PIN','Biometric','Manual')),
    CONSTRAINT fk_acc_room    FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
    CONSTRAINT fk_acc_user    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);
GO

-- AUDIT_TRAIL: auto-populated by triggers — tracks all booking changes
CREATE TABLE AUDIT_TRAIL (
    audit_id    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    action_type VARCHAR(50)  NOT NULL,
    timestamp   DATETIME     NOT NULL DEFAULT GETDATE(),
    old_value   VARCHAR(200),
    new_value   VARCHAR(200),
    booking_id  INT,
    CONSTRAINT fk_aud_booking FOREIGN KEY (booking_id) REFERENCES BOOKING(booking_id)
);
GO


/* =====================================================
   SECTION 2 : SEED DATA
   ===================================================== */

-- Departments (head_fac_id set to NULL first; updated after faculty insert)
INSERT INTO DEPARTMENT (dept_id, dept_name, office_location, head_fac_id) VALUES
(1, 'Computer Science and Engineering',          'E Block – Room 301', NULL),
(2, 'Electronics and Communication Engineering', 'E Block – Room 302', NULL),
(3, 'Data Science and Artificial Intelligence',  'E Block – Room 303', NULL);

-- Buildings
INSERT INTO BUILDING VALUES
(1,'PI Block',3,'Administration + Research',2019,1),
(2,'E Block', 5,'Academic Block',           2019,1),
(3,'M Block', 2,'Sports Complex',           2020,1),
(4,'B Block', 4,'Boys Hostel',              2020,1),
(5,'G Block', 4,'Girls Hostel',             2020,1),
(6,'H Block', 2,'Gym + Canteen + Clinic',   2021,1);

-- Floors
INSERT INTO FLOOR VALUES
(1, 0,'Ground Floor',1),(2, 1,'First Floor',1),(3, 2,'Second Floor',1),
(4,-1,'Lower Ground',2),(5, 0,'Upper Ground',2),(6, 1,'First Floor',2),
(7, 2,'Second Floor',2),(8, 3,'Third Floor',2),
(9, 0,'Ground Floor',3),(10,1,'First Floor',3),
(11,-1,'Mess Floor',4),(12,0,'Ground Floor',4),(13,1,'First Floor',4),(14,2,'Second Floor',4),
(15,-1,'Lower Ground',5),(16,0,'Upper Ground',5),(17,1,'First Floor',5),(18,2,'Second Floor',5),
(19,0,'Ground Floor',6),(20,1,'Gym Floor',6);

-- Rooms (all in E Block floors 4–8)
INSERT INTO ROOM VALUES
(101,'Seminar Hall',   240,'Seminar Hall',1200,4),
(102,'Mini Seminar 1', 120,'Seminar Hall', 800,4),
(103,'Mini Seminar 2', 120,'Seminar Hall', 800,4),
(104,'C101',            60,'Classroom',    600,5),
(105,'C102',            60,'Classroom',    600,5),
(106,'L101',            40,'ECE Lab',      650,5),
(107,'C201',            60,'Classroom',    600,6),
(108,'C202',            60,'Classroom',    600,6),
(109,'L201',            60,'Computer Lab', 700,6),
(110,'L202',            60,'Computer Lab', 700,6),
(111,'L203',            40,'ECE Lab',      650,6),
(112,'C301',            60,'Classroom',    600,7),
(113,'C302',            60,'Classroom',    600,7),
(114,'L301',            60,'Computer Lab', 700,7),
(115,'L302',            60,'Computer Lab', 700,7),
(116,'L303',            40,'ECE Lab',      650,7);

-- Equipment types
INSERT INTO EQUIPMENT_TYPE VALUES
(1,'Desktop Computer',0.35,'Dell'),
(2,'GPU Server',      3.00,'Nvidia'),
(3,'Projector',       0.50,'Epson'),
(4,'Air Conditioner', 3.50,'Daikin'),
(5,'Oscilloscope',    0.20,'Tektronix'),
(6,'FPGA Board',      0.15,'Xilinx'),
(7,'Router',          0.10,'Cisco'),
(8,'Solar Inverter',  5.00,'Luminous');

-- Equipment instances
INSERT INTO EQUIPMENT VALUES
(1,  'PC001', '2023-01-10','Active',109,1),
(2,  'PC002', '2023-01-10','Active',109,1),
(3,  'GPU001','2023-03-15','Active',114,2),
(4,  'PROJ01','2023-02-20','Active',101,3),
(5,  'AC001', '2022-05-01','Active',101,4),
(6,  'OSC001','2023-06-20','Active',106,5),
(7,  'FPGA01','2023-07-01','Active',106,6),
(8,  'PC003', '2023-01-10','Active',110,1),
(9,  'PC004', '2023-01-10','Active',110,1),
(10, 'PROJ02','2023-02-20','Active',107,3);

-- Energy meters
INSERT INTO ENERGY_METER VALUES
(1,'Electricity','2023-01-01',1,101),
(2,'Electricity','2023-01-01',1,109),
(3,'Electricity','2023-01-01',1,114),
(4,'Solar',      '2023-01-01',1,101),
(5,'Solar',      '2023-01-01',1,112),
(6,'Electricity','2023-01-01',1,107),
(7,'Electricity','2023-01-01',1,110);

-- Energy readings (IDENTITY column — do NOT specify reading_id)
INSERT INTO ENERGY_READING (timestamp, kwh_consumed, voltage, peak_flag, meter_id) VALUES
('2025-03-01 09:00',5.3,220,0,1),
('2025-03-01 10:00',6.1,221,1,1),
('2025-03-01 11:00',6.8,220,1,1),
('2025-03-01 09:00',4.9,219,0,2),
('2025-03-01 10:00',5.7,220,1,2),
('2025-03-01 09:00',3.1,220,0,4),
('2025-03-02 09:00',5.0,220,0,1),
('2025-03-02 10:00',5.9,221,1,1),
('2025-03-02 09:00',4.5,219,0,2),
('2025-03-02 10:00',5.2,220,1,2),
('2025-03-03 09:00',6.2,220,0,3),
('2025-03-03 10:00',7.1,221,1,3),
('2025-03-03 09:00',2.8,220,0,5),
('2025-03-03 10:00',3.3,220,0,6),
('2025-03-03 11:00',4.0,221,1,6);

-- Users: 3 faculty + 6 students
INSERT INTO USERS VALUES
(1,'Dr Rao',      'rao@iiitdwd.ac.in',    '9000000001','Faculty'),
(2,'Dr Sharma',   'sharma@iiitdwd.ac.in', '9000000002','Faculty'),
(3,'Dr Mehta',    'mehta@iiitdwd.ac.in',  '9000000003','Faculty'),
(4,'Arjun Kumar', 'arjun@iiitdwd.ac.in',  '9000000004','Student'),
(5,'Priya Singh', 'priya@iiitdwd.ac.in',  '9000000005','Student'),
(6,'Rahul Patil', 'rahul@iiitdwd.ac.in',  '9000000006','Student'),
(7,'Neha Verma',  'neha@iiitdwd.ac.in',   '9000000007','Student'),
(8,'Aditya Shah', 'aditya@iiitdwd.ac.in', '9000000008','Student'),
(9,'Kavya Reddy', 'kavya@iiitdwd.ac.in',  '9000000009','Student');

-- Faculty rows
INSERT INTO FACULTY VALUES
(1,1,'Professor',          'EMP001',1),
(2,2,'Associate Professor','EMP002',2),
(3,3,'Assistant Professor','EMP003',3);

-- Update department heads now that faculty exist
UPDATE DEPARTMENT SET head_fac_id = 1 WHERE dept_id = 1;
UPDATE DEPARTMENT SET head_fac_id = 2 WHERE dept_id = 2;
UPDATE DEPARTMENT SET head_fac_id = 3 WHERE dept_id = 3;

-- Student rows
INSERT INTO STUDENT VALUES
(1,4,'22BCS001',2,1),
(2,5,'22BCS002',2,1),
(3,6,'22BEC001',3,2),
(4,7,'22BEC002',3,2),
(5,8,'22BDS001',2,3),
(6,9,'22BDS002',2,3);

-- Time slots
INSERT INTO TIME_SLOT VALUES
(1,'Monday',   '08:00','09:00','Morning Slot 1'),
(2,'Monday',   '09:00','10:00','Morning Slot 2'),
(3,'Monday',   '10:00','11:00','Morning Slot 3'),
(4,'Tuesday',  '14:00','16:00','Afternoon Double'),
(5,'Wednesday','11:00','13:00','Pre-Lunch Double'),
(6,'Thursday', '15:00','17:00','Lab Evening'),
(7,'Friday',   '09:00','11:00','Friday Morning'),
(8,'Saturday', '10:00','12:00','Weekend Morning');

-- Bookings (IDENTITY column — do NOT specify booking_id)
-- SET IDENTITY_INSERT used here to preserve demo IDs in seed data
SET IDENTITY_INSERT BOOKING ON;
INSERT INTO BOOKING (booking_id, start_time, end_time, purpose, status, room_id, user_id, slot_id) VALUES
(1, '2025-04-07 08:00','2025-04-07 09:00','DBMS Lecture',        'Approved', 104,1,1),
(2, '2025-04-07 09:00','2025-04-07 10:00','Signals Class',       'Approved', 107,2,2),
(3, '2025-04-07 10:00','2025-04-07 11:00','ML Lab',              'Approved', 109,3,3),
(4, '2025-04-08 14:00','2025-04-08 16:00','Project Review',      'Pending',  101,4,4),
(5, '2025-04-08 11:00','2025-04-08 13:00','DSA Lecture',         'Approved', 108,1,5),
(6, '2025-04-09 15:00','2025-04-09 17:00','ECE Lab Practice',    'Approved', 106,2,6),
(7, '2025-04-09 09:00','2025-04-09 11:00','Seminar Presentation','Approved', 101,3,7),
(8, '2025-04-10 10:00','2025-04-10 12:00','Group Study',         'Cancelled',102,5,8),
(9, '2025-04-10 10:00','2025-04-10 12:00','Workshop',            'Rejected', 102,6,8),
(10,'2025-04-11 08:00','2025-04-11 09:00','Morning Briefing',    'Completed',104,1,1);
SET IDENTITY_INSERT BOOKING OFF;
GO

-- Maintenance tickets (IDENTITY column — do NOT specify ticket_id in seed)
SET IDENTITY_INSERT MAINTENANCE_TICKET ON;
INSERT INTO MAINTENANCE_TICKET (ticket_id, reported_date, description, priority, status, room_id, reported_by) VALUES
(1,'2025-03-10','Projector bulb fused',               'High',    'Resolved',   101,1),
(2,'2025-03-12','AC not cooling properly',            'Medium',  'In Progress',101,2),
(3,'2025-03-15','Computer #3 not booting',            'High',    'Open',       109,4),
(4,'2025-03-18','Oscilloscope display flickering',    'Low',     'Open',       106,6),
(5,'2025-03-20','GPU Server overheating',             'Critical','In Progress',114,3),
(6,'2025-03-22','Classroom lights not working – C201','Medium',  'Resolved',   107,5);
SET IDENTITY_INSERT MAINTENANCE_TICKET OFF;
GO

-- Access logs (IDENTITY column — do NOT specify log_id in seed)
SET IDENTITY_INSERT ACCESS_LOG ON;
INSERT INTO ACCESS_LOG (log_id, entry_time, exit_time, access_method, room_id, user_id) VALUES
(1,'2025-04-07 07:55','2025-04-07 09:05','RFID',     104,1),
(2,'2025-04-07 08:58','2025-04-07 10:10','RFID',     107,2),
(3,'2025-04-07 09:58','2025-04-07 11:15','Biometric',109,3),
(4,'2025-04-08 13:55','2025-04-08 16:05','PIN',      101,4),
(5,'2025-04-08 10:58','2025-04-08 13:10','RFID',     108,1),
(6,'2025-04-09 14:58','2025-04-09 17:10','RFID',     106,2),
(7,'2025-04-09 08:58','2025-04-09 11:05','Biometric',101,3),
(8,'2025-04-10 09:55','2025-04-10 12:10','RFID',     102,5);
SET IDENTITY_INSERT ACCESS_LOG OFF;
GO


/* =====================================================
   SECTION 3 : VIEWS
   ===================================================== */

-- View 1: Room-level energy summary
CREATE VIEW vw_ROOM_ENERGY_USAGE AS
SELECT
    R.room_id,
    R.room_no,
    R.room_type,
    COUNT(E.reading_id)  AS total_readings,
    SUM(E.kwh_consumed)  AS total_kwh,
    AVG(E.kwh_consumed)  AS avg_kwh_per_hour,
    MAX(E.kwh_consumed)  AS peak_kwh
FROM ENERGY_READING E
JOIN ENERGY_METER   M ON E.meter_id = M.meter_id
JOIN ROOM           R ON M.room_id  = R.room_id
GROUP BY R.room_id, R.room_no, R.room_type;
GO

-- View 2: Building-level energy rollup (OLAP Roll-up demo)
CREATE VIEW vw_BUILDING_ENERGY_REPORT AS
SELECT
    B.building_id,
    B.bld_name,
    B.bld_type,
    SUM(E.kwh_consumed)                                         AS total_kwh,
    COUNT(DISTINCT R.room_id)                                   AS rooms_monitored,
    SUM(CASE WHEN E.peak_flag=1 THEN E.kwh_consumed ELSE 0 END) AS peak_kwh
FROM ENERGY_READING E
JOIN ENERGY_METER   M ON E.meter_id    = M.meter_id
JOIN ROOM           R ON M.room_id     = R.room_id
JOIN FLOOR          F ON R.floor_id    = F.floor_id
JOIN BUILDING       B ON F.building_id = B.building_id
GROUP BY B.building_id, B.bld_name, B.bld_type;
GO

-- View 3: Active bookings with full user and room context
CREATE VIEW vw_ACTIVE_BOOKINGS AS
SELECT
    BK.booking_id,
    U.name      AS booked_by,
    U.user_type,
    R.room_no,
    R.room_type,
    BK.start_time,
    BK.end_time,
    DATEDIFF(MINUTE, BK.start_time, BK.end_time) / 60.0 AS duration_hrs,
    BK.purpose,
    BK.status
FROM BOOKING BK
JOIN USERS U ON BK.user_id = U.user_id
JOIN ROOM  R ON BK.room_id = R.room_id
WHERE BK.status IN ('Pending','Approved');
GO


/* =====================================================
   SECTION 4 : INDEXES
   ===================================================== */

-- Timestamp queries (most frequent scan on readings)
CREATE INDEX idx_energy_timestamp
    ON ENERGY_READING(timestamp);

-- Booking conflict detection: room + time range scan
CREATE INDEX idx_booking_conflict
    ON BOOKING(room_id, start_time, end_time);

-- Access log queries filtered by user
CREATE INDEX idx_access_user
    ON ACCESS_LOG(user_id, entry_time);

-- Active meters lookup (partial index — only active meters)
CREATE INDEX idx_active_meters
    ON ENERGY_METER(room_id)
    WHERE is_active = 1;

-- Ticket dashboard: filter by status and priority
CREATE INDEX idx_ticket_status
    ON MAINTENANCE_TICKET(status, priority);
GO


/* =====================================================
   SECTION 5 : ADVANCED SQL QUERIES  (Unit II Portfolio)
   ===================================================== */

-- Q1: Multi-table JOIN – department-level energy consumption
SELECT
    D.dept_name,
    B.bld_name,
    R.room_no,
    SUM(E.kwh_consumed) AS total_kwh
FROM ENERGY_READING E
JOIN ENERGY_METER M ON E.meter_id    = M.meter_id
JOIN ROOM         R ON M.room_id     = R.room_id
JOIN FLOOR        F ON R.floor_id    = F.floor_id
JOIN BUILDING     B ON F.building_id = B.building_id
JOIN DEPARTMENT   D ON B.dept_id     = D.dept_id
GROUP BY D.dept_name, B.bld_name, R.room_no
ORDER BY total_kwh DESC;
GO

-- Q2: Correlated subquery – rooms consuming above their building average
SELECT R.room_no, R.room_type, SUM(E.kwh_consumed) AS room_kwh
FROM ENERGY_READING E
JOIN ENERGY_METER M ON E.meter_id = M.meter_id
JOIN ROOM         R ON M.room_id  = R.room_id
GROUP BY R.room_id, R.room_no, R.room_type, R.floor_id
HAVING SUM(E.kwh_consumed) > (
    SELECT AVG(sub_kwh) FROM (
        SELECT SUM(E2.kwh_consumed) AS sub_kwh
        FROM ENERGY_READING E2
        JOIN ENERGY_METER M2 ON E2.meter_id = M2.meter_id
        JOIN ROOM         R2 ON M2.room_id  = R2.room_id
        JOIN FLOOR        F2 ON R2.floor_id = F2.floor_id
        WHERE F2.building_id = (
            SELECT F3.building_id FROM FLOOR F3 WHERE F3.floor_id = R.floor_id
        )
        GROUP BY R2.room_id
    ) AS bldg_avg
);
GO

-- Q3: Window function – RANK rooms by energy consumption within each building
SELECT
    B.bld_name,
    R.room_no,
    SUM(E.kwh_consumed) AS total_kwh,
    RANK() OVER (
        PARTITION BY B.building_id
        ORDER BY SUM(E.kwh_consumed) DESC
    ) AS energy_rank_in_building
FROM ENERGY_READING E
JOIN ENERGY_METER M ON E.meter_id    = M.meter_id
JOIN ROOM         R ON M.room_id     = R.room_id
JOIN FLOOR        F ON R.floor_id    = F.floor_id
JOIN BUILDING     B ON F.building_id = B.building_id
GROUP BY B.building_id, B.bld_name, R.room_id, R.room_no;
GO

-- Q4: CTE – building → floor → room drill-down hierarchy
WITH BuildingHierarchy AS (
    SELECT
        B.bld_name, F.floor_label,
        R.room_no,  R.room_type, R.capacity,
        B.building_id, F.floor_id, R.room_id
    FROM BUILDING B
    JOIN FLOOR F ON F.building_id = B.building_id
    JOIN ROOM  R ON R.floor_id    = F.floor_id
)
SELECT
    bld_name    AS building,
    floor_label AS floor,
    room_no     AS room,
    room_type,
    capacity,
    (SELECT COUNT(*) FROM EQUIPMENT   WHERE room_id = BH.room_id) AS equipment_count,
    (SELECT COUNT(*) FROM ENERGY_METER WHERE room_id = BH.room_id) AS meters_installed
FROM BuildingHierarchy BH
ORDER BY building_id, floor_id, room_id;
GO

-- Q5: LAG window function – hour-over-hour energy anomaly detection
SELECT
    meter_id,
    timestamp,
    kwh_consumed,
    LAG(kwh_consumed) OVER (PARTITION BY meter_id ORDER BY timestamp) AS prev_kwh,
    kwh_consumed
        - LAG(kwh_consumed) OVER (PARTITION BY meter_id ORDER BY timestamp) AS delta_kwh,
    CASE
        WHEN kwh_consumed
           - LAG(kwh_consumed) OVER (PARTITION BY meter_id ORDER BY timestamp) > 2
        THEN 'SPIKE DETECTED'
        ELSE 'Normal'
    END AS anomaly_flag
FROM ENERGY_READING;
GO

-- Q6: PIVOT-style CASE – booking status count per room (Slice & Dice demo)
SELECT
    R.room_no,
    COUNT(CASE WHEN BK.status='Approved'  THEN 1 END) AS approved,
    COUNT(CASE WHEN BK.status='Pending'   THEN 1 END) AS pending,
    COUNT(CASE WHEN BK.status='Cancelled' THEN 1 END) AS cancelled,
    COUNT(CASE WHEN BK.status='Rejected'  THEN 1 END) AS rejected,
    COUNT(BK.booking_id)                               AS total_bookings
FROM ROOM R
LEFT JOIN BOOKING BK ON R.room_id = BK.room_id
GROUP BY R.room_id, R.room_no
ORDER BY total_bookings DESC;
GO

-- Q7: Nested subquery – students who have NEVER made a booking
SELECT U.name, U.email, S.roll_no
FROM USERS   U
JOIN STUDENT S ON U.user_id = S.user_id
WHERE U.user_id NOT IN (SELECT DISTINCT user_id FROM BOOKING);
GO

-- Q8: Aggregate with HAVING – rooms with at least one open maintenance ticket
SELECT R.room_no, R.room_type, COUNT(T.ticket_id) AS open_tickets
FROM ROOM R
JOIN MAINTENANCE_TICKET T ON R.room_id = T.room_id
WHERE T.status IN ('Open','In Progress')
GROUP BY R.room_id, R.room_no, R.room_type
HAVING COUNT(T.ticket_id) > 0
ORDER BY open_tickets DESC;
GO


/* =====================================================
   SECTION 6 : TRANSACTION DEMOS  (Unit III – ACID)
   ===================================================== */

-- ── A1. ATOMICITY ─────────────────────────────────────────
-- "All or nothing" — if any step fails, everything rolls back.
-- Scenario: booking + access log must both succeed or both fail.

PRINT '=== A1: ATOMICITY DEMO ===';

-- Test 1: Both steps succeed → COMMIT
BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO BOOKING (start_time,end_time,purpose,status,room_id,user_id)
        VALUES ('2025-06-01 09:00','2025-06-01 10:00','Atomicity Demo - Success','Pending',104,1);

        INSERT INTO ACCESS_LOG (entry_time,access_method,room_id,user_id)
        VALUES ('2025-06-01 08:58','RFID',104,1);

        COMMIT TRANSACTION;
        PRINT 'A1-Test1: Both inserts succeeded. COMMITTED.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'A1-Test1: ROLLED BACK. Error: ' + ERROR_MESSAGE();
    END CATCH;
GO

-- Test 2: Second step deliberately fails (invalid room_id 9999 – FK violation)
--         → Booking insert must also be rolled back (Atomicity confirmed)
BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO BOOKING (start_time,end_time,purpose,status,room_id,user_id)
        VALUES ('2025-06-01 10:00','2025-06-01 11:00','Atomicity Demo - Should Rollback','Pending',104,1);

        -- This WILL fail — room_id 9999 does not exist
        INSERT INTO ACCESS_LOG (entry_time,access_method,room_id,user_id)
        VALUES ('2025-06-01 09:58','RFID',9999,1);

        COMMIT TRANSACTION;
        PRINT 'A1-Test2: COMMITTED (this line should NOT print).';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'A1-Test2: FK violation triggered ROLLBACK — Atomicity confirmed.';
    END CATCH;
GO

-- ── A2. CONSISTENCY ───────────────────────────────────────
-- Database must move from one valid state to another.
-- CHECK constraint rejects end_time < start_time.

PRINT '=== A2: CONSISTENCY DEMO ===';

-- Test: end_time before start_time → CHECK constraint fires → ROLLBACK
BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO BOOKING (start_time,end_time,purpose,status,room_id,user_id)
        VALUES ('2025-06-02 11:00','2025-06-02 09:00','Invalid Times','Pending',104,1);
        COMMIT TRANSACTION;
        PRINT 'A2: COMMITTED — this should NOT print.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'A2: CHECK constraint fired. ROLLED BACK — Consistency confirmed.';
    END CATCH;
GO

-- ── B. ISOLATION LEVELS ───────────────────────────────────
PRINT '=== B: ISOLATION LEVEL DEMO ===';

-- B1. READ COMMITTED (default) — reads only committed data
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION;
    SELECT booking_id, status FROM BOOKING WHERE room_id = 104;
COMMIT TRANSACTION;
GO

-- B2. SERIALIZABLE — strictest; no phantom reads allowed
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
    SELECT COUNT(*) AS total_bookings FROM BOOKING WHERE status = 'Pending';
COMMIT TRANSACTION;
GO

-- ── C. DEADLOCK SCENARIO ──────────────────────────────────
-- Run T1 in Session A and T2 in Session B simultaneously in SSMS.
-- SQL Server detects the cycle and auto-rolls back one transaction.

PRINT '=== C: DEADLOCK DEMO (run T1 and T2 in separate windows) ===';

-- T1 (Session A):
-- BEGIN TRANSACTION;
--   UPDATE BOOKING SET status = 'Approved'  WHERE booking_id = 4;  -- locks row 4
--   WAITFOR DELAY '00:00:05';
--   UPDATE BOOKING SET status = 'Cancelled' WHERE booking_id = 5;  -- wants row 5
-- COMMIT TRANSACTION;

-- T2 (Session B):
-- BEGIN TRANSACTION;
--   UPDATE BOOKING SET status = 'Approved'  WHERE booking_id = 5;  -- locks row 5
--   WAITFOR DELAY '00:00:05';
--   UPDATE BOOKING SET status = 'Cancelled' WHERE booking_id = 4;  -- wants row 4
-- COMMIT TRANSACTION;

-- SQL Server prints for the deadlock victim:
-- Msg 1205: Transaction was deadlocked on lock resources with another process
--           and has been chosen as the deadlock victim. Re-run the transaction.

-- ── D. TWO-PHASE LOCKING (2PL) ────────────────────────────
-- Growing phase: acquire all locks before any release.
-- Shrinking phase: release locks, no new locks acquired.

PRINT '=== D: TWO-PHASE LOCKING DEMO ===';

BEGIN TRANSACTION;
    -- Growing phase: acquire S-lock (read)
    SELECT * FROM BOOKING WHERE booking_id = 4;        -- S-lock acquired
    PRINT '2PL Growing Phase: S-lock acquired on Booking 4.';

    -- Growing phase: escalate to X-lock (write)
    UPDATE BOOKING SET status = 'Approved' WHERE booking_id = 4;  -- X-lock acquired
    PRINT '2PL Growing Phase: X-lock acquired for update.';

    -- Shrinking phase begins at COMMIT — all locks released
    COMMIT TRANSACTION;
    PRINT '2PL Shrinking Phase: COMMIT — all locks released.';
GO


/* =====================================================
   SECTION 7 : STORED PROCEDURES
   ===================================================== */

-- Procedure 1: Safe room booking with conflict check + transaction
CREATE OR ALTER PROCEDURE usp_AddBooking
    @start_time  DATETIME,
    @end_time    DATETIME,
    @purpose     VARCHAR(200),
    @room_id     INT,
    @user_id     INT,
    @slot_id     INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @end_time <= @start_time
    BEGIN
        RAISERROR('End time must be after start time.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Conflict check: is room already booked in this window?
        IF EXISTS (
            SELECT 1 FROM BOOKING
            WHERE room_id   = @room_id
              AND status    IN ('Pending','Approved')
              AND start_time < @end_time
              AND end_time   > @start_time
        )
        BEGIN
            RAISERROR('Room is already booked for this time slot.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO BOOKING (start_time, end_time, purpose, status, room_id, user_id, slot_id)
        VALUES (@start_time, @end_time, @purpose, 'Pending', @room_id, @user_id, @slot_id);

        COMMIT TRANSACTION;
        PRINT 'Booking created successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure 2: Approve / reject / cancel a booking
CREATE OR ALTER PROCEDURE usp_UpdateBookingStatus
    @booking_id  INT,
    @new_status  VARCHAR(50),
    @approver_id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @new_status NOT IN ('Approved','Rejected','Cancelled','Completed')
    BEGIN
        RAISERROR('Invalid status value.', 16, 1);
        RETURN;
    END

    DECLARE @old_status VARCHAR(50);
    SELECT @old_status = status FROM BOOKING WHERE booking_id = @booking_id;

    IF @old_status IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE BOOKING SET status = @new_status WHERE booking_id = @booking_id;
        -- Audit trail is auto-inserted by trg_booking_update trigger
        COMMIT TRANSACTION;
        PRINT 'Booking ' + CAST(@booking_id AS VARCHAR) + ' updated to ' + @new_status;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ── Test stored procedures ───────────────────────────────
-- Test 1: Should succeed (no conflict)
EXEC usp_AddBooking
    @start_time = '2025-04-13 09:00',
    @end_time   = '2025-04-13 10:00',
    @purpose    = 'Extra Tutorial',
    @room_id    = 104,
    @user_id    = 1;
GO

-- Test 2: Same room + same time → should FAIL with conflict error
EXEC usp_AddBooking
    @start_time = '2025-04-13 09:00',
    @end_time   = '2025-04-13 10:00',
    @purpose    = 'Another Class',
    @room_id    = 104,
    @user_id    = 2;
GO

-- Test 3: Approve a booking (triggers UPDATE audit trail)
EXEC usp_UpdateBookingStatus
    @booking_id  = 4,
    @new_status  = 'Approved',
    @approver_id = 1;
GO


/* =====================================================
   SECTION 8 : TRIGGERS
   ===================================================== */

-- Trigger 1: Auto-audit on booking INSERT
CREATE OR ALTER TRIGGER trg_booking_insert
ON BOOKING
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO AUDIT_TRAIL (audit_id, action_type, timestamp, old_value, new_value, booking_id)
    SELECT
        NEWID(),
        'INSERT',
        GETDATE(),
        NULL,
        'New booking created – Status: ' + i.status,
        i.booking_id
    FROM inserted i;
END;
GO

-- Trigger 2: Audit on booking status UPDATE
CREATE OR ALTER TRIGGER trg_booking_update
ON BOOKING
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(status)
    BEGIN
        INSERT INTO AUDIT_TRAIL (audit_id, action_type, timestamp, old_value, new_value, booking_id)
        SELECT
            NEWID(),
            'UPDATE',
            GETDATE(),
            'Old status: ' + d.status,
            'New status: ' + i.status,
            i.booking_id
        FROM inserted i
        JOIN deleted  d ON i.booking_id = d.booking_id;
    END
END;
GO

-- Trigger 3: Prevent direct deletion of Approved bookings
CREATE OR ALTER TRIGGER trg_booking_nodelete
ON BOOKING
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM deleted WHERE status = 'Approved')
    BEGIN
        RAISERROR('Cannot delete an Approved booking. Set status to Cancelled first.',16,1);
        ROLLBACK;
        RETURN;
    END
    DELETE FROM BOOKING WHERE booking_id IN (SELECT booking_id FROM deleted);
END;
GO

-- Verify audit trail was populated by the SP test above
SELECT * FROM AUDIT_TRAIL ORDER BY timestamp DESC;
GO


/* =====================================================
   SECTION 9 : DATA WAREHOUSE  (Unit IV)
   Star Schema + Snowflake Extension
   ===================================================== */

-- ── FACT TABLE ────────────────────────────────────────────
-- One row per energy reading event
CREATE TABLE fact_energy_consumption (
    fact_id      INT   IDENTITY(1,1) PRIMARY KEY,
    date_key     INT   NOT NULL,   -- FK → dim_date
    room_key     INT   NOT NULL,   -- FK → dim_room
    meter_key    INT   NOT NULL,   -- FK → dim_meter
    kwh_consumed FLOAT NOT NULL,
    voltage      FLOAT,
    peak_flag    BIT   DEFAULT 0,
    cost_inr     AS (kwh_consumed * 8.5)  -- computed: ₹8.5 / kWh
);
GO

-- ── DIMENSION: DATE ───────────────────────────────────────
CREATE TABLE dim_date (
    date_key     INT         PRIMARY KEY,  -- YYYYMMDD integer key
    full_date    DATE        NOT NULL,
    day_name     VARCHAR(20),
    day_of_month INT,
    month_no     INT,
    month_name   VARCHAR(20),
    quarter      INT,
    year         INT,
    is_weekend   BIT,
    is_holiday   BIT DEFAULT 0,
    academic_week INT
);
GO

-- ── DIMENSION: ROOM (denormalized Star node) ──────────────
CREATE TABLE dim_room (
    room_key      INT IDENTITY(1,1) PRIMARY KEY,
    room_id       INT,
    room_no       VARCHAR(50),
    room_type     VARCHAR(50),
    capacity      INT,
    floor_label   VARCHAR(50),
    building_name VARCHAR(100),
    building_type VARCHAR(50),
    dept_name     VARCHAR(100)
);
GO

-- ── DIMENSION: ENERGY METER ───────────────────────────────
CREATE TABLE dim_meter (
    meter_key  INT IDENTITY(1,1) PRIMARY KEY,
    meter_id   INT,
    meter_type VARCHAR(50),
    room_no    VARCHAR(50)
);
GO

-- ── SNOWFLAKE EXTENSION: sub-dimensions ──────────────────
-- Normalizing dim_room further into dim_building and dim_department
-- demonstrates the Snowflake Schema taught in Unit IV.
CREATE TABLE dim_building (
    building_key INT IDENTITY(1,1) PRIMARY KEY,
    building_id  INT,
    bld_name     VARCHAR(100),
    bld_type     VARCHAR(50)
);
GO

CREATE TABLE dim_department (
    dept_key  INT IDENTITY(1,1) PRIMARY KEY,
    dept_id   INT,
    dept_name VARCHAR(100)
);
GO


/* =====================================================
   SECTION 10 : ETL PIPELINE  (OLTP → Data Warehouse)
   ===================================================== */

-- ETL Step 1: Populate dim_date for all of 2025
INSERT INTO dim_date
SELECT
    CAST(FORMAT(d,'yyyyMMdd') AS INT) AS date_key,
    d                                 AS full_date,
    DATENAME(WEEKDAY, d)              AS day_name,
    DAY(d)                            AS day_of_month,
    MONTH(d)                          AS month_no,
    DATENAME(MONTH, d)                AS month_name,
    DATEPART(QUARTER, d)              AS quarter,
    YEAR(d)                           AS year,
    CASE WHEN DATEPART(WEEKDAY,d) IN (1,7) THEN 1 ELSE 0 END AS is_weekend,
    0                                 AS is_holiday,
    DATEPART(WEEK, d)                 AS academic_week
FROM (
    SELECT DATEADD(DAY, n, '2025-01-01') AS d
    FROM (
        SELECT TOP 365 ROW_NUMBER() OVER (ORDER BY (SELECT NULL))-1 AS n
        FROM sys.objects
    ) nums
) dates;
GO

-- ETL Step 2: Populate dim_room (denormalized from OLTP)
INSERT INTO dim_room (room_id, room_no, room_type, capacity, floor_label,
                      building_name, building_type, dept_name)
SELECT
    R.room_id, R.room_no, R.room_type, R.capacity,
    F.floor_label,
    B.bld_name, B.bld_type,
    D.dept_name
FROM ROOM       R
JOIN FLOOR      F ON R.floor_id    = F.floor_id
JOIN BUILDING   B ON F.building_id = B.building_id
JOIN DEPARTMENT D ON B.dept_id     = D.dept_id;
GO

-- ETL Step 3: Populate dim_meter
INSERT INTO dim_meter (meter_id, meter_type, room_no)
SELECT M.meter_id, M.meter_type, R.room_no
FROM ENERGY_METER M
JOIN ROOM R ON M.room_id = R.room_id;
GO

-- ETL Step 4: Load fact table from OLTP readings
INSERT INTO fact_energy_consumption
    (date_key, room_key, meter_key, kwh_consumed, voltage, peak_flag)
SELECT
    CAST(FORMAT(CAST(E.timestamp AS DATE),'yyyyMMdd') AS INT) AS date_key,
    DR.room_key,
    DM.meter_key,
    E.kwh_consumed,
    E.voltage,
    E.peak_flag
FROM ENERGY_READING E
JOIN ENERGY_METER M  ON E.meter_id  = M.meter_id
JOIN dim_meter    DM ON DM.meter_id = M.meter_id
JOIN dim_room     DR ON DR.room_id  = M.room_id;
GO


/* =====================================================
   SECTION 11 : OLAP QUERIES  (Unit IV)
   ===================================================== */

-- OLAP 1: ROLL-UP – daily → monthly → quarterly → yearly energy
SELECT
    DD.year,
    DD.quarter,
    DD.month_name,
    DD.full_date,
    SUM(F.kwh_consumed) AS total_kwh,
    SUM(F.cost_inr)     AS total_cost_inr
FROM fact_energy_consumption F
JOIN dim_date DD ON F.date_key = DD.date_key
GROUP BY GROUPING SETS (
    (DD.year, DD.quarter, DD.month_name, DD.full_date),  -- day level
    (DD.year, DD.quarter, DD.month_name),                 -- month level
    (DD.year, DD.quarter),                                -- quarter level
    (DD.year),                                            -- year level
    ()                                                    -- grand total
)
ORDER BY DD.year, DD.quarter, DD.month_name, DD.full_date;
GO

-- OLAP 2: DRILL-DOWN – campus → building → floor → room
SELECT
    DR.dept_name,
    DR.building_name,
    DR.floor_label,
    DR.room_no,
    SUM(F.kwh_consumed) AS total_kwh
FROM fact_energy_consumption F
JOIN dim_room DR ON F.room_key = DR.room_key
GROUP BY DR.dept_name, DR.building_name, DR.floor_label, DR.room_no
ORDER BY DR.dept_name, DR.building_name, DR.floor_label, total_kwh DESC;
GO

-- OLAP 3: SLICE – fix year = 2025, show all rooms
SELECT DR.room_no, DR.building_name, SUM(F.kwh_consumed) AS kwh_2025
FROM fact_energy_consumption F
JOIN dim_date DD ON F.date_key = DD.date_key
JOIN dim_room DR ON F.room_key = DR.room_key
WHERE DD.year = 2025
GROUP BY DR.room_no, DR.building_name;
GO

-- OLAP 4: DICE – Q1 2025, Computer Labs, Electricity meters only
SELECT
    DR.room_no,
    DR.building_name,
    DD.month_name,
    SUM(F.kwh_consumed) AS kwh
FROM fact_energy_consumption F
JOIN dim_date  DD ON F.date_key  = DD.date_key
JOIN dim_room  DR ON F.room_key  = DR.room_key
JOIN dim_meter DM ON F.meter_key = DM.meter_key
WHERE DD.year      = 2025
  AND DD.quarter   = 1
  AND DR.room_type = 'Computer Lab'
  AND DM.meter_type = 'Electricity'
GROUP BY DR.room_no, DR.building_name, DD.month_name;
GO

-- OLAP 5: PIVOT – buildings as columns, months as rows (crosstab)
SELECT
    DD.month_name,
    SUM(CASE WHEN DR.building_name='E Block'  THEN F.kwh_consumed ELSE 0 END) AS [E Block],
    SUM(CASE WHEN DR.building_name='PI Block' THEN F.kwh_consumed ELSE 0 END) AS [PI Block]
FROM fact_energy_consumption F
JOIN dim_date DD ON F.date_key = DD.date_key
JOIN dim_room DR ON F.room_key = DR.room_key
GROUP BY DD.month_name, DD.month_no
ORDER BY DD.month_no;
GO


/* =====================================================
   SECTION 12 : VERIFICATION QUERIES
   Run these at any time to confirm everything is in place.
   ===================================================== */

-- 1. All tables in the database
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

-- 2. Confirm IDENTITY columns on all 4 key tables
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    COLUMNPROPERTY(OBJECT_ID(TABLE_NAME), COLUMN_NAME, 'IsIdentity') AS is_identity
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME  IN ('BOOKING','ACCESS_LOG','MAINTENANCE_TICKET','ENERGY_READING')
  AND COLUMN_NAME IN ('booking_id','log_id','ticket_id','reading_id')
ORDER BY TABLE_NAME;
GO

-- 3. Row counts – OLTP tables
SELECT 'USERS'              AS tbl, COUNT(*) AS rows FROM USERS              UNION ALL
SELECT 'BOOKING'            AS tbl, COUNT(*) AS rows FROM BOOKING            UNION ALL
SELECT 'ACCESS_LOG'         AS tbl, COUNT(*) AS rows FROM ACCESS_LOG         UNION ALL
SELECT 'MAINTENANCE_TICKET' AS tbl, COUNT(*) AS rows FROM MAINTENANCE_TICKET UNION ALL
SELECT 'ENERGY_READING'     AS tbl, COUNT(*) AS rows FROM ENERGY_READING     UNION ALL
SELECT 'ROOM'               AS tbl, COUNT(*) AS rows FROM ROOM               UNION ALL
SELECT 'ENERGY_METER'       AS tbl, COUNT(*) AS rows FROM ENERGY_METER       UNION ALL
SELECT 'EQUIPMENT'          AS tbl, COUNT(*) AS rows FROM EQUIPMENT;
GO

-- 4. Row counts – Data Warehouse tables
SELECT 'fact_energy_consumption' AS tbl, COUNT(*) AS rows FROM fact_energy_consumption UNION ALL
SELECT 'dim_room'                AS tbl, COUNT(*) AS rows FROM dim_room                UNION ALL
SELECT 'dim_meter'               AS tbl, COUNT(*) AS rows FROM dim_meter               UNION ALL
SELECT 'dim_date'                AS tbl, COUNT(*) AS rows FROM dim_date;
GO

-- 5. All foreign keys
SELECT
    fk.name          AS constraint_name,
    tp.name          AS parent_table,
    tr.name          AS referenced_table
FROM sys.foreign_keys fk
JOIN sys.tables tp ON fk.parent_object_id    = tp.object_id
JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
ORDER BY tp.name;
GO

-- 6. All views
SELECT TABLE_NAME AS view_name
FROM INFORMATION_SCHEMA.VIEWS
ORDER BY TABLE_NAME;
GO

-- 7. All indexes
SELECT
    t.name  AS table_name,
    i.name  AS index_name,
    i.type_desc
FROM sys.indexes i
JOIN sys.tables  t ON i.object_id = t.object_id
WHERE i.name IS NOT NULL
ORDER BY t.name, i.name;
GO

SELECT TOP 5 * FROM fact_energy_consumption ORDER BY fact_id DESC
SELECT TOP 20 * FROM ENERGY_READING ORDER BY reading_id DESC

