/**
 * Componente raíz de la aplicación.
 */
import { useEffect, useState } from 'react';
import { LoginPage, RegisterPage } from './features/auth';
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
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-[0.16em]">
              {authenticatedUser.role === 'SUPERVISOR' ? 'PESTAÑA SUPERVISOR' : 'PESTAÑA STANDARD'}
            </h1>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Bienvenido, <span className="font-semibold text-slate-900">{authenticatedUser.username}</span>
            </p>
            <p>Correo: {authenticatedUser.email}</p>
            <p>Unidad: {authenticatedUser.unit}</p>
            <p>Rol: {authenticatedUser.role}</p>
          </div>
        </section>
      </main>
    );
  }

  /** Rama para la pantalla de registro. */
  if (authView === 'register') {
    return <RegisterPage onGoToLogin={() => setAuthView('login')} />;
  }

  /** Rama por defecto: pantalla de login. */
  return <LoginPage onGoToRegister={() => setAuthView('register')} onLoginSuccess={setAuthenticatedUser} />;
}

export default App;
