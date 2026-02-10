import { Request, Response, NextFunction } from "express";
import { Role } from "../types/roles";

export function roleGuard(allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 🔒 Narrow req.user first
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}
