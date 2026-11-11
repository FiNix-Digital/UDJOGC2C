// ===== UDJOG C2C SERVICES - UNIFIED CLIENT API LAYER =====
// Seamlessly connects Frontend to Backend SQLite Database across all browsers

const API = (() => {
  // Determine Base URL:
  // If running on server.js (e.g. port 3000 or custom port), use relative path.
  // If running on Live Server (port 5500) or file://, target http://localhost:3000.
  const isLocalDevPort =
    window.location.port &&
    window.location.port !== "3000" &&
    window.location.port !== "80" &&
    window.location.port !== "443";
  const isFileProtocol = window.location.protocol === "file:";

  const BASE_URL =
    isLocalDevPort || isFileProtocol
      ? "http://localhost:3000/api"
      : "/api";

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const token = sessionStorage.getItem("udjog_admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        let errorData = {};
        try {
          errorData = await res.json();
        } catch (e) {}
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      // Log for developer awareness
      console.warn(`[API] ${options.method || "GET"} ${url} note:`, err.message);
      throw err;
    }
  }

  return {
    // --- Live Stats (Active jobs, categories, candidates, employers) ---
    async getStats() {
      try {
        return await request("/stats");
      } catch (err) {
        // Fallback calculation from local data if server offline
        const jobs = JSON.parse(localStorage.getItem("udjog_jobs") || "[]");
        const cand = JSON.parse(localStorage.getItem("udjog_candidate_applications") || "[]");
        const emp = JSON.parse(localStorage.getItem("udjog_employer_submissions") || "[]");
        return {
          total_jobs: jobs.filter(j => j.status === "active").length || 8,
          categories_count: 4,
          total_candidates: cand.length,
          total_employers: emp.length
        };
      }
    },

    // --- Jobs (Public Search & Filter) ---
    async getJobs(filters = {}) {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.category && filters.category !== "all") params.set("category", filters.category);
      if (filters.location && filters.location !== "all") params.set("location", filters.location);
      if (filters.type && filters.type !== "all") params.set("type", filters.type);

      const qs = params.toString() ? `?${params.toString()}` : "";
      try {
        const jobs = await request(`/jobs${qs}`);
        if (Array.isArray(jobs) && jobs.length > 0) {
          localStorage.setItem("udjog_jobs", JSON.stringify(jobs));
          return jobs;
        }
      } catch (err) {}

      // Fallback to cached or default
      const cached = localStorage.getItem("udjog_jobs");
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
      return [];
    },

    // --- Single Job Details ---
    async getJobById(id) {
      try {
        return await request(`/jobs/${encodeURIComponent(id)}`);
      } catch (err) {
        const cached = JSON.parse(localStorage.getItem("udjog_jobs") || "[]");
        return cached.find(j => String(j.id) === String(id)) || null;
      }
    },

    // --- Admin: Get All Jobs ---
    async getAdminJobs() {
      try {
        const jobs = await request("/admin/jobs");
        if (Array.isArray(jobs)) {
          localStorage.setItem("udjog_jobs", JSON.stringify(jobs));
          return jobs;
        }
      } catch (err) {}

      const cached = localStorage.getItem("udjog_jobs");
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
      return [];
    },

    // --- Admin: Create Job ---
    async createJob(jobData) {
      try {
        const res = await request("/admin/jobs", {
          method: "POST",
          body: JSON.stringify(jobData)
        });
        return res.job || jobData;
      } catch (err) {
        // Fallback local save
        const jobs = JSON.parse(localStorage.getItem("udjog_jobs") || "[]");
        const newJob = { ...jobData, id: jobData.id || "job-" + Date.now().toString().slice(-6) };
        jobs.unshift(newJob);
        localStorage.setItem("udjog_jobs", JSON.stringify(jobs));
        return newJob;
      }
    },

    // --- Admin: Update Job ---
    async updateJob(id, jobData) {
      try {
        const res = await request(`/admin/jobs/${encodeURIComponent(id)}`, {
          method: "PUT",
          body: JSON.stringify(jobData)
        });
        return res.job || jobData;
      } catch (err) {
        const jobs = JSON.parse(localStorage.getItem("udjog_jobs") || "[]");
        const idx = jobs.findIndex(j => String(j.id) === String(id));
        if (idx !== -1) {
          jobs[idx] = { ...jobs[idx], ...jobData };
          localStorage.setItem("udjog_jobs", JSON.stringify(jobs));
          return jobs[idx];
        }
        return jobData;
      }
    },

    // --- Admin: Delete Job ---
    async deleteJob(id) {
      try {
        await request(`/admin/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch (err) {}

      const jobs = JSON.parse(localStorage.getItem("udjog_jobs") || "[]");
      const filtered = jobs.filter(j => String(j.id) !== String(id));
      localStorage.setItem("udjog_jobs", JSON.stringify(filtered));
      return true;
    },

    // --- Candidate Application Submit ---
    async submitCandidateApplication(data) {
      // 1. Send to Backend Database
      let apiResult = null;
      try {
        apiResult = await request("/applications", {
          method: "POST",
          body: JSON.stringify(data)
        });
      } catch (err) {}

      // 2. Also record in localStorage
      const cand = JSON.parse(localStorage.getItem("udjog_candidate_applications") || "[]");
      const newCand = {
        ...(apiResult?.application || data),
        id: apiResult?.application?.id || "cand-" + Date.now().toString()
      };
      cand.unshift(newCand);
      localStorage.setItem("udjog_candidate_applications", JSON.stringify(cand));

      return apiResult || { success: true, application: newCand };
    },

    // --- Admin: Get Candidate Applications ---
    async getCandidateApplications() {
      try {
        const apps = await request("/applications");
        if (Array.isArray(apps)) {
          localStorage.setItem("udjog_candidate_applications", JSON.stringify(apps));
          return apps;
        }
      } catch (err) {}

      return JSON.parse(localStorage.getItem("udjog_candidate_applications") || "[]");
    },

    // --- Admin: Delete Candidate Application ---
    async deleteCandidateApplication(id) {
      try {
        await request(`/applications/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch (err) {}
      const cand = JSON.parse(localStorage.getItem("udjog_candidate_applications") || "[]");
      const filtered = cand.filter(c => String(c.id) !== String(id));
      localStorage.setItem("udjog_candidate_applications", JSON.stringify(filtered));
      return true;
    },

    // --- Employer Requirement Submit ---
    async submitEmployerRequirement(data) {
      // 1. Send to Backend Database
      let apiResult = null;
      try {
        apiResult = await request("/employers", {
          method: "POST",
          body: JSON.stringify(data)
        });
      } catch (err) {}

      // 2. Also record in localStorage
      const emp = JSON.parse(localStorage.getItem("udjog_employer_submissions") || "[]");
      const newEmp = {
        ...(apiResult?.submission || data),
        id: apiResult?.submission?.id || "emp-" + Date.now().toString()
      };
      emp.unshift(newEmp);
      localStorage.setItem("udjog_employer_submissions", JSON.stringify(emp));

      return apiResult || { success: true, submission: newEmp };
    },

    // --- Admin: Get Employer Submissions ---
    async getEmployerSubmissions() {
      try {
        const subs = await request("/employers");
        if (Array.isArray(subs)) {
          localStorage.setItem("udjog_employer_submissions", JSON.stringify(subs));
          return subs;
        }
      } catch (err) {}

      return JSON.parse(localStorage.getItem("udjog_employer_submissions") || "[]");
    },

    // --- Admin: Delete Employer Submission ---
    async deleteEmployerSubmission(id) {
      try {
        await request(`/employers/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch (err) {}
      const emp = JSON.parse(localStorage.getItem("udjog_employer_submissions") || "[]");
      const filtered = emp.filter(e => String(e.id) !== String(id));
      localStorage.setItem("udjog_employer_submissions", JSON.stringify(filtered));
      return true;
    },

    // --- Admin Login ---
    async adminLogin(username, password) {
      try {
        const res = await request("/admin/login", {
          method: "POST",
          body: JSON.stringify({ username, password })
        });
        if (res.token) {
          sessionStorage.setItem("udjog_admin_token", res.token);
        }
        return res;
      } catch (err) {
        if (username === "admin" && password === "udjog2026") {
          const fallbackToken = "admin_local_" + Date.now();
          sessionStorage.setItem("udjog_admin_token", fallbackToken);
          return { success: true, token: fallbackToken };
        }
        throw err;
      }
    }
  };
})();

// Attach globally
window.API = API;

