-- 001_phase1_seed.sql
-- Minimal realistic seed data for Phase 1 testing

-- -----------------------------
-- USERS
-- -----------------------------

INSERT INTO users (id, name, role, phone)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Manager One', 'MANAGER', '9000000001'),
  ('22222222-2222-2222-2222-222222222222', 'Telecaller One', 'TELECALLER', '9000000002'),
  ('33333333-3333-3333-3333-333333333333', 'Field Manager One', 'FIELD_MANAGER', '9000000003'),
  ('44444444-4444-4444-4444-444444444444', 'Field Exec One', 'FIELD_EXEC', '9000000004');

-- -----------------------------
-- CAMPAIGN
-- -----------------------------

INSERT INTO campaigns (id, name, created_by)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Idar Cotton Push', '11111111-1111-1111-1111-111111111111');

-- -----------------------------
-- LEADS (UNASSIGNED)
-- -----------------------------

INSERT INTO leads (id, phone, name, taluka, state)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '8000000001', 'Farmer A', 'Idar', 'UNASSIGNED'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '8000000002', 'Farmer B', 'Idar', 'UNASSIGNED'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '8000000003', 'Farmer C', 'Idar', 'UNASSIGNED');

-- -----------------------------
-- LINK LEADS TO CAMPAIGN
-- -----------------------------

INSERT INTO lead_campaigns (lead_id, campaign_id)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');