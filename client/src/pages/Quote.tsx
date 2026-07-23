import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../lang/LanguageContext";
import { useNavigate } from "react-router-dom";
import type { Quote as QuoteType } from "../../../shared/types";
import { API_URL } from "../utils/api";

/**
 * Página de frase motivacional do dia.
 * @returns Componente React com frase aleatória
 */
export const Quote = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteType | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Carrega uma frase aleatória do servidor.
   */
  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quotes/random?lang=${language}`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [language]);

  /**
   * Carrega uma frase ao montar ou mudar idioma.
   */
  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return (
    <div className="glass-card quote-container">
      <h1 className="title quote-page-title">
        {t("quotes.title") || "Frase do Dia"}
      </h1>

      <div className="quote-content-box">
        {loading ? (
          <p className="text-muted">{t("home.loading") || "A carregar..."}</p>
        ) : quote ? (
          <>
            <p className="quote-text">"{quote.texto}"</p>
            <p className="quote-author">— {quote.autor}</p>
          </>
        ) : (
          <p className="text-muted">
            {t("quote.error") || "Erro ao carregar frase"}
          </p>
        )}
      </div>

      <div className="quote-buttons">
        <button onClick={fetchQuote} className="btn btn-action">
          {t("quotes.refresh") || "Nova Frase"}
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
