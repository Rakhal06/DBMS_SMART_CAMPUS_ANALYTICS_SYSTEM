/* =====================================================
   SMART CAMPUS RESOURCE & ENERGY ANALYTICS SYSTEM
   IIIT DHARWAD  |  DA264 – Database Management
   UNIT III – Transaction Management & Concurrency Control
   File: transactions_unit3_demo.sql
   Run in: SSMS (SQL Server Management Studio)
   ===================================================== */

USE SmartCampusDB;
GO

/* =====================================================
   SECTION A : ACID PROPERTIES — FULL DEMONSTRATION
   ===================================================== */

-- ─────────────────────────────────────────────────────
-- A1. ATOMICITY
--     "All or nothing" — if any step fails, the entire
--     transaction is rolled back as if nothing happened.
--
--     Scenario: A student books a room AND an access log
--     entry is created simultaneously. If the access log
--     insert fails (e.g. invalid room), the booking must
--     also be cancelled — not left dangling.
-- ─────────────────────────────────────────────────────

PRINT '=== A1: ATOMICITY DEMO ===';

-- Test 1: Both steps succeed → COMMIT
BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO BOOKING (booking_id, start_time, end_time, purpose, status, room_id, user_id)
        VALUES (501, '2025-06-01 09:00', '2025-06-01 10:00', 'Atomicity Demo - Success', 'Pending', 104, 1);

        INSERT INTO ACCESS_LOG (log_id, entry_time, access_method, room_id, user_id)
        VALUES (901, '2025-06-01 08:58', 'RFID', 104, 1);

        COMMIT TRANSACTION;
        PRINT 'A1-Test1: Both inserts succeeded. COMMITTED.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'A1-Test1: ROLLED BACK. Error: ' + ERROR_MESSAGE();
    END CATCH;
GO

-- Test 2: Second step deliberately fails (invalid room_id 9999)
--         → Booking insert must also be rolled back (Atomicity)
BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO BOOKING (booking_id, start_time, end_time, purpose, status, room_id, user_id)
        VALUES (502, '2025-06-01 10:00', '2025-06-01 11:00', 'Atomicity Demo - Should Rollback', 'Pending', 104, 1);

        -- This WILL fail — room_id 9999 does not exist (FK violation)
        INSERT INTO ACCESS_LOG (log_id, entry_time, access_method, room_id, user_id)
        VALUES (902, '2025-06-01 09:58', 'RFID', 9999, 1);

        COMMIT TRANSACTION;
        PRINT 'A1-Test2: COMMITTED (this line should NOT print).';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'A1-Test2: FK violation triggered ROLLBACK. Booking 502 does NOT exist — Atomicity confirmed.';
    END CATCH;
GO

-- Verify: booking_id 502 must NOT exist in the table
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ ATOMICITY VERIFIED: Booking 502 was rolled back successfully.'
        ELSE               '❌ ATOMICITY FAILED: Booking 502 was incorrectly committed.'
    END AS atomicity_result
FROM BOOKING
WHERE booking_id = 502;
GO


-- ─────────────────────────────────────────────────────
-- A2. CONSISTENCY
--     The database must move from one valid state to
--     another. Constraints must never be violated.
--
--     Scenario 1: Try booking a room that is already
--     booked for the same time window → CHECK constraint
--     + procedure logic rejects it cleanly.
--
--     Scenario 2: Try inserting a booking with
--     end_time < start_time → CHECK constraint fires.
-- ─────────────────────────────────────────────────────

PRINT '=== A2: CONSISTENCY DEMO ===';

-- Test 1: Overlapping booking — calls the safe stored procedure
EXEC usp_AddBooking
    @booking_id = 503,
    @start_time = '2025-06-01 09:00',   -- overlaps with booking 501 above
    @end_time   = '2025-06-01 09:30',
    @purpose    = 'Consistency Test - Overlap',
    @room_id    = 104,
    @user_id    = 2;
-- Expected output: "Room is already booked for this time slot." — no insert occurs.
GO

-- Test 2: Invalid time range (end before start) — CHECK constraint
BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO BOOKING (booking_id, start_time, end_time, purpose, status, room_id, user_id)
        VALUES (504, '2025-06-02 11:00', '2025-06-02 09:00', 'Invalid Time Test', 'Pending', 105, 1);
        -- end_time < start_time violates CHECK constraint chk_bk_times
        COMMIT TRANSACTION;
        PRINT 'A2-Test2: COMMITTED (this should NOT print).';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'A2-Test2: CHECK constraint fired. ROLLED BACK. Consistency maintained.';
        PRINT 'Error: ' + ERROR_MESSAGE();
    END CATCH;
