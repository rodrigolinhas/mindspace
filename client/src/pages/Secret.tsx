import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import secretBg from "../../assets/secret.jpg";
import { renderEmoji } from "../utils/emojis";

/**
 * Página secreta acessível apenas para o utilizador "RuiPaulo".
 * Inclui imagem de fundo, música de fundo e popup com botão de fechar.
 * @returns Componente React da página secreta
 */
export const Secret = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showPopup, setShowPopup] = useState(true);

  /**
   * Verifica se o utilizador é "RuiPaulo", redireciona caso contrário.
   */
  useEffect(() => {
    if (user?.username !== "RuiPaulo") {
      navigate("/profile");
      return;
    }
  }, [user, navigate]);

  /**
   * Inicia a música.
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {
        console.log("Autoplay blocked by browser");
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="secret-bg" style={{ backgroundImage: `url(${secretBg})` }}>
      {/* Background music */}
      <audio ref={audioRef} loop>
        <source src="/assets/secret.mp3" type="audio/mpeg" />
      </audio>

      {/* Botão para reabrir popup (só aparece quando popup está fechado) */}
      {!showPopup && (
        <button onClick={() => setShowPopup(true)} className="secret-popup-btn">
          {renderEmoji("shushing", "1.2rem")} Mostrar Mensagem
        </button>
      )}

      {/* Popup Modal */}
      {showPopup && (
        <div className="glass-card secret-card">
          {/* Botão X para fechar */}
          <button
            onClick={() => setShowPopup(false)}
            className="btn-close"
            title="Fechar"
          >
            ✕
          </button>

          <h1 className="secret-title">
            {renderEmoji("shushing", "48px")} Página Secreta
          </h1>
          <p className="secret-message">
            Olá Professor! Por favor dê-me 20 {renderEmoji("pleading", "28px")}
            {renderEmoji("pray", "28px")}
          </p>
          <p className="secret-submessage">
            Desfruta da música e do ambiente especial!{" "}
            {renderEmoji("music", "24px")}
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="btn secret-btn"
          >
            Voltar ao Perfil
          </button>
        </div>
      )}
    </div>
  );
};
