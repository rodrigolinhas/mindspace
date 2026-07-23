/**
 * Interface que representa um utilizador do sistema.
 * @property id - Identificador único do utilizador
 * @property username - Nome de utilizador único
 * @property email - Email do utilizador
 * @property password - Password encriptada do utilizador
 * @property created_at - Data de criação da conta (opcional)
 * @property role - Papel do utilizador no sistema ('admin' ou 'user')
 */
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at?: string;
  role: "admin" | "user";
}
