BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_type') THEN
    CREATE TYPE change_type AS ENUM ('CREATE', 'UPDATE', 'COMPLETE', 'DELETE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS organizational_units (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(20) UNIQUE NOT NULL CHECK (code = upper(code)),
  name             VARCHAR(120) UNIQUE NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(30) UNIQUE NOT NULL CHECK (code = upper(code)),
  name             VARCHAR(120) UNIQUE NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(60) UNIQUE NOT NULL CHECK (code = upper(code)),
  name             VARCHAR(150) NOT NULL,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id          INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id    INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id                      BIGSERIAL PRIMARY KEY,
  username                CITEXT UNIQUE,
  full_name               VARCHAR(120) NOT NULL,
  email                   CITEXT UNIQUE NOT NULL,
  password_hash           TEXT NOT NULL,
  organizational_unit_id  INT NOT NULL REFERENCES organizational_units(id),
  role_id                 INT NOT NULL REFERENCES roles(id),
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at           TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (username IS NULL OR length(trim(username)) >= 3)
);

CREATE TABLE IF NOT EXISTS tasks (
  id                      BIGSERIAL PRIMARY KEY,
  organizational_unit_id  INT NOT NULL REFERENCES organizational_units(id),
  title                   VARCHAR(180) NOT NULL,
  description             TEXT,
  status                  task_status NOT NULL DEFAULT 'PENDING',
  priority                task_priority NOT NULL DEFAULT 'MEDIUM',
  due_date                DATE,
  assigned_to_user_id     BIGINT REFERENCES users(id),
  created_by_user_id      BIGINT NOT NULL REFERENCES users(id),
  approved_by_user_id     BIGINT REFERENCES users(id),
  completed_at            TIMESTAMPTZ,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(title)) >= 3),
  CHECK (due_date IS NULL OR due_date >= DATE '2000-01-01')
);

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assigned_to_user_id BIGINT REFERENCES users(id);

CREATE TABLE IF NOT EXISTS task_change_requests (
  id                      BIGSERIAL PRIMARY KEY,
  task_id                 BIGINT REFERENCES tasks(id),
  organizational_unit_id  INT NOT NULL REFERENCES organizational_units(id),
  requested_by_user_id    BIGINT NOT NULL REFERENCES users(id),
  reviewed_by_user_id     BIGINT REFERENCES users(id),
  change_type             change_type NOT NULL,
  status                  approval_status NOT NULL DEFAULT 'PENDING',
  reason                  TEXT,
  review_comment          TEXT,
  payload                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (change_type = 'CREATE' AND task_id IS NULL)
    OR
    (change_type IN ('UPDATE', 'COMPLETE', 'DELETE') AND task_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS task_events (
  id                      BIGSERIAL PRIMARY KEY,
  task_id                 BIGINT REFERENCES tasks(id),
  change_request_id       BIGINT REFERENCES task_change_requests(id),
  action                  VARCHAR(40) NOT NULL,
  actor_user_id           BIGINT NOT NULL REFERENCES users(id),
  details                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_unit_role ON users(organizational_unit_id, role_id);

CREATE INDEX IF NOT EXISTS idx_tasks_unit_status ON tasks(organizational_unit_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active);

CREATE INDEX IF NOT EXISTS idx_tcr_status_unit ON task_change_requests(status, organizational_unit_id);
CREATE INDEX IF NOT EXISTS idx_tcr_requested_at ON task_change_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_tcr_task_id ON task_change_requests(task_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_task_completion_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;

  IF NEW.status <> 'COMPLETED' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ou_updated_at ON organizational_units;
CREATE TRIGGER trg_ou_updated_at
BEFORE UPDATE ON organizational_units
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_permissions_updated_at ON permissions;
CREATE TRIGGER trg_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_task_completion_fields ON tasks;
CREATE TRIGGER trg_task_completion_fields
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION enforce_task_completion_fields();

DROP TRIGGER IF EXISTS trg_tcr_updated_at ON task_change_requests;
CREATE TRIGGER trg_tcr_updated_at
BEFORE UPDATE ON task_change_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

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

CREATE OR REPLACE VIEW vw_pending_change_requests AS
SELECT
  r.id,
  r.change_type,
  r.status,
  r.reason,
  r.payload,
  r.requested_at,
  ou.name AS organizational_unit,
  u.full_name AS requested_by,
  t.title AS current_task_title
FROM task_change_requests r
JOIN organizational_units ou ON ou.id = r.organizational_unit_id
JOIN users u ON u.id = r.requested_by_user_id
LEFT JOIN tasks t ON t.id = r.task_id
WHERE r.status = 'PENDING';

COMMIT;
