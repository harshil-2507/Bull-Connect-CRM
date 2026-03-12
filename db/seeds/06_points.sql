-- seed/06_points.sql

INSERT INTO points (user_id, lead_id, points, reason)
SELECT
    (SELECT id FROM users WHERE role='TELECALLER' ORDER BY random() LIMIT 1),
    l.id,
    floor(random()*10 + 1),
    'Call performance reward'
FROM leads l
LIMIT 2000;