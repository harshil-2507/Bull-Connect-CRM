-- seed/05_call_logs.sql

INSERT INTO call_logs (lead_id,user_id,disposition,notes,duration_seconds)
SELECT
    l.id,
    (SELECT id FROM users WHERE role='TELECALLER' ORDER BY random() LIMIT 1),
    (ARRAY['INTERESTED','CALLBACK','NO_ANSWER','NOT_INTERESTED'])[floor(random()*4)+1]::call_disposition,
    'Initial call attempt',
    floor(random()*300)::int
FROM leads l
LIMIT 3000;