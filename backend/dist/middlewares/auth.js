"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
// Runtime guard for Role union
const isRole = (value) => {
    return (value === "ADMIN" ||
        value === "MANAGER" ||
        value === "TELECALLER" ||
        value === "FIELD_MANAGER" ||
        value === "FIELD_EXEC");
};
const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: Missing token" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        // 🔐 validate role before trusting it
        if (!decoded.id || !isRole(decoded.role)) {
            return res.status(403).json({ error: "Invalid token payload" });
        }
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
    }
};
exports.auth = auth;
