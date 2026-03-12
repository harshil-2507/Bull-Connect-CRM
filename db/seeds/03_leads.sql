-- seed/03_leads.sql

INSERT INTO leads (
    farmer_name,
    phone_number,
    village,
    taluka,
    district,
    state,
    campaign_id,
    status,
    crop_type,
    acreage
)
SELECT
    'Farmer_' || gs,
    '98' || LPAD((10000000 + gs)::text, 8, '0'),
    (ARRAY['Rampura','Devpura','Motipura','Nandol','Sundarpura'])[floor(random()*5)+1],
    (ARRAY['Idar','Modasa','Kadi','Bayad','Patan'])[floor(random()*5)+1],
    (ARRAY['Sabarkantha','Aravalli','Mehsana'])[floor(random()*3)+1],
    'Gujarat',
    (SELECT id FROM campaigns ORDER BY random() LIMIT 1),
    'NEW',
    (ARRAY['Wheat','Cotton','Bajra','Castor'])[floor(random()*4)+1],
    round((random()*10 + 1)::numeric,2)
FROM generate_series(1,5000) gs;