import { useState } from 'react';
import { FaLock, FaUserEdit } from 'react-icons/fa';
import type { SupervisorProfileForm } from '../types';

interface SupervisorSettingsPageProps {
  profileForm: SupervisorProfileForm;
  onProfileFormChange: (next: SupervisorProfileForm) => void;
  onSave: (next: SupervisorProfileForm) => Promise<void>;
  onPasswordUpdate: (newPassword: string) => Promise<void>;
}

export const SupervisorSettingsPage = ({
  profileForm,
  onProfileFormChange,
  onSave,
  onPasswordUpdate,
}: SupervisorSettingsPageProps) => {
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordUpdate = async () => {
    setPasswordFeedback(null);
    setPasswordError(null);

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Completa todos los campos para actualizar la contraseña.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    try {
      await onPasswordUpdate(passwordForm.newPassword);
      setPasswordFeedback('Contraseña actualizada correctamente.');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      setPasswordError(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.');
    }
  };

  const handleSaveProfile = async () => {
    setPasswordFeedback(null);
    setPasswordError(null);

    try {
      await onSave(profileForm);
    } catch (error: unknown) {
      setPasswordError(error instanceof Error ? error.message : 'No se pudo actualizar el perfil.');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-[#15161B] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div
        className="pointer-events-none absolute top-0 left-0 h-20 w-full"
        style={{
          background:
            'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
        }}
      />

      <div className="relative z-10 space-y-5">
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--blanco)]">
            <FaUserEdit className="text-[var(--dorado)]" /> Perfil del supervisor
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--blanco)]/65">Nombre</label>
              <input
                type="text"
                value={profileForm.nombre}
                onChange={(event) => onProfileFormChange({ ...profileForm, nombre: event.target.value })}
                className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-[var(--blanco)] outline-none focus:border-[var(--dorado)]/45"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-[var(--blanco)]/65">Correo</label>
              <input
                type="email"
                value={profileForm.correo}
                onChange={(event) => onProfileFormChange({ ...profileForm, correo: event.target.value })}
                className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-[var(--blanco)] outline-none focus:border-[var(--dorado)]/45"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-[var(--blanco)]/65">Unidad (solo lectura)</label>
              <input
                type="text"
                value={profileForm.unidad}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--blanco)]/70 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                className="mt-1 w-fit rounded-lg bg-[var(--dorado)] px-4 py-2 text-sm font-semibold text-[var(--blanco)]"
              >
                Guardar perfil
              </button>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--dorado)]/70 to-transparent" />

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--blanco)]">
            <FaLock className="text-[var(--dorado)]" /> Cambio de contraseña
          </h3>

          {passwordError && <p className="mb-2 text-xs text-red-300">{passwordError}</p>}
          {passwordFeedback && <p className="mb-2 text-xs text-[#9BE2B3]">{passwordFeedback}</p>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--blanco)]/65">Nueva contraseña</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((state) => ({
                    ...state,
                    newPassword: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-[var(--blanco)] outline-none focus:border-[var(--dorado)]/45"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-[var(--blanco)]/65">Confirmar contraseña</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((state) => ({
                    ...state,
                    confirmPassword: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-[var(--blanco)] outline-none focus:border-[var(--dorado)]/45"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => void handlePasswordUpdate()}
                className="mt-1 w-fit rounded-lg bg-[var(--dorado)] px-4 py-2 text-sm font-semibold text-[var(--blanco)]"
              >
                Actualizar contraseña
              </button>
            </div>
          </div>
        </div>
      </div>

      <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
    </div>
  );
};
