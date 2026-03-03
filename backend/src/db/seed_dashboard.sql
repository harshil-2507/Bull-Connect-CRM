-- ============================================
-- CLEAN SAFE DASHBOARD SEED
-- ============================================

-- 1️⃣ CREATE ADMIN (required for campaign)
INSERT INTO users (id, name, username, password_hash, role, is_active)
VALUES (
  gen_random_uuid(),
  'System Admin',
  'admin_seed',
  'dummyhash',
  'ADMIN',
  true
)
ON CONFLICT (username) DO NOTHING;

-- 2️⃣ CREATE TELECALLERS
INSERT INTO users (id, name, username, password_hash, role, is_active, phone)
SELECT
  gen_random_uuid(),
  'Telecaller ' || gs,
  'tele_' || gs,
  'dummyhash',
  'TELECALLER',
  true,
  '98' || (10000000 + gs)
FROM generate_series(1,5) gs
ON CONFLICT (username) DO NOTHING;

-- 3️⃣ CREATE FIELD EXECUTIVES
INSERT INTO users (id, name, username, password_hash, role, is_active, phone)
SELECT
  gen_random_uuid(),
  'Field Exec ' || gs,
  'field_' || gs,
  'dummyhash',
  'FIELD_EXEC',
  true,
  '97' || (20000000 + gs)
FROM generate_series(1,3) gs
ON CONFLICT (username) DO NOTHING;

-- 4️⃣ CREATE CAMPAIGN
INSERT INTO campaigns (id, name, start_date, created_by)
VALUES (
  gen_random_uuid(),
  'Seed Campaign',
  CURRENT_DATE,
  (SELECT id FROM users WHERE username='admin_seed' LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- 5️⃣ INSERT 300 NEW LEADS
INSERT INTO leads (
  farmer_name,
  phone_number,
  village,
  taluka,
  district,
  state,
  campaign_id,
  created_at,
  updated_at
)
SELECT
  'Farmer ' || gs,
  '99' || (30000000 + gs),
  'Village ' || (gs % 10),
  'Taluka ' || (gs % 5),
  'Sabarkantha',
  'Gujarat',
  (SELECT id FROM campaigns WHERE name='Seed Campaign' LIMIT 1),
  NOW() - (random() * interval '30 days'),
  NOW()
FROM generate_series(1,300) gs;

-- 6️⃣ ASSIGN 200 LEADS
UPDATE leads
SET assigned_to = (
  SELECT id FROM users
  WHERE role='TELECALLER'
  ORDER BY random()
  LIMIT 1
),
status='ASSIGNED'
WHERE id IN (
  SELECT id FROM leads
  ORDER BY created_at
  LIMIT 200
);

-- 7️⃣ MOVE 150 TO CONTACTED
UPDATE leads
SET status='CONTACTED',
    attempt_count=1,
    last_contacted_at=NOW()
WHERE status='ASSIGNED'
AND id IN (
  SELECT id FROM leads WHERE status='ASSIGNED' LIMIT 150
);

-- 8️⃣ MOVE 100 TO VISIT_REQUESTED
UPDATE leads
SET status='VISIT_REQUESTED',
    crop_type='Wheat',
    acreage=(random()*5+1)::numeric(10,2)
WHERE status='CONTACTED'
AND id IN (
  SELECT id FROM leads WHERE status='CONTACTED' LIMIT 100
);

-- 9️⃣ CREATE VISIT REQUESTS
INSERT INTO visit_requests (
  lead_id,
  requested_by,
  notes
)
SELECT
  id,
  assigned_to,
  'Auto seeded visit request'
FROM leads
WHERE status='VISIT_REQUESTED';

-- 🔟 CREATE VISITS (SCHEDULED)
INSERT INTO visits (
  visit_request_id,
  lead_id,
  field_exec_id,
  assigned_by,
  status,
  scheduled_at
)
SELECT
  vr.id,
  vr.lead_id,
  (SELECT id FROM users WHERE role='FIELD_EXEC' ORDER BY random() LIMIT 1),
  (SELECT id FROM users WHERE role='ADMIN' LIMIT 1),
  'SCHEDULED',
  NOW() - interval '2 days'
FROM visit_requests vr;

-- 1️⃣1️⃣ COMPLETE 80 VISITS
UPDATE visits
SET status='COMPLETED',
    outcome = CASE WHEN random()>0.5 THEN 'SOLD' ELSE 'WAITING' END,
    completed_at=NOW()
WHERE id IN (
  SELECT id FROM visits LIMIT 80
);

-- 1️⃣2️⃣ MOVE LEADS TO VISIT_COMPLETED
UPDATE leads
SET status='VISIT_COMPLETED'
WHERE status='VISIT_REQUESTED'
AND id IN (
  SELECT lead_id FROM visits WHERE status='COMPLETED'
);

-- 1️⃣3️⃣ MOVE 40 LEADS TO SOLD
UPDATE leads
SET status='SOLD'
WHERE status='VISIT_COMPLETED'
AND id IN (
  SELECT lead_id FROM visits
  WHERE outcome='SOLD'
  LIMIT 40
);

-- 1️⃣4️⃣ CREATE DEALS FOR SOLD
INSERT INTO deals (
  lead_id,
  crop_type,
  estimated_quantity,
  expected_value,
  status,
  created_by,
  assigned_to
)
SELECT
  id,
  crop_type,
  (random()*10+5),
  (random()*100000+50000),
  'SOLD',
  assigned_to,
  assigned_to
FROM leads
WHERE status='SOLD';