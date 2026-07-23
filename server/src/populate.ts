/**
 * Script de povoamento da base de dados MindSpace.
 * Lê dados de um ficheiro de texto e popula as tabelas users e entries.
 * @module populate
 */
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { initDB } from "./db";

/**
 * Função principal que popula a base de dados com dados de teste.
 * Limpa todas as tabelas existentes e insere novos dados a partir do ficheiro povoamento.txt.
 * @returns Promise que resolve quando o povoamento está completo
 */
async function populate() {
  const db = await initDB();
  const filePath = path.join(__dirname, "../data/povoamento.txt");

  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split("\n");

  console.log("Cleaning database...");
  await db.exec("DELETE FROM entries");
  await db.exec("DELETE FROM users");
  await db.exec("DELETE FROM sqlite_sequence"); // Reset do AutoIncrement

  console.log("Starting population...");

  let currentSection = ""; // 'users' ou 'entries'
  let userCount = 0;
  let entryCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.startsWith("--users")) {
      currentSection = "users";
      console.log("Processing Users...");
      continue;
    }
    if (trimmedLine.startsWith("--entries")) {
      currentSection = "entries";
      console.log("Processing Entries...");
      continue;
    }

    if (currentSection === "users") {
      const data = parseLine(trimmedLine);
      if (data.username && data.password && data.email) {
        try {
          const hashedPassword = await bcrypt.hash(data.password, 10);
          const createdAt = parseDate(data.created_at);

          // IDs são gerados automaticamente sequencialmente a partir de 1
          await db.run(
            `INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)`,
            [
              data.username,
              data.email,
              hashedPassword,
              data.role || "user",
              createdAt,
            ],
          );
          userCount++;
        } catch (error) {
          console.error(`Error inserting user ${data.username}:`, error);
        }
      }
    } else if (currentSection === "entries") {
      const data = parseLine(trimmedLine);
      if (data.user_id && data.sentimento) {
        try {
          const createdAt = parseDate(data.data); // campo 'data' no ficheiro de texto mapeia para a coluna 'data'

          await db.run(
            `INSERT INTO entries (user_id, sentimento, data) VALUES (?, ?, ?)`,
            [data.user_id, data.sentimento, createdAt],
          );
          entryCount++;
        } catch (error) {
          console.error(
            `Error inserting entry for user ${data.user_id}:`,
            error,
          );
        }
      }
    }
  }

  console.log(`\n [SUCCESS] Population complete!`);
  console.log(`- Users inserted: ${userCount}`);
  console.log(`- Entries inserted: ${entryCount}`);
  await db.close();
}

/**
 * Interface para dados parseados de uma linha do ficheiro de povoamento.
 */
interface ParsedData {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  created_at?: string;
  user_id?: string;
  sentimento?: string;
  data?: string;
  [key: string]: string | undefined;
}

/**
 * Faz parse de uma linha do ficheiro de povoamento.
 * Formato esperado: "chave: valor; chave2: valor2"
 * @param line - Linha a processar
 * @returns Objeto com os pares chave-valor extraídos
 */
function parseLine(line: string): ParsedData {
  const pairs = line
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const data: ParsedData = {};
  pairs.forEach((pair) => {
    const parts = pair.split(":");
    if (parts.length >= 2) {
      const key = parts[0]!.trim();
      const value = parts.slice(1).join(":").trim(); // Junta de volta caso o valor tenha dois pontos (timestamps)
      data[key] = value;
    }
  });
  return data;
}

/**
 * Valida e formata uma string de data para formato ISO.
 * @param dateStr - String de data opcional
 * @returns Data no formato ISO ou data atual se inválida
 */
function parseDate(dateStr?: string): string {
  if (dateStr) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return dateStr;
    }
    console.warn(`Invalid date detected: ${dateStr}. Using current time.`);
  }
  return new Date().toISOString();
}

populate().catch(console.error);
