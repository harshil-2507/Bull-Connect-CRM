-- seed/07_audit_logs.sql

INSERT INTO audit_logs (user_id, entity_type, entity_id, action, metadata)
SELECT
    (SELECT id FROM users ORDER BY random() LIMIT 1),
    'LEAD',
    id,
    'CREATE',
    jsonb_build_object('source','seed_script')
FROM leads
LIMIT 3000;