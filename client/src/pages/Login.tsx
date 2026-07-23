import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../lang/LanguageContext";
import { API_URL } from "../utils/api";

/**
 * Componente de Login/Registo que permite ao utilizador autenticar-se ou criar uma nova conta.
 * Suporta alternância entre modo de login e modo de registo.
 * @returns Componente React com formulário de autenticação
 */
export const Login = () => {
  const [password, setPassword] = useState("");
  /** Estado que controla se o utilizador está a criar uma nova conta */
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  /** Email é utilizado apenas no registo */
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const { t } = useLanguage();

  /**
   * Processa o formulário de login ou registo.
   * Envia os dados para a API e autentica o utilizador se bem sucedido.
   * @param e - Evento de submissão do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const endpoint = isSignUp ? "/api/users/signup" : "/api/users/login";
    /** Signup precisa de username, email, password. Login precisa de username, password. */
    const body = isSignUp
      ? { username, email, password }
      : { username, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        /** Login e signup retornam token, role, username, id */
        const role = data.role || "user";
        const respUsername = data.username || username;
        login(data.token, role, respUsername, data.id);
        navigate("/profile");
      } else {
        setError(data.error || t("login.error") || "Authentication failed");
      }
    } catch (err) {
      console.error(err);
      setError(t("login.connectionError") || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h1 className="title">MindSpace</h1>
      <p className="subtitle">
        {isSignUp ? t("register.title") : t("login.title")}
      </p>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <label htmlFor="username">{t("register.username")}</label>
          <input
            type="text"
            id="username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("register.username")}
            required
          />
        </div>
        {isSignUp && (
          <div className="input-group">
            <label htmlFor="email">{t("login.email")}</label>
            <input
              type="email"
              id="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
        )}

        <div className="input-group">
          <label htmlFor="password">{t("login.password")}</label>
          <input
            type="password"
            id="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading
            ? "..."
            : isSignUp
              ? t("register.registerBtn")
              : t("login.loginBtn")}
        </button>
      </form>
      <p className="login-toggle-text">
        {isSignUp ? t("register.hasAccount") : t("login.noAccount")}
        <button onClick={() => setIsSignUp(!isSignUp)} className="btn-link">
          {isSignUp ? t("register.login") : t("login.register")}
        </button>
      </p>
      <p>
        <button onClick={() => navigate("/")} className="btn-link">
          {t("nav.home")}
        </button>
      </p>
    </div>
  );
};