GO


-- ─────────────────────────────────────────────────────
-- A3. DURABILITY
--     Once a transaction is COMMITTED, data survives
--     even a system crash. SQL Server uses WAL
--     (Write-Ahead Logging) to guarantee this.
--
--     Scenario: Insert a booking, COMMIT it, then query
--     to confirm it persists. In a real crash test you
--     would restart SQL Server and re-query.
-- ─────────────────────────────────────────────────────

PRINT '=== A3: DURABILITY DEMO ===';

BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO BOOKING (booking_id, start_time, end_time, purpose, status, room_id, user_id)
        VALUES (505, '2025-06-03 14:00', '2025-06-03 15:00', 'Durability Demo', 'Pending', 107, 3);

        COMMIT TRANSACTION;
        PRINT 'A3: Booking 505 COMMITTED. SQL Server WAL ensures this survives a restart.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'A3: ROLLED BACK. Error: ' + ERROR_MESSAGE();
    END CATCH;
GO

-- Verify durability: this record exists even after server restart
SELECT booking_id, purpose, status, start_time
FROM   BOOKING
WHERE  booking_id = 505;
GO


/* =====================================================
   SECTION B : ISOLATION LEVELS
   Run Session A script first, then Session B in a
   SEPARATE SSMS query window without closing Session A.
   ===================================================== */

PRINT '=== B: ISOLATION LEVEL DEMO ===';

-- ─────────────────────────────────────────────────────
-- B1. READ COMMITTED (SQL Server default)
--     A transaction only sees data that has been
--     committed. It cannot read "dirty" (uncommitted)
--     data from another open transaction.
-- ─────────────────────────────────────────────────────

-- ▶ SESSION A — run this first, keep the window open:
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION;
    UPDATE BOOKING SET status = 'Approved' WHERE booking_id = 501;
    PRINT 'Session A: Updated booking 501 to Approved. NOT yet committed.';
    -- Do NOT commit yet. Switch to Session B window now.
    -- COMMIT TRANSACTION;  ← uncomment only after checking Session B
GO

-- ▶ SESSION B — run this in a SEPARATE query window while Session A is open:
 SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
 SELECT booking_id  , status FROM BOOKING WHERE booking_id = 501;
-- Expected: query BLOCKS (waits) until Session A commits or rolls back.
-- This proves READ COMMITTED prevents dirty reads.

-- ▶ Back in SESSION A — commit to unblock Session B:
-- COMMIT TRANSACTION;


-- ─────────────────────────────────────────────────────
-- B2. SERIALIZABLE (Strictest isolation)
--     Prevents dirty reads, non-repeatable reads,
--     AND phantom reads. Transactions execute as if
--     they were fully serial (one after another).
-- ─────────────────────────────────────────────────────

-- ▶ SESSION A:
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
    SELECT booking_id, status FROM BOOKING WHERE room_id = 104;
    PRINT 'Session A (SERIALIZABLE): Read all bookings for room 104. Range lock held.';
    -- Keep open. Session B cannot insert new rows for room 104 until this commits.
GO

-- ▶ SESSION B (separate window):
-- BEGIN TRANSACTION;
-- INSERT INTO BOOKING (booking_id,start_time,end_time,purpose,status,room_id,user_id)
-- VALUES (506,'2025-07-01 09:00','2025-07-01 10:00','Serializable Test','Pending',104,2);
-- Expected: INSERT BLOCKS — SERIALIZABLE holds a range lock on room_id=104.

-- ▶ Back in SESSION A — commit to release:
-- COMMIT TRANSACTION;
-- Session B will then complete its insert.


/* =====================================================
   SECTION C : DEADLOCK DEMONSTRATION
   Open TWO separate SSMS windows.
   Run the T1 steps in Window 1, T2 steps in Window 2,
   alternating as indicated by the step numbers.
   ===================================================== */

PRINT '=== C: DEADLOCK DEMO ===';

-- ─────────────────────────────────────────────────────
-- HOW A DEADLOCK HAPPENS:
--   T1 locks Booking 501, then wants Booking 502
--   T2 locks Booking 502, then wants Booking 501
--   Neither can proceed → SQL Server kills one (victim)
-- ─────────────────────────────────────────────────────

-- ▶ WINDOW 1 — Transaction T1:

-- Step 1 (run in Window 1):
BEGIN TRANSACTION;
    UPDATE BOOKING SET status = 'Approved' WHERE booking_id = 501;
    PRINT 'T1: Locked Booking 501. Waiting 5 seconds before requesting Booking 502...';
    WAITFOR DELAY '00:00:05';  -- pause to let T2 acquire its lock

