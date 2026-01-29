-- 003_create_leads.sql
-- Core lead entity with strict state machine

CREATE TYPE lead_state AS ENUM (
    'UNASSIGNED',
    'TELE_PROSPECTING',
    'FIELD_VISIT_PENDING',
    'FIELD_VERIFICATION',
    'CONVERTED',
    'DROPPED'
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    phone TEXT NOT NULL UNIQUE,
    name TEXT,
    taluka TEXT,

    state lead_state NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT now()
);