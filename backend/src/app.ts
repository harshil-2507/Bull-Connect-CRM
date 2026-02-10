  import express from "express";
  import { auth } from "./middlewares/auth";
import { login } from "./controllers/auth.controller";
  import managerRoutes from "./routes/manager.routes";
  import telecallerRoutes from "./routes/telecaller.routes";
  import fieldManagerRoutes from "./routes/fieldManager.routes";
  import fieldExecRoutes from "./routes/fieldExec.routes";
  import adminRoutes from "./routes/admin.routes";
  import leadRoutes from "./routes/lead.routes";


  const app = express();

  app.use(express.json());

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

  export default app;
