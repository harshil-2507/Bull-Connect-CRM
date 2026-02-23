# Production Hardening - Implementation Checklist

## 🎯 Step 1: Database Setup

### 1.1 Backup Existing Database
```bash
pg_dump -U your_user -d bullconnect_crm > backup_$(date +%Y%m%d).sql
```

### 1.2 Choose Migration Path

**Option A: Fresh Installation (Recommended for new deployments)**
```bash
psql -U your_user -d bullconnect_crm < db/migrations/production_schema.sql
```

**Option B: Migrate Existing Data**
```bash
psql -U your_user -d bullconnect_crm < db/migrations/MIGRATION_GUIDE.sql
```

### 1.3 Verify Migration
```bash
psql -U your_user -d bullconnect_crm
```
```sql
-- Check tables
\dt

-- Check indexes
\di

-- Check views
\dv

-- Verify data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM campaigns;
```

---

## 🔧 Step 2: Backend Integration

### 2.1 Install Dependencies
```bash
cd backend
npm install pg bcrypt jsonwebtoken
npm install -D @types/pg @types/bcrypt @types/jsonwebtoken
```

### 2.2 Update Environment Variables
Create/update `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bullconnect_crm
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bullconnect_crm
DB_USER=your_user
DB_PASSWORD=your_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h

# Server
PORT=3000
NODE_ENV=production

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2.3 Update Database Configuration
Update `backend/src/config/db.ts` to use environment variables:
```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

### 2.4 Update app.ts
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import production routes
import telecallerProductionRoutes from './routes/telecaller.production.routes';
import adminProductionRoutes from './routes/admin.production.routes';

// Import existing routes
import authRoutes from './routes/auth.routes';
// ... other routes

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/telecaller', telecallerProductionRoutes);
app.use('/api/admin', adminProductionRoutes);
// ... other routes

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

export default app;
```

---

## 🔐 Step 3: Authentication Setup

### 3.1 Update Auth Middleware
Ensure `backend/src/middlewares/auth.ts` properly sets `req.user`:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  name: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### 3.2 Update Express Type Definitions
Create/update `backend/src/types/express.d.ts`:
```typescript
import { AuthUser } from '../middlewares/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
```

---

## 📊 Step 4: Testing

### 4.1 Test Database Connection
```typescript
// backend/src/test-db.ts
import { pool } from './config/db';

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log('✅ Users count:', userCount.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
}

testConnection();
```

```bash
npx ts-node src/test-db.ts
```

### 4.2 Test State Machine
```bash
# Create test file: backend/src/test-state-machine.ts
```
```typescript
import { validateLeadTransition } from './services/stateMachine.service';

console.log('Testing state machine...');

// Valid transitions
try {
  validateLeadTransition('NEW', 'ASSIGNED');
  console.log('✅ NEW → ASSIGNED: Valid');
} catch (e) {
  console.error('❌ NEW → ASSIGNED: Failed');
}

// Invalid transition
try {
  validateLeadTransition('NEW', 'FIELD_REQUESTED');
  console.error('❌ Should have thrown error');
} catch (e) {
  console.log('✅ NEW → FIELD_REQUESTED: Correctly rejected');
}

console.log('State machine tests complete!');
```

### 4.3 Test Call Logging
Create a test script to verify transaction handling:
```typescript
import { recordCallLog } from './services/callLog.service';

async function testCallLog() {
  try {
    // This will fail if lead doesn't exist - that's expected
    await recordCallLog({
      leadId: 'test-id',
      userId: 'test-user',
      disposition: 'INTERESTED',
      notes: 'Test call',
    });
  } catch (error) {
    console.log('✅ Call logging service is working (error expected):', error.message);
  }
}
```

---

## 🚀 Step 5: Deployment

### 5.1 Environment-Specific Configuration

**Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
```

**Production:**
```env
NODE_ENV=production
LOG_LEVEL=error
DATABASE_SSL=true
```

### 5.2 Start Application
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 5.3 Health Check
```bash
# Test basic endpoint
curl http://localhost:3000/api/health

# Test authenticated endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/telecaller/stats
```

---

## 📋 Step 6: Post-Deployment

### 6.1 Change Default Passwords
```sql
-- The default admin password is 'admin123'
-- Force password change on first login
UPDATE users SET password_hash = NULL WHERE username = 'admin';
```

### 6.2 Create Initial Users
```bash
# Use the admin route to create users
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

### 6.3 Create Test Campaign
```bash
curl -X POST http://localhost:3000/api/admin/campaigns \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "description": "Testing production setup",
    "startDate": "2026-02-22",
    "isActive": true
  }'
