export type SupervisorSection = 'dashboard' | 'temporal' | 'reportes' | 'notificaciones' | 'configuracion';

export type TaskSortBy = 'new' | 'old' | 'alphabetical' | 'id-asc';

export interface TaskCreationForm {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  assignedToUserId: string;
}

export interface SupervisorProfileForm {
  nombre: string;
  correo: string;
  unidad: string;
}
