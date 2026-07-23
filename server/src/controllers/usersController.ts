import { Request, Response } from "express";
import { getDB } from "../db";
import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../middlewares/auth";
import {
  signupSchema,
  loginSchema,
  updateUserSchema,
} from "../middlewares/validation";

/**
 * Obtém todos os utilizadores registados.
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const db = await getDB();
    const users = await db.all(
      "SELECT id, username, email, role, created_at FROM users",
    );
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Cria um novo utilizador com validação de input.
 */
export const createUser = async (req: Request, res: Response) => {
  const validation = signupSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: validation.error.issues.map(
        (e: { message: string }) => e.message,
      ),
    });
  }

  const { username, email, password, role } = validation.data;

  try {
    const db = await getDB();
    const hashed = await hashPassword(password);
    const result = await db.run(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashed, role],
    );
    const user = await db.get(
      "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
      [result.lastID],
    );
    const token = generateToken(user);
    res.status(201).json({ ...user, token });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * Autentica um utilizador com validação de input.
 */
export const loginUser = async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: validation.error.issues.map(
        (e: { message: string }) => e.message,
      ),
    });
  }

  const { username, password } = validation.data;

  try {
    const db = await getDB();
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Incorrect password" });

    const token = generateToken(user);
    res.json({ token, role: user.role, username: user.username, id: user.id });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Elimina um utilizador pelo ID.
 * Utilizadores podem eliminar a própria conta.
 * Admins não podem eliminar a própria conta (para garantir que há sempre um admin).
 */
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = req.user;
  const targetId = Number(id);

  // Impedir admin de se auto-eliminar (para garantir que há sempre um admin)
  if (requestingUser.role === "admin" && requestingUser.id === targetId) {
    return res
      .status(403)
      .json({ error: "Admins cannot delete their own account" });
  }

  // Utilizadores só podem eliminar a própria conta, admins podem eliminar qualquer um
  if (requestingUser.role !== "admin" && requestingUser.id !== targetId) {
    return res
      .status(403)
      .json({ error: "No permission to delete this account" });
  }

  try {
    const db = await getDB();
    const result = await db.run("DELETE FROM users WHERE id = ?", [id]);
    if (result.changes === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

/**
 * Atualiza um utilizador pelo ID.
 * Utilizadores só podem editar o próprio perfil (exceto admins).
 * Apenas admins podem alterar roles.
 */
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = req.user;

  // Verificar permissões: utilizadores só podem editar-se a si próprios
  const targetId = Number(id);
  if (requestingUser.role !== "admin" && requestingUser.id !== targetId) {
    return res.status(403).json({ error: "No permission to edit this user" });
  }

  // Validar dados de entrada com schema Zod
  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: validation.error.issues.map(
        (e: { message: string }) => e.message,
      ),
    });
  }

  const { username, email, password, role } = validation.data;

  // Apenas admins podem alterar roles
  if (role && requestingUser.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only administrators can change roles" });
  }

  try {
    const db = await getDB();

    const existingUser = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (username) {
      updates.push("username = ?");
      values.push(username);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (password) {
      const hashed = await hashPassword(password);
      updates.push("password = ?");
      values.push(hashed);
    }
    if (role && (role === "admin" || role === "user")) {
      updates.push("role = ?");
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(Number(id));
    await db.run(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const updatedUser = await db.get(
      "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
      [id],
    );
    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};
