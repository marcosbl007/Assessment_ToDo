/**
 * - Evita duplicación entre login y registro.
 * - Garantiza consistencia visual (logo, card, efectos y footer).
 */
import type { ReactNode } from 'react';
import { Logo } from '../atoms';
import co2SmallLogo from '../../assets/co2.svg';

interface AuthLayoutProps {
  /** Título principal mostrado dentro del card (ej. INICIO, REGISTRO). */
  title: string;
  /** Área de formulario/contenido que se renderiza debajo del título. */
  children: ReactNode;
}

export const AuthLayout = ({ title, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--fondo)]">
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-[400px]">
          <div className="relative mt-16 md:mt-20">
            <div className="absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 z-20">
              <Logo size="lg" />
            </div>

            <div className="bg-[#15161B] rounded-lg p-8 md:p-12 pt-20 md:pt-24 pb-16 md:pb-20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] relative overflow-hidden">
              {/* Luz superior sutil para dar profundidad sin bordes duros. */}
              <div
                className="absolute top-0 left-0 w-full h-36 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
                }}
              />

              {/* Degradado dorado semicircular derecho, parte de la identidad visual. */}
              <div
                className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-[28rem] h-[28rem] rounded-full blur-xl pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(157, 131, 62, 0.28) 0%, rgba(157, 131, 62, 0.16) 25%, rgba(157, 131, 62, 0.08) 45%, rgba(157, 131, 62, 0.04) 65%, transparent 85%)',
                }}
              />

              {/* Línea vertical dorada derecha con puntas suavizadas. */}
              <div
                className="absolute top-1/2 -translate-y-1/2 right-0 w-[1px] h-[90%] pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 0%, rgba(157, 131, 62, 0.7) 15%, rgba(157, 131, 62, 0.7) 85%, transparent 100%)',
                }}
              />

              {/* Capa de contenido principal por encima de fondos decorativos. */}
              <div className="relative z-10 space-y-8">
                <div className="flex flex-col items-center">
                  <h1 className="text-3xl md:text-4xl font-semibold text-[var(--blanco)] tracking-[0.11em] uppercase">
                    {title}
                  </h1>
                </div>

                {children}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-center gap-6 text-[var(--blanco)]/60 text-sm">
          <div className="flex items-center gap-1">
            <span>© 2026 Proyecto</span>
            <img src={co2SmallLogo} alt="CO2+" className="w-5 h-5 opacity-60" />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span>Todos los derechos reservados por</span>
            <img src={co2SmallLogo} alt="CO2+" className="w-4 h-4 opacity-60" />
          </div>
        </div>
      </footer>
    </div>
  );
};
