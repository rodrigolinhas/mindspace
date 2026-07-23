import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../lang/LanguageContext";
import { useNavigate } from "react-router-dom";
import type { Entry } from "../../../shared/types";
import { EMOJI_CODES, SENTIMENT_KEYS, renderEmoji } from "../utils/emojis";
import { API_URL } from "../utils/api";

/**
 * Página de histórico de sentimentos do utilizador.
 * @returns Componente React com lista de entradas
 */
export const History = () => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  /** Estado para modal de confirmação de eliminar */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  /**
   * Carrega as entradas ao montar o componente.
   */
  useEffect(() => {
    fetchEntries();
  }, [token]);

  /**
   * Busca todas as entradas do utilizador.
   */
  const fetchEntries = async () => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Backend já retorna apenas entries do user, ordenadas por data desc
        setEntries(data);
      } else {
        setError(t("history.errorLoading") || "Erro ao carregar histórico");
      }
    } catch (err) {
      console.error(err);
      setError(t("history.errorConnection") || "Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre o modal de confirmação para eliminar entrada.
   * @param id - Identificador da entrada
   */
  const openDeleteModal = (id: number) => {
    setEntryToDelete(id);
    setShowDeleteModal(true);
  };

  /**
   * Elimina a entrada após confirmação no modal.
   */
  const handleDelete = async () => {
    if (!entryToDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/entries/${entryToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEntries(entries.filter((e) => e.id !== entryToDelete));
      } else {
        setError(t("history.errorDelete") || "Erro ao eliminar entrada");
      }
    } catch (err) {
      console.error(err);
      setError(t("history.errorConnection") || "Erro de conexão");
    }
    setShowDeleteModal(false);
    setEntryToDelete(null);
  };

  return (
    <>
      <div className="glass-card history-container">
        <div className="history-header">
          <h1 className="title history-title">
            {t("history.title") || "Histórico"}
          </h1>
          <button onClick={() => navigate("/profile")} className="btn btn-back">
            {t("nav.back") || "Voltar"}
          </button>
        </div>

        {error && <div className="error-msg mb-1">{error}</div>}

        <div className="history-scroll">
          {loading ? (
            <p className="admin-loading">
              {t("history.loading") || "A carregar..."}
            </p>
          ) : entries.length > 0 ? (
            <div className="history-list">
              {entries.map((entry) => (
                <div key={entry.id} className="history-entry">
                  <div className="history-entry-info">
                    <div className="history-emoji-circle">
                      {EMOJI_CODES[entry.sentimento]
                        ? renderEmoji(entry.sentimento, "30px")
                        : renderEmoji("1f4dd", "30px")}
                    </div>
                    <div>
                      <div className="history-entry-text">
                        {t(
                          SENTIMENT_KEYS[entry.sentimento] || entry.sentimento,
                        )}
                      </div>
                      <div className="history-entry-date">
                        {new Date(entry.data).toLocaleDateString()} às{" "}
                        {new Date(entry.data).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openDeleteModal(entry.id)}
                    title={t("history.deleteButton") || "Eliminar"}
                    className="btn-delete-round"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <p className="history-empty-emoji">
                {renderEmoji("1f4ed", "60px")}
              </p>
              <p>{t("history.noEntries") || "Sem entradas registadas"}</p>
            </div>
          )}
        </div>

        {entries.length > 0 && (
          <p className="history-count">
            {entries.length}{" "}
            {t("history.entriesCount") || "entrada(s) registada(s)"}
          </p>
        )}
      </div>

      {/* Modal de Confirmação para Eliminar */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">{t("modal.warning") || "Atenção"}</h2>
            <p className="modal-text">
              {t("history.confirmDelete") ||
                "Tem a certeza que deseja eliminar esta entrada?"}
            </p>
            <div className="modal-buttons">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEntryToDelete(null);
                }}
                className="btn btn-secondary"
              >
                {t("modal.cancel") || "Cancelar"}
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger btn-action"
              >
                {t("modal.continue") || "Continuar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
