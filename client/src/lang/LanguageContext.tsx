/**
 * Contexto de idioma para internacionalização da aplicação MindSpace.
 * Gere a alternância entre Português e Inglês com persistência em localStorage.
 * @module LanguageContext
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import ptTranslations from "./pt.json";
import enTranslations from "./en.json";

type Language = "pt" | "en";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, unknown>> = {
  pt: ptTranslations,
  en: enTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

/**
 * Obtém um valor aninhado de um objeto usando notação de ponto.
 * @param obj - Objeto de traduções
 * @param path - Caminho para a tradução (ex: "nav.home")
 * @returns Valor traduzido ou a chave se não encontrado
 */
const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if translation not found
    }
  }

  return typeof result === "string" ? result : path;
};

/**
 * Provider de idioma que envolve a aplicação.
 * Gere o estado de idioma usando localStorage para persistência.
 * @param children - Componentes filhos a envolver
 * @returns Provider com contexto de idioma
 */
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("mindspace-lang");
    return saved === "en" || saved === "pt" ? saved : "pt";
  });

  useEffect(() => {
    localStorage.setItem("mindspace-lang", language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "pt" ? "en" : "pt"));
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations[language], key);
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook para aceder ao contexto de idioma.
 * @returns Contexto de idioma com language, toggleLanguage e t
 * @throws Error se usado fora de um LanguageProvider
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
