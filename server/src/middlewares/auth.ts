// server/src/middlewares/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import { User } from "../../../shared/types";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

/**
 * Encripta uma password utilizando bcrypt.
 * @param password - Password em texto simples
 * @returns Password encriptada
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compara uma password em texto simples com uma hash.
 * @param password - Password em texto simples
 * @param hash - Hash da password guardada
 * @returns true se as passwords coincidem, false caso contrário
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Gera um token JWT para um utilizador autenticado.
 * @param user - Objeto do utilizador (sem password)
 * @returns Token JWT válido por 1 hora
 */
export function generateToken(user: Omit<User, "password">): string {
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

/**
 * Middleware que verifica a validade do token JWT.
 * Adiciona o utilizador à request se o token for válido.
 * @param req - Request do Express
 * @param res - Response do Express
 * @param next - Função next do middleware
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded as User;
    next();
  });
}
