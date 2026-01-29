-- 004_create_assignments.sql
-- Ownership, grouping, and handoff tables

-- Leads grouped under campaigns (many-to-many)
CREATE TABLE lead_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES leads(id)
        ON DELETE RESTRICT,

    campaign_id UUID NOT NULL REFERENCES campaigns(id)
        ON DELETE RESTRICT,

    created_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE (lead_id, campaign_id)
);

-- Telecaller ownership during TELE_PROSPECTING
CREATE TABLE tele_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES leads(id)
        ON DELETE RESTRICT,

    telecaller_id UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    assigned_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE (lead_id)
);

-- Field visit requested after interest confirmation
CREATE TABLE field_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES leads(id)
        ON DELETE RESTRICT,

    requested_by UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    primary_crop TEXT NOT NULL,

    requested_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE (lead_id)
);

-- Field executive assignment (one per request)
CREATE TABLE field_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    field_request_id UUID NOT NULL REFERENCES field_requests(id)
        ON DELETE RESTRICT,

    field_exec_id UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    assigned_by UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    assigned_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE (field_request_id)
);