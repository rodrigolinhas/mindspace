/**
 * Rotas de Entradas - Registos de Sentimentos
 * Endpoints para CRUD de entradas emocionais do utilizador.
 * @module routes/entries
 */
import { Router } from "express";
import { verifyToken } from "../middlewares/auth";
import {
  createEntry,
  getAllEntries,
  deleteEntry,
} from "../controllers/entriesController";

const router = Router();

// GET /api/entries - Obtém todas as entradas do utilizador autenticado
router.get("/", verifyToken, getAllEntries);

// POST /api/entries - Cria nova entrada de sentimento
router.post("/", verifyToken, createEntry);

// DELETE /api/entries/:id - Elimina entrada (apenas próprias)
router.delete("/:id", verifyToken, deleteEntry);

export default router;