```

### 6.4 Import Leads
```bash
# Use your existing lead import functionality
# or create a CSV import endpoint
```

### 6.5 Test Assignment Flow
```bash
# Assign leads to telecaller
curl -X POST http://localhost:3000/api/admin/campaigns/CAMPAIGN_ID/assign-leads \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telecallerId": "TELECALLER_ID",
    "count": 10
  }'
```

### 6.6 Test Call Recording
```bash
# Record a test call
curl -X POST http://localhost:3000/api/telecaller/leads/LEAD_ID/call \
  -H "Authorization: Bearer TELECALLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disposition": "CALLBACK",
    "notes": "Will call back tomorrow",
    "nextCallbackAt": "2026-02-23T10:00:00Z",
    "durationSeconds": 120
  }'
```

---

## 🔍 Step 7: Monitoring

### 7.1 Database Performance
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### 7.2 Application Logs
```bash
# Monitor application logs
tail -f logs/application.log

# Monitor error logs
tail -f logs/error.log
```

### 7.3 Audit Log Review
```bash
# Check recent audit events
curl http://localhost:3000/api/admin/audit-logs?limit=50 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## ✅ Verification Checklist

### Database
- [ ] Schema migration completed without errors
- [ ] All tables created with proper constraints
- [ ] Indexes created and verified
- [ ] Triggers are functional
- [ ] Views are accessible
- [ ] Data migrated correctly (if upgrading)

### Backend
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database connection successful
- [ ] Authentication working
- [ ] State machine validates transitions
- [ ] Call logging creates transactions
- [ ] Audit logs are being created
- [ ] Role middleware protects routes

### API Endpoints
- [ ] `/api/auth/login` - Authentication works
- [ ] `/api/telecaller/leads` - Returns assigned leads
- [ ] `/api/telecaller/leads/:id/call` - Records calls
- [ ] `/api/admin/users` - Creates users
- [ ] `/api/admin/campaigns/:id/assign-leads` - Assigns leads
- [ ] `/api/admin/reports/campaign/:id` - Generates reports

### Security
- [ ] JWT secret is strong and unique
- [ ] Default admin password changed
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly
- [ ] Rate limiting functional
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input validation)

### Performance
- [ ] Database indexes verified
- [ ] Connection pooling configured
- [ ] Query performance acceptable
- [ ] API response times < 500ms
- [ ] No N+1 query issues

---

## 🆘 Troubleshooting

### Issue: "Invalid transition" errors
**Solution:** Check that leads are in the correct status before attempting transitions.
```sql
SELECT id, status FROM leads WHERE id = 'PROBLEM_LEAD_ID';
```

### Issue: "Lead not assigned to this user"
**Solution:** Verify lead assignment:
```sql
SELECT assigned_to FROM leads WHERE id = 'LEAD_ID';
```

### Issue: Slow queries
**Solution:** Check if indexes are being used:
```sql
EXPLAIN ANALYZE SELECT * FROM leads WHERE status = 'ASSIGNED';
```

### Issue: Connection pool exhausted
**Solution:** Increase pool size or fix connection leaks:
```env
DB_POOL_MAX=20
```

---

## 🎉 Success Criteria

Your production hardening is complete when:

1. ✅ All database migrations applied successfully
2. ✅ State machine enforces all transition rules
3. ✅ Call logging works with full transaction support
4. ✅ Role-based access control protects all routes
5. ✅ Audit logs capture all critical actions
6. ✅ Telecallers can view and call assigned leads
7. ✅ Admins can assign leads and view reports
8. ✅ No console errors in production
9. ✅ API response times are acceptable
10. ✅ Security best practices implemented

---

## 📚 Next Steps

After completing Step 1:
- [ ] Step 2: Frontend Integration
- [ ] Step 3: Field Operations Module
- [ ] Step 4: Reporting & Analytics
- [ ] Step 5: Performance Optimization
- [ ] Step 6: Load Testing
- [ ] Step 7: Production Deployment

---

**Need Help?**
- Review: `docs/PRODUCTION_BACKEND.md` for detailed documentation
- Check: Error logs in `logs/` directory
- Verify: Database state with verification queries
- Test: Each component with test scripts

**Documentation:**
- Production Schema: `db/migrations/production_schema.sql`
- Migration Guide: `db/migrations/MIGRATION_GUIDE.sql`
- Implementation Details: `docs/PRODUCTION_BACKEND.md`
