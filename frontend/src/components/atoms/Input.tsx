/**
 * - Centraliza estilos y comportamiento base de inputs del sistema.
 * - Permite acceso al nodo nativo mediante ref (útil para foco/validación).
 
 * - Soporta etiqueta opcional y estado de error visual.
 */
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta visible encima del campo. */
  label?: string;
  /** Mensaje/estado de error para retroalimentación visual. */
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[var(--dorado)] text-sm mb-2 font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 
            bg-transparent 
            border-b-2 border-[var(--dorado)]
            text-[var(--blanco)] 
            placeholder:text-[var(--blanco)]/50
            focus:outline-none focus:border-[var(--dorado)] focus:border-b-[3px]
            transition-all duration-200
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
