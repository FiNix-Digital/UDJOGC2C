// ===== UDJOG C2C SERVICES - PERSISTENT DATABASE ENGINE =====
// Uses Node.js 22 built-in SQLite (DatabaseSync) with automatic JSON backup

const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname);
const DB_FILE = path.join(DB_DIR, "udjog.db");
const BACKUP_FILE = path.join(DB_DIR, "data.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Default initial jobs (seeded only on fresh database)
const INITIAL_JOBS = [
  {
    id: "job-101",
    title: "Junior Java Full Stack Developer",
    company: "NexTech Solutions",
    location: "Hyderabad",
    category: "it",
    job_type: "Full Time",
    experience: "Freshers / 0-1 Yr",
    salary: "₹3.6 - ₹5.0 LPA",
    vacancies: 15,
    skills: "Java,Spring Boot,MySQL,React,HTML/CSS",
    description: "Looking for enthusiastic freshers and entry-level Java developers with strong OOPs concepts and basic web development knowledge. Full training and mentor support will be provided during onboarding.",
    requirements: "B.Tech/MCA/B.Sc Computers (2024, 2025 or 2026 batches). Basic knowledge of Core Java, SQL, and Git. Good problem-solving mindset and communication skills.",
    status: "active",
    posted_at: "2 days ago"
  },
  {
    id: "job-102",
    title: "Customer Support Executive (Voice / Non-Voice)",
    company: "Apex Global BPO",
    location: "Hyderabad",
    category: "bpo",
    job_type: "Full Time",
    experience: "Freshers / Any Graduate",
    salary: "₹2.4 - ₹3.5 LPA + Incentives",
    vacancies: 40,
    skills: "English Fluency,Hindi,Customer Handling,Email Support",
    description: "Handle incoming customer queries for global banking and telecom clients. Day & rotational shifts available with free cab drop facility.",
    requirements: "Any Graduate or 10+2 with good spoken English. Typing speed 25+ WPM. Freshers welcome with free communication training by UDJOG.",
    status: "active",
    posted_at: "Just now"
  },
  {
    id: "job-103",
    title: "Banking Relationship Officer (CASA)",
    company: "TrustFin Bank",
    location: "Vijayawada",
    category: "banking",
    job_type: "Full Time",
    experience: "0-2 Yrs",
    salary: "₹2.8 - ₹4.2 LPA + Bonus",
    vacancies: 20,
    skills: "Banking Products,Customer Relationship,KYC,Sales",
    description: "Responsible for acquisition of new retail banking customers, Current and Savings Account (CASA) operations, and cross-selling banking products.",
    requirements: "Graduate in any stream (B.Com/BBA preferred). Basic banking knowledge, energetic customer interaction, and local language proficiency.",
    status: "active",
    posted_at: "1 day ago"
  },
  {
    id: "job-104",
    title: "Frontend Developer (React / JavaScript)",
    company: "CloudWave Technologies",
    location: "Bengaluru",
    category: "it",
    job_type: "Full Time / Hybrid",
    experience: "1-3 Yrs",
    salary: "₹4.5 - ₹7.0 LPA",
    vacancies: 8,
    skills: "React.js,JavaScript (ES6+),Tailwind CSS,REST APIs",
    description: "Join a fast-growing SaaS team to build high-performance client dashboards and web applications with modern React architecture.",
    requirements: "1+ year experience or strong portfolio projects in React, responsive CSS, and state management. Strong debugging and UI sensibility.",
    status: "active",
    posted_at: "3 days ago"
  },
  {
    id: "job-105",
    title: "Business Development Executive (BDE)",
    company: "EduVibe Infotech",
    location: "Hyderabad",
    category: "sales",
    job_type: "Full Time",
    experience: "Freshers / 0-1 Yr",
    salary: "₹3.0 - ₹4.5 LPA + High Incentives",
    vacancies: 25,
    skills: "Lead Generation,Client Pitching,Negotiation,CRM",
    description: "Connect with prospective clients, conduct product walkthroughs, build pipeline, and close corporate partnerships.",
    requirements: "MBA / BBA / Any degree. Confident presentation and negotiation skills. Willingness to learn corporate sales.",
    status: "active",
    posted_at: "4 days ago"
  },
  {
    id: "job-106",
    title: "Data Analyst Trainee",
    company: "Insight Analytics Corp",
    location: "Remote / Hyderabad",
    category: "it",
    job_type: "Internship / Full Time",
    experience: "Freshers",
    salary: "₹3.2 - ₹4.8 LPA",
    vacancies: 10,
    skills: "Excel (Advanced),SQL,Power BI / Tableau,Python basics",
    description: "Analyze datasets, build automated reporting dashboards, and extract business insights for executive decision making.",
    requirements: "Strong quantitative and analytical skills. Familiarity with SQL queries, Excel Pivot tables, and data visualization.",
    status: "active",
    posted_at: "5 days ago"
  },
  {
    id: "job-107",
    title: "Finance & Accounts Executive",
    company: "Vanguard Audit & Advisory",
    location: "Visakhapatnam",
    category: "banking",
    job_type: "Full Time",
    experience: "0-2 Yrs",
    salary: "₹2.6 - ₹3.8 LPA",
    vacancies: 6,
    skills: "Tally Prime,GST Filing,Bookkeeping,Bank Reconciliation",
    description: "Manage daily ledger entries, vendor invoice verifications, GST return prep, and monthly reconciliation statements.",
    requirements: "B.Com / M.Com / MBA Finance. Practical knowledge of Tally and basic Indian GST regulations.",
    status: "active",
    posted_at: "6 days ago"
  },
  {
    id: "job-108",
    title: "Technical Support Associate",
    company: "Zenith Systems",
    location: "Hyderabad",
    category: "bpo",
    job_type: "Full Time",
    experience: "0-1 Yr",
    salary: "₹2.8 - ₹3.6 LPA",
    vacancies: 18,
    skills: "Networking Basics,Windows OS,Hardware Troubleshooting,Ticketing",
    description: "Provide L1 technical troubleshooting for software installations, network setup, and IT service desk requests.",
    requirements: "B.Sc Computers / Diploma / B.Tech. Good troubleshooting patience and customer service attitude.",
    status: "active",
    posted_at: "1 week ago"
  }
];

let db = null;
let useJsonFallback = false;
let memoryStore = {
  jobs: [],
  candidates: [],
  employers: [],
  admin_users: []
};

function initDatabaseTables(database) {
  database.exec(`
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

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed sample jobs only if table is empty
  const countRow = database.prepare("SELECT COUNT(*) as count FROM jobs;").get();
  if (!countRow || countRow.count === 0) {
    const insertStmt = database.prepare(`
      INSERT INTO jobs (id, title, company, location, category, job_type, salary, experience, vacancies, skills, description, requirements, status, posted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    for (const job of INITIAL_JOBS) {
      insertStmt.run(
        job.id,
        job.title,
        job.company,
        job.location,
        job.category,
        job.job_type,
        job.salary,
        job.experience,
        job.vacancies,
        job.skills,
        job.description,
        job.requirements,
        job.status,
        job.posted_at
      );
    }
    console.log(`✅ Seeded ${INITIAL_JOBS.length} default jobs into SQLite database.`);
  }

  // Backup to JSON
  syncToJsonBackup();
}

function syncToJsonBackup() {
  try {
    if (db && !useJsonFallback) {
      const allJobs = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC;").all();
      const allCandidates = db.prepare("SELECT * FROM candidates ORDER BY created_at DESC;").all();
      const allEmployers = db.prepare("SELECT * FROM employers ORDER BY created_at DESC;").all();
      const store = {
        jobs: allJobs,
        candidates: allCandidates,
        employers: allEmployers,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(store, null, 2), "utf8");
    }
  } catch (err) {
    // Non-blocking
  }
}

function loadJsonStore() {
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const content = fs.readFileSync(BACKUP_FILE, "utf8");
      memoryStore = JSON.parse(content);
      if (!memoryStore.jobs || memoryStore.jobs.length === 0) {
        memoryStore.jobs = [...INITIAL_JOBS];
      }
      return;
    } catch (e) {}
  }
  memoryStore.jobs = [...INITIAL_JOBS];
  saveJsonStore();
}

