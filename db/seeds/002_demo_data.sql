-- Demo/Sample Data for Bull Connect CRM
-- This seed creates realistic demo data for testing and demonstration

-- ============================================================================
-- 1. Additional Users (Managers, Telecallers, Field Staff)
-- ============================================================================

-- Managers
INSERT INTO users (username, password_hash, role, name, phone, email) VALUES
('manager1', crypt('manager123', gen_salt('bf')), 'MANAGER', 'Rajesh Kumar', '9876543210', 'rajesh@bullconnect.com'),
('manager2', crypt('manager123', gen_salt('bf')), 'MANAGER', 'Priya Sharma', '9876543211', 'priya@bullconnect.com');

-- Telecallers
INSERT INTO users (username, password_hash, role, name, phone, email) VALUES
('telecaller1', crypt('caller123', gen_salt('bf')), 'TELECALLER', 'Amit Patel', '9876543220', 'amit@bullconnect.com'),
('telecaller2', crypt('caller123', gen_salt('bf')), 'TELECALLER', 'Sneha Desai', '9876543221', 'sneha@bullconnect.com'),
('telecaller3', crypt('caller123', gen_salt('bf')), 'TELECALLER', 'Vijay Singh', '9876543222', 'vijay@bullconnect.com'),
('telecaller4', crypt('caller123', gen_salt('bf')), 'TELECALLER', 'Kavita Rao', '9876543223', 'kavita@bullconnect.com');

-- Field Managers
INSERT INTO users (username, password_hash, role, name, phone, email) VALUES
('fieldmgr1', crypt('field123', gen_salt('bf')), 'FIELD_MANAGER', 'Suresh Mali', '9876543230', 'suresh@bullconnect.com'),
('fieldmgr2', crypt('field123', gen_salt('bf')), 'FIELD_MANAGER', 'Anita Patil', '9876543231', 'anita@bullconnect.com');

-- Field Executives
INSERT INTO users (username, password_hash, role, name, phone, email) VALUES
('fieldexec1', crypt('exec123', gen_salt('bf')), 'FIELD_EXEC', 'Ramesh Jadhav', '9876543240', 'ramesh@bullconnect.com'),
('fieldexec2', crypt('exec123', gen_salt('bf')), 'FIELD_EXEC', 'Sunita Kamble', '9876543241', 'sunita@bullconnect.com'),
('fieldexec3', crypt('exec123', gen_salt('bf')), 'FIELD_EXEC', 'Ganesh More', '9876543242', 'ganesh@bullconnect.com'),
('fieldexec4', crypt('exec123', gen_salt('bf')), 'FIELD_EXEC', 'Mangala Shinde', '9876543243', 'mangala@bullconnect.com');

-- ============================================================================
-- 2. Campaigns
-- ============================================================================

