# Bull Connect CRM - Production Backend Implementation

## 📋 Overview

This is a production-grade backend implementation for Bull Connect CRM, a tele-acquisition optimized system with strict state machine enforcement, comprehensive audit logging, and role-based access control.

## 🏗️ Architecture

### Database Schema
- **Production-ready PostgreSQL schema** with all required tables, indexes, constraints, and triggers
- **State machine enforcement at database level** using triggers
- **Comprehensive indexing** for optimal query performance
- **Audit trail** for all critical operations

### Core Components

1. **State Machine Service** (`services/stateMachine.service.ts`)
   - Enforces strict lead status transitions
   - Validates business rules
   - Maps call dispositions to status changes

2. **Call Logging Service** (`services/callLog.service.ts`)
   - Transactional call recording
   - Automatic lead updates
   - State machine integration

3. **Audit Service** (`services/audit.service.ts`)
   - System-wide audit trail
   - Security event logging
   - Compliance tracking

4. **RBAC Middleware** (`middlewares/rbac.middleware.ts`)
   - Role-based access control
   - Resource ownership verification
   - Rate limiting

5. **Example Routes**
   - Telecaller routes with full transaction support
   - Admin routes with bulk operations
   - Proper error handling and validation

## 🗄️ Database Setup

### 1. Apply the Production Schema

```bash
# Connect to PostgreSQL
psql -U your_username -d your_database

# Run the production schema
\i db/migrations/production_schema.sql
```

### 2. Schema Highlights

**Tables:**
- `users` - Internal employees with authentication
- `campaigns` - Marketing campaigns
- `leads` - Core lead entity with state machine
- `call_logs` - Complete call history
- `assignments` - Lead assignment tracking
- `audit_logs` - System-wide audit trail
- `points` - Gamification system

**Key Features:**
- UUID primary keys
- ENUM types for type safety
- Check constraints for data validation
- Triggers for automated updates
- State machine validation at DB level
- Comprehensive indexes

### 3. Indexes

Critical indexes for performance:
```sql
-- Lead queries (most frequent)
CREATE INDEX idx_leads_phone_number ON leads(phone_number);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_status_assigned ON leads(status, assigned_to);

-- Call log queries
CREATE INDEX idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX idx_call_logs_created_at ON call_logs(created_at);
```

## 🔐 State Machine

### Lead Status Flow

```
NEW → ASSIGNED → CONTACTED → FIELD_REQUESTED
                           → DROPPED
```

### Validation Rules

1. **NEW → ASSIGNED**: Requires `assigned_to` field
2. **ASSIGNED → CONTACTED**: First call moves lead to CONTACTED
3. **CONTACTED → FIELD_REQUESTED**: Requires `crop_type` and `acreage`
4. **CONTACTED → DROPPED**: Requires `drop_reason`
5. **Terminal states**: FIELD_REQUESTED and DROPPED cannot transition

### Enforcement Layers

1. **Application Layer**: `stateMachine.service.ts`
2. **Database Layer**: Trigger `enforce_lead_status_transitions`

## 🔒 Role-Based Access Control

### Roles

- **ADMIN**: Full system access
- **MANAGER**: Campaign management, reporting
- **TELECALLER**: Call leads, update status
- **FIELD_MANAGER**: Manage field operations
- **FIELD_EXEC**: Field verification

### Access Patterns

```typescript
// Require specific role
router.get('/admin', requireRole(['ADMIN']), handler);

// Require multiple roles (OR)
router.get('/reports', requireRole(['ADMIN', 'MANAGER']), handler);

// Verify lead ownership
router.post('/call', requireLeadOwnership, handler);

// Combined checks
router.post('/call', requireTelecallerAccess, handler);
```

### Ownership Rules

- **TELECALLER**: Can only access leads assigned to them
- **FIELD_EXEC**: Can only access FIELD_REQUESTED leads
- **MANAGER**: Can access campaigns they created
- **ADMIN**: Can access everything

## ☎️ Call Logging

### Recording a Call

```typescript
const result = await recordCallLog({
  leadId: 'uuid',
  userId: 'uuid',
  disposition: 'INTERESTED',
  notes: 'Farmer is interested in our product',
  nextCallbackAt: new Date('2026-02-23T10:00:00'),
  cropType: 'wheat',
  acreage: 10.5,
  durationSeconds: 180,
});
```

### Automatic Actions

When a call is recorded:
1. **Insert call_log record**
2. **Increment attempt_count**
3. **Update last_contacted_at**
4. **Transition status** (if applicable)
5. **Update agricultural data** (if FIELD_REQUESTED)
6. **Update drop reason** (if DROPPED)
7. **Create audit log entry**

All within a **single transaction** for data consistency.

## 📊 Audit Logging

### What Gets Audited

- User creation/updates
- Lead status changes
- Campaign creation/updates
- Lead assignments
- Security events (login, logout, failed auth)

### Querying Audit Logs

```typescript
// Get logs for a specific lead
const logs = await getEntityAuditLogs('LEAD', leadId);

// Get logs for a user's actions
const userLogs = await getUserAuditLogs(userId);

// Get recent logs with filters
const logs = await getRecentAuditLogs({
  entityType: 'LEAD',
  action: 'STATUS_CHANGE',
  startDate: new Date('2026-02-01'),
});

// Get audit statistics
const stats = await getAuditStatistics();
```

