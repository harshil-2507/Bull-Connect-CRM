import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  createUser,
  getAllUsersByRole,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
  getAllUsers,
} from "../controllers/admin.controller";

const router = Router();

/**
 * ADMIN only routes
 */
router.use(roleGuard(["ADMIN"]));

/**
 * Create a user (MANAGER, TELECALLER, FIELD_MANAGER, FIELD_EXEC)
 */
router.post("/users", createUser);

/**
 * Get all users (no filtering)
 */
router.get("/users", getAllUsers);

/**
 * Routes for a single user by role and ID must come BEFORE routes with only :role
 */
router.get("/users/:role/:id", getUserById);
router.put("/users/:role/:id", updateUser);
router.patch("/users/:role/:id", deactivateUser);
router.delete("/users/:role/:id", deleteUser);

/**
 * Get all users by role
 * (This comes after the /:role/:id routes)
 */
router.get("/users/:role", getAllUsersByRole);

export default router;
