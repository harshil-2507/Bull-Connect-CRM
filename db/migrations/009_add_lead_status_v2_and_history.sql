-- 009_add_lead_status_v2_and_history.sql
-- Additive, rollback-safe migration to introduce canonical lead_status_v2 and history

BEGIN;

-- 1) Add new column to leads to hold canonical state (nullable initially)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_status_v2 TEXT NULL;

-- 2) Create a status history table to record every transition (transactional and timestamped)
CREATE TABLE IF NOT EXISTS lead_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  changed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  from_status TEXT NULL,
  to_status TEXT NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 3) Add an index to speed up queries by lead
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_created_at ON lead_status_history(created_at DESC);

-- 4) Add lightweight index on leads.lead_status_v2 for filtering
CREATE INDEX IF NOT EXISTS idx_leads_status_v2 ON leads (lead_status_v2);

COMMIT;
