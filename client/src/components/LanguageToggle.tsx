/**
 * Componente de alternância de idioma.
 * Permite alternar entre Português e Inglês na aplicação.
 * @module LanguageToggle
 */
import { useLanguage } from "../lang/LanguageContext";
import { useLocation } from "react-router-dom";
import { getEmojiUrl } from "../utils/emojis";
import "../../css/LanguageToggle.css";

/**
 * Renderiza um botão para alternar entre idiomas PT/EN.
 * Escondido na página secreta.
 * @returns Botão de alternância de idioma ou null
 */
export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();

  // Esconder na página secreta (tem botão próprio)
  if (location.pathname === "/secret") {
    return null;
  }

  return (
    <button
      className="language-toggle"
      onClick={toggleLanguage}
      aria-label={
        language === "pt" ? "Switch to English" : "Mudar para Português"
      }
      title={language === "pt" ? "Switch to English" : "Mudar para Português"}
    >
      <img
        src={getEmojiUrl(language)}
        alt={language === "pt" ? "Português" : "English"}
        style={{
          width: "20px",
          height: "20px",
          verticalAlign: "middle",
          marginRight: "4px",
        }}
      />
      {language === "pt" ? "PT" : "EN"}
    </button>
  );
};
