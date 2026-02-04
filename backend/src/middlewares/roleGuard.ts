import { Request, Response, NextFunction } from "express";
import { Role } from "../types/roles";

export function roleGuard(allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}