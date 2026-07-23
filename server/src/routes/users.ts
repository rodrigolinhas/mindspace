/**
 * Rotas de Utilizadores - Autenticação e Gestão
 * Endpoints para signup, login, e operações CRUD de utilizadores.
 * @module routes/users
 */
import { Router } from "express";
import { verifyToken } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rateLimiter";
import {
  getAllUsers,
  createUser,
  loginUser,
  deleteUser,
  updateUser,
} from "../controllers/usersController";

const router = Router();

// GET /api/users - Lista todos os utilizadores (requer autenticação)
router.get("/", verifyToken, getAllUsers);

// POST /api/users/signup - Registo de novo utilizador (rate limited)
router.post("/signup", authLimiter, createUser);

// POST /api/users/login - Autenticação de utilizador (rate limited)
router.post("/login", authLimiter, loginUser);

// PUT /api/users/:id - Atualiza utilizador (requer autenticação)
router.put("/:id", verifyToken, updateUser);

// DELETE /api/users/:id - Elimina utilizador (requer autenticação)
router.delete("/:id", verifyToken, deleteUser);

export default router;
