/**
 * Página de estatísticas e registo de sentimentos.
 * Dashboard principal do utilizador com gráfico, registo e entradas recentes.
 * @module Stats
 */
import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../lang/LanguageContext";
import { useNavigate } from "react-router-dom";
import type { Entry } from "../../../shared/types";
import {
  EMOJI_CODES,
  SENTIMENT_KEYS,
  SENTIMENTOS,
  renderEmoji,
} from "../utils/emojis";
import { API_URL } from "../utils/api";

ChartJS.register(ArcElement, Tooltip, Legend);

/* ========== SUB-COMPONENTES ========== */

/**
 * Secção do gráfico de sentimentos.
 * @param entries - Lista de entradas do utilizador
 * @param loading - Estado de carregamento
 * @param t - Função de tradução
 */
const ChartSection = ({
  entries,
  loading,
  t,
}: {
  entries: Entry[];
  loading: boolean;
  t: (key: string) => string;
}) => {
  const getSentimentCounts = () => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      counts[e.sentimento] = (counts[e.sentimento] || 0) + 1;
    });
    return counts;
  };

  const counts = getSentimentCounts();
  const translatedLabels = Object.keys(counts).map((s) =>
    t(SENTIMENT_KEYS[s] || s),
  );

  const chartData = {
    labels: translatedLabels,
    datasets: [
      {
        data: Object.values(counts),
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
          "rgba(46, 204, 113, 0.8)",
          "rgba(155, 89, 182, 0.8)",
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="chart-section">
      <h3 className="mb-1">{t("dashboard.chart") || "Os Meus Sentimentos"}</h3>
      {loading ? (
        <p>{t("stats.loading") || "A carregar..."}</p>
      ) : entries.length > 0 ? (
        <div className="chart-container">
          <Doughnut
            data={chartData}
            options={{
              cutout: "60%",
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: "white", padding: 15, boxWidth: 12 },
                },
              },
            }}
          />
        </div>
      ) : (
        <p className="text-muted">{t("stats.noData") || "Sem dados"}</p>
      )}
    </div>
  );
};

/**
 * Secção de adicionar novo sentimento.
 * @param selectedSentiment - Sentimento atualmente selecionado
 * @param setSelectedSentiment - Setter para sentimento
 * @param onAdd - Callback para adicionar entrada
 * @param adding - Estado de a adicionar
 * @param t - Função de tradução
 */
const AddEntrySection = ({
  selectedSentiment,
  setSelectedSentiment,
  onAdd,
  adding,
  t,
}: {
  selectedSentiment: string;
  setSelectedSentiment: (s: string) => void;
  onAdd: () => void;
  adding: boolean;
  t: (key: string) => string;
}) => (
  <div className="add-entry-section">
    <div className="add-entry-box">
      <h3 className="mb-1">
        {t("dashboard.addSentiment") || "Como te sentes hoje?"}
      </h3>
      <div className="sentiment-grid">
        {SENTIMENTOS.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSentiment(s)}
            className={`sentiment-btn ${selectedSentiment === s ? "selected" : ""}`}
          >
            {EMOJI_CODES[s]
              ? renderEmoji(s, "36px")
              : renderEmoji("2753", "36px")}
            <span>{t(SENTIMENT_KEYS[s] || s)}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="btn mt-1"
        disabled={!selectedSentiment || adding}
      >
        {adding ? "..." : t("dashboard.add") || "Registar Sentimento"}
      </button>
    </div>
  </div>
);

/**
 * Secção de entradas recentes.
 * @param entries - Lista de entradas a mostrar
 * @param t - Função de tradução
 */
const RecentEntriesSection = ({
  entries,
  t,
}: {
  entries: Entry[];
  t: (key: string) => string;
}) => (
  <div className="entries-section">
    <h3>{t("dashboard.recentEntries") || "Últimas Entradas"}</h3>
    {entries.length > 0 ? (
      <div className="recent-entries-grid">
        {entries.map((entry) => (
          <div key={entry.id} className="entry-card">
            <div className="flex-center mb-1">
              {EMOJI_CODES[entry.sentimento]
                ? renderEmoji(entry.sentimento, "40px")
                : renderEmoji("1f610", "40px")}
            </div>
            <div className="stats-entry-label">
              {t(SENTIMENT_KEYS[entry.sentimento] || entry.sentimento)}
            </div>
            <div className="text-muted text-small mt-1">
              {new Date(entry.data).toLocaleDateString()} <br />
              {new Date(entry.data).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-muted stats-entry-date">
        {t("history.noEntries") || "Ainda não tens registos."}
      </p>
    )}
  </div>
);

/* ========== COMPONENTE PRINCIPAL ========== */

/**
 * Componente Stats - Dashboard de sentimentos do utilizador.
 * @returns Componente React
 */
export const Stats = () => {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSentiment, setSelectedSentiment] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEntries();
  }, [token]);

  /**
   * Carrega todas as entradas do utilizador autenticado.
   */
  const fetchEntries = async () => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      } else {
        setError(t("stats.errorLoading") || "Erro ao carregar dados");
      }
    } catch (err) {
      console.error(err);
      setError(t("stats.errorConnection") || "Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Adiciona uma nova entrada de sentimento.
   */
  const handleAddEntry = async () => {
    if (!selectedSentiment || !user?.id) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sentimento: selectedSentiment,
        }),
      });
      if (res.ok) {
        setSelectedSentiment("");
        fetchEntries();
      } else {
        setError(t("stats.errorAdding") || "Erro ao adicionar sentimento");
      }
    } catch (err) {
      console.error("Failed to add entry");
      setError(t("stats.errorConnection") || "Erro de conexão");
    } finally {
      setAdding(false);
    }
  };

  const last3Entries = entries.slice(0, 3);

  return (
    <div className="glass-card stats-container">
      <h1 className="title page-title mb-1">
        {t("dashboard.title") || "Dashboard"}
      </h1>

      {error && <div className="error-msg mb-1">{error}</div>}

      <div className="stats-layout">
        <ChartSection entries={entries} loading={loading} t={t} />
        <AddEntrySection
          selectedSentiment={selectedSentiment}
          setSelectedSentiment={setSelectedSentiment}
          onAdd={handleAddEntry}
          adding={adding}
          t={t}
        />
      </div>

      <RecentEntriesSection entries={last3Entries} t={t} />

      <div className="navigation-buttons">
        <button onClick={() => navigate("/history")} className="btn btn-action">
          {t("dashboard.viewHistory") || "Ver Histórico Completo"}
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="btn btn-secondary btn-action"
        >
          {t("nav.back") || "Voltar"}
        </button>
      </div>
    </div>
  );
};
