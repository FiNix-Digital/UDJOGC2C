// ===== UDJOG C2C SERVICES - MAIN CLOUDFLARE WORKER ROUTER =====

import { handleGetJobs, handleGetJobById } from "./routes/jobs.js";
import {
  handleAdminLogin,
  handleAdminGetJobs,
  handleAdminCreateJob,
  handleAdminUpdateJob,
  handleAdminDeleteJob
} from "./routes/admin.js";

// Helper to auto-initialize D1 tables if they don't exist yet
async function ensureD1Tables(db) {
  try {
    await db.exec(`
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
    `);

    // Check if initial jobs need to be seeded
    const countRow = await db.prepare("SELECT COUNT(*) as c FROM jobs").first();
    if (!countRow || countRow.c === 0) {
      await db.exec(`
        INSERT OR IGNORE INTO jobs (id, title, company, location, category, job_type, salary, experience, vacancies, skills, description, requirements, status, posted_at) VALUES
        ('job-101', 'Junior Java Full Stack Developer', 'NexTech Solutions', 'Hyderabad', 'it', 'Full Time', '₹3.6 - ₹5.0 LPA', 'Freshers / 0-1 Yr', 15, 'Java,Spring Boot,MySQL,React', 'Looking for enthusiastic freshers and entry-level Java developers with strong OOPs concepts.', 'B.Tech/MCA/B.Sc Computers (2024-2026 batches).', 'active', '2 days ago'),
        ('job-102', 'Customer Support Executive (Voice / Non-Voice)', 'Apex Global BPO', 'Hyderabad', 'bpo', 'Full Time', '₹2.4 - ₹3.5 LPA', 'Freshers / Any Graduate', 40, 'English Fluency,Customer Handling,Email Support', 'Handle incoming customer queries for global banking and telecom clients.', 'Any Graduate or 10+2 with good spoken English.', 'active', 'Just now'),
        ('job-103', 'Banking Relationship Officer (CASA)', 'TrustFin Bank', 'Vijayawada', 'banking', 'Full Time', '₹2.8 - ₹4.2 LPA', '0-2 Yrs', 20, 'Banking Products,Customer Relationship,KYC', 'Responsible for acquisition of new retail banking customers and CASA accounts.', 'Graduate in any stream (B.Com/BBA preferred).', 'active', '1 day ago'),
        ('job-104', 'Business Development Executive (BDE)', 'EduVibe Infotech', 'Hyderabad', 'sales', 'Full Time', '₹3.0 - ₹4.5 LPA', 'Freshers / 0-1 Yr', 25, 'Lead Generation,Client Pitching,Negotiation', 'Connect with prospective clients, conduct product walkthroughs, and close sales.', 'MBA / BBA / Any degree.', 'active', '4 days ago');
      `);
    }
  } catch (err) {
    console.warn("D1 table check note:", err.message);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    };

    // Ensure D1 database tables exist
    if (env.DB) {
      ctx.waitUntil(ensureD1Tables(env.DB));
    }

    // --- Stats API ---
    if (pathname === "/api/stats" && method === "GET") {
      if (env.DB) {
        try {
          const j = await env.DB.prepare("SELECT COUNT(*) as c FROM jobs WHERE status = 'active'").first();
          const cats = await env.DB.prepare("SELECT COUNT(DISTINCT LOWER(category)) as c FROM jobs WHERE status = 'active'").first();
          const cand = await env.DB.prepare("SELECT COUNT(*) as c FROM candidates").first();
          const emp = await env.DB.prepare("SELECT COUNT(*) as c FROM employers").first();
          return new Response(JSON.stringify({
            total_jobs: j?.c || 0,
            categories_count: cats?.c || 1,
            total_candidates: cand?.c || 0,
            total_employers: emp?.c || 0
          }), { headers: corsHeaders });
        } catch (e) {}
      }
      return new Response(JSON.stringify({ total_jobs: 4, categories_count: 4, total_candidates: 0, total_employers: 0 }), { headers: corsHeaders });
    }

    // --- Candidate Applications ---
    if (pathname === "/api/applications") {
      if (method === "POST") {
        try {
          const body = await request.json();
          const id = "cand-" + Date.now();
          if (env.DB) {
            await env.DB.prepare(`
              INSERT INTO candidates (id, full_name, email, phone, qualification, passout_year, experience, role_category, location, resume_link, message, applied_job)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              id, body.full_name || "", body.email || "", body.phone || "", body.qualification || "",
              body.passout_year || "", body.experience || "", body.role_category || "", body.location || "",
              body.resume_link || "", body.message || "", body.applied_job || "General Application"
            ).run();
          }
          return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders, status: 201 });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
        }
      }
      if (method === "GET") {
        if (env.DB) {
          const { results } = await env.DB.prepare("SELECT * FROM candidates ORDER BY created_at DESC").all();
          return new Response(JSON.stringify(results || []), { headers: corsHeaders });
        }
        return new Response(JSON.stringify([]), { headers: corsHeaders });
      }
    }

    if (pathname.startsWith("/api/applications/") && method === "DELETE") {
      const id = pathname.replace("/api/applications/", "");
      if (env.DB) {
        await env.DB.prepare("DELETE FROM candidates WHERE id = ?").bind(id).run();
      }
      return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
    }

    // --- Employer Submissions ---
    if (pathname === "/api/employers") {
      if (method === "POST") {
        try {
          const body = await request.json();
          const id = "emp-" + Date.now();
          if (env.DB) {
            await env.DB.prepare(`
              INSERT INTO employers (id, company_name, contact_person, email, phone, website, job_title, department, job_type, location, salary_ctc, vacancies, description, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              id, body.company_name || "", body.contact_person || "", body.email || "", body.phone || "",
              body.website || "", body.job_title || "", body.department || "", body.job_type || "Full Time",
              body.location || "", body.salary_ctc || "", Number(body.vacancies) || 1, body.description || "", "pending"
            ).run();
          }
          return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders, status: 201 });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
        }
      }
      if (method === "GET") {
        if (env.DB) {
          const { results } = await env.DB.prepare("SELECT * FROM employers ORDER BY created_at DESC").all();
          return new Response(JSON.stringify(results || []), { headers: corsHeaders });
        }
        return new Response(JSON.stringify([]), { headers: corsHeaders });
      }
    }

    if (pathname.startsWith("/api/employers/") && method === "DELETE") {
      const id = pathname.replace("/api/employers/", "");
      if (env.DB) {
        await env.DB.prepare("DELETE FROM employers WHERE id = ?").bind(id).run();
      }
      return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
    }

    // ===== JOBS PUBLIC ROUTES =====
    if (pathname === "/api/jobs" && method === "GET") {
      return handleGetJobs(request, env);
    }

    if (pathname.startsWith("/api/jobs/") && method === "GET") {
      const id = pathname.replace("/api/jobs/", "");
      return handleGetJobById(request, env, id);
    }

    // ===== ADMIN ROUTES =====
    if (pathname === "/api/admin/login" && method === "POST") {
      return handleAdminLogin(request, env);
    }

    if (pathname === "/api/admin/jobs") {
      if (method === "GET") return handleAdminGetJobs(request, env);
      if (method === "POST") return handleAdminCreateJob(request, env);
    }

    if (pathname.startsWith("/api/admin/jobs/")) {
      const id = pathname.replace("/api/admin/jobs/", "");
      if (method === "PUT") return handleAdminUpdateJob(request, env, id);
      if (method === "DELETE") return handleAdminDeleteJob(request, env, id);
    }

    // Static Assets handler (Serves HTML, CSS, JS, Images, Admin files)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("UDJOG C2C Services API is active", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
