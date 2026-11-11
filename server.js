// ===== UDJOG C2C SERVICES - FULL STACK NODE.JS BACKEND SERVER =====
// Provides real SQLite Database REST APIs and Static Frontend Serving

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const db = require("./database/db.js");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

// MIME types mapping
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

// Helper to send JSON responses with CORS
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

// Helper to parse incoming JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) {
        // 5MB limit
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON: " + err.message));
      }
    });
    req.on("error", reject);
  });
}

// Get local IPv4 address for mobile / tablet testing
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }

  // ==========================================
  // ===== 1. REST API ENDPOINTS (/api/...) =====
  // ==========================================

  // --- STATS (Live database counters) ---
  if (pathname === "/api/stats" && method === "GET") {
    try {
      const stats = db.getStats();
      return sendJson(res, 200, stats);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- JOBS: Public Search & Filter ---
  if (pathname === "/api/jobs" && method === "GET") {
    try {
      const filters = {
        q: parsedUrl.searchParams.get("q") || parsedUrl.searchParams.get("search"),
        category: parsedUrl.searchParams.get("category"),
        location: parsedUrl.searchParams.get("location"),
        type: parsedUrl.searchParams.get("type")
      };
      const jobs = db.getJobs(filters);
      return sendJson(res, 200, jobs);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- SINGLE JOB ---
  if (pathname.startsWith("/api/jobs/") && method === "GET") {
    try {
      const id = pathname.replace("/api/jobs/", "");
      const job = db.getJobById(id);
      if (!job) return sendJson(res, 404, { error: "Job not found" });
      return sendJson(res, 200, job);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- CANDIDATE APPLICATIONS ---
  if (pathname === "/api/applications") {
    if (method === "POST") {
      try {
        const body = await parseJsonBody(req);
        if (!body.full_name || !body.email || !body.phone) {
          return sendJson(res, 400, { error: "Name, email, and phone are required" });
        }
        const app = db.createCandidateApplication(body);
        const stats = db.getStats();
        return sendJson(res, 201, { success: true, application: app, stats });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }
    if (method === "GET") {
      try {
        const apps = db.getCandidateApplications();
        return sendJson(res, 200, apps);
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
  }

  if (pathname.startsWith("/api/applications/") && method === "DELETE") {
    try {
      const id = pathname.replace("/api/applications/", "");
      db.deleteCandidateApplication(id);
      return sendJson(res, 200, { success: true, id });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- EMPLOYER SUBMISSIONS ---
  if (pathname === "/api/employers") {
    if (method === "POST") {
      try {
        const body = await parseJsonBody(req);
        if (!body.company_name || !body.contact_person || !body.phone || !body.job_title) {
          return sendJson(res, 400, { error: "Company, contact person, phone and job title are required" });
        }
        const sub = db.createEmployerSubmission(body);
        const stats = db.getStats();
        return sendJson(res, 201, { success: true, submission: sub, stats });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }
    if (method === "GET") {
      try {
        const subs = db.getEmployerSubmissions();
        return sendJson(res, 200, subs);
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
  }

  if (pathname.startsWith("/api/employers/") && method === "DELETE") {
    try {
      const id = pathname.replace("/api/employers/", "");
      db.deleteEmployerSubmission(id);
      return sendJson(res, 200, { success: true, id });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- ADMIN AUTH ---
  if (pathname === "/api/admin/login" && method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const { username, password } = body;
      if (username === "admin" && (password === "udjog2026" || password === process.env.ADMIN_PASSWORD)) {
        return sendJson(res, 200, {
          success: true,
          token: "udjog_admin_" + Date.now(),
          user: { username: "admin", role: "administrator" }
        });
      }
      return sendJson(res, 401, { success: false, message: "Invalid username or password" });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // --- ADMIN: ALL JOBS (including draft/closed) ---
  if (pathname === "/api/admin/jobs") {
    if (method === "GET") {
      try {
        const jobs = db.getAllJobsAdmin();
        return sendJson(res, 200, jobs);
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
    if (method === "POST") {
      try {
        const body = await parseJsonBody(req);
        if (!body.title || !body.company) {
          return sendJson(res, 400, { error: "Job title and company name are required" });
        }
        const created = db.createJob(body);
        return sendJson(res, 201, { success: true, job: created });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
  }

  // --- ADMIN: EDIT / DELETE JOB ---
  if (pathname.startsWith("/api/admin/jobs/")) {
    const id = pathname.replace("/api/admin/jobs/", "");
    if (method === "PUT") {
      try {
        const body = await parseJsonBody(req);
        const updated = db.updateJob(id, body);
        return sendJson(res, 200, { success: true, job: updated });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
    if (method === "DELETE") {
      try {
        db.deleteJob(id);
        return sendJson(res, 200, { success: true, id });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
  }

  // ==========================================
  // ===== 2. STATIC ASSET & HTML SERVING =====
  // ==========================================

  let relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");

  // Prevent directory traversal
  const safePath = path.normalize(path.join(PUBLIC_DIR, relativePath));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("Forbidden");
  }

  // Check if file exists, or check with .html extension
  let filePath = safePath;
  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(filePath + ".html")) {
      filePath = filePath + ".html";
    } else {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(`
        <!doctype html>
        <html>
        <head><title>404 Not Found</title><link rel="stylesheet" href="/css/style.css"></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;font-family:sans-serif;">
          <div>
            <h1 style="font-size:3rem;color:#1a3a6b;">404 - Page Not Found</h1>
            <p style="color:#64748b;margin:12px 0 24px;">The requested URL was not found on this server.</p>
            <a href="/" class="btn btn-primary" style="padding:10px 20px;text-decoration:none;">Go to Homepage</a>
          </div>
        </body>
        </html>
      `);
    }
  }

  // If path is a directory, look for index.html inside it
  if (fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, "index.html");
    if (fs.existsSync(indexPath)) {
      filePath = indexPath;
    } else {
      res.writeHead(403, { "Content-Type": "text/plain" });
      return res.end("Directory listing forbidden");
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*"
    });
    stream.pipe(res);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server Error: " + err.message);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const localIp = getLocalIp();
  console.log("\n========================================================");
  console.log("🚀 UDJOG C2C SERVICES SERVER IS LIVE!");
  console.log("========================================================");
  console.log(`📡 Local Desktop:   http://localhost:${PORT}`);
  console.log(`📱 Mobile & Tablet: http://${localIp}:${PORT}`);
  console.log(`🔐 Admin URL:       http://localhost:${PORT}/admin/login.html`);
  console.log(`💾 Database:        ${path.join(__dirname, "database", "udjog.db")}`);
  console.log("========================================================\n");
});

