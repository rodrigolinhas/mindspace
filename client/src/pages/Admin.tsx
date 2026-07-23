import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../lang/LanguageContext";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/api";
import { renderEmoji } from "../utils/emojis";
import type { User } from "../../../shared/types";

/**
 * Dados do utilizador para exibição na tabela de administração.
 * Não inclui password por razões de segurança.
 */
type UserData = Omit<User, "password">;

/**
 * Página de administração para gerir utilizadores.
 * Permite ver todos os utilizadores e alterar roles (exceto admins não podem ser eliminados).
 * @returns Componente React da página Admin
 */
export const Admin = () => {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [error, setError] = useState("");

  /**
   * Carrega todos os utilizadores.
   */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
      setError(t("admin.errorLoading") || "Erro ao carregar utilizadores");
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  /**
   * Redireciona se não for admin.
   */
  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/profile");
      return;
    }
    fetchUsers();
  }, [user, navigate, fetchUsers]);

  /**
   * Filtra utilizadores com base no termo de pesquisa.
   */
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /**
   * Abre o modal de confirmação para eliminar um utilizador.
   * @param userId - ID do utilizador a eliminar
   */
  const openDeleteModal = (userId: number) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  /**
   * Elimina um utilizador pelo ID.
   */
  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/users/${userToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userToDelete));
      }
    } catch (err) {
      console.error(err);
      setError(t("admin.errorDelete") || "Erro ao eliminar utilizador");
    }
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  /**
   * Altera o role de um utilizador.
   * @param userId - ID do utilizador
   * @param newRole - Novo role ('admin' ou 'user')
   */
  const handleRoleChange = async (
    userId: number,
    newRole: "admin" | "user",
  ) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      }
    } catch (err) {
      console.error(err);
      setError(t("admin.errorRole") || "Erro ao alterar role");
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <>
      <div className="glass-card admin-card">
        <div className="page-header">
          <h1 className="title page-title">
            {t("admin.title") || "Administração"}
          </h1>
          <button onClick={() => navigate("/profile")} className="btn btn-back">
            {t("nav.back") || "Voltar"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-1">
          <input
            type="text"
            placeholder={
              t("admin.searchPlaceholder") || "Pesquisar utilizador..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field search-bar"
          />
        </div>

        {loading ? (
          <p style={{ textAlign: "center" }}>
            {t("admin.loading") || "A carregar utilizadores..."}
          </p>
        ) : (
          <>
            {error && <div className="error-msg mb-1">{error}</div>}
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("admin.username")}</th>
                  <th>{t("admin.email")}</th>
                  <th>{t("admin.password")}</th>
                  <th>{t("admin.role")}</th>
                  <th>{t("admin.createdAt")}</th>
                  <th style={{ textAlign: "center" }}>{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {searchTerm && filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td className="text-muted">••••••••</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                      </td>
                      <td className="text-muted text-small">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="flex-center gap-1">
                          {u.role !== "admin" ? (
                            <>
                              <button
                                onClick={() => handleRoleChange(u.id, "admin")}
                                className="btn-small btn-promote"
                              >
                                {t("admin.promote")}
                              </button>
                              <button
                                onClick={() => openDeleteModal(u.id)}
                                className="btn-small btn-danger"
                              >
                                {t("admin.delete")}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u.id, "user")}
                              className="btn-small btn-demote"
                            >
                              {t("admin.demote")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted"
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      {searchTerm
                        ? `${t("admin.noUserFound")} "${searchTerm}"`
                        : t("admin.searchHint")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        <p
          className="text-muted text-small mt-1"
          style={{ textAlign: "center" }}
        >
          {users.length} {t("admin.usersCount")}
        </p>
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="btn btn-secondary"
              >
                {t("modal.cancel")}
              </button>
              <button
                onClick={handleDelete}
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
