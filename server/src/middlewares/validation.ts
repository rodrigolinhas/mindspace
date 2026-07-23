import { z } from "zod";

/**
 * Zod validation schemas for input security.
 * Prevents SQL injection, XSS, and malformed data.
 */

// Schema para login
export const loginSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username is too long")
    .regex(
      /^[\w]+$/,
      "Username can only contain letters, numbers and underscore",
    ),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});

// Schema para registo
export const signupSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username is too long")
    .regex(
      /^[\w]+$/,
      "Username can only contain letters, numbers and underscore",
    ),
  email: z.string().email("Invalid email").max(100, "Email is too long"),
  password: z
    .string()
    .min(3, "Password must be at least 3 characters")
    .max(100, "Password is too long"),
  role: z.enum(["admin", "user"]).optional().default("user"),
});

// Schema para criação de entrada (user_id vem do token JWT)
export const createEntrySchema = z.object({
  sentimento: z
    .string()
    .min(1, "Sentiment is required")
    .max(50, "Sentiment is too long"),
});

// Schema para atualização de utilizador
export const updateUserSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[\w]+$/)
    .optional(),
  email: z.string().email().max(100).optional(),
  password: z.string().min(3).max(100).optional(),
  role: z.enum(["admin", "user"]).optional(),
});

/**
 * Utility type to extract the type from a Zod schema
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
