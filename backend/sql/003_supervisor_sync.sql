BEGIN;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assigned_to_user_id BIGINT REFERENCES users(id);

CREATE OR REPLACE FUNCTION apply_task_change_request(
  p_request_id BIGINT,
  p_supervisor_user_id BIGINT,
  p_decision approval_status,
  p_review_comment TEXT DEFAULT NULL
)
RETURNS TABLE(change_request_id BIGINT, status approval_status, task_id BIGINT) AS $$
DECLARE
  v_request         task_change_requests%ROWTYPE;
  v_supervisor_role VARCHAR(30);
  v_supervisor_unit INT;
  v_task_id         BIGINT;
BEGIN
  IF p_decision NOT IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'La decisión debe ser APPROVED o REJECTED';
  END IF;

  SELECT * INTO v_request
  FROM task_change_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada: %', p_request_id;
  END IF;

  IF v_request.status <> 'PENDING' THEN
    RAISE EXCEPTION 'La solicitud % ya fue procesada', p_request_id;
  END IF;

  SELECT r.code, u.organizational_unit_id
  INTO v_supervisor_role, v_supervisor_unit
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE u.id = p_supervisor_user_id
    AND u.is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supervisor no encontrado o inactivo';
  END IF;

  IF v_supervisor_role <> 'SUPERVISOR' THEN
    RAISE EXCEPTION 'Solo un usuario con rol SUPERVISOR puede aprobar o rechazar';
  END IF;

  IF v_supervisor_unit <> v_request.organizational_unit_id THEN
    RAISE EXCEPTION 'El supervisor debe pertenecer a la misma unidad de la solicitud';
  END IF;

  IF p_decision = 'REJECTED' THEN
    UPDATE task_change_requests
    SET status = 'REJECTED',
        reviewed_by_user_id = p_supervisor_user_id,
        reviewed_at = NOW(),
        review_comment = COALESCE(p_review_comment, 'Solicitud rechazada')
    WHERE id = p_request_id;

    RETURN QUERY
      SELECT p_request_id, 'REJECTED'::approval_status, v_request.task_id;
    RETURN;
  END IF;

  IF v_request.change_type = 'CREATE' THEN
    INSERT INTO tasks (
      organizational_unit_id,
      title,
      description,
      status,
      priority,
      due_date,
      assigned_to_user_id,
      created_by_user_id,
      approved_by_user_id
    )
    VALUES (
      v_request.organizational_unit_id,
      COALESCE(v_request.payload ->> 'title', 'Sin título'),
      v_request.payload ->> 'description',
      COALESCE((v_request.payload ->> 'status')::task_status, 'PENDING'),
      COALESCE((v_request.payload ->> 'priority')::task_priority, 'MEDIUM'),
      (v_request.payload ->> 'dueDate')::DATE,
      (v_request.payload ->> 'assignedToUserId')::BIGINT,
      v_request.requested_by_user_id,
      p_supervisor_user_id
    )
    RETURNING id INTO v_task_id;

  ELSIF v_request.change_type = 'UPDATE' THEN
    UPDATE tasks
    SET title = COALESCE(v_request.payload ->> 'title', title),
        description = COALESCE(v_request.payload ->> 'description', description),
        status = COALESCE((v_request.payload ->> 'status')::task_status, status),
        priority = COALESCE((v_request.payload ->> 'priority')::task_priority, priority),
        due_date = COALESCE((v_request.payload ->> 'dueDate')::DATE, due_date),
        assigned_to_user_id = COALESCE((v_request.payload ->> 'assignedToUserId')::BIGINT, assigned_to_user_id),
        approved_by_user_id = p_supervisor_user_id
    WHERE id = v_request.task_id
      AND is_active = TRUE
    RETURNING id INTO v_task_id;

  ELSIF v_request.change_type = 'COMPLETE' THEN
    UPDATE tasks
    SET status = 'COMPLETED',
        completed_at = NOW(),
        approved_by_user_id = p_supervisor_user_id
    WHERE id = v_request.task_id
      AND is_active = TRUE
    RETURNING id INTO v_task_id;

  ELSIF v_request.change_type = 'DELETE' THEN
    UPDATE tasks
    SET is_active = FALSE,
        approved_by_user_id = p_supervisor_user_id
    WHERE id = v_request.task_id
    RETURNING id INTO v_task_id;
  END IF;

  IF v_task_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo aplicar la solicitud %', p_request_id;
  END IF;

  UPDATE task_change_requests
  SET status = 'APPROVED',
      reviewed_by_user_id = p_supervisor_user_id,
      reviewed_at = NOW(),
      review_comment = COALESCE(p_review_comment, 'Solicitud aprobada'),
      task_id = v_task_id
  WHERE id = p_request_id;

  INSERT INTO task_events (task_id, change_request_id, action, actor_user_id, details)
  VALUES (
    v_task_id,
    p_request_id,
    CONCAT('REQUEST_', v_request.change_type, '_APPROVED'),
    p_supervisor_user_id,
    jsonb_build_object('comment', p_review_comment, 'requestId', p_request_id)
  );

  RETURN QUERY
    SELECT p_request_id, 'APPROVED'::approval_status, v_task_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW vw_tasks_public AS
SELECT
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.completed_at,
  t.created_at,
  ou.code AS organizational_unit_code,
  ou.name AS organizational_unit_name,
  creator.full_name AS created_by,
  approver.full_name AS approved_by,
  t.assigned_to_user_id,
  assignee.full_name AS assigned_to
FROM tasks t
JOIN organizational_units ou ON ou.id = t.organizational_unit_id
JOIN users creator ON creator.id = t.created_by_user_id
LEFT JOIN users approver ON approver.id = t.approved_by_user_id
LEFT JOIN users assignee ON assignee.id = t.assigned_to_user_id
WHERE t.is_active = TRUE;

COMMIT;
