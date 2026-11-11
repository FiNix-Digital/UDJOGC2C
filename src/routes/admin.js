// ===== UDJOG C2C SERVICES - ADMIN ROUTES =====

import { validateJob } from "../utils/validation.js";

export async function handleAdminLogin(request, env) {
  try {
    const { username, password } = await request.json();
    if (username === "admin" && (password === "udjog2026" || password === env.ADMIN_PASSWORD)) {
      const token = "admin_token_" + Date.now();
      return new Response(JSON.stringify({ success: true, token }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}

export async function handleAdminGetJobs(request, env) {
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
      const formatted = (results || []).map(r => ({
        ...r,
        skills: typeof r.skills === "string" ? r.skills.split(",").map(s => s.trim()) : r.skills
      }));
      return new Response(JSON.stringify(formatted), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch(err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
  return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
}

export async function handleAdminCreateJob(request, env) {
  try {
    const body = await request.json();
    const validation = validateJob(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: "Validation failed", details: validation.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const id = body.id || "job-" + Date.now().toString().slice(-6);
    const skillsStr = Array.isArray(body.skills) ? body.skills.join(",") : (body.skills || "");

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO jobs (id, title, company, location, category, job_type, salary, experience, vacancies, skills, description, requirements, status, posted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.title,
        body.company,
        body.location,
        body.category || "it",
        body.job_type || "Full Time",
        body.salary || "Competitive",
        body.experience || "Freshers",
        body.vacancies || 1,
        skillsStr,
        body.description,
        body.requirements || "",
        body.status || "active",
        body.posted_at || "Just now"
      ).run();
    }

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function handleAdminUpdateJob(request, env, id) {
  try {
    const body = await request.json();
    const skillsStr = Array.isArray(body.skills) ? body.skills.join(",") : (body.skills || "");

    if (env.DB) {
      await env.DB.prepare(`
        UPDATE jobs
        SET title = ?, company = ?, location = ?, category = ?, job_type = ?, salary = ?,
            experience = ?, vacancies = ?, skills = ?, description = ?, requirements = ?,
            status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        body.title,
        body.company,
        body.location,
        body.category,
        body.job_type,
        body.salary,
        body.experience,
        body.vacancies,
        skillsStr,
        body.description,
        body.requirements,
        body.status,
        id
      ).run();
    }

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function handleAdminDeleteJob(request, env, id) {
  try {
    if (env.DB) {
      await env.DB.prepare("DELETE FROM jobs WHERE id = ?").bind(id).run();
    }
    return new Response(JSON.stringify({ success: true, id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

