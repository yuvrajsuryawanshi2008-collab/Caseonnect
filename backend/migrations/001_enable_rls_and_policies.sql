-- ============================================================
-- CaseConnect AICTE Platform — Supabase RLS Policies Migration
-- Version: 001_enable_rls_and_policies.sql
-- ============================================================

-- 1. Enable Row Level Security on all public tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlap_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- BUREAUS (Publicly readable directory, Admin managed)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Bureaus are viewable by everyone" ON bureaus;
CREATE POLICY "Bureaus are viewable by everyone"
  ON bureaus FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Bureaus are modifiable only by super admins" ON bureaus;
CREATE POLICY "Bureaus are modifiable only by super admins"
  ON bureaus FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'SUPER_ADMIN')
  WITH CHECK ((auth.jwt() ->> 'role') = 'SUPER_ADMIN');

-- ------------------------------------------------------------
-- INSTITUTIONS (Readable by authenticated users, Admin managed)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Institutions viewable by authenticated users" ON institutions;
CREATE POLICY "Institutions viewable by authenticated users"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Institutions modifiable by authorized officials" ON institutions;
CREATE POLICY "Institutions modifiable by authorized officials"
  ON institutions FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER'));

-- ------------------------------------------------------------
-- USERS (Official Staff)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view official directory" ON users;
CREATE POLICY "Users can view official directory"
  ON users FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN')
  WITH CHECK (id::text = auth.uid()::text OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "Admins can insert officials" ON users;
CREATE POLICY "Admins can insert officials"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'SUPER_ADMIN');

-- ------------------------------------------------------------
-- STUDENTS (External Portal Users: Students, Faculty, Stakeholders)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Students can view own profile" ON students;
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  TO authenticated
  USING (
    id::text = auth.uid()::text 
    OR (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER', 'REGIONAL_REVIEWER')
  );

DROP POLICY IF EXISTS "Students can update own profile" ON students;
CREATE POLICY "Students can update own profile"
  ON students FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Allow portal user registration" ON students;
CREATE POLICY "Allow portal user registration"
  ON students FOR INSERT
  WITH CHECK (true);

-- ------------------------------------------------------------
-- CASES (Grievance & Statutory Docket)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Officials can view all cases" ON cases;
CREATE POLICY "Officials can view all cases"
  ON cases FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER', 'REGIONAL_REVIEWER', 'AUDITOR')
    OR petitioner_contact = (auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "Officials can manage cases" ON cases;
CREATE POLICY "Officials can manage cases"
  ON cases FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER'));

-- ------------------------------------------------------------
-- OVERLAP REVIEWS (Cross-bureau regulatory intelligence)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Officials can access overlap reviews" ON overlap_reviews;
CREATE POLICY "Officials can access overlap reviews"
  ON overlap_reviews FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER', 'REGIONAL_REVIEWER'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER', 'REGIONAL_REVIEWER'));

-- ------------------------------------------------------------
-- COORDINATION REQUESTS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Officials can access coordination requests" ON coordination_requests;
CREATE POLICY "Officials can access coordination requests"
  ON coordination_requests FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER', 'REGIONAL_REVIEWER'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER', 'REGIONAL_REVIEWER'));

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    recipient_user_id::text = auth.uid()::text 
    OR bureau_code = (auth.jwt() ->> 'bureau_id')
    OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  );

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON notifications;
CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_user_id::text = auth.uid()::text 
    OR bureau_code = (auth.jwt() ->> 'bureau_id')
    OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  );

-- ------------------------------------------------------------
-- AUDIT LOGS (Immutable Compliance Journal)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Auditors and admins can view audit logs" ON audit_logs;
CREATE POLICY "Auditors and admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'AUDITOR'));

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ------------------------------------------------------------
-- SYSTEM CONFIGS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read system configs" ON system_configs;
CREATE POLICY "Authenticated users can read system configs"
  ON system_configs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update system configs" ON system_configs;
CREATE POLICY "Admins can update system configs"
  ON system_configs FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'SUPER_ADMIN')
  WITH CHECK ((auth.jwt() ->> 'role') = 'SUPER_ADMIN');