-- Step 2 (run in Window 1 after T2 has run its Step 1):
    UPDATE BOOKING SET status = 'Approved' WHERE booking_id = 502;
    -- T1 now wants Booking 502, which T2 already locked → DEADLOCK
    COMMIT TRANSACTION;
    PRINT 'T1: COMMITTED (printed only if T1 wins the deadlock).';
GO

-- ▶ WINDOW 2 — Transaction T2 (run Step 1 while Window 1 is paused):

-- Step 1 (run in Window 2 immediately after Window 1 Step 1):
BEGIN TRANSACTION;
    UPDATE BOOKING SET status = 'Cancelled' WHERE booking_id = 502;
    PRINT 'T2: Locked Booking 502. Now requesting Booking 501...';

-- Step 2 (run in Window 2):
    UPDATE BOOKING SET status = 'Cancelled' WHERE booking_id = 501;
    -- T2 now wants Booking 501, which T1 already locked → DEADLOCK detected
    COMMIT TRANSACTION;
    PRINT 'T2: COMMITTED (printed only if T2 wins the deadlock).';
GO

-- ─────────────────────────────────────────────────────
-- Expected result:
--   SQL Server prints for the deadlock VICTIM:
--   "Msg 1205, Level 13, State 51 — Transaction was
--    deadlocked on lock resources with another process
--    and has been chosen as the deadlock victim.
--    Rerun the transaction."
--   The other transaction completes successfully.
-- ─────────────────────────────────────────────────────

-- Check audit trail to see which transaction survived:
SELECT TOP 5 action_type, timestamp, old_value, new_value, booking_id
FROM   AUDIT_TRAIL
WHERE  booking_id IN (501, 502)
ORDER  BY timestamp DESC;
GO


/* =====================================================
   SECTION D : TWO-PHASE LOCKING (2PL) PROTOCOL
   Demonstrates the growing phase and shrinking phase
   using explicit lock hints in SQL Server.
   ===================================================== */

PRINT '=== D: TWO-PHASE LOCKING (2PL) DEMO ===';

-- ─────────────────────────────────────────────────────
-- 2PL THEORY:
--   GROWING PHASE  → Transaction acquires all needed
--                    locks. No locks released yet.
--   LOCK POINT     → All required locks are held.
--   SHRINKING PHASE → Transaction releases locks.
--                    No new locks acquired.
--
-- SQL Server enforces 2PL automatically inside
-- transactions. We demonstrate it explicitly below
-- using UPDLOCK and HOLDLOCK hints.
-- ─────────────────────────────────────────────────────

BEGIN TRANSACTION;
    -- ── GROWING PHASE ────────────────────────────────
    -- Acquire S-lock (shared) on Booking 501
    SELECT booking_id, status
    FROM   BOOKING WITH (HOLDLOCK)       -- holds S-lock until end of transaction
    WHERE  booking_id = 501;
    PRINT '2PL Growing Phase: S-lock acquired on Booking 501.';

    -- Acquire U-lock (update) on Booking 502 before modifying
    SELECT booking_id, status
    FROM   BOOKING WITH (UPDLOCK, HOLDLOCK)  -- upgrade-ready lock
    WHERE  booking_id = 502;
    PRINT '2PL Growing Phase: U-lock acquired on Booking 502.';

    -- ── LOCK POINT ───────────────────────────────────
    -- All required locks are now held. This is the lock point.
    PRINT '2PL Lock Point: All locks held. Beginning data modification.';

    -- ── SHRINKING PHASE ──────────────────────────────
    -- Perform the actual update (U-lock upgrades to X-lock automatically)
    UPDATE BOOKING
    SET    status = 'Approved'
    WHERE  booking_id = 502;
    PRINT '2PL Shrinking Phase: X-lock used for update on Booking 502.';

    -- COMMIT releases ALL locks simultaneously (end of shrinking phase)
    COMMIT TRANSACTION;
    PRINT '2PL: COMMIT — all locks released. Shrinking phase complete.';
GO

-- ─────────────────────────────────────────────────────
-- 2PL TIMELINE SUMMARY (for report diagram):
--
--  Time →       T1 actions
--  ─────────────────────────────────────────────────
--  t1    [GROWING]  Acquire S-lock on Booking 501
--  t2    [GROWING]  Acquire U-lock on Booking 502
--  t3    [LOCK PT]  All locks held — read phase done
--  t4    [SHRINK]   Upgrade U→X, UPDATE Booking 502
--  t5    [SHRINK]   COMMIT — release S-lock + X-lock
--  ─────────────────────────────────────────────────
--  No new locks acquired after t3 (lock point).
--  This is the strict 2PL guarantee.
-- ─────────────────────────────────────────────────────


