/**
 * - Orquesta el comportamiento asíncrono específico del registro.
 * - Reutiliza la misma carcasa visual auth mediante `AuthLayout`.
 * - Mantiene la lógica de campos dentro de `RegisterForm`.
 */
import { useState } from 'react';
import { RegisterForm } from '../../components/molecules';
import { AuthLayout } from '../../components/organisms';
import type { RegisterFormData } from '../../types';

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
      console.log('Register attempt:', data);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert('Registro exitoso! (implementar integración backend)');
      onGoToLogin?.();
    } catch {
      setError('Error al registrarte. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="REGISTRO">
      <RegisterForm
        onSubmit={handleRegister}
        isLoading={isLoading}
        error={error || undefined}
        onGoToLogin={onGoToLogin}
      />
    </AuthLayout>
  );
};
