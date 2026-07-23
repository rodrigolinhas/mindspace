import rateLimit from "express-rate-limit";

/**
 * Global rate limiter: max 100 requests per minute per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // limite por IP
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Aggressive rate limiter for login/signup (brute force protection)
 * Max 10 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login por 15 min
  message: { error: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
