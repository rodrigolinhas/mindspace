import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";

import { globalLimiter } from "./middlewares/rateLimiter";

import usersRouter from "./routes/users";
import entriesRouter from "./routes/entries";
import quotesRouter from "./routes/quotes";

// Inicialização da aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===== SECURITY MIDDLEWARE =====

// Helmet: adiciona headers de segurança (XSS, clickjacking, etc.)
app.use(helmet());

// Rate limiter global (importado dos middlewares)
app.use(globalLimiter);

// Configuração CORS com origens permitidas
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (ex: Postman, apps mobile)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Origem não permitida - bloquear silenciosamente
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10kb" })); // Limite de payload (proteção DoS)

// Definição das rotas principais (prefixo /api)
app.use("/api/users", usersRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/quotes", quotesRouter);

app.get("/", (req, res) => res.send("Mindspace API running (secured)"));

app.listen(PORT, () =>
  console.log(`[SERVER] Secured server running on http://localhost:${PORT}`),
);
