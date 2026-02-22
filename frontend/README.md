# Bull Connect CRM - Admin Web

Admin-only web frontend built with React + TypeScript + Vite.

## Implemented in this version

- Admin login (`/login`) using backend `/login`
- Protected admin routes with role guard
- Dashboard (basic campaign/user summary)
- Users management (`/admin/users` and `/admin/users/:role`)
- Campaign management (`/campaigns`, create + activate/deactivate)
- Leads list (`/leads`)

## Run locally

1. Start backend on `http://localhost:3000`
2. Start frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API configuration

- By default frontend calls relative API paths and uses Vite proxy to `http://localhost:3000`.
- If you want direct API calls, create `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Next step for your design integration

Apply your admin UI design by replacing visual layout/styles in:

- `src/components/AdminLayout.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/UsersPage.tsx`
- `src/pages/CampaignsPage.tsx`
- `src/pages/LeadsPage.tsx`