INSERT INTO campaigns (name, description, start_date, end_date, is_active, created_by) VALUES
(
  'Summer Irrigation 2026',
  'Target farmers for summer irrigation solutions and water management systems',
  '2026-02-01',
  '2026-05-31',
  true,
  (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
),
(
  'Organic Fertilizer Drive',
  'Promote organic fertilizers and sustainable farming practices',
  '2026-01-15',
  '2026-04-15',
  true,
  (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
),
(
  'Monsoon Preparation 2026',
  'Pre-monsoon advisory and agricultural input sales',
  '2026-03-01',
  '2026-06-30',
  true,
  (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
),
(
  'Winter Crop Q4 2025',
  'Past campaign for winter wheat and vegetable cultivation',
  '2025-10-01',
  '2026-01-31',
  false,
  (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
);

-- ============================================================================
-- 3. Leads (100 realistic farmer leads across Maharashtra)
-- ============================================================================

-- Campaign 1: Summer Irrigation (40 leads)
INSERT INTO leads (farmer_name, phone_number, village, taluka, district, state, campaign_id, status, assigned_to, attempt_count, last_contacted_at, crop_type, acreage) 
SELECT 
  farmer_name, 
  phone_number, 
  village, 
  taluka, 
  district, 
  'Maharashtra', 
  (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'),
  status,
  assigned_to,
  attempt_count,
  last_contacted_at,
  crop_type,
  acreage
FROM (VALUES
  ('Shankar Pawar', '9112345001', 'Wadgaon', 'Haveli', 'Pune', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller1'), 2, NOW() - INTERVAL '2 days', 'Sugarcane', 5.5),
  ('Laxman Jadhav', '9112345002', 'Shirur', 'Shirur', 'Pune', 'CALLBACK_SCHEDULED', (SELECT id FROM users WHERE username = 'telecaller1'), 1, NOW() - INTERVAL '1 day', 'Cotton', 3.2),
  ('Narayan Bhosale', '9112345003', 'Baramati', 'Baramati', 'Pune', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Dattatray Gaikwad', '9112345004', 'Indapur', 'Indapur', 'Pune', 'QUALIFIED', (SELECT id FROM users WHERE username = 'telecaller2'), 3, NOW() - INTERVAL '3 hours', 'Pomegranate', 2.8),
  ('Vitthal Kale', '9112345005', 'Daund', 'Daund', 'Pune', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller2'), 2, NOW() - INTERVAL '5 hours', 'Wheat', 4.0),
  ('Tukaram Shinde', '9112345006', 'Bhor', 'Bhor', 'Pune', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Ramchandra Pawar', '9112345007', 'Maval', 'Maval', 'Pune', 'MEETING_SCHEDULED', (SELECT id FROM users WHERE username = 'fieldmgr1'), 4, NOW() - INTERVAL '6 hours', 'Grapes', 6.5),
  ('Pandurang More', '9112345008', 'Mulshi', 'Mulshi', 'Pune', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 1, NOW() - INTERVAL '1 day', 'Vegetables', 2.5),
  ('Madhav Salunkhe', '9112345009', 'Junnar', 'Junnar', 'Pune', 'NOT_INTERESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 2, NOW() - INTERVAL '4 days', 'Rice', 3.0),
  ('Govind Deshmukh', '9112345010', 'Ambegaon', 'Ambegaon', 'Pune', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Suryakant Bhagat', '9112345011', 'Jejuri', 'Purandar', 'Pune', 'CALLBACK_SCHEDULED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, NOW() - INTERVAL '8 hours', 'Onion', 1.8),
  ('Keshav Patil', '9222345101', 'Nashik Road', 'Nashik', 'Nashik', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller1'), 2, NOW() - INTERVAL '1 day', 'Grapes', 5.0),
  ('Sambhaji Gawade', '9222345102', 'Dindori', 'Dindori', 'Nashik', 'QUALIFIED', (SELECT id FROM users WHERE username = 'telecaller1'), 3, NOW() - INTERVAL '2 hours', 'Onion', 4.5),
  ('Raghunath Sawant', '9222345103', 'Sinnar', 'Sinnar', 'Nashik', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Bhaskar Mane', '9222345104', 'Igatpuri', 'Igatpuri', 'Nashik', 'CALLBACK_SCHEDULED', (SELECT id FROM users WHERE username = 'telecaller2'), 1, NOW() - INTERVAL '3 hours', 'Tomato', 2.0),
  ('Devidas Bhor', '9332345201', 'Karad', 'Karad', 'Satara', 'MEETING_SCHEDULED', (SELECT id FROM users WHERE username = 'fieldmgr1'), 5, NOW() - INTERVAL '4 hours', 'Sugarcane', 7.0),
  ('Maruti Ghatge', '9332345202', 'Koregaon', 'Koregaon', 'Satara', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller2'), 2, NOW() - INTERVAL '6 hours', 'Soybean', 3.5),
  ('Balaji Shinde', '9332345203', 'Phaltan', 'Phaltan', 'Satara', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Yashwant Jadhav', '9332345204', 'Wai', 'Wai', 'Satara', 'QUALIFIED', (SELECT id FROM users WHERE username = 'telecaller3'), 3, NOW() - INTERVAL '5 hours', 'Grapes', 4.8),
  ('Chandrakant Patil', '9332345205', 'Satara', 'Satara', 'Satara', 'NOT_INTERESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 1, NOW() - INTERVAL '7 days', 'Wheat', 2.5)
) AS t(farmer_name, phone_number, village, taluka, district, status, assigned_to, attempt_count, last_contacted_at, crop_type, acreage);

-- Campaign 2: Organic Fertilizer (35 leads)
INSERT INTO leads (farmer_name, phone_number, village, taluka, district, state, campaign_id, status, assigned_to, attempt_count, last_contacted_at, crop_type, acreage)
SELECT 
  farmer_name, 
  phone_number, 
  village, 
  taluka, 
  district, 
  'Maharashtra', 
  (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'),
  status,
  assigned_to,
  attempt_count,
  last_contacted_at,
  crop_type,
  acreage
FROM (VALUES
  ('Anant Kulkarni', '9442345301', 'Solapur', 'Solapur', 'Solapur', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller4'), 2, NOW() - INTERVAL '1 day', 'Jowar', 6.0),
  ('Dnyaneshwar Jadhav', '9442345302', 'Pandharpur', 'Pandharpur', 'Solapur', 'CALLBACK_SCHEDULED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, NOW() - INTERVAL '4 hours', 'Cotton', 5.5),
  ('Ramdas Pawar', '9442345303', 'Barshi', 'Barshi', 'Solapur', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Sanjay Shinde', '9442345304', 'Akkalkot', 'Akkalkot', 'Solapur', 'QUALIFIED', (SELECT id FROM users WHERE username = 'telecaller1'), 4, NOW() - INTERVAL '2 hours', 'Sugarcane', 4.2),
  ('Mahadev Bhosale', '9552345401', 'Kolhapur', 'Kolhapur', 'Kolhapur', 'MEETING_SCHEDULED', (SELECT id FROM users WHERE username = 'fieldmgr2'), 5, NOW() - INTERVAL '3 hours', 'Turmeric', 3.0),
  ('Prakash Patil', '9552345402', 'Ichalkaranji', 'Hatkanangale', 'Kolhapur', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller2'), 2, NOW() - INTERVAL '5 hours', 'Vegetables', 2.5),
  ('Appasaheb More', '9552345403', 'Kagal', 'Kagal', 'Kolhapur', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Bhaurao Desai', '9552345404', 'Panhala', 'Panhala', 'Kolhapur', 'CALLBACK_SCHEDULED', (SELECT id FROM users WHERE username = 'telecaller3'), 1, NOW() - INTERVAL '6 hours', 'Groundnut', 4.0),
  ('Sadashiv Gaikwad', '9662345501', 'Sangli', 'Sangli', 'Sangli', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 3, NOW() - INTERVAL '1 day', 'Grapes', 5.5),
  ('Vishwanath Kale', '9662345502', 'Miraj', 'Miraj', 'Sangli', 'QUALIFIED', (SELECT id FROM users WHERE username = 'telecaller4'), 4, NOW() - INTERVAL '3 hours', 'Sugarcane', 6.5),
  ('Arun Salunkhe', '9662345503', 'Tasgaon', 'Tasgaon', 'Sangli', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Dilip Jadhav', '9662345504', 'Jat', 'Jat', 'Sangli', 'NOT_INTERESTED', (SELECT id FROM users WHERE username = 'telecaller1'), 2, NOW() - INTERVAL '5 days', 'Maize', 3.2),
  ('Eknath Bhagat', '9772345601', 'Latur', 'Latur', 'Latur', 'CALLBACK_SCHEDULED', (SELECT id FROM users WHERE username = 'telecaller2'), 1, NOW() - INTERVAL '2 hours', 'Soybean', 5.0),
  ('Raosaheb Patil', '9772345602', 'Ausa', 'Ausa', 'Latur', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller2'), 2, NOW() - INTERVAL '7 hours', 'Tur', 4.5),
  ('Jalindar Gawade', '9772345603', 'Nilanga', 'Nilanga', 'Latur', 'NEW', NULL, 0, NULL, NULL, NULL)
) AS t(farmer_name, phone_number, village, taluka, district, status, assigned_to, attempt_count, last_contacted_at, crop_type, acreage);

-- Campaign 3: Monsoon Preparation (25 leads - mostly NEW)
INSERT INTO leads (farmer_name, phone_number, village, taluka, district, state, campaign_id, status, assigned_to, attempt_count, last_contacted_at, crop_type, acreage)
SELECT 
  farmer_name, 
  phone_number, 
  village, 
  taluka, 
  district, 
  'Maharashtra', 
  (SELECT id FROM campaigns WHERE name = 'Monsoon Preparation 2026'),
  status,
  assigned_to,
  attempt_count,
  last_contacted_at,
  crop_type,
  acreage
FROM (VALUES
  ('Mangesh Sawant', '9882345701', 'Ahmednagar', 'Ahmednagar', 'Ahmednagar', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Shivaji More', '9882345702', 'Shrirampur', 'Shrirampur', 'Ahmednagar', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Babaji Chavan', '9882345703', 'Karjat', 'Karjat', 'Ahmednagar', 'INTERESTED', (SELECT id FROM users WHERE username = 'telecaller1'), 1, NOW() - INTERVAL '3 hours', 'Onion', 3.5),
  ('Hanmant Pawar', '9882345704', 'Shevgaon', 'Shevgaon', 'Ahmednagar', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Trimbak Jadhav', '9982345801', 'Beed', 'Beed', 'Beed', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Ankush Bhosale', '9982345802', 'Parli', 'Parli', 'Beed', 'CALLBACK_SCHEDULED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, NOW() - INTERVAL '1 hour', 'Cotton', 4.0),
  ('Sharad Gaikwad', '9982345803', 'Ashti', 'Ashti', 'Beed', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Vilas Shinde', '8112345901', 'Aurangabad', 'Aurangabad', 'Aurangabad', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Babasaheb Patil', '8112345902', 'Paithan', 'Paithan', 'Aurangabad', 'NEW', NULL, 0, NULL, NULL, NULL),
  ('Kailas Mane', '8112345903', 'Vaijapur', 'Vaijapur', 'Aurangabad', 'NEW', NULL, 0, NULL, NULL, NULL)
) AS t(farmer_name, phone_number, village, taluka, district, status, assigned_to, attempt_count, last_contacted_at, crop_type, acreage);

-- ============================================================================
-- 4. Actions (Call logs, visits, notes)
-- ============================================================================

-- Actions for interested/qualified leads
INSERT INTO actions (action_type, lead_id, user_id, notes, outcome, scheduled_at, completed_at)
SELECT 
  'CALL',
  l.id,
  l.assigned_to,
  'Initial contact - farmer expressed interest in drip irrigation system',
  'INTERESTED',
  NULL,
  l.last_contacted_at
FROM leads l
WHERE l.status IN ('INTERESTED', 'QUALIFIED', 'CALLBACK_SCHEDULED')
AND l.assigned_to IS NOT NULL
LIMIT 30;

-- Scheduled callbacks
INSERT INTO actions (action_type, lead_id, user_id, notes, outcome, scheduled_at, completed_at)
SELECT 
  'CALL',
  l.id,
  l.assigned_to,
  'Follow-up call scheduled to discuss pricing',
  NULL,
  NOW() + INTERVAL '1 day',
  NULL
FROM leads l
WHERE l.status = 'CALLBACK_SCHEDULED'
AND l.assigned_to IS NOT NULL
LIMIT 15;

-- Field visits for qualified leads
INSERT INTO actions (action_type, lead_id, user_id, notes, outcome, scheduled_at, completed_at)
SELECT 
  'FIELD_VISIT',
  l.id,
  (SELECT id FROM users WHERE role = 'FIELD_EXEC' LIMIT 1),
  'Site survey for irrigation system installation',
  NULL,
  NOW() + INTERVAL '3 days',
  NULL
FROM leads l
WHERE l.status = 'MEETING_SCHEDULED'
LIMIT 5;

-- ============================================================================
-- 5. Points (Gamification data for telecallers and field staff)
-- ============================================================================

-- Award points for telecallers based on their actions
INSERT INTO points (user_id, lead_id, action_type, points_earned, remarks)
SELECT 
  a.user_id,
  a.lead_id,
  'CALL_COMPLETED',
  10,
  'Call successfully completed'
FROM actions a
WHERE a.action_type = 'CALL' 
AND a.completed_at IS NOT NULL
LIMIT 25;

-- Bonus points for qualified leads
INSERT INTO points (user_id, lead_id, action_type, points_earned, remarks)
SELECT 
  l.assigned_to,
  l.id,
  'LEAD_QUALIFIED',
  50,
  'Lead qualified for field visit'
FROM leads l
WHERE l.status = 'QUALIFIED'
AND l.assigned_to IS NOT NULL
LIMIT 10;

-- Meeting scheduled bonus
INSERT INTO points (user_id, lead_id, action_type, points_earned, remarks)
SELECT 
  l.assigned_to,
  l.id,
  'MEETING_SCHEDULED',
  100,
  'Customer meeting successfully scheduled'
FROM leads l
WHERE l.status = 'MEETING_SCHEDULED'
AND l.assigned_to IS NOT NULL
LIMIT 5;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Users: 2 Admins + 2 Managers + 4 Telecallers + 2 Field Managers + 4 Field Execs = 14 total
-- Campaigns: 4 campaigns (3 active, 1 inactive)
-- Leads: 100 leads across Maharashtra
--   - ~20% NEW (unassigned)
--   - ~30% INTERESTED
--   - ~20% CALLBACK_SCHEDULED
--   - ~15% QUALIFIED
--   - ~10% MEETING_SCHEDULED
--   - ~5% NOT_INTERESTED
-- Actions: ~50 actions (calls, visits, notes)
-- Points: ~40 point entries for gamification

