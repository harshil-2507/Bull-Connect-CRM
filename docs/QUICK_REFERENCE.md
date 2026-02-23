# Quick Reference Guide - Production Backend

## 🚀 Common Operations

Quick snippets for the most common operations in Bull Connect CRM.

---

## 📞 Call Logging Examples

### Record Interested Call (Moves to FIELD_REQUESTED)
```typescript
import { recordCallLog } from './services/callLog.service';

const result = await recordCallLog({
  leadId: 'uuid-of-lead',
  userId: 'uuid-of-telecaller',
  disposition: 'INTERESTED',
  notes: 'Farmer is interested, grows wheat',
  cropType: 'wheat',
  acreage: 10.5,
  durationSeconds: 180,
});

// Result:
// {
//   callLogId: 'uuid',
//   leadId: 'uuid',
//   newStatus: 'FIELD_REQUESTED',
//   attemptCount: 3
// }
```

### Record Callback Request
```typescript
const result = await recordCallLog({
  leadId: 'uuid-of-lead',
  userId: 'uuid-of-telecaller',
  disposition: 'CALLBACK',
  notes: 'Call back tomorrow at 10 AM',
  nextCallbackAt: new Date('2026-02-23T10:00:00Z'),
  durationSeconds: 45,
});

// Status remains 'CONTACTED', callback scheduled
```

### Record Not Interested (Moves to DROPPED)
```typescript
const result = await recordCallLog({
  leadId: 'uuid-of-lead',
  userId: 'uuid-of-telecaller',
  disposition: 'NOT_INTERESTED',
  notes: 'Not interested in product',
  dropReason: 'NOT_INTERESTED',
  dropNotes: 'Already has similar product',
  durationSeconds: 60,
});

// Result:
// {
//   ...
//   newStatus: 'DROPPED'
// }
```

---

## 🔐 Authentication Examples

### Login Endpoint (Example)
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './config/db';

async function login(username: string, password: string) {
  // Get user
  const result = await pool.query(
    'SELECT id, username, password_hash, role, name, is_active FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new Error('Account is deactivated');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    },
  };
}
```

---

## 👥 User Management

### Create User
```typescript
import bcrypt from 'bcrypt';
import { pool } from './config/db';

