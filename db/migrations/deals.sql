CREATE TYPE deal_status AS ENUM (
    'NEW',
    'CONTACTED',
    'VISIT_REQUESTED',
    'VISIT_ASSIGNED',
    'VISIT_COMPLETED',
    'NEGOTIATION',
    'SOLD',
    'LOST',
    'DORMANT'
);

CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    crop_type TEXT,
    estimated_quantity NUMERIC,
    expected_value NUMERIC,

    status deal_status NOT NULL DEFAULT 'NEW',

    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),

    closed_reason TEXT,
    closed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_deals_lead_id ON deals(lead_id);
CREATE INDEX idx_deals_status ON deals(status);