"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.deactivateUser = exports.updateUser = exports.getUserById = exports.getAllUsersByRole = exports.getAllUsers = exports.createUser = void 0;
const admin_service_1 = require("../services/admin.service");
const service = new admin_service_1.AdminService();
/**
 * Validate that role is one of allowed roles (excluding ADMIN)
 */
function validateRole(role) {
    const allowedRoles = ["MANAGER", "TELECALLER", "FIELD_MANAGER", "FIELD_EXEC"];
    if (!allowedRoles.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
    }
}
//CRUD operations as ADMIN
/**
 * Create user of any role (except ADMIN)
 * POST /users
 */
const createUser = async (req, res) => {
    try {
        const { role, ...data } = req.body;
        validateRole(role);
        await service.createUser({ ...data, role, adminId: req.user.id });
        res.status(201).json({ message: `${role} created successfully` });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createUser = createUser;
/**
 * Get all users (no role filtering)
 * GET /all/users
 */
const getAllUsers = async (_req, res) => {
    try {
        const users = await service.getAllUsersUnfiltered();
        res.status(200).json(users);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Get all users by role
 * GET /users/:role
 */
const getAllUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        validateRole(role);
        const users = await service.getAllUsers(role);
        res.status(200).json(users);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getAllUsersByRole = getAllUsersByRole;
/**
 * Get single user by role & ID
 * GET /users/:role/:id
 */
const getUserById = async (req, res) => {
    try {
        const { role, id } = req.params;
        validateRole(role);
        const user = await service.getUserById(id, role);
        res.status(200).json(user);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
};
exports.getUserById = getUserById;
/**
 * Update user by role & ID
 * PUT /users/:role/:id
 */
const updateUser = async (req, res) => {
    try {
        const { role, id } = req.params;
        validateRole(role);
        await service.updateUser(id, req.body, role);
        res.status(200).json({ message: `${role} updated successfully` });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.updateUser = updateUser;
/**
 * Deactivate user by role & ID
 * PATCH /users/:role/:id
 */
const deactivateUser = async (req, res) => {
    try {
        const { role, id } = req.params;
        validateRole(role);
        await service.deactivateUser(id, role);
        res.status(200).json({ message: `${role} deactivated` });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.deactivateUser = deactivateUser;
/**
 * Delete user by role & ID
 * DELETE /users/:role/:id
 */
const deleteUser = async (req, res) => {
    try {
        const { role, id } = req.params;
        validateRole(role);
        await service.deleteUser(id, role);
        res.status(204).send();
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.deleteUser = deleteUser;
