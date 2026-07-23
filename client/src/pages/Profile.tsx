import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../lang/LanguageContext";
import { useNavigate } from "react-router-dom";
import { renderEmoji } from "../utils/emojis";

/**
 * Página de perfil do utilizador com menu de navegação.
 * @returns Componente React com grid de navegação
 */
export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  /**
   * Faz logout e redireciona para a página inicial.
   */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="glass-card profile-card">
      <h1 className="title page-title-large">
        {t("profile.welcome") || "Bem-vindo"}
      </h1>
      <h2 className="subtitle mb-2">
        <span className="highlight-text">{user?.username}</span>
      </h2>

      <div className="grid-2col">
        <button onClick={() => navigate("/quote")} className="btn btn-large">
          {t("nav.dailyQuote") || "Frase do Dia"}
        </button>
        <button onClick={() => navigate("/history")} className="btn btn-large">
          {t("nav.history") || "Histórico"}
        </button>
        <button onClick={() => navigate("/stats")} className="btn btn-large">
          {t("nav.stats") || "Estatísticas"}
        </button>
        <button onClick={() => navigate("/settings")} className="btn btn-large">
          {t("nav.settings") || "Definições"}
        </button>
      </div>

      <div className="flex-wrap">
        {user?.role === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className="btn btn-admin btn-action"
          >
            {t("nav.admin") || "Admin"}
          </button>
        )}
        {user?.username === "RuiPaulo" && (
          <button
            onClick={() => navigate("/secret")}
            className="btn btn-action btn-secret flex-center"
          >
            {renderEmoji("1f92b", "1.2rem")} Secret
          </button>
        )}
        <button onClick={handleLogout} className="btn btn-danger btn-action">
          {t("nav.logout") || "Sair"}
        </button>
      </div>
    </div>
  );
};
