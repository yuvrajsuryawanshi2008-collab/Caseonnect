-- ============================================================
-- CaseConnect AICTE Platform — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS (official AICTE staff accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'BUREAU_OFFICER'
                  CHECK (role IN ('SUPER_ADMIN','SENIOR_MONITORING_OFFICER','BUREAU_OFFICER','REGIONAL_REVIEWER','AUDITOR','INSTITUTION_USER')),
  bureau_id     TEXT DEFAULT 'RB',
  institution_id UUID,
  designation   TEXT DEFAULT 'Institutional Scrutiny Officer',
  phone_number  TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_emp_id   ON users (employee_id);

-- ============================================================
-- STUDENTS (generic user portal — Faculty, Stakeholder, Inst Rep)
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  college           TEXT NOT NULL,
  institution_id    UUID,
  course            TEXT NOT NULL,
  branch            TEXT NOT NULL,
  academic_year     TEXT NOT NULL,
  student_id_number TEXT DEFAULT '',
  phone_number      TEXT DEFAULT '',
  role              TEXT NOT NULL DEFAULT 'STUDENT'
                      CHECK (role IN ('STUDENT','ROLE_FACULTY','ROLE_STAKEHOLDER','ROLE_INSTITUTION_REP')),
  user_type         TEXT DEFAULT '',
  is_active         BOOLEAN DEFAULT TRUE,
  last_login        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_email ON students (email);
CREATE INDEX IF NOT EXISTS idx_students_role  ON students (role);

-- ============================================================
-- BUREAUS
-- ============================================================
CREATE TABLE IF NOT EXISTS bureaus (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  description        TEXT,
  head_officer_name  TEXT,
  contact_email      TEXT,
  jurisdiction_scope JSONB DEFAULT '[]',
  capacity_limit     INTEGER DEFAULT 100,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bureaus_code ON bureaus (code);

-- ============================================================
-- INSTITUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS institutions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permanent_id         TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  institution_type     TEXT DEFAULT 'Unaided-Private'
                         CHECK (institution_type IN ('Government','Govt-Aided','Unaided-Private','University-Dept','Deemed-University')),
  region               TEXT NOT NULL,
  state                TEXT NOT NULL,
  city                 TEXT NOT NULL,
  address              TEXT,
  pincode              TEXT,
  affiliated_university TEXT,
  approved_intake      INTEGER DEFAULT 0,
  contact_email        TEXT,
  contact_phone        TEXT,
  principal_name       TEXT,
  is_active            BOOLEAN DEFAULT TRUE,
  risk_score           NUMERIC DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institutions_permanent_id ON institutions (permanent_id);
CREATE INDEX IF NOT EXISTS idx_institutions_region       ON institutions (region);

-- ============================================================
-- CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number          TEXT NOT NULL UNIQUE,
  institution_id       UUID,
  permanent_id         TEXT NOT NULL,
  institution_name     TEXT NOT NULL,
  bureau_id            TEXT NOT NULL,
  bureau_code          TEXT NOT NULL,
  assigned_officer_id  UUID,
  assigned_officer_name TEXT,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  category             TEXT NOT NULL,
  severity             TEXT DEFAULT 'MEDIUM'  CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  priority             TEXT DEFAULT 'NORMAL'  CHECK (priority IN ('NORMAL','URGENT','IMMEDIATE')),
  status               TEXT DEFAULT 'RECEIVED'
                         CHECK (status IN ('RECEIVED','ASSIGNED','UNDER_PROCESS','PENDING_RESPONSE',
                                           'COORDINATION_REQUESTED','TRANSFERRED','ESCALATED','DISPOSED','CLOSED')),
  received_date        TIMESTAMPTZ DEFAULT NOW(),
  sla_deadline         TIMESTAMPTZ NOT NULL,
  last_action_date     TIMESTAMPTZ DEFAULT NOW(),
  disposed_date        TIMESTAMPTZ,
  petitioner_type      TEXT DEFAULT 'Student',
  petitioner_name      TEXT,
  petitioner_contact   TEXT,
  is_confidential      BOOLEAN DEFAULT FALSE,
  next_required_action TEXT DEFAULT 'Initial Scrutiny & Bureau Review',
  disposal_resolution  TEXT,
  penalty_or_directive TEXT,
  related_case_ids     JSONB DEFAULT '[]',
  has_potential_overlap BOOLEAN DEFAULT FALSE,
  timeline             JSONB DEFAULT '[]',
  internal_remarks     JSONB DEFAULT '[]',
  documents            JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_case_number    ON cases (case_number);
CREATE INDEX IF NOT EXISTS idx_cases_permanent_id   ON cases (permanent_id);
CREATE INDEX IF NOT EXISTS idx_cases_bureau_code    ON cases (bureau_code);
CREATE INDEX IF NOT EXISTS idx_cases_status         ON cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_sla_deadline   ON cases (sla_deadline);
CREATE INDEX IF NOT EXISTS idx_cases_category       ON cases (category);
CREATE INDEX IF NOT EXISTS idx_cases_institution_id ON cases (institution_id);

-- ============================================================
-- OVERLAP REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS overlap_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_a_id        UUID NOT NULL,
  case_a_number    TEXT NOT NULL,
  case_a_title     TEXT,
  case_a_bureau    TEXT,
  case_a_officer   TEXT,
  case_b_id        UUID NOT NULL,
  case_b_number    TEXT NOT NULL,
  case_b_title     TEXT,
  case_b_bureau    TEXT,
  case_b_officer   TEXT,
  institution_id   UUID NOT NULL,
  institution_name TEXT NOT NULL,
  permanent_id     TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  layer_matches    JSONB DEFAULT '{}',
  matching_tokens  JSONB DEFAULT '[]',
  explanation      TEXT NOT NULL,
  status           TEXT DEFAULT 'PENDING_REVIEW'
                     CHECK (status IN ('PENDING_REVIEW','CONFIRMED_RELATED','COORDINATION_INITIATED','DISMISSED_UNRELATED')),
  reviewed_by      UUID,
  reviewer_name    TEXT,
  reviewer_role    TEXT,
  reviewer_notes   TEXT,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overlaps_status ON overlap_reviews (status);

-- ============================================================
-- COORDINATION REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS coordination_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_bureau_code TEXT NOT NULL,
  target_bureau_code     TEXT NOT NULL,
  primary_case_id        UUID NOT NULL,
  primary_case_number    TEXT NOT NULL,
  associated_case_ids    JSONB DEFAULT '[]',
  institution_name       TEXT NOT NULL,
  subject                TEXT NOT NULL,
  justification          TEXT NOT NULL,
  status                 TEXT DEFAULT 'REQUESTED'
                           CHECK (status IN ('REQUESTED','ACCEPTED','DECLINED','RESOLVED')),
  joint_action_notes     JSONB DEFAULT '[]',
  initiated_by_id        UUID,
  initiated_by_name      TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coord_status ON coordination_requests (status);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID,
  bureau_code       TEXT,
  title             TEXT NOT NULL,
  message           TEXT NOT NULL,
  type              TEXT DEFAULT 'SYSTEM'
                      CHECK (type IN ('OVERLAP_ALERT','DEADLINE_WARNING','OVERDUE_ALERT',
                                      'CASE_ASSIGNED','TRANSFER_REQUEST','COORDINATION_NOTE','SYSTEM')),
  case_id           UUID,
  link_url          TEXT,
  is_read           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_bureau    ON notifications (bureau_code);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON notifications (is_read);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT,
  user_name    TEXT,
  user_email   TEXT,
  user_role    TEXT,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  ip_address   TEXT,
  details      TEXT,
  before_state JSONB,
  after_state  JSONB,
  timestamp    TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id     ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action      ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_entity_type ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp   ON audit_logs (timestamp);

-- ============================================================
-- SYSTEM CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS system_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  value       JSONB NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sysconfig_key ON system_configs (key);

-- ============================================================
-- updated_at auto-trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','students','bureaus','institutions','cases',
    'overlap_reviews','coordination_requests','notifications','audit_logs','system_configs']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl);
  END LOOP;
END;
$$;
