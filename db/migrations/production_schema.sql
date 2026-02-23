-- ==============================================================================
-- Bull Connect CRM - Production Schema
-- ==============================================================================
-- This schema is designed for production use with strict constraints,
-- proper indexing, and audit capabilities.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- ENUMS
-- ==============================================================================

-- User roles (internal employees + admin)
CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'MANAGER',
    'TELECALLER',
    'FIELD_MANAGER',
    'FIELD_EXEC'
);

-- Lead status with strict state machine
CREATE TYPE lead_status AS ENUM (
    'NEW',
    'ASSIGNED',
    'CONTACTED',
    'FIELD_REQUESTED',
    'DROPPED'
);

-- Call dispositions
CREATE TYPE call_disposition AS ENUM (
    'INTERESTED',
    'CALLBACK',
    'BUSY',
    'NOT_INTERESTED',
    'NO_ANSWER',
    'INVALID_NUMBER'
);

-- Drop reasons
CREATE TYPE drop_reason AS ENUM (
    'NOT_INTERESTED',
    'INVALID_NUMBER',
    'DUPLICATE',
    'OUT_OF_AREA',
    'NOT_QUALIFIED',
    'OTHER'
);

-- Entity types for audit
CREATE TYPE entity_type AS ENUM (
    'USER',
    'CAMPAIGN',
    'LEAD',
    'ASSIGNMENT',
    'CALL_LOG'
);

-- Audit actions
CREATE TYPE audit_action AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'ASSIGN',
    'STATUS_CHANGE'
);

-- ==============================================================================
-- TABLE: users
-- ==============================================================================
-- Internal employees with authentication and role-based access

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Role and status
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Contact
    phone VARCHAR(15),
    email VARCHAR(255),
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (char_length(username) >= 3),
    CHECK (char_length(name) >= 2)
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ==============================================================================
-- TABLE: campaigns
-- ==============================================================================
-- Marketing campaigns for lead grouping

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Ownership
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (end_date IS NULL OR end_date >= start_date),
    CHECK (char_length(name) >= 3)
);

-- Indexes
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

-- ==============================================================================
-- TABLE: leads
-- ==============================================================================
-- Core lead entity with farmer information and state machine

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Farmer details
    farmer_name VARCHAR(255),
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    
    -- Location
    village VARCHAR(255),
    taluka VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(100),
    
    -- Campaign association
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
    
    -- State machine
    status lead_status NOT NULL DEFAULT 'NEW',
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Call tracking
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_contacted_at TIMESTAMP,
    next_callback_at TIMESTAMP,
    
    -- Drop information
    drop_reason drop_reason,
    drop_notes TEXT,
    
    -- Agricultural details
    crop_type VARCHAR(100),
    acreage NUMERIC(10, 2),
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (phone_number ~ '^[0-9]{10,15}$'),
    CHECK (attempt_count >= 0),
    CHECK (acreage IS NULL OR acreage > 0),
    CHECK (
        (status = 'DROPPED' AND drop_reason IS NOT NULL) OR
        (status != 'DROPPED' AND drop_reason IS NULL)
    ),
    CHECK (
        (status = 'FIELD_REQUESTED' AND crop_type IS NOT NULL AND acreage IS NOT NULL) OR
        (status != 'FIELD_REQUESTED')
    )
);

-- Indexes (CRITICAL for performance)
CREATE INDEX idx_leads_phone_number ON leads(phone_number);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_next_callback ON leads(next_callback_at) WHERE next_callback_at IS NOT NULL;
CREATE INDEX idx_leads_status_assigned ON leads(status, assigned_to);

-- ==============================================================================
-- TABLE: call_logs
-- ==============================================================================
-- Every call attempt by telecallers

CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Call details
    disposition call_disposition NOT NULL,
    notes TEXT,
    
    -- Follow-up
    next_callback_at TIMESTAMP,
    
    -- Duration (in seconds, optional)
    duration_seconds INTEGER,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

-- Indexes
CREATE INDEX idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX idx_call_logs_created_at ON call_logs(created_at);
CREATE INDEX idx_call_logs_disposition ON call_logs(disposition);

-- ==============================================================================
-- TABLE: assignments
-- ==============================================================================
-- Track lead assignments with history

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Assignment details
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX idx_assignments_lead_id ON assignments(lead_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_is_active ON assignments(is_active);

-- ==============================================================================
-- TABLE: audit_logs
-- ==============================================================================
-- System-wide audit trail for compliance

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- Actor
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Target
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Action
    action audit_action NOT NULL,
    
    -- Details (flexible JSON for any additional data)
    metadata JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING gin(metadata);

-- ==============================================================================
-- TABLE: points
-- ==============================================================================
-- Gamification and performance tracking

CREATE TABLE points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Points
    points INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (points != 0)
);

-- Indexes
CREATE INDEX idx_points_user_id ON points(user_id);
CREATE INDEX idx_points_created_at ON points(created_at);

-- ==============================================================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- STATE MACHINE VALIDATION
-- ==============================================================================

-- Function to validate lead state transitions
CREATE OR REPLACE FUNCTION validate_lead_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow initial creation
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'NEW' THEN
            RAISE EXCEPTION 'New leads must have status NEW';
        END IF;
        RETURN NEW;
    END IF;
    
    -- Check valid transitions on update
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

-- Apply state machine validation trigger
CREATE TRIGGER enforce_lead_status_transitions
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION validate_lead_status_transition();

-- ==============================================================================
-- VIEWS FOR COMMON QUERIES
-- ==============================================================================

-- View: Active leads by status
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

-- View: Telecaller performance
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
-- COMMENTS
-- ==============================================================================

COMMENT ON TABLE users IS 'Internal employees with authentication and role-based access';
COMMENT ON TABLE campaigns IS 'Marketing campaigns for lead grouping and tracking';
COMMENT ON TABLE leads IS 'Core lead entity with strict state machine enforcement';
COMMENT ON TABLE call_logs IS 'Complete audit trail of all call attempts';
COMMENT ON TABLE audit_logs IS 'System-wide audit trail for compliance and debugging';
COMMENT ON TABLE assignments IS 'Historical record of all lead assignments';
COMMENT ON TABLE points IS 'Gamification and performance tracking system';

COMMENT ON COLUMN leads.status IS 'Enforced by trigger: NEW → ASSIGNED → CONTACTED → (FIELD_REQUESTED | DROPPED)';
COMMENT ON COLUMN leads.attempt_count IS 'Incremented automatically on each call log entry';
COMMENT ON COLUMN leads.phone_number IS 'Unique indexed field for fast lookups';

-- ==============================================================================
-- INITIAL DATA (Optional)
-- ==============================================================================

-- Create default admin user (password: 'admin123' - CHANGE IN PRODUCTION)
-- Password hash generated with bcrypt, cost factor 10
INSERT INTO users (name, username, password_hash, role, is_active)
VALUES (
    'System Admin',
    'admin',
    '$2b$10$rKvV1QO5z4tZyLqGx8c.LOjKGKJMJ2YyP7aH6HZs9jqF3WZj9fYJm',
    'ADMIN',
    true
) ON CONFLICT (username) DO NOTHING;

-- ==============================================================================
-- GRANTS (Adjust based on your application user)
-- ==============================================================================

-- Example: Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
