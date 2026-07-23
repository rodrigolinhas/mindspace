/**
 * Contexto de autenticação para a aplicação MindSpace.
 * Gere o estado de autenticação do utilizador, incluindo login, logout e verificação de permissões.
 * @module AuthContext
 */
import { createContext, useContext, useState, ReactNode } from "react";
import type { User } from "../../../shared/types";

/**
 * Tipo que representa o utilizador autenticado no cliente.
 * Derivado de User mas sem campos sensíveis (password, email) e com token JWT.
 * O id é opcional pois pode não estar disponível em certos fluxos.
 */
export type AuthUser = Pick<User, "username" | "role"> &
  Partial<Pick<User, "id">> & {
    token: string;
  };

/**
 * Tipo do contexto de autenticação.
 */
type AuthContextType = {
  /** Utilizador autenticado ou null se não autenticado */
  user: AuthUser | null;
  /** Token JWT atual ou null */
  token: string | null;
  /** Função para fazer login */
  login: (token: string, role: string, username: string, id?: number) => void;
  /** Função para fazer logout */
  logout: () => void;
  /** Indica se o utilizador é administrador */
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticação que envolve a aplicação.
 * Gere o estado de autenticação usando localStorage para persistência.
 * @param children - Componentes filhos a envolver
 * @returns Provider com contexto de autenticação
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  /**
   * Autentica o utilizador e guarda os dados em localStorage.
   * @param newToken - Token JWT recebido do servidor
   * @param role - Role do utilizador ('admin' ou 'user')
   * @param username - Nome de utilizador
   * @param id - ID do utilizador (opcional)
   */
  const login = (
    newToken: string,
    role: string,
    username: string,
    id?: number,
  ) => {
    const newUser: AuthUser = {
      token: newToken,
      role: role as "admin" | "user",
      username,
      id,
    };
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
  };

  /**
   * Termina a sessão do utilizador e limpa os dados de localStorage.
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para aceder ao contexto de autenticação.
 * @returns Contexto de autenticação com user, token, login, logout e isAdmin
 * @throws Error se usado fora de um AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
