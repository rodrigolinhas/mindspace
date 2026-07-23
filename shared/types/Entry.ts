/**
 * Interface que representa uma entrada de sentimento do utilizador.
 * @property id - Identificador único da entrada
 * @property user_id - Identificador do utilizador que criou a entrada
 * @property sentimento - Sentimento registado pelo utilizador
 * @property data - Data de criação da entrada (formato ISO)
 */
export interface Entry {
  id: number;
  user_id: number;
  sentimento: string;
  data: string;
}
