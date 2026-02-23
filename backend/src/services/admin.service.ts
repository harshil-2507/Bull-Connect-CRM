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
  adminId: string; // for audit
  role: Role;
}

export class AdminService {
  /**
   * Create any non-ADMIN user
   */
  async createUser(input: CreateUserInput) {
    await withTransaction(async (tx: PoolClient) => {
      // Check username uniqueness
      const existing = await tx.query(
        "SELECT id FROM users WHERE username = $1",
        [input.username]
      );

      if (existing.rowCount) {
        throw new Error("Username already exists");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      await tx.query(
        `INSERT INTO users
         (username, password_hash, name, phone, role)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          input.username,
          hashedPassword,
          input.name,
          input.phone,
          input.role,
        ]
      );
    });
  }

  /**
 * Get all users (no role filtering)
 */
async getAllUsersUnfiltered() {
  const res = await pool.query(
    `SELECT id, username, name, phone, role, is_active, created_at
     FROM users`
  );
  return res.rows;
}

  /**
   * Get all users by role
   */
  async getAllUsers(role: Role) {
    const res = await pool.query(
      `SELECT id, username, name, phone, is_active, created_at
       FROM users
       WHERE role = $1`,
      [role]
    );
    return res.rows;
  }

  /**
   * Get single user by ID and role
   */
  async getUserById(id: string, role: Role) {
    const res = await pool.query(
      `SELECT id, username, name, phone, is_active, created_at
       FROM users
       WHERE id = $1 AND role = $2`,
      [id, role]
    );

    if (!res.rowCount) throw new Error(`${role} not found`);
    return res.rows[0];
  }

  /**
   * Update user by ID and role
   */
  async updateUser(id: string, updates: Partial<{ name: string; phone: string; is_active: boolean }>, role: Role) {
    await withTransaction(async (tx) => {
      const exists = await tx.query(
        "SELECT id FROM users WHERE id = $1 AND role = $2",
        [id, role]
      );

      if (!exists.rowCount) throw new Error(`${role} not found`);

      const fields: string[] = [];
      const values: any[] = [];
      let i = 1;

      for (const key in updates) {
        fields.push(`${key} = $${i++}`);
        values.push((updates as any)[key]);
      }

      if (!fields.length) return;

      await tx.query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} AND role = $${i + 1}`,
        [...values, id, role]
      );
    });
  }

  /**
   * Deactivate user by setting is_active = false
   */
  async deactivateUser(id: string, role: Role) {
    await withTransaction(async (tx) => {
      const res = await tx.query(
        `UPDATE users SET is_active = false WHERE id = $1 AND role = $2`,
        [id, role]
      );

      if (!res.rowCount) throw new Error(`${role} not found`);
    });
  }

  /**
   * Hard delete user (use with caution!)
   */
  async deleteUser(id: string, role: Role) {
    await withTransaction(async (tx) => {
      const res = await tx.query(
        `DELETE FROM users WHERE id = $1 AND role = $2`,
        [id, role]
      );

      if (!res.rowCount) throw new Error(`${role} not found or cannot delete due to FK constraints`);
    });
  }
}
