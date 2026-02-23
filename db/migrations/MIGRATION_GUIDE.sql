-- ==============================================================================
-- MIGRATION GUIDE: Upgrading to Production Schema
-- ==============================================================================
-- This guide helps you migrate from the existing schema to the production schema
-- Use this carefully in production - always backup first!
-- ==============================================================================

-- ==============================================================================
-- STEP 1: BACKUP YOUR DATA
-- ==============================================================================
-- BEFORE running any migration, create a backup:
-- pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

-- ==============================================================================
-- STEP 2: ADD MISSING COLUMNS TO USERS TABLE
-- ==============================================================================

-- Add username column (required for authentication)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;

-- Add password_hash column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add email column
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add updated_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing users with default values (CHANGE THESE IN PRODUCTION!)
UPDATE users 
SET username = LOWER(REPLACE(name, ' ', '_')) || '_' || SUBSTRING(id::text, 1, 4)
WHERE username IS NULL;

-- Set temporary password hash (MUST be changed after migration)
UPDATE users 
SET password_hash = '$2b$10$rKvV1QO5z4tZyLqGx8c.LOjKGKJMJ2YyP7aH6HZs9jqF3WZj9fYJm'
WHERE password_hash IS NULL;

-- Make columns NOT NULL after setting values
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

-- Add ADMIN role to existing enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';

-- ==============================================================================
-- STEP 3: UPDATE CAMPAIGNS TABLE
-- ==============================================================================

-- Add description column
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;

-- Add start_date column
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;

-- Add end_date column
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add is_active column
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add updated_at column
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Make start_date NOT NULL after setting default
ALTER TABLE campaigns ALTER COLUMN start_date SET NOT NULL;

-- ==============================================================================
-- STEP 4: MIGRATE LEADS TABLE
-- ==============================================================================

-- Rename 'name' to 'farmer_name'
ALTER TABLE leads RENAME COLUMN name TO farmer_name;

-- Rename 'phone' to 'phone_number'
ALTER TABLE leads RENAME COLUMN phone TO phone_number;

-- Add missing location columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS village VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- Update taluka from existing data if needed
-- (Assuming taluka already exists based on your schema)

-- Add campaign_id column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- Create status mapping (NEW, ASSIGNED, CONTACTED, FIELD_REQUESTED, DROPPED)
-- UNASSIGNED -> NEW
-- TELE_PROSPECTING -> ASSIGNED or CONTACTED (depending on attempt_count)
-- FIELD_VISIT_PENDING -> FIELD_REQUESTED
-- FIELD_VERIFICATION -> FIELD_REQUESTED
-- CONVERTED -> FIELD_REQUESTED (keep as requested until field exec confirms)
-- DROPPED -> DROPPED

-- First, create the new enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE lead_status AS ENUM ('NEW', 'ASSIGNED', 'CONTACTED', 'FIELD_REQUESTED', 'DROPPED');
    END IF;
END $$;

-- Add new status column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status lead_status;

-- Migrate old state to new status
UPDATE leads
SET status = CASE 
    WHEN state = 'UNASSIGNED' THEN 'NEW'::lead_status
    WHEN state = 'TELE_PROSPECTING' AND (attempt_count > 0 OR assigned_to IS NOT NULL) THEN 'CONTACTED'::lead_status
    WHEN state = 'TELE_PROSPECTING' THEN 'ASSIGNED'::lead_status
    WHEN state = 'FIELD_VISIT_PENDING' THEN 'FIELD_REQUESTED'::lead_status
    WHEN state = 'FIELD_VERIFICATION' THEN 'FIELD_REQUESTED'::lead_status
    WHEN state = 'CONVERTED' THEN 'FIELD_REQUESTED'::lead_status
    WHEN state = 'DROPPED' THEN 'DROPPED'::lead_status
    ELSE 'NEW'::lead_status
END
WHERE status IS NULL;

-- Add assigned_to column (if not exists)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add attempt_count column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0;

-- Add last_contacted_at column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;

-- Add next_callback_at column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_callback_at TIMESTAMP;