## 🚀 API Examples

### Telecaller: Record Call

```bash
POST /telecaller/leads/:leadId/call
Authorization: Bearer <token>

{
  "disposition": "INTERESTED",
  "notes": "Farmer grows wheat, 10 acres",
  "cropType": "wheat",
  "acreage": 10.5,
  "durationSeconds": 180
}

Response:
{
  "message": "Call logged successfully",
  "callLogId": "uuid",
  "leadId": "uuid",
  "newStatus": "FIELD_REQUESTED",
  "attemptCount": 3
}
```

### Telecaller: Get Assigned Leads

```bash
GET /telecaller/leads?status=ASSIGNED&page=1&limit=50
Authorization: Bearer <token>

Response:
{
  "leads": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

### Admin: Bulk Assign Leads

```bash
POST /admin/campaigns/:campaignId/assign-leads
Authorization: Bearer <token>

{
  "telecallerId": "uuid",
  "count": 50
}

Response:
{
  "message": "Leads assigned successfully",
  "assignedCount": 50,
  "leadIds": [...]
}
```

### Admin: Campaign Report

```bash
GET /admin/reports/campaign/:campaignId
Authorization: Bearer <token>

Response:
{
  "campaign": {...},
  "summary": {
    "totalLeads": 1000,
    "leadsByStatus": {...},
    "conversionFunnel": {...},
    "conversionRates": {
      "assignmentRate": "95.50",
      "contactRate": "78.30",
      "fieldRequestRate": "34.20"
    }
  },
  "telecallerPerformance": [...]
}
```

## 🛡️ Security Features

### 1. Authentication
- JWT-based authentication (implement in `middlewares/auth.ts`)
- Secure password hashing with bcrypt

### 2. Authorization
- Role-based access control
- Resource ownership verification
- Status-based access control

### 3. Rate Limiting
```typescript
router.post('/call', rateLimit(200, 60000), handler);
// 200 requests per minute
```

### 4. Active User Check
```typescript
router.use(requireActiveUser);
// Ensures deactivated users cannot access system
```

## 📈 Performance Optimizations

### 1. Database Indexes
All critical query paths are indexed:
- Phone number lookups (unique index)
- Status filtering
- Assignment queries
- Campaign queries
- Time-based queries

### 2. Query Optimization
- Use of `FOR UPDATE` for row locking
- Efficient joins with proper indexes
- Limited result sets with pagination

### 3. Transaction Management
- Minimal transaction scope
- Proper error handling with rollback
- Connection pooling

## 🔍 Monitoring & Debugging

### Database Views

```sql
-- Active leads by status
SELECT * FROM v_leads_by_status;

-- Telecaller performance
SELECT * FROM v_telecaller_stats;
```

### Audit Statistics

```bash
GET /admin/audit-stats?startDate=2026-02-01&endDate=2026-02-28
```

### Call Statistics

```bash
GET /telecaller/stats
```

## 📦 Dependencies

Add to `backend/package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/pg": "^8.10.9",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

## 🚢 Deployment Checklist

### Database
- [ ] Run production schema migration
- [ ] Verify all indexes are created
- [ ] Test state machine triggers
- [ ] Change default admin password

### Application
- [ ] Set strong JWT secret in environment
- [ ] Configure connection pool size
- [ ] Enable SSL for database connection
- [ ] Configure rate limiting
- [ ] Set up error logging (e.g., Sentry)

### Security
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Review and update password policy
- [ ] Set up database backups

### Monitoring
- [ ] Set up application monitoring
- [ ] Configure database query monitoring
- [ ] Set up alerts for errors
- [ ] Monitor audit log growth

## 📝 Usage Example

```typescript
// In your main app.ts
import express from 'express';
import telecallerRoutes from './routes/telecaller.production.routes';
import adminRoutes from './routes/admin.production.routes';

const app = express();

app.use(express.json());
app.use('/api/telecaller', telecallerRoutes);
app.use('/api/admin', adminRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 🧪 Testing

### Test State Machine

```typescript
import { validateLeadTransition } from './services/stateMachine.service';

// Valid transition
validateLeadTransition('NEW', 'ASSIGNED'); // ✅ OK

// Invalid transition
validateLeadTransition('NEW', 'CONTACTED'); // ❌ Throws error
```

### Test Call Logging

```typescript
import { recordCallLog } from './services/callLog.service';

const result = await recordCallLog({
  leadId: 'test-lead-id',
  userId: 'test-user-id',
  disposition: 'INTERESTED',
  notes: 'Test call',
  cropType: 'wheat',
  acreage: 10,
});

console.log(result.newStatus); // 'FIELD_REQUESTED'
```

## 🤝 Contributing

When adding new features:
1. Follow the existing patterns
2. Use transactions for multi-step operations
3. Add audit logging for critical actions
4. Include proper error handling
5. Add validation at multiple layers
6. Update documentation

## 📄 License

Proprietary - Bull Connect CRM

---

**Status**: Production Ready ✅
**Last Updated**: February 2026
**Version**: 1.0.0