async function createUser(data: {
  name: string;
  username: string;
  password: string;
  role: string;
  phone?: string;
  email?: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, username, password_hash, role, phone, email, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id, name, username, role, phone, email, is_active, created_at`,
    [data.name, data.username, passwordHash, data.role, data.phone, data.email]
  );

  return result.rows[0];
}
```

### Deactivate User
```typescript
async function deactivateUser(userId: string) {
  await pool.query(
    'UPDATE users SET is_active = false WHERE id = $1',
    [userId]
  );
}
```

---

## 📊 Campaign Management

### Create Campaign
```typescript
async function createCampaign(data: {
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
}) {
  const result = await pool.query(
    `INSERT INTO campaigns (name, description, start_date, end_date, created_by, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING *`,
    [data.name, data.description, data.startDate, data.endDate, data.createdBy]
  );

  return result.rows[0];
}
```

### Bulk Assign Leads
```typescript
import { withTransaction } from './db/transactions';
import { PoolClient } from 'pg';

async function bulkAssignLeads(
  campaignId: string,
  telecallerId: string,
  count: number
) {
  return withTransaction(async (tx: PoolClient) => {
    // Get unassigned leads
    const leadsResult = await tx.query(
      `SELECT id FROM leads
       WHERE campaign_id = $1
         AND status = 'NEW'
         AND assigned_to IS NULL
       ORDER BY created_at ASC
       LIMIT $2
       FOR UPDATE`,
      [campaignId, count]
    );

    const leadIds = leadsResult.rows.map((row) => row.id);

    if (leadIds.length === 0) {
      throw new Error('No unassigned leads available');
    }

    // Update leads
    await tx.query(
      `UPDATE leads
       SET assigned_to = $1,
           status = 'ASSIGNED',
           updated_at = NOW()
       WHERE id = ANY($2)`,
      [telecallerId, leadIds]
    );

    // Create assignment records
    for (const leadId of leadIds) {
      await tx.query(
        `INSERT INTO assignments (lead_id, user_id, assigned_by, is_active)
         VALUES ($1, $2, $3, true)`,
        [leadId, telecallerId, 'SYSTEM']
      );
    }

    return leadIds;
  });
}
```

---

## 📈 Lead Management

### Import Leads
```typescript
async function importLeads(
  campaignId: string,
  leads: Array<{
    farmerName: string;
    phoneNumber: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
  }>
) {
  const values = leads.map((lead, index) => {
    const offset = index * 7;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
  }).join(',');

  const params = leads.flatMap((lead) => [
    campaignId,
    lead.farmerName,
    lead.phoneNumber,
    lead.village || null,
    lead.taluka || null,
    lead.district || null,
    lead.state || null,
  ]);

  const query = `
    INSERT INTO leads (campaign_id, farmer_name, phone_number, village, taluka, district, state, status)
    VALUES ${values}
    ON CONFLICT (phone_number) DO NOTHING
    RETURNING id
  `;

  const result = await pool.query(query, params);
  return result.rows.map((row) => row.id);
}
```

### Get Leads for Telecaller
```typescript
async function getLeadsForTelecaller(
  telecallerId: string,
  options: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      l.*,
      c.name as campaign_name
    FROM leads l
    JOIN campaigns c ON l.campaign_id = c.id
    WHERE l.assigned_to = $1
      AND l.status IN ('ASSIGNED', 'CONTACTED')
  `;

  const params: any[] = [telecallerId];
  let paramIndex = 2;

  if (options.status) {
    query += ` AND l.status = $${paramIndex++}`;
    params.push(options.status);
  }

  query += ` ORDER BY 
    CASE 
      WHEN l.next_callback_at IS NOT NULL AND l.next_callback_at <= NOW() THEN 0
      ELSE 1
    END,
    l.next_callback_at ASC NULLS LAST,
    l.created_at ASC
  `;

  query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}
```

---

## 📝 Audit Logging

### Manual Audit Entry
```typescript
import { createAuditLog } from './services/audit.service';

await createAuditLog({
  userId: 'uuid-of-user',
  entityType: 'LEAD',
  entityId: 'uuid-of-lead',
  action: 'STATUS_CHANGE',
  metadata: {
    from: 'ASSIGNED',
    to: 'CONTACTED',
    reason: 'First successful call',
  },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});
```

### Query Audit Logs
```typescript
import { getRecentAuditLogs } from './services/audit.service';

// Get all status changes today
const logs = await getRecentAuditLogs({
  action: 'STATUS_CHANGE',
  startDate: new Date(new Date().setHours(0, 0, 0, 0)),
}, 100);

// Get all actions on a specific lead
const leadLogs = await getEntityAuditLogs('LEAD', 'lead-uuid');

// Get user's actions
const userLogs = await getUserAuditLogs('user-uuid');
```

---

## 🔍 Reporting Queries

### Campaign Performance
```sql
-- Get campaign statistics
SELECT 
  c.name,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'ASSIGNED') as assigned,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'CONTACTED') as contacted,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'FIELD_REQUESTED') as field_requested,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'DROPPED') as dropped,
  ROUND(
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'FIELD_REQUESTED')::numeric / 
    NULLIF(COUNT(DISTINCT l.id), 0) * 100, 
    2
  ) as conversion_rate
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE c.id = 'campaign-uuid'
GROUP BY c.id, c.name;
```

### Telecaller Performance
```sql
-- Get telecaller stats for the day
SELECT 
  u.name,
  COUNT(DISTINCT cl.id) as total_calls,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.disposition = 'INTERESTED') as interested,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'FIELD_REQUESTED') as converted,
  ROUND(AVG(cl.duration_seconds)) as avg_duration
FROM users u
LEFT JOIN call_logs cl ON cl.user_id = u.id AND cl.created_at >= CURRENT_DATE
LEFT JOIN leads l ON l.assigned_to = u.id AND l.status = 'FIELD_REQUESTED'
WHERE u.role = 'TELECALLER'
GROUP BY u.id, u.name
ORDER BY converted DESC;
```

### Callback Queue
```sql
-- Get overdue callbacks
SELECT 
  l.id,
  l.farmer_name,
  l.phone_number,
  l.next_callback_at,
  l.attempt_count,
  u.name as assigned_to_name
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE l.status = 'CONTACTED'
  AND l.next_callback_at IS NOT NULL
  AND l.next_callback_at <= NOW()