-- Add drop_reason column (enum)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'drop_reason') THEN
        CREATE TYPE drop_reason AS ENUM (
            'NOT_INTERESTED',
            'INVALID_NUMBER',
            'DUPLICATE',
            'OUT_OF_AREA',
            'NOT_QUALIFIED',
            'OTHER'
        );
    END IF;
END $$;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS drop_reason drop_reason;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS drop_notes TEXT;

-- Add crop information columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS acreage NUMERIC(10, 2);

-- Add updated_at column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Make status NOT NULL
ALTER TABLE leads ALTER COLUMN status SET NOT NULL;

-- ==============================================================================
-- STEP 5: MIGRATE CALL_ACTIONS TO CALL_LOGS
-- ==============================================================================

-- Check if call_actions exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_actions') THEN
        
        -- Create call_disposition enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_disposition') THEN
            CREATE TYPE call_disposition AS ENUM (
                'INTERESTED',
                'CALLBACK',
                'BUSY',
                'NOT_INTERESTED',
                'NO_ANSWER',
                'INVALID_NUMBER'
            );
        END IF;

        -- Create call_logs table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs') THEN
            CREATE TABLE call_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                disposition call_disposition NOT NULL,
                notes TEXT,
                next_callback_at TIMESTAMP,
                duration_seconds INTEGER,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
            );
        END IF;

        -- Migrate data from call_actions to call_logs
        INSERT INTO call_logs (id, lead_id, user_id, disposition, notes, created_at)
        SELECT 
            id,
            lead_id,
            telecaller_id as user_id,
            disposition::call_disposition,
            notes,
            created_at
        FROM call_actions
        WHERE disposition IN ('INTERESTED', 'CALLBACK', 'BUSY', 'NOT_INTERESTED');

        -- Update attempt_count based on call_actions
        UPDATE leads l
        SET attempt_count = (
            SELECT COUNT(*) 
            FROM call_actions ca 
            WHERE ca.lead_id = l.id
        );

        -- Update last_contacted_at
        UPDATE leads l
        SET last_contacted_at = (
            SELECT MAX(created_at)
            FROM call_actions ca
            WHERE ca.lead_id = l.id
        );

    END IF;
END $$;

-- ==============================================================================
-- STEP 6: CREATE AUDIT_LOGS TABLE
-- ==============================================================================

-- Create enums for audit logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN
        CREATE TYPE entity_type AS ENUM ('USER', 'CAMPAIGN', 'LEAD', 'ASSIGNMENT', 'CALL_LOG');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'STATUS_CHANGE');
    END IF;
END $$;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- STEP 7: CREATE ASSIGNMENTS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Migrate existing assignments from leads table
INSERT INTO assignments (lead_id, user_id, assigned_by, is_active)
SELECT 
    id as lead_id,
    assigned_to as user_id,
    (SELECT id FROM users WHERE role = 'MANAGER' LIMIT 1) as assigned_by,
    true as is_active
FROM leads
WHERE assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- STEP 8: CREATE POINTS TABLE (if not exists)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (points != 0)
);

-- ==============================================================================
-- STEP 9: CREATE INDEXES
-- ==============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- Leads indexes (CRITICAL)
CREATE INDEX IF NOT EXISTS idx_leads_phone_number ON leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_next_callback ON leads(next_callback_at) WHERE next_callback_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status_assigned ON leads(status, assigned_to);

-- Call logs indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_disposition ON call_logs(disposition);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING gin(metadata);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_lead_id ON assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_is_active ON assignments(is_active);

-- Points indexes
CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON points(created_at);

