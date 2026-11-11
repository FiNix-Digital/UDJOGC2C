-- ===== UDJOG C2C SERVICES - CLOUDFLARE D1 DATABASE SCHEMA =====

-- 1. JOBS TABLE (Active & Managed Postings)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'it',
  job_type TEXT NOT NULL DEFAULT 'Full Time',
  salary TEXT,
  experience TEXT,
  vacancies INTEGER DEFAULT 1,
  skills TEXT,
  description TEXT NOT NULL,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  posted_at TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  qualification TEXT,
  passout_year TEXT,
  experience TEXT,
  role_category TEXT,
  location TEXT,
  resume_link TEXT,
  message TEXT,
  applied_job TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. EMPLOYERS TABLE
CREATE TABLE IF NOT EXISTS employers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  job_title TEXT NOT NULL,
  department TEXT,
  job_type TEXT DEFAULT 'Full Time',
  location TEXT NOT NULL,
  salary_ctc TEXT,
  vacancies INTEGER DEFAULT 1,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial jobs
INSERT OR IGNORE INTO jobs (id, title, company, location, category, job_type, salary, experience, vacancies, skills, description, requirements, status, posted_at) VALUES
('job-101', 'Junior Java Full Stack Developer', 'NexTech Solutions', 'Hyderabad', 'it', 'Full Time', '₹3.6 - ₹5.0 LPA', 'Freshers / 0-1 Yr', 15, 'Java,Spring Boot,MySQL,React', 'Looking for enthusiastic freshers and entry-level Java developers with strong OOPs concepts.', 'B.Tech/MCA/B.Sc Computers (2024-2026 batches).', 'active', '2 days ago'),
('job-102', 'Customer Support Executive (Voice / Non-Voice)', 'Apex Global BPO', 'Hyderabad', 'bpo', 'Full Time', '₹2.4 - ₹3.5 LPA', 'Freshers / Any Graduate', 40, 'English Fluency,Customer Handling,Email Support', 'Handle incoming customer queries for global banking and telecom clients.', 'Any Graduate or 10+2 with good spoken English. Typing 25+ WPM.', 'active', 'Just now'),
('job-103', 'Banking Relationship Officer (CASA)', 'TrustFin Bank', 'Vijayawada', 'banking', 'Full Time', '₹2.8 - ₹4.2 LPA', '0-2 Yrs', 20, 'Banking Products,Customer Relationship,KYC', 'Responsible for acquisition of new retail banking customers and CASA accounts.', 'Graduate in any stream (B.Com/BBA preferred).', 'active', '1 day ago'),
('job-104', 'Business Development Executive (BDE)', 'EduVibe Infotech', 'Hyderabad', 'sales', 'Full Time', '₹3.0 - ₹4.5 LPA', 'Freshers / 0-1 Yr', 25, 'Lead Generation,Client Pitching,Negotiation', 'Connect with prospective clients, conduct product walkthroughs, and close sales.', 'MBA / BBA / Any degree. Confident presentation and negotiation skills.', 'active', '4 days ago');
