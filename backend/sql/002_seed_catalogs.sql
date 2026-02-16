INSERT INTO organizational_units (code, name)
VALUES
  ('RRHH', 'Recursos Humanos (RRHH)'),
  ('FIN', 'Finanzas'),
  ('BI', 'Business Intelligence (BI)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (code, name)
VALUES
  ('STANDARD', 'Usuario estándar'),
  ('SUPERVISOR', 'Usuario supervisor')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO permissions (code, name, description)
VALUES
  ('TASK_VIEW_ALL', 'Ver todas las tareas', 'Permite visualizar la tabla principal de tareas aprobadas.'),
  ('TASK_CREATE', 'Crear tareas', 'Permite crear solicitudes para nuevas tareas.'),
  ('TASK_EDIT_UNIT', 'Editar tareas de su unidad', 'Permite solicitar edición de tareas de su unidad organizacional.'),
  ('TASK_DELETE_UNIT', 'Eliminar tareas de su unidad', 'Permite solicitar eliminación de tareas de su unidad organizacional.'),
  ('TASK_COMPLETE_UNIT', 'Completar tareas de su unidad', 'Permite solicitar marcar tareas como completadas en su unidad.'),
  ('TASK_APPROVE_CHANGES', 'Aprobar cambios', 'Permite aprobar o rechazar solicitudes pendientes de su unidad.')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

WITH role_permission_matrix AS (
  SELECT r.id AS role_id, p.id AS permission_id
  FROM roles r
  JOIN permissions p ON p.code IN (
    'TASK_VIEW_ALL',
    'TASK_CREATE',
    'TASK_EDIT_UNIT',
    'TASK_DELETE_UNIT',
    'TASK_COMPLETE_UNIT'
  )
  WHERE r.code = 'STANDARD'

  UNION ALL

  SELECT r.id AS role_id, p.id AS permission_id
  FROM roles r
  JOIN permissions p ON p.code IN (
    'TASK_VIEW_ALL',
    'TASK_CREATE',
    'TASK_EDIT_UNIT',
    'TASK_DELETE_UNIT',
    'TASK_COMPLETE_UNIT',
    'TASK_APPROVE_CHANGES'
  )
  WHERE r.code = 'SUPERVISOR'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM role_permission_matrix
ON CONFLICT (role_id, permission_id) DO NOTHING;
