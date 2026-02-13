/**
 * - Encapsula la renderización del logo institucional.
 * - Estandariza tamaños permitidos para evitar inconsistencias visuales.
 */
import co2Logo from '../../assets/co2.svg';

interface LogoProps {
  /** Tamaño predefinido del logo según contexto de pantalla. */
  size?: 'sm' | 'md' | 'lg';
  /** Clases adicionales para posicionamiento o ajustes puntuales. */
  className?: string;
}

export const Logo = ({ size = 'md', className = '' }: LogoProps) => {
  /** Mapa de tamaños para mantener consistencia responsive. */
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16 md:w-20 md:h-20',
    lg: 'w-24 h-24 md:w-32 md:h-32'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={co2Logo} 
        alt="CO2+ Logo" 
        className={`${sizes[size]} object-contain`}
      />
    </div>
  );
};
