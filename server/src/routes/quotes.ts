/**
 * Rotas de Frases - Frases Motivacionais
 * Endpoints públicos para obter frases inspiracionais.
 * @module routes/quotes
 */
import { Router } from "express";
import { getAllQuotes, getRandomQuote } from "../controllers/quotesController";

const router = Router();

// GET /api/quotes - Lista todas as frases disponíveis
router.get("/", getAllQuotes);

// GET /api/quotes/random?lang=pt|en - Obtém frase aleatória por idioma
router.get("/random", getRandomQuote);

export default router;
