import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";

import {
  createUser,
  getAllUsers,
  getUsersByRole,
  getUserById,
  updateUser,
  deactivateUser,
  resetPassword,
  deleteUser,
} from "../controllers/admin.controller";

const router = Router();

/**
 * ADMIN only routes
 */
router.use(roleGuard(["ADMIN"]));

/**
 * Create user
 */
router.post("/users", createUser);

/**
 * Get all users
 */
router.get("/users", getAllUsers);

/**
 * Get users by role
 */
router.get("/users/role/:role", getUsersByRole);

/**
 * Get user by id
 */
router.get("/users/:id", getUserById);

/**
 * Update user
 */
router.put("/users/:id", updateUser);

/**
 * Deactivate user
 */
router.patch("/users/:id/deactivate", deactivateUser);

/**
 * Reset password
 */
router.patch("/users/:id/reset-password", resetPassword);

/**
 * Delete user
 */
router.delete("/users/:id", deleteUser);

export default router;