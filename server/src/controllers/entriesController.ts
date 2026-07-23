import { Request, Response } from "express";
import { getDB } from "../db";
import { createEntrySchema } from "../middlewares/validation";

/**
 * Cria uma nova entrada de sentimento.
 * Valida os dados de entrada usando schema Zod.
 * Usa o ID do utilizador autenticado para garantir ownership.
 */
export const createEntry = async (req: Request, res: Response) => {
  // Validar dados de entrada com schema Zod
  const validation = createEntrySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: validation.error.issues.map((e) => e.message),
    });
  }

  // Usar o ID do utilizador autenticado (do token JWT)
  const userId = req.user.id;
  const { sentimento } = validation.data;

  try {
    const db = await getDB();

    const result = await db.run(
      "INSERT INTO entries (user_id, sentimento) VALUES (?, ?)",
      [userId, sentimento],
    );

    const newEntry = await db.get("SELECT * FROM entries WHERE id = ?", [
      result.lastID,
    ]);
    res.status(201).json(newEntry);
  } catch (err) {
    console.error("Error creating entry:", err);
    res.status(500).json({ error: "Failed to create entry" });
  }
};

/**
 * Obtém todas as entradas do utilizador autenticado.
 */
export const getAllEntries = async (req: Request, res: Response) => {
  try {
    const db = await getDB();
    const userId = req.user.id;
    const entries = await db.all(
      `SELECT * FROM entries WHERE user_id = ? ORDER BY data DESC`,
      [userId],
    );
    res.json(entries);
  } catch (err) {
    console.error("Error fetching entries:", err);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
};

/**
 * Elimina uma entrada pelo ID.
 * Verifica se a entrada pertence ao utilizador autenticado.
 */
export const deleteEntry = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const db = await getDB();
    const entry = await db.get("SELECT * FROM entries WHERE id = ?", [id]);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    if (entry.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "No permission to delete this entry" });
    }
    await db.run("DELETE FROM entries WHERE id = ?", [id]);
    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    console.error("Error deleting entry:", err);
    res.status(500).json({ error: "Failed to delete entry" });
  }
};