-- ==============================================================================
-- STEP 10: CREATE TRIGGERS
-- ==============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- State machine validation trigger
CREATE OR REPLACE FUNCTION validate_lead_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'NEW' THEN
            RAISE EXCEPTION 'New leads must have status NEW';
        END IF;
        RETURN NEW;
    END IF;
    
    IF OLD.status != NEW.status THEN
        CASE OLD.status
            WHEN 'NEW' THEN
                IF NEW.status NOT IN ('ASSIGNED') THEN
                    RAISE EXCEPTION 'Invalid transition: NEW → %', NEW.status;
                END IF;
            WHEN 'ASSIGNED' THEN
                IF NEW.status NOT IN ('CONTACTED') THEN
                    RAISE EXCEPTION 'Invalid transition: ASSIGNED → %', NEW.status;
                END IF;
            WHEN 'CONTACTED' THEN
                IF NEW.status NOT IN ('FIELD_REQUESTED', 'DROPPED') THEN
                    RAISE EXCEPTION 'Invalid transition: CONTACTED → %', NEW.status;
                END IF;
            WHEN 'FIELD_REQUESTED' THEN
                RAISE EXCEPTION 'Invalid transition: FIELD_REQUESTED is terminal';
            WHEN 'DROPPED' THEN
                RAISE EXCEPTION 'Invalid transition: DROPPED is terminal';
            ELSE
                RAISE EXCEPTION 'Unknown status: %', OLD.status;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_lead_status_transitions ON leads;
CREATE TRIGGER enforce_lead_status_transitions
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION validate_lead_status_transition();

-- ==============================================================================
-- STEP 11: CREATE VIEWS
-- ==============================================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_leads_by_status;
DROP VIEW IF EXISTS v_telecaller_stats;

-- Create views
CREATE VIEW v_leads_by_status AS
SELECT 
    l.status,
    l.campaign_id,
    c.name AS campaign_name,
    COUNT(*) AS lead_count,
    COUNT(DISTINCT l.assigned_to) AS unique_assignees
FROM leads l
JOIN campaigns c ON l.campaign_id = c.id
GROUP BY l.status, l.campaign_id, c.name;

CREATE VIEW v_telecaller_stats AS
SELECT 
    u.id AS user_id,
    u.name AS telecaller_name,
    COUNT(DISTINCT cl.lead_id) AS leads_contacted,
    COUNT(*) AS total_calls,
    COUNT(*) FILTER (WHERE cl.disposition = 'INTERESTED') AS interested_count,
    COUNT(*) FILTER (WHERE cl.disposition = 'NOT_INTERESTED') AS not_interested_count,
    ROUND(AVG(cl.duration_seconds)) AS avg_call_duration
FROM users u
LEFT JOIN call_logs cl ON u.id = cl.user_id
WHERE u.role = 'TELECALLER'
GROUP BY u.id, u.name;

-- ==============================================================================
-- STEP 12: VERIFICATION QUERIES
-- ==============================================================================

-- Run these queries to verify migration success:

-- Check user counts
SELECT role, COUNT(*) as count, COUNT(*) FILTER (WHERE is_active = true) as active
FROM users
GROUP BY role;

-- Check campaign counts
SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active
FROM campaigns;

-- Check lead status distribution
SELECT status, COUNT(*) as count
FROM leads
GROUP BY status
ORDER BY count DESC;

-- Check call logs count
SELECT COUNT(*) as total_calls,
       COUNT(DISTINCT lead_id) as unique_leads,
       COUNT(DISTINCT user_id) as unique_callers
FROM call_logs;

-- Check audit logs count
SELECT COUNT(*) as total_audit_entries,
       COUNT(DISTINCT entity_type) as entity_types
FROM audit_logs;

-- ==============================================================================
-- STEP 13: CLEANUP (Optional - after verifying migration)
-- ==============================================================================

-- Only run these after confirming everything works!
/*
-- Drop old state column from leads
ALTER TABLE leads DROP COLUMN IF EXISTS state;

-- Drop old lead_state enum
DROP TYPE IF EXISTS lead_state CASCADE;

-- Drop old call_actions table
DROP TABLE IF EXISTS call_actions CASCADE;

-- Drop old field_verifications table  
DROP TABLE IF EXISTS field_verifications CASCADE;
*/

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Final steps:
-- 1. Verify all data is present
-- 2. Test application functionality
-- 3. Monitor for errors
-- 4. Force all users to change passwords on next login
-- 5. Update application code to use new schema

SELECT 'Migration completed successfully!' as status;
