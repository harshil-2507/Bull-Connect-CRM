// src/types/express.d.ts
import * as express from "express";
import { Role } from "./roles";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: Role;
      };
    }
  }
}