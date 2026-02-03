/**
 * Central role definition
 * Used across auth, guards, and controllers
 */
export type UserRole =
  | "MANAGER"
  | "TELECALLER"
  | "FIELD_MANAGER"
  | "FIELD_EXEC";