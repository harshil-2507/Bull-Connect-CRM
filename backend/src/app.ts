import express from "express";
import telecallerRoutes from "./routes/telecaller.routes";
import fieldExecRoutes from "./routes/fieldExec.routes";
import { auth } from "./middleware/auth";

export const app = express();

app.use(express.json());

//  Attach auth before protected routes
app.use(auth);

app.use("/telecaller", telecallerRoutes);
app.use("/field-exec", fieldExecRoutes);