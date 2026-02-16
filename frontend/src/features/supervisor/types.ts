/**
 * - Tipos de soporte del dashboard de supervisor.
 * - Define secciones, ordenamiento y modelos de formulario locales.
 */
export type SupervisorSection = 'dashboard' | 'temporal' | 'reportes' | 'notificaciones' | 'configuracion';

/** Criterios de orden disponibles para listado de tareas. */
export type TaskSortBy = 'new' | 'old' | 'alphabetical' | 'id-asc';

/** Estado del formulario de creación de tarea en modal supervisor. */
export interface TaskCreationForm {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  assignedToUserId: string;
}

/** Estado editable de perfil en la sección de configuración. */
export interface SupervisorProfileForm {
  nombre: string;
  correo: string;
  unidad: string;
}
