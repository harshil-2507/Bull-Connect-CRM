-- 006_create_points.sql
-- Gamification & analytics support

CREATE TABLE point_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id)
        ON DELETE RESTRICT,

    lead_id UUID REFERENCES leads(id)
        ON DELETE RESTRICT,

    points INTEGER NOT NULL,

    reason TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT now()
);