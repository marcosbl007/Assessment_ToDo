/**
 * - Encapsula todos los campos de registro y validaciones locales.
 * - Reutiliza átomos sin mezclar lógica específica de registro en la página.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { RegisterFormData, SupervisorTokenRequestResult } from '../../types';
import { Input, Button } from '../atoms';

interface RegisterFormProps {
  /** Callback de envío delegado al orquestador de la página. */
  onSubmit: (data: RegisterFormData) => void;
  /** Estado de carga para evitar doble envío. */
  isLoading?: boolean;
  /** Error externo, normalmente de respuesta API. */
  error?: string;
  /** Acción opcional para volver a la pantalla de login. */
  onGoToLogin?: () => void;
  /** Solicita token de registro cuando el rol seleccionado es supervisor. */
  onRequestSupervisorToken?: (data: {
    name: string;
    email: string;
    organizationalUnit: string;
  }) => Promise<SupervisorTokenRequestResult>;
}

/** Unidades organizacionales predefinidas para el alcance actual (MVP). */
const units = ['Recursos Humanos (RRHH)', 'Finanzas', 'Business Intelligence (BI)'];
/** Roles de usuario predefinidos, alineados al enunciado. */
const roles = ['Usuario estándar', 'Usuario supervisor'];

export const RegisterForm = ({
  onSubmit,
  isLoading = false,
  error,
  onGoToLogin,
  onRequestSupervisorToken,
}: RegisterFormProps) => {
  /** Estado controlado para todos los campos del formulario. */
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationalUnit: '',
    role: '',
    supervisorToken: '',
  });
  /** Mensaje de validación local (previo al envío). */
  const [localError, setLocalError] = useState<string | null>(null);
  /** Mensaje informativo tras solicitar token de supervisor. */
  const [supervisorTokenMessage, setSupervisorTokenMessage] = useState<string | null>(null);
  /** URL a visitar para obtener el token en Ethereal. */
  const [supervisorTokenUrl, setSupervisorTokenUrl] = useState<string | null>(null);
  /** Estado de carga para evitar dobles clics al solicitar token. */
  const [isRequestingToken, setIsRequestingToken] = useState(false);

  const isSupervisorRole = formData.role === 'Usuario supervisor';

  /**
   * Ejecuta validaciones básicas antes de delegar el payload al padre.
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }

    if (!formData.organizationalUnit || !formData.role) {
      setLocalError('Selecciona unidad organizacional y rol.');
      return;
    }

    if (isSupervisorRole && !formData.supervisorToken?.trim()) {
      setLocalError('Para rol supervisor debes ingresar el token de autorización.');
      return;
    }

    onSubmit(formData);
  };

  const handleRequestSupervisorToken = async () => {
    setLocalError(null);
    setSupervisorTokenMessage(null);
    setSupervisorTokenUrl(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.organizationalUnit.trim()) {
      setLocalError('Completa nombre, email y unidad antes de solicitar token de supervisor.');
      return;
    }

    if (!onRequestSupervisorToken) {
      setLocalError('No está disponible la solicitud de token en este entorno.');
      return;
    }

    setIsRequestingToken(true);

    try {
      const result = await onRequestSupervisorToken({
        name: formData.name,
        email: formData.email,
        organizationalUnit: formData.organizationalUnit,
      });

      setSupervisorTokenMessage(result.message);
      setSupervisorTokenUrl(result.previewUrl);
    } catch (requestError: unknown) {
      if (requestError instanceof Error) {
        setLocalError(requestError.message);
      } else {
        setLocalError('No se pudo solicitar el token de supervisor.');
      }
    } finally {
      setIsRequestingToken(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {(error || localError) && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded max-w-[240px] mx-auto text-sm">
          {error || localError}
        </div>
      )}

      <div className="max-w-[240px] mx-auto">
        <Input
          label="Nombre"
          type="text"
          placeholder="Nombre"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          autoComplete="name"
        />
      </div>

      <div className="max-w-[240px] mx-auto">
        <Input
          label="Email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          autoComplete="email"
        />
      </div>

      <div className="max-w-[240px] mx-auto">
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="max-w-[240px] mx-auto">
        <Input
          label="Confirmar Contraseña"
          type="password"
          placeholder="••••"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="max-w-[240px] mx-auto">
        <label className="block text-[var(--dorado)] text-sm mb-2 font-medium">Unidad Organizacional</label>
        <select
          value={formData.organizationalUnit}
          onChange={(e) => setFormData({ ...formData, organizationalUnit: e.target.value })}
          className="w-full px-4 py-2.5 bg-transparent border border-[var(--dorado)]/35 rounded-md text-[var(--blanco)] focus:outline-none focus:border-[var(--dorado)] transition-all"
          required
        >
          <option value="" className="text-[#15161B]">- Seleccionar Unidad -</option>
          {units.map((unit) => (
            <option key={unit} value={unit} className="text-[#15161B]">
              {unit}
            </option>
          ))}
        </select>
      </div>

      <div className="max-w-[240px] mx-auto">
        <label className="block text-[var(--dorado)] text-sm mb-2 font-medium">Rol</label>
        <select
          value={formData.role}
          onChange={(e) => {
            const nextRole = e.target.value;
            setFormData((current) => ({
              ...current,
              role: nextRole,
              supervisorToken: nextRole === 'Usuario supervisor' ? current.supervisorToken : '',
            }));
            setSupervisorTokenMessage(null);
          }}
          className="w-full px-4 py-2.5 bg-transparent border border-[var(--dorado)]/35 rounded-md text-[var(--blanco)] focus:outline-none focus:border-[var(--dorado)] transition-all"
          required
        >
          <option value="" className="text-[#15161B]">- Seleccionar Rol -</option>
          {roles.map((role) => (
            <option key={role} value={role} className="text-[#15161B]">
              {role}
            </option>
          ))}
        </select>
      </div>

      {isSupervisorRole && (
        <>
          <div className="max-w-[240px] mx-auto">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-[var(--dorado)] text-sm font-medium">Token de Supervisor</label>
              <button
                type="button"
                onClick={handleRequestSupervisorToken}
                disabled={isRequestingToken || isLoading}
                className="text-[11px] font-semibold text-[var(--dorado)]/90 hover:text-[var(--dorado)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRequestingToken ? 'Solicitando...' : 'Solicitar token'}
              </button>
            </div>

            <Input
              type="text"
              placeholder="Ingresa token autorizado"
              value={formData.supervisorToken ?? ''}
              onChange={(e) => setFormData({ ...formData, supervisorToken: e.target.value })}
              required
            />

            {supervisorTokenMessage && (
              <p className="mt-2 text-[11px] text-[var(--blanco)]/75">{supervisorTokenMessage}</p>
            )}

            {supervisorTokenUrl && (
              <a
                href={supervisorTokenUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-[11px] text-[var(--dorado)] hover:text-[var(--dorado)]/80"
              >
                Visite la URL para el token
              </a>
            )}
          </div>
        </>
      )}

      <div className="pt-3 max-w-[160px] mx-auto">
        <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="text-base font-bold tracking-wide">
          REGISTRARME
        </Button>
      </div>

      <div className="max-w-[240px] mx-auto text-center">
        <p className="text-[var(--blanco)]/65 text-sm">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            className="text-[var(--dorado)] font-semibold hover:text-[var(--dorado)]/80 transition-colors"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </form>
  );
};
