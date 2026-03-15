import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import { Role } from "../types/roles";

const service = new AdminService();

/**
 * Validate role (excluding ADMIN)
 */
function validateRole(role: string): asserts role is Role {
  const allowedRoles: Role[] = [
    "MANAGER",
    "TELECALLER",
    "FIELD_MANAGER",
    "FIELD_EXEC",
  ];

  if (!allowedRoles.includes(role as Role)) {
    throw new Error(`Invalid role: ${role}`);
  }
}

/**
 * Create user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { role, ...data } = req.body;

    validateRole(role);

    const user = await service.createUser({
      ...data,
      role,
      adminId: req.user.id,
    });

    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Get all users
 */
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await service.getAllUsersUnfiltered();
    res.status(200).json(users);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Filter users by role
 */
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;

    validateRole(role);

    const users = await service.getUsersByRole(role);

    res.status(200).json(users);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await service.getUserById(id);

    res.status(200).json(user);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

/**
 * Update user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await service.updateUser(id, req.body);

    res.status(200).json({
      message: "User updated successfully",
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Deactivate user
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {

    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        error: "is_active must be boolean",
      });
    }

    await service.setUserActiveStatus(id, is_active);

    res.status(200).json({
      message: is_active ? "User activated" : "User deactivated",
    });

  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      throw new Error("New password required");
    }

    await service.resetPassword(id, newPassword);

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await service.deleteUser(id);

    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};