/**
 * Componente raíz de la aplicación.
 */
import { useEffect, useState } from 'react';
import { LoginPage, RegisterPage } from './features/auth';
import { StandardDashboardPage } from './features/standard';
import { SupervisorDashboardPage } from './features/supervisor';
import type { User } from './types';
import { clearSession, getSessionToken, meRequest } from './services';

/** Tipos de vista disponibles en el módulo de autenticación. */
type AuthView = 'login' | 'register';

function App() {
  /** Controla la navegación entre las vistas de login y registro. */
  const [authView, setAuthView] = useState<AuthView>('login');
  /** Usuario autenticado en memoria para decidir la pestaña destino por rol. */
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  /** Evita parpadeos mientras se valida una sesión persistida. */
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(true);

  useEffect(() => {
    const token = getSessionToken();

    if (!token) {
      setIsBootstrappingSession(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const { user } = await meRequest();
        setAuthenticatedUser(user);
      } catch {
        clearSession();
        setAuthenticatedUser(null);
      } finally {
        setIsBootstrappingSession(false);
      }
    };

    void restoreSession();
  }, []);

  const handleLogout = () => {
    clearSession();
    setAuthenticatedUser(null);
    setAuthView('login');
  };

  if (isBootstrappingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <p className="text-sm font-medium">Validando sesión...</p>
      </main>
    );
  }

  if (authenticatedUser) {
    if (authenticatedUser.role === 'SUPERVISOR') {
      return <SupervisorDashboardPage user={authenticatedUser} onLogout={handleLogout} />;
    }

    return <StandardDashboardPage user={authenticatedUser} onLogout={handleLogout} />;
  }

  /** Rama para la pantalla de registro. */
  if (authView === 'register') {
    return <RegisterPage onGoToLogin={() => setAuthView('login')} />;
  }

  /** Rama por defecto: pantalla de login. */
  return <LoginPage onGoToRegister={() => setAuthView('register')} onLoginSuccess={setAuthenticatedUser} />;
}

export default App;
