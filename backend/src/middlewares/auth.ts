import { Request, Response, NextFunction } from "express";

/**
 * TEMP AUTH MIDDLEWARE (replace with JWT later)
 */
export function auth(req: Request, _res: Response, next: NextFunction) {
  req.user = {
    id: req.headers["x-user-id"] as string,
    role: req.headers["x-user-role"] as any,
  };
  next();
}