/* =====================================================
   SECTION E : TRANSACTION STATE DIAGRAM DEMO
   Shows all 5 transaction states from theory:
   Active → Partially Committed → Committed
   Active → Failed → Aborted
   ===================================================== */

PRINT '=== E: TRANSACTION STATES DEMO ===';

-- Path 1: Active → Partially Committed → COMMITTED
PRINT 'State: ACTIVE — transaction has started.';
BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO MAINTENANCE_TICKET
            (ticket_id, reported_date, description, priority, status, room_id, reported_by)
        VALUES
            (201, GETDATE(), 'AC not working — Unit III state demo', 'High', 'Open', 109, 1);

        PRINT 'State: PARTIALLY COMMITTED — all operations done, awaiting COMMIT.';
        COMMIT TRANSACTION;
        PRINT 'State: COMMITTED — data written to disk via WAL. Durable.';
    END TRY
    BEGIN CATCH
        PRINT 'State: FAILED — error detected during execution.';
        ROLLBACK TRANSACTION;
        PRINT 'State: ABORTED — all changes undone. Database restored to prior state.';
        PRINT 'Error: ' + ERROR_MESSAGE();
    END CATCH;
GO

-- Path 2: Active → Failed → ABORTED (forced failure)
PRINT 'Demonstrating FAILED → ABORTED path:';
BEGIN TRANSACTION;
    BEGIN TRY
        PRINT 'State: ACTIVE';
        -- Force a failure: divide by zero inside a transaction
        INSERT INTO MAINTENANCE_TICKET
            (ticket_id, reported_date, description, priority, status, room_id, reported_by)
        VALUES
            (201, GETDATE(), 'Duplicate ticket — will fail', 'Low', 'Open', 109, 1);
        -- ticket_id 201 already exists → PK violation → FAILURE
        PRINT 'State: PARTIALLY COMMITTED (should not reach here)';
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        PRINT 'State: FAILED — PK violation detected (ticket_id 201 already exists).';
        ROLLBACK TRANSACTION;
        PRINT 'State: ABORTED — transaction undone. Database unchanged.';
    END CATCH;
GO


/* =====================================================
   SECTION F : RECOVERY — WAL (Write-Ahead Log) DEMO
   Demonstrates SQL Server's WAL-based recovery.
   ===================================================== */

PRINT '=== F: WAL RECOVERY DEMO ===';

-- Step 1: Insert without committing (simulates in-flight transaction)
BEGIN TRANSACTION;
    INSERT INTO BOOKING (booking_id, start_time, end_time, purpose, status, room_id, user_id)
    VALUES (599, '2025-08-01 10:00', '2025-08-01 11:00', 'WAL Recovery Test - NOT committed', 'Pending', 112, 1);

    PRINT 'WAL Demo: Record inserted but NOT committed.';
    PRINT 'If SQL Server crashes NOW, this record will NOT survive (WAL UNDO on restart).';

    -- Intentional ROLLBACK to simulate crash recovery (UNDO)
    ROLLBACK TRANSACTION;
    PRINT 'WAL Demo: ROLLBACK issued — record undone (same as crash + WAL UNDO recovery).';
GO

-- Verify: booking 599 must not exist
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ WAL UNDO confirmed: Booking 599 does not exist after rollback.'
        ELSE               '❌ WAL Demo failed: Booking 599 incorrectly persisted.'
    END AS wal_result
FROM BOOKING WHERE booking_id = 599;
GO

-- Step 2: Committed transaction — survives WAL REDO
BEGIN TRANSACTION;
    INSERT INTO BOOKING (booking_id, start_time, end_time, purpose, status, room_id, user_id)
    VALUES (600, '2025-08-02 10:00', '2025-08-02 11:00', 'WAL Recovery Test - COMMITTED', 'Pending', 112, 1);
    COMMIT TRANSACTION;
    PRINT 'WAL Demo: Booking 600 COMMITTED. WAL REDO ensures it survives even a server crash.';
GO

SELECT booking_id, purpose, status
FROM   BOOKING
WHERE  booking_id = 600;
GO


/* =====================================================
   CLEANUP — Remove demo rows (optional, run after demo)
   ===================================================== */

-- DELETE FROM BOOKING         WHERE booking_id IN (501,505,600);
-- DELETE FROM ACCESS_LOG      WHERE log_id     IN (901);
-- DELETE FROM MAINTENANCE_TICKET WHERE ticket_id = 201;
-- DELETE FROM AUDIT_TRAIL     WHERE booking_id IN (501,502,505);