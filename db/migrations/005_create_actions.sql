-- 005_create_actions.sql
-- User actions and terminal outcomes

-- Telecaller call attempts and dispositions
CREATE TABLE call_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES leads(id)
        ON DELETE RESTRICT,

    telecaller_id UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    disposition TEXT NOT NULL CHECK (
        disposition IN (
            'INTERESTED',
            'CALLBACK',
            'BUSY',
            'NOT_INTERESTED'
        )
    ),

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Field executive verification (on-site)
CREATE TABLE field_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES leads(id)
        ON DELETE RESTRICT,

    field_exec_id UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    gps_checkin_ok BOOLEAN NOT NULL,
    photo_ref TEXT,

    final_status TEXT NOT NULL CHECK (
        final_status IN ('CONVERTED', 'DROPPED')
    ),

    verified_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE (lead_id)
);

-- Drop reasons (tele or field)
CREATE TABLE drop_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL REFERENCES leads(id)
        ON DELETE RESTRICT,

    reason TEXT NOT NULL,

    marked_by UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    marked_at TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE (lead_id)
);