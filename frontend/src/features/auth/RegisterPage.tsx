/**
 * - Orquesta el comportamiento asíncrono específico del registro.
 * - Reutiliza la misma carcasa visual auth mediante `AuthLayout`.
 * - Mantiene la lógica de campos dentro de `RegisterForm`.
 */
import { useState } from 'react';
import { RegisterForm } from '../../components/molecules';
import { AuthLayout } from '../../components/organisms';
import type { RegisterFormData } from '../../types';
import { registerRequest, requestSupervisorToken } from '../../services';

/** Contrato de navegación a nivel de página. */
interface RegisterPageProps {
  /** Callback para volver al login por acción del usuario o tras registro. */
  onGoToLogin?: () => void;
}

export const RegisterPage = ({ onGoToLogin }: RegisterPageProps) => {
  /** Indica solicitud de registro en curso. */
  const [isLoading, setIsLoading] = useState(false);
  /** Error legible de cliente/servidor para la acción de registro. */
  const [error, setError] = useState<string | null>(null);

  /**
   * Maneja el envío del formulario de registro.
   */
  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerRequest(data);
      alert('Registro exitoso. Ahora inicia sesión con tus credenciales.');
      onGoToLogin?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrarte. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSupervisorToken = (data: {
    name: string;
    email: string;
    organizationalUnit: string;
  }) => requestSupervisorToken(data);

  return (
    <AuthLayout title="REGISTRO">
      <RegisterForm
        onSubmit={handleRegister}
        isLoading={isLoading}
        error={error || undefined}
        onGoToLogin={onGoToLogin}
        onRequestSupervisorToken={handleRequestSupervisorToken}
      />
    </AuthLayout>
  );
};
