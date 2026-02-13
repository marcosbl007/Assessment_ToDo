/**
 * - Orquesta el comportamiento específico del login (loading/error/envío).
 * - Delega la estructura visual a `AuthLayout` y los campos a `LoginForm`.
 */
import { useState } from 'react';
import { LoginForm } from '../../components/molecules';
import { AuthLayout } from '../../components/organisms';
import type { LoginFormData } from '../../types';

/** Contrato de navegación a nivel de página. */
interface LoginPageProps {
  /** Callback para cambiar a la vista de registro. */
  onGoToRegister?: () => void;
}

export const LoginPage = ({ onGoToRegister }: LoginPageProps) => {
  /** Indica solicitud pendiente de auth y deshabilita interacciones de envío. */
  const [isLoading, setIsLoading] = useState(false);
  /** Error legible para usuario cuando falla el inicio de sesión. */
  const [error, setError] = useState<string | null>(null);

  /**
   * Maneja el envío del formulario de login.
   */
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Reemplazar con servicio real de autenticación en backend.
      console.log('Login attempt:', data);
      
      // Simulación de latencia de red.
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Reemplazar alert por navegación al dashboard tras autenticación.
      alert('Login exitoso! (implementar navegación)');
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="INICIO">
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error || undefined}
        onGoToRegister={onGoToRegister}
      />
    </AuthLayout>
  );
};
