import { useEffect, useState } from "react";
import { useLanguage } from "../lang/LanguageContext";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logotipo.png";
import { API_URL } from "../utils/api";

/**
 * Página inicial pública com logo, frase aleatória e botões.
 * @returns Componente React da página Home
 */
export const Home = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<string>("");

  useEffect(() => {
    // Carrega frase aleatória ao montar o componente
    const fetchQuote = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/quotes/random?lang=${t("quote.lang") || "pt"}`,
        );
        if (res.ok) {
          const data = await res.json();
          setQuote(data.texto);
        }
      } catch (err) {
        console.error("Failed to fetch quote");
      }
    };
    fetchQuote();
  }, [t]);

  return (
    <div className="glass-card home-card">
      <img src={logo} alt="MindSpace Logo" className="mb-1 home-logo" />

      <h1 className="text-muted mb-1 home-subtitle">
        {t("home.subtitle") || "O teu espaço de bem-estar mental"}
      </h1>

      {quote && <p className="text-muted mb-1 home-quote">"{quote}"</p>}

      <div className="flex-col gap-1" style={{ width: "100%" }}>
        <button onClick={() => navigate("/login")} className="btn">
          {t("nav.login")}
        </button>
      </div>
    </div>
  );
};
