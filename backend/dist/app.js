"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("./middlewares/auth");
const auth_controller_1 = require("./controllers/auth.controller");
const manager_routes_1 = __importDefault(require("./routes/manager.routes"));
const telecaller_routes_1 = __importDefault(require("./routes/telecaller.routes"));
const fieldManager_routes_1 = __importDefault(require("./routes/fieldManager.routes"));
const fieldExec_routes_1 = __importDefault(require("./routes/fieldExec.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const lead_routes_1 = __importDefault(require("./routes/lead.routes"));
const campaign_routes_1 = __importDefault(require("./routes/campaign.routes"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigin = env_1.env.CORS_ORIGIN;
    if (allowedOrigin === "*" && origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }
    else if (allowedOrigin && origin === allowedOrigin) {
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
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.post("/login", auth_controller_1.login);
app.use(auth_1.auth);
// TEMP health check
app.post("/ping", (_req, res) => {
    res.json({ ok: true });
});
app.use("/leads", lead_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.use("/manager", manager_routes_1.default);
app.use("/telecaller", telecaller_routes_1.default);
app.use("/field-manager", fieldManager_routes_1.default);
app.use("/field-exec", fieldExec_routes_1.default);
console.log("Campaign routes loaded");
app.use("/campaigns", campaign_routes_1.default);
exports.default = app;
