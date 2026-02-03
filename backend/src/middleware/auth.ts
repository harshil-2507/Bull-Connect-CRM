import { Request, Response, NextFunction } from "express";

/**
 * Temporary auth middleware
 * In production this will:
 * - Verify JWT
 * - Fetch user from DB
 *
 * For now, we attach a mocked user
 */
export function auth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  //  TEMPORARY — replace with JWT later
  req.user = {
    id: "22222222-2222-2222-2222-222222222222",
    role: "TELECALLER",
  };

  next();
}