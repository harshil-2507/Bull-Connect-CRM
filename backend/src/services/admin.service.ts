import { withTransaction } from "../db/transactions";
import bcrypt from "bcryptjs";
import { PoolClient } from "pg";
import { pool } from "../config/db";
import { Role } from "../types/roles";

interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  phone: string;
  adminId: string;
  role: Role;
}

export class AdminService {

  /**
   * Create user
   */
  async createUser(input: CreateUserInput) {
    return withTransaction(async (tx: PoolClient) => {

      if (input.role === "ADMIN") {
        throw new Error("Admin creation not allowed");
      }

      const existingUsername = await tx.query(
        "SELECT id FROM users WHERE username = $1",
        [input.username]
      );

      if (existingUsername.rowCount !== 0) {
        throw new Error("Username already exists");
      }

      const existingPhone = await tx.query(
        "SELECT id FROM users WHERE phone = $1",
        [input.phone]
      );

      if (existingPhone.rowCount !== 0) {
        throw new Error("Phone already exists");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const result = await tx.query(
        `INSERT INTO users
        (username, password_hash, name, phone, role)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id, username, name, phone, role, is_active, created_at`,
        [
          input.username,
          hashedPassword,
          input.name,
          input.phone,
          input.role,
        ]
      );

      return result.rows[0];
    });
  }

  /**
   * Get all users
   */
  async getAllUsersUnfiltered() {
    const res = await pool.query(`
      SELECT id, username, name, phone, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.rows;
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: Role) {
    const res = await pool.query(
      `
      SELECT id, username, name, phone, role, is_active, created_at
      FROM users
      WHERE role = $1
      ORDER BY created_at DESC
      `,
      [role]
    );

    return res.rows;
  }

  /**
   * Get single user
   */
  async getUserById(id: string) {

    const res = await pool.query(
      `
      SELECT id, username, name, phone, role, is_active, created_at
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (res.rowCount === 0) {
      throw new Error("User not found");
    }

    return res.rows[0];
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    updates: Partial<{ name: string; phone: string; is_active: boolean }>
  ) {

    const allowedFields = ["name", "phone", "role", "is_active"]

    const fields: string[] = [];
    const values: any[] = [];

    let i = 1;

    for (const key of allowedFields) {
      if (updates[key as keyof typeof updates] !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(updates[key as keyof typeof updates]);
      }
    }

    if (!fields.length) return;

    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${i}`,
      values
    );
  }

  /**
   * Deactivate user
   */
async setUserActiveStatus(id: string, isActive: boolean) {

  const res = await pool.query(
    `UPDATE users SET is_active = $1 WHERE id = $2`,
    [isActive, id]
  )

  if (res.rowCount === 0) {
    throw new Error("User not found")
  }

}

  /**
   * Reset password
   */
  async resetPassword(id: string, newPassword: string) {

    if (!newPassword) {
      throw new Error("Password cannot be empty");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const res = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [hashedPassword, id]
    );

    if (res.rowCount === 0) {
      throw new Error("User not found");
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string) {

    const res = await pool.query(
      `DELETE FROM users WHERE id = $1 AND role != 'ADMIN'`,
      [id]
    );

    if (res.rowCount === 0) {
      throw new Error("User not found or cannot delete admin");
    }
  }
}