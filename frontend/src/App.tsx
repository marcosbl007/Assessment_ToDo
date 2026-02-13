/**
 * Componente raíz de la aplicación.
 */
import { useState } from 'react';
import { LoginPage, RegisterPage } from './features/auth';

/** Tipos de vista disponibles en el módulo de autenticación. */
type AuthView = 'login' | 'register';

function App() {
  /** Controla la navegación entre las vistas de login y registro. */
  const [authView, setAuthView] = useState<AuthView>('login');

  /** Rama para la pantalla de registro. */
  if (authView === 'register') {
    return <RegisterPage onGoToLogin={() => setAuthView('login')} />;
  }

  /** Rama por defecto: pantalla de login. */
  return <LoginPage onGoToRegister={() => setAuthView('register')} />;
}

export default App;
