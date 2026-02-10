import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import { Role } from "../types/roles"; // your Role type

const service = new AdminService();

/**
 * Validate that role is one of allowed roles (excluding ADMIN)
 */
function validateRole(role: string): asserts role is Role {
  const allowedRoles: Role[] = ["MANAGER", "TELECALLER", "FIELD_MANAGER", "FIELD_EXEC"];
  if (!allowedRoles.includes(role as Role)) {
    throw new Error(`Invalid role: ${role}`);
  }
}

/**
 * Create user of any role (except ADMIN)
 * POST /users
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { role, ...data } = req.body;
    validateRole(role);
    await service.createUser({ ...data, role, adminId: req.user.id });
    res.status(201).json({ message: `${role} created successfully` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Get all users (no role filtering)
 * GET /all/users
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
 * Get all users by role
 * GET /users/:role
 */
export const getAllUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    validateRole(role);
    const users = await service.getAllUsers(role);
    res.status(200).json(users);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Get single user by role & ID
 * GET /users/:role/:id
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { role, id } = req.params;
    validateRole(role);
    const user = await service.getUserById(id, role);
    res.status(200).json(user);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

/**
 * Update user by role & ID
 * PUT /users/:role/:id
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { role, id } = req.params;
    validateRole(role);
    await service.updateUser(id, req.body, role);
    res.status(200).json({ message: `${role} updated successfully` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Deactivate user by role & ID
 * PATCH /users/:role/:id
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { role, id } = req.params;
    validateRole(role);
    await service.deactivateUser(id, role);
    res.status(200).json({ message: `${role} deactivated` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Delete user by role & ID
 * DELETE /users/:role/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { role, id } = req.params;
    validateRole(role);
    await service.deleteUser(id, role);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