function saveJsonStore() {
  try {
    memoryStore.lastUpdated = new Date().toISOString();
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(memoryStore, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save JSON store:", err);
  }
}

// Try initializing Node 22 built-in SQLite
try {
  const { DatabaseSync } = require("node:sqlite");
  db = new DatabaseSync(DB_FILE);
  initDatabaseTables(db);
} catch (err) {
  console.warn("⚠️ SQLite initialization note:", err.message);
  console.warn("📁 Using persistent JSON database engine as fallback.");
  useJsonFallback = true;
  loadJsonStore();
}

// ===== API IMPLEMENTATION =====

function formatJob(row) {
  if (!row) return null;
  let skills = [];
  if (Array.isArray(row.skills)) {
    skills = row.skills;
  } else if (typeof row.skills === "string") {
    skills = row.skills.split(",").map(s => s.trim()).filter(Boolean);
  }
  return {
    ...row,
    skills,
    vacancies: Number(row.vacancies) || 1
  };
}

// 1. Get Jobs (Public with Search & Filter)
function getJobs(filters = {}) {
  const keyword = (filters.q || filters.search || "").trim().toLowerCase();
  const category = (filters.category || "all").toLowerCase();
  const location = (filters.location || "all").toLowerCase();
  const type = (filters.type || "all").toLowerCase();

  let jobs = [];
  if (db && !useJsonFallback) {
    jobs = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC;").all();
  } else {
    jobs = memoryStore.jobs || [];
  }

  // Filter
  const filtered = jobs.filter(job => {
    // Only active jobs
    if (job.status && job.status !== "active") return false;

    // Category
    if (category !== "all" && (job.category || "").toLowerCase() !== category) return false;

    // Location
    if (location !== "all" && !(job.location || "").toLowerCase().includes(location)) return false;

    // Job Type
    if (type !== "all" && !(job.job_type || "").toLowerCase().includes(type)) return false;

    // Keyword search
    if (keyword) {
      const inTitle = (job.title || "").toLowerCase().includes(keyword);
      const inCompany = (job.company || "").toLowerCase().includes(keyword);
      const inSkills = (job.skills || "").toLowerCase().includes(keyword);
      const inDesc = (job.description || "").toLowerCase().includes(keyword);
      if (!inTitle && !inCompany && !inSkills && !inDesc) return false;
    }

    return true;
  });

  return filtered.map(formatJob);
}

// 2. Get Single Job
function getJobById(id) {
  if (db && !useJsonFallback) {
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?;").get(id);
    return formatJob(row);
  }
  const job = (memoryStore.jobs || []).find(j => String(j.id) === String(id));
  return formatJob(job);
}

// 3. Get All Jobs (Admin - includes closed/drafts)
function getAllJobsAdmin() {
  let jobs = [];
  if (db && !useJsonFallback) {
    jobs = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC;").all();
  } else {
    jobs = memoryStore.jobs || [];
  }
  return jobs.map(formatJob);
}

// 4. Create Job (Admin)
function createJob(jobData) {
  const id = jobData.id || "job-" + Date.now().toString().slice(-6);
  const skillsStr = Array.isArray(jobData.skills)
    ? jobData.skills.join(",")
    : (jobData.skills || "");
  const vacancies = Number(jobData.vacancies) || 1;
  const status = jobData.status || "active";
  const posted_at = jobData.posted_at || "Just now";

  const newJob = {
    id,
    title: jobData.title || "Untitled Position",
    company: jobData.company || "Company",
    location: jobData.location || "Hyderabad",
    category: (jobData.category || "it").toLowerCase(),
    job_type: jobData.job_type || "Full Time",
    salary: jobData.salary || "Competitive",
    experience: jobData.experience || "Freshers",
    vacancies,
    skills: skillsStr,
    description: jobData.description || "",
    requirements: jobData.requirements || "",
    status,
    posted_at,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (db && !useJsonFallback) {
    db.prepare(`
      INSERT INTO jobs (id, title, company, location, category, job_type, salary, experience, vacancies, skills, description, requirements, status, posted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      newJob.id,
      newJob.title,
      newJob.company,
      newJob.location,
      newJob.category,
      newJob.job_type,
      newJob.salary,
      newJob.experience,
      newJob.vacancies,
      newJob.skills,
      newJob.description,
      newJob.requirements,
      newJob.status,
      newJob.posted_at,
      newJob.created_at,
      newJob.updated_at
    );
    syncToJsonBackup();
  } else {
    memoryStore.jobs.unshift(newJob);
    saveJsonStore();
  }

  return formatJob(newJob);
}

// 5. Update Job (Admin)
function updateJob(id, jobData) {
  const skillsStr = Array.isArray(jobData.skills)
    ? jobData.skills.join(",")
    : (jobData.skills || "");
  const vacancies = Number(jobData.vacancies) || 1;
  const status = jobData.status || "active";
  const updated_at = new Date().toISOString();

  if (db && !useJsonFallback) {
    db.prepare(`
      UPDATE jobs
      SET title = ?, company = ?, location = ?, category = ?, job_type = ?, salary = ?,
          experience = ?, vacancies = ?, skills = ?, description = ?, requirements = ?,
          status = ?, updated_at = ?
      WHERE id = ?;
    `).run(
      jobData.title,
      jobData.company,
      jobData.location,
      (jobData.category || "it").toLowerCase(),
      jobData.job_type || "Full Time",
      jobData.salary,
      jobData.experience,
      vacancies,
      skillsStr,
      jobData.description,
      jobData.requirements,
      status,
      updated_at,
      id
    );
    syncToJsonBackup();
    return getJobById(id);
  }

  const idx = (memoryStore.jobs || []).findIndex(j => String(j.id) === String(id));
  if (idx !== -1) {
    memoryStore.jobs[idx] = {
      ...memoryStore.jobs[idx],
      ...jobData,
      skills: skillsStr,
      vacancies,
      status,
      updated_at
    };
    saveJsonStore();
    return formatJob(memoryStore.jobs[idx]);
  }
  return null;
}

// 6. Delete Job (Admin)
function deleteJob(id) {
  if (db && !useJsonFallback) {
    db.prepare("DELETE FROM jobs WHERE id = ?;").run(id);
    syncToJsonBackup();
    return true;
  }
  const beforeLen = (memoryStore.jobs || []).length;
  memoryStore.jobs = memoryStore.jobs.filter(j => String(j.id) !== String(id));
  saveJsonStore();
  return memoryStore.jobs.length < beforeLen;
}

// 7. Candidate Application Submit
function createCandidateApplication(data) {
  const id = "cand-" + Date.now().toString();
  const app = {
    id,
    full_name: data.full_name || "",
    email: data.email || "",
    phone: data.phone || "",
    qualification: data.qualification || "",
    passout_year: data.passout_year || "",
    experience: data.experience || "",
    role_category: data.role_category || "",
    location: data.location || "",
    resume_link: data.resume_link || "",
    message: data.message || "",
    applied_job: data.applied_job || "General Candidate Application",
    created_at: new Date().toISOString()
  };

  if (db && !useJsonFallback) {
    db.prepare(`
      INSERT INTO candidates (id, full_name, email, phone, qualification, passout_year, experience, role_category, location, resume_link, message, applied_job, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      app.id,
      app.full_name,
      app.email,
      app.phone,
      app.qualification,
      app.passout_year,
      app.experience,
      app.role_category,
      app.location,
      app.resume_link,
      app.message,
      app.applied_job,
      app.created_at
    );
    syncToJsonBackup();
  } else {
    if (!memoryStore.candidates) memoryStore.candidates = [];
    memoryStore.candidates.unshift(app);
    saveJsonStore();
  }

  return app;
}

function getCandidateApplications() {
  if (db && !useJsonFallback) {
    return db.prepare("SELECT * FROM candidates ORDER BY created_at DESC;").all();
  }
  return memoryStore.candidates || [];
}

function deleteCandidateApplication(id) {
  if (db && !useJsonFallback) {
    db.prepare("DELETE FROM candidates WHERE id = ?;").run(id);
    syncToJsonBackup();
    return true;
  }
  memoryStore.candidates = (memoryStore.candidates || []).filter(c => String(c.id) !== String(id));
  saveJsonStore();
  return true;
}

// 8. Employer Job Submission
function createEmployerSubmission(data) {
  const id = "emp-" + Date.now().toString();
  const sub = {
    id,
    company_name: data.company_name || "",
    contact_person: data.contact_person || "",
    email: data.email || "",
    phone: data.phone || "",
    website: data.website || "",
    job_title: data.job_title || "",
    department: data.department || "",
    job_type: data.job_type || "Full Time",
    location: data.location || "",
    salary_ctc: data.salary_ctc || "",
    vacancies: Number(data.vacancies) || 1,
    description: data.description || "",
    status: "pending",
    created_at: new Date().toISOString()
  };

  if (db && !useJsonFallback) {
    db.prepare(`
      INSERT INTO employers (id, company_name, contact_person, email, phone, website, job_title, department, job_type, location, salary_ctc, vacancies, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      sub.id,
      sub.company_name,
      sub.contact_person,
      sub.email,
      sub.phone,
      sub.website,
      sub.job_title,
      sub.department,
      sub.job_type,
      sub.location,
      sub.salary_ctc,
      sub.vacancies,
      sub.description,
      sub.status,
      sub.created_at
    );
    syncToJsonBackup();
  } else {
    if (!memoryStore.employers) memoryStore.employers = [];
    memoryStore.employers.unshift(sub);
    saveJsonStore();
  }

  return sub;
}

function getEmployerSubmissions() {
  if (db && !useJsonFallback) {
    return db.prepare("SELECT * FROM employers ORDER BY created_at DESC;").all();
  }
  return memoryStore.employers || [];
}

function updateEmployerSubmissionStatus(id, status) {
  if (db && !useJsonFallback) {
    db.prepare("UPDATE employers SET status = ? WHERE id = ?;").run(status, id);
    syncToJsonBackup();
    return true;
  }
  const emp = (memoryStore.employers || []).find(e => String(e.id) === String(id));
  if (emp) {
    emp.status = status;
    saveJsonStore();
    return true;
  }
  return false;
}

function deleteEmployerSubmission(id) {
  if (db && !useJsonFallback) {
    db.prepare("DELETE FROM employers WHERE id = ?;").run(id);
    syncToJsonBackup();
    return true;
  }
  memoryStore.employers = (memoryStore.employers || []).filter(e => String(e.id) !== String(id));
  saveJsonStore();
  return true;
}

// 9. Stats Summary (Real Database Counters for Dashboard)
function getStats() {
  let totalJobs = 0;
  let categoriesCount = 0;
  let totalCandidates = 0;
  let totalEmployers = 0;

  if (db && !useJsonFallback) {
    const jobRow = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'active';").get();
    totalJobs = jobRow ? jobRow.count : 0;

    const catRow = db.prepare("SELECT COUNT(DISTINCT LOWER(category)) as count FROM jobs WHERE status = 'active';").get();
    categoriesCount = catRow ? catRow.count : 0;

    const candRow = db.prepare("SELECT COUNT(*) as count FROM candidates;").get();
    totalCandidates = candRow ? candRow.count : 0;

    const empRow = db.prepare("SELECT COUNT(*) as count FROM employers;").get();
    totalEmployers = empRow ? empRow.count : 0;
  } else {
    totalJobs = (memoryStore.jobs || []).filter(j => j.status === "active").length;
    const cats = new Set((memoryStore.jobs || []).filter(j => j.status === "active").map(j => (j.category || "").toLowerCase()));
    categoriesCount = cats.size;
    totalCandidates = (memoryStore.candidates || []).length;
    totalEmployers = (memoryStore.employers || []).length;
  }

  return {
    total_jobs: totalJobs,
    categories_count: Math.max(categoriesCount, 1),
    total_candidates: totalCandidates,
    total_employers: totalEmployers
  };
}

module.exports = {
  getJobs,
  getJobById,
  getAllJobsAdmin,
  createJob,
  updateJob,
  deleteJob,
  createCandidateApplication,
  getCandidateApplications,
  deleteCandidateApplication,
  createEmployerSubmission,
  getEmployerSubmissions,
  updateEmployerSubmissionStatus,
  deleteEmployerSubmission,
  getStats
};
