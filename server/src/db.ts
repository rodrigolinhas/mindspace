import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

/** Instância singleton da base de dados */
let dbInstance: Database | null = null;

/**
 * Obtém a instância da base de dados (singleton pattern).
 * @returns Instância da base de dados
 */
export async function getDB(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
}

/**
 * Inicializa a conexão com a base de dados SQLite.
 * Cria as tabelas 'users' e 'entries' se não existirem.
 * @returns Instância da base de dados
 */
export async function initDB(): Promise<Database> {
  const db = await open({
    filename: "./server/data/mindspace.db",
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sentimento TEXT NOT NULL,
      data TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}
