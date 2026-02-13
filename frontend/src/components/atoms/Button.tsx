/*
 * - Estandariza la apariencia y el comportamiento de botones del sistema.
 * - Evita repetir clases Tailwind y lógica de loading/disabled en cada pantalla.

 * - Un cambio de estilo aquí impacta de forma consistente en toda la app.
 */
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón según contexto de uso. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Cuando es `true`, ocupa el ancho completo del contenedor padre. */
  fullWidth?: boolean;
  /** Activa estado de carga (spinner + texto) y deshabilita interacción. */
  isLoading?: boolean;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) => {
  /** Estilos base compartidos por todas las variantes. */
  const baseStyles = 'px-6 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm';
  
  /** Diccionario de estilos por variante. */
  const variants = {
    primary: 'bg-[var(--dorado)] text-white hover:bg-[var(--dorado)]/90 active:scale-95',
    secondary: 'bg-transparent border-2 border-[var(--dorado)] text-[var(--dorado)] hover:bg-[var(--dorado)] hover:text-white',
    ghost: 'bg-transparent text-[var(--blanco)] hover:bg-[var(--blanco)]/10'
  };


  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando...
        </span>
      ) : children}
    </button>
  );
};
