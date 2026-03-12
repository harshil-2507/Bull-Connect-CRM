import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcryptjs";      
import jwt from "jsonwebtoken";     
import { env } from "../config/env";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1", //username for login credentials
      [username]
    );
    
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
  { 
    id: user.id, 
    role: user.role 
  }, 
  env.JWT_SECRET
);//removed expiry for now because of frequent token errors, can add later if needed

    // 4. Send Success Response
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,         
        email: user.email,         
        created_at: user.created_at 
      }

      
    });

    console.log("DB URL:", env.DATABASE_URL);

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};