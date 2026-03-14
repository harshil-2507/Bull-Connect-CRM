import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../types/roles"; // adjust path

// Runtime guard for Role union
const isRole = (value: any): value is Role => {
  return (
    value === "ADMIN" ||
    value === "MANAGER" ||
    value === "TELECALLER" ||
    value === "FIELD_MANAGER" ||
    value === "FIELD_EXEC"
  );
};

export const auth = (req: Request, res: Response, next: NextFunction) => {

  //  Allow CORS preflight requests to pass
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: unknown;
    };

    //  validate role before trusting it
    if (!decoded.id || !isRole(decoded.role)) {
      return res.status(403).json({ error: "Invalid token payload" });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
  }
};