# 🧘 MindSpace - Projeto Final DAW 2024/2025

Uma aplicação web RESTful que promove o bem-estar mental através de frases inspiradoras e auto-análise emocional.

## 🎯 Objetivo

O **MindSpace** combina **motivação diária** e **auto-reflexão emocional**. Os utilizadores podem:
- Ler frases inspiradoras em Português ou Inglês
- Registar o seu estado emocional diário
- Visualizar a evolução dos sentimentos ao longo do tempo
- Gerir a sua conta e histórico

## ✨ Funcionalidades

### Funcionalidades Base (50%)
- ✅ **REST API completa** com endpoints para users, entries e quotes
- ✅ **Base de dados SQLite** com tabelas users e entries
- ✅ **Cliente web** com 6 páginas HTML + TypeScript
- ✅ **CRUD completo** para utilizadores e sentimentos

### Funcionalidades Extra (50%)
1. ✨ **Gradiente Animado de Fundo** - Fundo dinâmico e relaxante em todas as páginas
2. 🌍 **Suporte Multilingue (PT/EN)** - Sistema i18n com toggle de idioma
3. 📊 **Análise Visual de Sentimentos** - Gráficos dinâmicos com Chart.js

## 🛠️ Tecnologias

**Backend:**
- Node.js + Express
- TypeScript
- SQLite3

**Frontend:**
- HTML5 + CSS3
- TypeScript
- Chart.js
- Sistema i18n customizado

## 💾 Instalação

```bash
# Clonar o repositório
git clone <url>
cd PROJECT_FINAL

# Instalar dependências
npm install

# Compilar TypeScript
npm run build
```

## 🚀 Execução

### Modo Desenvolvimento
```bash
# Iniciar servidor com hot-reload
npm run dev
```

### Modo Produção
```bash
# Compilar
npm run build

# Iniciar servidor
npm start
```

O servidor estará disponível em **http://localhost:3000**

## 📚 API Endpoints

### Users
- `POST /api/users` - Criar conta
- `POST /api/users/login` - Login
- `GET /api/users/:id` - Obter utilizador
- `PUT /api/users/:id` - Atualizar utilizador
- `DELETE /api/users/:id` - Remover conta

### Entries (Sentimentos)
- `POST /api/entries` - Registar sentimento
- `GET /api/entries?user_id=X` - Listar sentimentos do utilizador
- `DELETE /api/entries/:id` - Remover entrada

### Quotes
- `GET /api/quotes/random?lang=pt` - Frase aleatória (pt ou en)
- `GET /api/quotes?lang=pt` - Todas as frases

## 📱 Páginas

1. **index.html** - Página inicial com frase do dia
2. **login.html** - Autenticação e registo
3. **dashboard.html** - Painel principal com botões de sentimentos
4. **stats.html** - Gráfico circular de equilíbrio emocional
5. **history.html** - Tabela com histórico de sentimentos
6. **settings.html** - Gestão de conta

## 📝 Estrutura do Projeto

```
mindspace/
├── server/
│   ├── src/
│   │   ├── server.ts
│   │   ├── db.ts
│   │   ├── routes/
│   │   │   ├── users.ts
│   │   │   ├── entries.ts
│   │   │   └── quotes.ts
│   │   └── models/
│   │       ├── User.ts
│   │       ├── Entry.ts
│   │       └── Quote.ts
│   └── data/
│       ├── quotes-pt.txt
│       └── quotes-eng.txt
├── client/
│   ├── pages/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── stats.html
│   │   ├── history.html
│   │   └── settings.html
│   ├── css/
│   │   └── style.css
│   └── src/
│       ├── api.ts
│       ├── index.ts
│       ├── login.ts
│       ├── dashboard.ts
│       ├── charts.ts
│       ├── history.ts
│       ├── settings.ts
│       ├── background.ts
│       ├── lang.ts
│       └── lang/
│           ├── pt.json
│           └── en.json
├── tsconfig.base.json
├── package.json
└── README.md
```

## 🎨 Design
O fundo de todas as paginas usa o seguinte tema: https://github.com/baunov/gradients-bg

## 💡 Notas

- A base de dados SQLite é criada automaticamente em `server/data/mindspace.db`
- As frases são carregadas de ficheiros locais (quotes-pt.txt e quotes-eng.txt)
- O idioma é guardado em localStorage para persistência
- Todos os scripts TypeScript estão compilados para `dist/`

---

**Autor:** Rodrigo  
**Curso:** Desenvolvimento de Aplicações Web (DAW)  
**Ano Letivo:** 2025/2026
