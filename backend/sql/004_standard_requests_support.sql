BEGIN;

CREATE INDEX IF NOT EXISTS idx_tcr_requested_by_status
ON task_change_requests(requested_by_user_id, status, requested_at DESC);

COMMIT;
