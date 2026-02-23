"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db_1.pool.query("SELECT * FROM users WHERE username = $1", //username for login credentials
        [username]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            role: user.role
        }, env_1.env.JWT_SECRET, // In a real app, use process.env.JWT_SECRET
        { expiresIn: "24h" });
        // 4. Send Success Response
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            }
        });
        console.log("DB URL:", env_1.env.DATABASE_URL);
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.login = login;
