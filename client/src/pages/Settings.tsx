import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../lang/LanguageContext";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/api";
import { renderEmoji } from "../utils/emojis";

/**
 * Página de definições para editar perfil e eliminar conta.
 * @returns Componente React com formulário de definições
 */
export const Settings = () => {
  const { token, user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Atualiza o perfil do utilizador.
   * @param e - Evento de submissão do formulário
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setMsg(t("settings.passwordMismatch") || "As passwords não coincidem");
      return;
    }

    const updates: Record<string, string> = {};
    if (username && username !== user?.username) updates.username = username;
    if (email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
      setMsg(t("settings.noChanges") || "Nenhuma alteração para guardar");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setMsg(t("settings.success") || "Perfil atualizado com sucesso!");
        setPassword("");
        setConfirmPassword("");
        setEmail("");
      } else {
        setMsg(t("settings.error") || "Erro ao atualizar perfil");
      }
    } catch (err) {
      console.error(err);
      setMsg(t("settings.error") || "Erro ao atualizar perfil");
    }
  };

  /**
   * Elimina a conta do utilizador após confirmação.
   */
  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user?.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        logout();
        navigate("/");
      } else {
        const data = await res.json();
        setMsg(
          data.error || t("settings.deleteError") || "Erro ao eliminar conta",
        );
      }
    } catch (err) {
      console.error(err);
      setMsg(t("settings.deleteError") || "Erro ao eliminar conta");
    }
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="glass-card settings-card">
        <div className="page-header">
          <h1 className="title page-title">
            {t("settings.title") || "Definições"}
          </h1>
          <button onClick={() => navigate("/profile")} className="btn btn-back">
            {t("nav.back") || "Voltar"}
          </button>
        </div>

        {msg && (
          <p
            className={`mb-1 settings-msg ${msg.includes("sucesso") ? "settings-msg-success" : "settings-msg-warning"}`}
          >
            {msg}
          </p>
        )}

        <form onSubmit={handleUpdate} className="flex-col gap-1">
          <div className="input-group">
            <label htmlFor="username">
              {t("register.username") || "Username"}
            </label>
            <input
              type="text"
              id="username"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={user?.username}
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">{t("login.email") || "Email"}</label>
            <input
              type="email"
              id="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("settings.newEmail") || "Novo email"}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              {t("settings.newPassword") || "Nova Password"}
            </label>
            <input
              type="password"
              id="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">
              {t("register.confirmPassword") || "Confirmar Password"}
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn mt-1">
            {t("settings.save") || "Guardar Alterações"}
          </button>
        </form>

        <hr
          style={{ margin: "2rem 0", borderColor: "rgba(255,255,255,0.2)" }}
        />

        <div className="danger-zone">
          <h3>{t("settings.dangerZone") || "Zona de Perigo"}</h3>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger"
          >
            {t("settings.deleteAccount") || "Apagar Conta"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">
              {renderEmoji("warning", "24px", "0 8px 0 0")} {t("modal.warning")}
            </h2>
            <p className="modal-text">{t("modal.deleteConfirm")}</p>
            <div className="modal-buttons">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                {t("modal.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn btn-danger btn-action"
              >
                {t("modal.continue")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
