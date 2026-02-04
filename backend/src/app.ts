import express from "express";
import { auth } from "./middlewares/auth";

import managerRoutes from "./routes/manager.routes";
import telecallerRoutes from "./routes/telecaller.routes";
import fieldManagerRoutes from "./routes/fieldManager.routes";
import fieldExecRoutes from "./routes/fieldExec.routes";

const app = express();

app.use(express.json());
app.use(auth);

// TEMP health check
app.post("/ping", (_req, res) => {
  res.json({ ok: true });
});
app.use("/manager", managerRoutes);
app.use("/telecaller", telecallerRoutes);
app.use("/field-manager", fieldManagerRoutes);
app.use("/field-exec", fieldExecRoutes);

export default app;
