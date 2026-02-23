"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleGuard_1 = require("../middlewares/roleGuard");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
/**
 * ADMIN only routes
 */
router.use((0, roleGuard_1.roleGuard)(["ADMIN"]));
/**
 * Create a user (MANAGER, TELECALLER, FIELD_MANAGER, FIELD_EXEC)
 */
router.post("/users", admin_controller_1.createUser);
/**
 * Get all users (no filtering)
 */
router.get("/users", admin_controller_1.getAllUsers);
/**
 * Routes for a single user by role and ID must come BEFORE routes with only :role
 */
router.get("/users/:role/:id", admin_controller_1.getUserById);
router.put("/users/:role/:id", admin_controller_1.updateUser);
router.patch("/users/:role/:id", admin_controller_1.deactivateUser);
router.delete("/users/:role/:id", admin_controller_1.deleteUser);
/**
 * Get all users by role
 * (This comes after the /:role/:id routes)
 */
router.get("/users/:role", admin_controller_1.getAllUsersByRole);
exports.default = router;
