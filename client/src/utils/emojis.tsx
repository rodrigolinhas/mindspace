import React from "react";

/**
 * Utilitários para renderização de emojis com Twemoji.
 * Centraliza toda a lógica de emojis para evitar duplicação.
 */

/** Mapeamento de sentimentos para códigos Hex do Twemoji */
export const SENTIMENT_CODES: Record<string, string> = {
  Feliz: "1f60a",
  Triste: "1f622",
  Ansioso: "1f630",
  Calmo: "1f60c",
  Irritado: "1f620",
  Esperançoso: "1f91e",
  Motivado: "1f4aa",
  Cansado: "1f634",
  Nervoso: "1f62c",
  Pensativo: "1f914",
};

/** Mapeamento de outros emojis utilitários para códigos Hex do Twemoji */
export const UTILITY_CODES: Record<string, string> = {
  warning: "26a0",
  shushing: "1f92b",
  pleading: "1f97a",
  pray: "1f64f",
  music: "1f3b6",
  pt: "1f1f5-1f1f9",
  en: "1f1ec-1f1e7",
};

/** Mapeamento completo de todos os emojis (sentimentos + utilitários) */
export const EMOJI_CODES: Record<string, string> = {
  ...SENTIMENT_CODES,
  ...UTILITY_CODES,
};

/** Mapeamento de sentimentos para chaves de tradução */
export const SENTIMENT_KEYS: Record<string, string> = {
  Feliz: "feelings.happy",
  Triste: "feelings.sad",
  Ansioso: "feelings.anxious",
  Calmo: "feelings.calm",
  Irritado: "feelings.angry",
  Esperançoso: "feelings.hopeful",
  Motivado: "feelings.motivated",
  Cansado: "feelings.tired",
  Nervoso: "feelings.nervous",
  Pensativo: "feelings.thoughtful",
};

/** Lista de todos os sentimentos disponíveis (apenas sentimentos, não utilitários) */
export const SENTIMENTOS = Object.keys(SENTIMENT_CODES);

/**
 * Obtém a URL da imagem Twemoji para um sentimento ou código.
 * @param sentimentOrCode - Nome do sentimento ou código hex
 * @returns URL da imagem Twemoji
 */
export const getEmojiUrl = (sentimentOrCode: string): string => {
  // Se é um nome de sentimento, obtém o código
  if (EMOJI_CODES[sentimentOrCode]) {
    return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${EMOJI_CODES[sentimentOrCode]}.png`;
  }
  // Se já é um código hex
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${sentimentOrCode}.png`;
};

/**
 * Renderiza um emoji como elemento JSX.
 * @param sentimentOrCode - Nome do sentimento ou código hex
 * @param size - Tamanho do emoji (default: 36px)
 * @param margin - Margem do emoji (default: 0)
 * @returns Elemento img JSX
 */
export const renderEmoji = (
  sentimentOrCode: string,
  size: string = "36px",
  margin: string = "0",
): React.ReactElement => {
  const imgStyle: React.CSSProperties = {
    width: size,
    height: size,
    verticalAlign: "middle",
    margin: margin,
  };

  return (
    <img
      src={getEmojiUrl(sentimentOrCode)}
      alt={sentimentOrCode}
      style={imgStyle}
    />
  );
};