ORDER BY l.next_callback_at ASC
LIMIT 50;
```

---

## 🛡️ Security Best Practices

### Password Hashing
```typescript
import bcrypt from 'bcrypt';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

### JWT Token Generation
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);
```

### Secure Route Example
```typescript
import { Router } from 'express';
import { auth } from './middlewares/auth';
import { requireRole, requireLeadOwnership } from './middlewares/rbac.middleware';

const router = Router();

router.post(
  '/leads/:leadId/call',
  auth,                              // Authenticate
  requireRole(['TELECALLER']),       // Check role
  requireLeadOwnership,              // Verify ownership
  async (req, res) => {
    // Handler code
  }
);
```

---

## 🧪 Testing Examples

### Test State Machine
```typescript
import { validateLeadTransition } from './services/stateMachine.service';

// Valid transitions
validateLeadTransition('NEW', 'ASSIGNED');      // ✅ OK
validateLeadTransition('ASSIGNED', 'CONTACTED'); // ✅ OK
validateLeadTransition('CONTACTED', 'FIELD_REQUESTED'); // ✅ OK
validateLeadTransition('CONTACTED', 'DROPPED');  // ✅ OK

// Invalid transitions
try {
  validateLeadTransition('NEW', 'CONTACTED'); // ❌ Throws error
} catch (error) {
  console.log('Expected error:', error.message);
}
```

### Test Call Logging
```typescript
import { recordCallLog } from './services/callLog.service';

// Mock test
const mockCallLog = {
  leadId: 'test-lead-id',
  userId: 'test-user-id',
  disposition: 'CALLBACK' as const,
  notes: 'Test call',
};

try {
  const result = await recordCallLog(mockCallLog);
  console.log('Call logged:', result);
} catch (error) {
  console.log('Expected error (lead not found):', error.message);
}
```

---

## 🔧 Common Database Operations

### Get Lead with Full Details
```sql
SELECT 
  l.*,
  c.name as campaign_name,
  u.name as assigned_to_name,
  (
    SELECT COUNT(*) FROM call_logs WHERE lead_id = l.id
  ) as total_calls,
  (
    SELECT MAX(created_at) FROM call_logs WHERE lead_id = l.id
  ) as last_call_at
FROM leads l
LEFT JOIN campaigns c ON l.campaign_id = c.id
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.id = 'lead-uuid';
```

### Update Lead Status (Use Service Instead!)
```sql
-- DON'T DO THIS - Use recordCallLog service instead
-- This bypasses state machine and audit logging
UPDATE leads 
SET status = 'CONTACTED', 
    updated_at = NOW() 
WHERE id = 'lead-uuid';
```

---

## 📱 API Request Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Get Assigned Leads
```bash
curl -X GET "http://localhost:3000/api/telecaller/leads?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Record Call
```bash
curl -X POST http://localhost:3000/api/telecaller/leads/LEAD_ID/call \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disposition": "INTERESTED",
    "notes": "Farmer interested",
    "cropType": "wheat",
    "acreage": 10.5,
    "durationSeconds": 180
  }'
```

### Create User (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "password": "secure_password",
    "role": "TELECALLER",
    "phone": "1234567890"
  }'
```

---

## 🎯 Production Gotchas

### ❌ Don't Do This
```typescript
// Updating lead status without state machine
await pool.query('UPDATE leads SET status = $1 WHERE id = $2', ['CONTACTED', leadId]);

// No transaction for multi-step operations
await pool.query('INSERT INTO call_logs...');
await pool.query('UPDATE leads...');
```

### ✅ Do This Instead
```typescript
// Use service with transaction
await recordCallLog({
  leadId,
  userId,
  disposition: 'INTERESTED',
  // ...other fields
});
```

---

## 📚 Reference Links

- **Full Documentation**: `docs/PRODUCTION_BACKEND.md`
- **Implementation Guide**: `docs/IMPLEMENTATION_CHECKLIST.md`
- **Schema Details**: `db/migrations/production_schema.sql`
- **Migration Guide**: `db/migrations/MIGRATION_GUIDE.sql`

---

**Pro Tip:** Always use the service layer functions instead of direct database queries. They handle transactions, state machines, and audit logging automatically.
