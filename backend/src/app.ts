  import express from "express";
  import { auth } from "./middlewares/auth";
import { login } from "./controllers/auth.controller";
  import managerRoutes from "./routes/manager.routes";
  import telecallerRoutes from "./routes/telecaller.routes";
  import fieldManagerRoutes from "./routes/fieldManager.routes";
  import fieldExecRoutes from "./routes/fieldExec.routes";
  import adminRoutes from "./routes/admin.routes";
  import leadRoutes from "./routes/lead.routes";
  import campaignRoutes from "./routes/campaign.routes";
  import adminDashboardRoutes from "./routes/adminDashboard.routes";
  import { env } from "./config/env";

  const app = express();

    app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigin = env.CORS_ORIGIN;

      if (allowedOrigin === "*" && origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      } else if (allowedOrigin && origin === allowedOrigin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }

      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }

      next();
    });

  app.use(express.json());

    app.get("/health", (_req, res) => {
      res.json({ ok: true });
    });

  app.post("/login", login);
  app.use(auth);

  // TEMP health check
  app.post("/ping", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/leads", leadRoutes);
  app.use("/admin", adminRoutes);
  app.use("/manager", managerRoutes);
  app.use("/telecaller", telecallerRoutes);
  app.use("/field-manager", fieldManagerRoutes);
  app.use("/field-exec", fieldExecRoutes);
  
  app.use("/campaigns", campaignRoutes);
  app.use("/admin/dashboard", adminDashboardRoutes);

  export default app;
