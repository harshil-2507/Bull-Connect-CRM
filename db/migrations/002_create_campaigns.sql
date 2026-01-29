-- 002_create_campaigns.sql
-- Campaigns created by managers to group leads

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    created_by UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    created_at TIMESTAMP NOT NULL DEFAULT now()
);