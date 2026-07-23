/**
 * Ponto de entrada principal da aplicação MindSpace.
 * Renderiza o componente App no elemento root do DOM.
 * @module main
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "../css/index.css";
import "../css/App.css";
import "../css/pages.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
