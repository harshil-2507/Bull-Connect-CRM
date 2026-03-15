import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    /**
     * 1 Validate input
     */
    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    /**
     * 2 Fetch user from database
     */
    const result = await pool.query(
      `SELECT id, name, username, password_hash, role, phone, email, created_at
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    /**
     * 3 Compare password
     */
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    /**
     * 4 Generate JWT
     */
    //no expiration for now, can be added later if needed
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      env.JWT_SECRET
    );

    /**
     * 5 Send response
     */
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        created_at: user.created_at,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};