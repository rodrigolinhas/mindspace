import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Quote } from "../../../shared/types";

const quotesFilePaths = {
  pt: path.resolve(process.cwd(), "server/data/quotes-pt.txt"),
  en: path.resolve(process.cwd(), "server/data/quotes-eng.txt"),
};

/**
 * Carrega frases de um ficheiro de texto.
 * @param filePath Caminho absoluto do ficheiro
 * @returns Array de objetos Quote
 */
function loadQuotes(filePath: string): Quote[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const dash = line.lastIndexOf(" - ");
        if (dash === -1)
          return { texto: line.replace(/^"|"$/g, ""), autor: "Desconhecido" };
        const texto = line.slice(0, dash).replace(/^"|"$/g, "").trim();
        const autor = line.slice(dash + 3).trim();
        return { texto, autor };
      })
      .filter((quote) => quote.texto.length > 0);
  } catch (err) {
    console.error(`Erro a ler ${filePath}:`, err);
    return [];
  }
}

const quotesCache: Record<"pt" | "en", Quote[]> = {
  pt: loadQuotes(quotesFilePaths.pt),
  en: loadQuotes(quotesFilePaths.en),
};

/**
 * Retorna todas as frases disponíveis num idioma.
 * @param req Request com query param 'lang' (pt ou en)
 * @param res Response com array de frases
 */
export const getAllQuotes = (req: Request, res: Response) => {
  const lang = (req.query.lang as "pt" | "en") || "pt";
  res.json(quotesCache[lang]);
};

/**
 * Retorna uma frase aleatória.
 * @param req Request com query param 'lang' (pt ou en)
 * @param res Response com uma frase aleatória
 */
export const getRandomQuote = (req: Request, res: Response) => {
  const lang = (req.query.lang as "pt" | "en") || "pt";
  const quotes = quotesCache[lang];
  if (!quotes.length)
    return res.status(500).json({ error: "Nenhuma quote carregada" });
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  res.json(random);
};
