-- seed/02_campaigns.sql

INSERT INTO campaigns (name, description, start_date, end_date, created_by)
SELECT
    campaign_name,
    description,
    '2026-01-01',
    '2026-12-31',
    (SELECT id FROM users WHERE role='ADMIN' LIMIT 1)
FROM (VALUES
('North Gujarat Wheat Push','Cold lead CSV upload'),
('Sabarkantha Cotton Drive','Winter cotton acquisition'),
('Modasa Bajra Program','Bajra farmer onboarding'),
('Idar Wheat Premium','Premium wheat farmers'),
('Banaskantha Farmer Outreach','North Gujarat farmers'),
('Ahmedabad Peri-Urban Farming','Urban fringe farmers'),
('Patan Bulk Wheat','Bulk supply chain'),
('Mehsana Dairy + Crop','Mixed farmers'),
('Kadi Cotton Network','Cotton cluster campaign'),
('Bayad Rural Outreach','Village penetration'),
('Aravalli Region Expansion','New farmer discovery'),
('North Gujarat Phase 2','Expansion push'),
('Inbound Leads Program','Warm leads'),
('Ground Scout Campaign','Field discovery'),
('Referral Farmers Program','Referral based acquisition')
) AS campaigns(campaign_name, description);