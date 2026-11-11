// ===== UDJOG C2C SERVICES - PUBLIC JOBS ROUTE =====

export async function handleGetJobs(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const location = url.searchParams.get("location");
  const type = url.searchParams.get("type");
  const search = url.searchParams.get("q") || url.searchParams.get("search");

  if (env.DB) {
    try {
      let query = "SELECT * FROM jobs WHERE status = 'active'";
      const params = [];

      if (category && category !== "all") {
        query += " AND LOWER(category) = LOWER(?)";
        params.push(category);
      }
      if (location && location !== "all") {
        query += " AND LOWER(location) LIKE LOWER(?)";
        params.push(`%${location}%`);
      }
      if (type && type !== "all") {
        query += " AND LOWER(job_type) LIKE LOWER(?)";
        params.push(`%${type}%`);
      }
      if (search) {
        query += " AND (LOWER(title) LIKE LOWER(?) OR LOWER(company) LIKE LOWER(?) OR LOWER(skills) LIKE LOWER(?))";
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      query += " ORDER BY created_at DESC";

      const stmt = env.DB.prepare(query).bind(...params);
      const { results } = await stmt.all();

      const formatted = (results || []).map(r => ({
        ...r,
        skills: typeof r.skills === "string" ? r.skills.split(",").map(s => s.trim()) : r.skills
      }));

      return new Response(JSON.stringify(formatted), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Fallback demo response if D1 is not bound
  return new Response(JSON.stringify([]), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

export async function handleGetJobById(request, env, id) {
  if (env.DB) {
    try {
      const stmt = env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(id);
      const job = await stmt.first();
      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      return new Response(JSON.stringify({
        ...job,
        skills: typeof job.skills === "string" ? job.skills.split(",").map(s => s.trim()) : job.skills
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Database not connected" }), {
    status: 503,
    headers: { "Content-Type": "application/json" }
  });
}

