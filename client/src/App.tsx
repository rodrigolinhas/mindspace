import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LanguageProvider } from "./lang/LanguageContext";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Quote } from "./pages/Quote";
import { Stats } from "./pages/Stats";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { Secret } from "./pages/Secret";
import { Admin } from "./pages/Admin";
import { Background } from "./components/Background";
import { LanguageToggle } from "./components/LanguageToggle";
import "../css/App.css";

/**
 * Componente de rota protegida que redireciona para login se não autenticado.
 */
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

/**
 * Componente de rotas da aplicação.
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quote"
        element={
          <ProtectedRoute>
            <Quote />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <Stats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/secret"
        element={
          <ProtectedRoute>
            <Secret />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/**
 * Componente principal da aplicação MindSpace.
 */
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Background />
          <LanguageToggle />
          <div className="app-wrapper">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
