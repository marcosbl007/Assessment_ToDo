/**
 * - Encapsula el renderizado de campos y el comportamiento de envío.
 * - Evita mezclar detalles de inputs dentro de la página.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { LoginFormData } from '../../types';
import { Input, Button } from '../atoms';

interface LoginFormProps {
  /** Callback de envío delegado al orquestador de la página. */
  onSubmit: (data: LoginFormData) => void;
  /** Deshabilita el envío y muestra estado de carga en el botón. */
  isLoading?: boolean;
  /** Error externo, normalmente proveniente de la capa auth/API. */
  error?: string;
  /** Acción opcional para cambiar a la pantalla de registro. */
  onGoToRegister?: () => void;
}

export const LoginForm = ({ onSubmit, isLoading = false, error, onGoToRegister }: LoginFormProps) => {
  /** Estado controlado de credenciales del formulario. */
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });

  /**
   * Previene la navegación nativa del form y emite el payload tipado al padre.
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded max-w-[200px] mx-auto">
          {error}
        </div>
      )}

      <div className="max-w-[200px] mx-auto">
        <Input
          label="Usuario"
          type="text"
          placeholder="Usuario"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          autoComplete="username"
        />
      </div>

      <div className="max-w-[200px] mx-auto">
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          autoComplete="current-password"
        />
      </div>

      <div className="pt-4 max-w-[120px] mx-auto translate-y-3">
        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          isLoading={isLoading}
          className="text-lg font-bold tracking-wider"
        >
          INGRESAR
        </Button>
      </div>

      <div className="max-w-[200px] mx-auto text-center translate-y-2.5">
        <p className="text-[var(--blanco)]/65 text-sm">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="text-[var(--dorado)] font-semibold hover:text-[var(--dorado)]/80 transition-colors"
          >
            Regístrate
          </button>
        </p>
      </div>
    </form>
  );
};
