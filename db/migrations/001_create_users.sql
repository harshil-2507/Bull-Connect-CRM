-- 001_create_users.sql
-- Core internal users (employees only)

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    role TEXT NOT NULL CHECK (
        role IN (
            'MANAGER',
            'TELECALLER',
            'FIELD_MANAGER',
            'FIELD_EXEC'
        )
    ),

    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP NOT NULL DEFAULT now()
);