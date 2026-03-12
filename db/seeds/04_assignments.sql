-- seed/04_assignments.sql

INSERT INTO assignments (lead_id, user_id, assigned_by)
SELECT
    l.id,
    (SELECT id FROM users WHERE role='TELECALLER' ORDER BY random() LIMIT 1),
    (SELECT id FROM users WHERE role='MANAGER' ORDER BY random() LIMIT 1)
FROM leads l
WHERE l.status='NEW'
LIMIT 4000;