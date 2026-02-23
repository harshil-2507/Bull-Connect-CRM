-- Simple Demo Data for Bull Connect CRM
-- Users, Campaigns, and Leads with proper schema

-- ============================================================================
-- 1. Users
-- ============================================================================

INSERT INTO users (username, password_hash, role, name, phone, email) VALUES
('manager2', crypt('manager123', gen_salt('bf')), 'MANAGER', 'Priya Sharma', '9876543211', 'priya@bullconnect.com'),
('telecaller3', crypt('caller123', gen_salt('bf')), 'TELECALLER', 'Vijay Singh', '9876543222', 'vijay@bullconnect.com'),
('telecaller4', crypt('caller123', gen_salt('bf')), 'TELECALLER', 'Kavita Rao', '9876543223', 'kavita@bullconnect.com');

-- ============================================================================
-- 2. Campaigns
-- ============================================================================

INSERT INTO campaigns (name, description, start_date, end_date, is_active, created_by) VALUES
(
  'Summer Irrigation 2026',
  'Target farmers for summer irrigation solutions',
  '2026-02-01',
  '2026-05-31',
  true,
  (SELECT id FROM users WHERE role = 'ADMIN' ORDER BY created_at DESC LIMIT 1)
),
(
  'Organic Fertilizer Drive',
  'Promote organic fertilizers',
  '2026-01-15',
  '2026-04-15',
  true,
  (SELECT id FROM users WHERE role = 'ADMIN' ORDER BY created_at DESC LIMIT 1)
);

-- ============================================================================
-- 3. Leads (50 farmer leads)
-- ============================================================================

INSERT INTO leads (farmer_name, phone_number, village, taluka, district, state, campaign_id, status, assigned_to, attempt_count, crop_type, acreage) VALUES
-- Campaign 1: Summer Irrigation
  ('Shankar Pawar', '9112345001', 'Wadgaon', 'Haveli', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller3'), 2, 'Sugarcane', 5.5),
  ('Laxman Jadhav', '9112345002', 'Shirur', 'Shirur', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller3'), 1, 'Cotton', 3.2),
  ('Narayan Bhosale', '9112345003', 'Baramati', 'Baramati', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'NEW', NULL, 0, NULL, NULL),
  ('Dattatray Gaikwad', '9112345004', 'Indapur', 'Indapur', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'FIELD_REQUESTED', (SELECT id FROM users WHERE username = 'telecaller4'), 3, 'Pomegranate', 2.8),
  ('Vitthal Kale', '9112345005', 'Daund', 'Daund', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller4'), 2, 'Wheat', 4.0),
  ('Tukaram Shinde', '9112345006', 'Bhor', 'Bhor', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'NEW', NULL, 0, NULL, NULL),
  ('Ramchandra Pawar', '9112345007', 'Maval', 'Maval', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'FIELD_REQUESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 4, 'Grapes', 6.5),
  ('Pandurang More', '9112345008', 'Mulshi', 'Mulshi', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, 'Vegetables', 2.5),
  ('Madhav Salunkhe', '9112345009', 'Junnar', 'Junnar', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'DROPPED', (SELECT id FROM users WHERE username = 'telecaller3'), 2, 'Rice', 3.0),
  ('Govind Deshmukh', '9112345010', 'Ambegaon', 'Ambegaon', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'NEW', NULL, 0, NULL, NULL),
  ('Suryakant Bhagat', '9112345011', 'Jejuri', 'Purandar', 'Pune', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, 'Onion', 1.8),
  ('Keshav Patil', '9222345101', 'Nashik Road', 'Nashik', 'Nashik', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller3'), 2, 'Grapes', 5.0),
  ('Sambhaji Gawade', '9222345102', 'Dindori', 'Dindori', 'Nashik', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'FIELD_REQUESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 3, 'Onion', 4.5),
  ('Raghunath Sawant', '9222345103', 'Sinnar', 'Sinnar', 'Nashik', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'NEW', NULL, 0, NULL, NULL),
  ('Bhaskar Mane', '9222345104', 'Igatpuri', 'Igatpuri', 'Nashik', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, 'Tomato', 2.0),
  ('Devidas Bhor', '9332345201', 'Karad', 'Karad', 'Satara', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'FIELD_REQUESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 5, 'Sugarcane', 7.0),
  ('Maruti Ghatge', '9332345202', 'Koregaon', 'Koregaon', 'Satara', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller4'), 2, 'Soybean', 3.5),
  ('Balaji Shinde', '9332345203', 'Phaltan', 'Phaltan', 'Satara', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'NEW', NULL, 0, NULL, NULL),
  ('Yashwant Jadhav', '9332345204', 'Wai', 'Wai', 'Satara', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'FIELD_REQUESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 3, 'Grapes', 4.8),
  ('Chandrakant Patil', '9332345205', 'Satara', 'Satara', 'Satara', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Summer Irrigation 2026'), 'DROPPED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, 'Wheat', 2.5),
-- Campaign 2: Organic Fertilizer
  ('Anant Kulkarni', '9442345301', 'Solapur', 'Solapur', 'Solapur', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller3'), 2, 'Jowar', 6.0),
  ('Dnyaneshwar Jadhav', '9442345302', 'Pandharpur', 'Pandharpur', 'Solapur', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, 'Cotton', 5.5),
  ('Ramdas Pawar', '9442345303', 'Barshi', 'Barshi', 'Solapur', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'NEW', NULL, 0, NULL, NULL),
  ('Sanjay Shinde', '9442345304', 'Akkalkot', 'Akkalkot', 'Solapur', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'FIELD_REQUESTED', (SELECT id FROM users WHERE username = 'telecaller3'), 4, 'Sugarcane', 4.2),
  ('Mahadev Bhosale', '9552345401', 'Kolhapur', 'Kolhapur', 'Kolhapur', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'FIELD_REQUESTED', (SELECT id FROM users WHERE username = 'telecaller4'), 5, 'Turmeric', 3.0),
  ('Prakash Patil', '9552345402', 'Ichalkaranji', 'Hatkanangale', 'Kolhapur', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller3'), 2, 'Vegetables', 2.5),
  ('Appasaheb More', '9552345403', 'Kagal', 'Kagal', 'Kolhapur', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'NEW', NULL, 0, NULL, NULL),
  ('Bhaurao Desai', '9552345404', 'Panhala', 'Panhala', 'Kolhapur', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller4'), 1, 'Groundnut', 4.0),
  ('Sadashiv Gaikwad', '9662345501', 'Sangli', 'Sangli', 'Sangli', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'CONTACTED', (SELECT id FROM users WHERE username = 'telecaller3'), 3, 'Grapes', 5.5),
  ('Vishwanath Kale', '9662345502', 'Miraj', 'Miraj', 'Sangli', 'Maharashtra', (SELECT id FROM campaigns WHERE name = 'Organic Fertilizer Drive'), 'FIELD_REQUESTED', (SELECT id FROM users WHERE username = 'telecaller4'), 4, 'Sugarcane', 6.5);

-- ============================================================================
-- Summary: 3 managers/telecallers, 2 campaigns, 30 leads
-- ============================================================================
