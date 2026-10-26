# Database Schema & Data Dictionary

**Database Engine**: Supabase PostgreSQL  
**Client Library**: `@supabase/supabase-js`  
**Security Model**: PostgreSQL Row Level Security (RLS)  
**Migration Files**: `database/schema.sql`, `supabase/migrations/20261025_caseconnect_core.sql`

---

## 1. Relational Table Specifications

### 1.1 `institutions` Table
Stores statutory technical education institutions.
```sql
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permanent_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  institution_type VARCHAR(50) DEFAULT 'Unaided-Private',
  region VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT,
  pincode VARCHAR(20),
  affiliated_university VARCHAR(255),
  approved_intake INT DEFAULT 0,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  principal_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  risk_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 `bureaus` Table
Regulatory bureaus and specialized cells within the Council.
```sql
CREATE TABLE bureaus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  head_officer_name VARCHAR(255),
  contact_email VARCHAR(255),
  jurisdiction_scope TEXT[] DEFAULT ARRAY[]::TEXT[],
  capacity_limit INT DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 `users` Table
Authorized regulatory officials, scrutiny officers, and administrators.
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'BUREAU_OFFICER',
  bureau_id VARCHAR(50) DEFAULT 'RB',
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  designation VARCHAR(100) DEFAULT 'Institutional Scrutiny Officer',
  phone_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.4 `cases` Table
Central complaint docket repository across all bureaus.
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  permanent_id VARCHAR(50) NOT NULL,
  institution_name VARCHAR(255) NOT NULL,
  bureau_id VARCHAR(50) NOT NULL,
  bureau_code VARCHAR(50) NOT NULL,
  assigned_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_officer_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'MEDIUM',
  priority VARCHAR(20) DEFAULT 'NORMAL',
  status VARCHAR(50) DEFAULT 'RECEIVED',
  received_date TIMESTAMPTZ DEFAULT NOW(),
  sla_deadline TIMESTAMPTZ NOT NULL,
  last_action_date TIMESTAMPTZ DEFAULT NOW(),
  disposed_date TIMESTAMPTZ,
  petitioner_type VARCHAR(50) DEFAULT 'Student',
  petitioner_name VARCHAR(255),
  petitioner_contact VARCHAR(255),
  is_confidential BOOLEAN DEFAULT FALSE,
  next_required_action TEXT DEFAULT 'Initial Scrutiny & Bureau Review',
  disposal_resolution TEXT,
  penalty_or_directive TEXT,
  related_case_ids UUID[] DEFAULT ARRAY[]::UUID[],
  has_potential_overlap BOOLEAN DEFAULT FALSE,
  timeline JSONB DEFAULT '[]'::JSONB,
  internal_remarks JSONB DEFAULT '[]'::JSONB,
  documents JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 `overlap_reviews` Table
Cross-bureau overlap detection records with confidence scores and human review determinations.
```sql
CREATE TABLE overlap_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_a_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  case_a_number VARCHAR(50) NOT NULL,
  case_a_title VARCHAR(255),
  case_a_bureau VARCHAR(50),
  case_a_officer VARCHAR(255),
  case_b_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  case_b_number VARCHAR(50) NOT NULL,
  case_b_title VARCHAR(255),
  case_b_bureau VARCHAR(50),
  case_b_officer VARCHAR(255),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  institution_name VARCHAR(255) NOT NULL,
  permanent_id VARCHAR(50) NOT NULL,
  confidence_score NUMERIC NOT NULL,
  layer_matches JSONB DEFAULT '{}'::JSONB,
  matching_tokens TEXT[] DEFAULT ARRAY[]::TEXT[],
  explanation TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(255),
  reviewer_role VARCHAR(50),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.6 `coordination_requests` Table
Inter-bureau joint coordination tickets and action notes.
```sql
CREATE TABLE coordination_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_bureau_code VARCHAR(50) NOT NULL,
  target_bureau_code VARCHAR(50) NOT NULL,
  primary_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  primary_case_number VARCHAR(50) NOT NULL,
  associated_case_ids UUID[] DEFAULT ARRAY[]::UUID[],
  institution_name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  justification TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'REQUESTED',
  joint_action_notes JSONB DEFAULT '[]'::JSONB,
  initiated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  initiated_by_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.7 `notifications` Table
User and bureau notifications, alerts, and SLA warnings.
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bureau_code VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'SYSTEM',
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.8 `audit_logs` Table
Append-only immutable audit trail for security and statutory compliance.
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50),
  details TEXT,
  before_state JSONB,
  after_state JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.9 `system_configs` Table
Configurable SLA resolution parameters and algorithmic thresholds.
```sql
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Row Level Security (RLS) Architecture

All tables have RLS enabled with explicit least-privilege policies:
1. `service_role` has full server-side read/write capability.
2. Authenticated officials have read access to non-confidential cases, their assigned bureau records, and directory information.
3. Users can only view their own notifications or bureau-wide alerts.
4. `audit_logs` is append-only for authenticated officials; only Super Admins and Auditors can read audit logs.
