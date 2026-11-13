// ===== UDJOG C2C SERVICES - ADMIN DASHBOARD SCRIPT =====

// Auth check
if (sessionStorage.getItem("udjog_admin_auth") !== "true") {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const logoutBtn = document.getElementById("logout-btn");
  const statTotalJobs = document.getElementById("stat-total-jobs");
  const statTotalCats = document.getElementById("stat-total-cats");
  const statTotalCandidates = document.getElementById("stat-total-candidates");
  const statTotalEmployers = document.getElementById("stat-total-employers");

  const jobsTbody = document.getElementById("admin-jobs-tbody");
  const searchInput = document.getElementById("admin-search-input");
  const categoryFilter = document.getElementById("admin-category-filter");
  const addJobBtn = document.getElementById("add-job-btn");

  // Modal elements
  const jobModal = document.getElementById("job-form-modal");
  const jobModalCloseBtn = document.getElementById("job-form-close-btn");
  const cancelFormBtn = document.getElementById("cancel-form-btn");
  const jobEditorForm = document.getElementById("admin-job-editor-form");
  const modalHeading = document.getElementById("modal-form-heading");
  const editJobIdField = document.getElementById("edit-job-id");

  // Submissions review modal
  const subsInfoBtn = document.getElementById("open-sheet-info-btn");
  const subsModal = document.getElementById("submissions-info-modal");
  const closeSubsModalBtn = document.getElementById("close-subs-modal-btn");
  const recentEmployersList = document.getElementById("recent-employers-list");
  const recentCandidatesList = document.getElementById("recent-candidates-list");

  let jobs = [];

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("udjog_admin_auth");
      sessionStorage.removeItem("udjog_admin_token");
      sessionStorage.removeItem("udjog_admin_user");
      window.location.href = "login.html";
    });
  }

  // Load live stats directly from database
  async function refreshStats() {
    try {
      const stats = await window.API.getStats();
      if (statTotalJobs) statTotalJobs.textContent = stats.total_jobs;
      if (statTotalCats) statTotalCats.textContent = stats.categories_count;
      if (statTotalCandidates) statTotalCandidates.textContent = stats.total_candidates;
      if (statTotalEmployers) statTotalEmployers.textContent = stats.total_employers;
    } catch (e) {
      console.warn("Stats refresh note:", e);
    }
  }

  // Load all jobs from database
  async function loadJobs() {
    try {
      jobs = await window.API.getAdminJobs();
      renderTable();
      await refreshStats();
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  }

  function renderTable() {
    const keyword = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const cat = categoryFilter ? categoryFilter.value.toLowerCase() : "all";

    const filtered = (jobs || []).filter(j => {
      const titleMatch = (j.title || "").toLowerCase().includes(keyword);
      const companyMatch = (j.company || "").toLowerCase().includes(keyword);
      const matchesKeyword = !keyword || titleMatch || companyMatch;
      const matchesCat = cat === "all" || (j.category || "").toLowerCase() === cat;
      return matchesKeyword && matchesCat;
    });

    if (filtered.length === 0) {
      jobsTbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--grey-600);">
            <span class="material-symbols-outlined" style="font-size: 2.2rem; color: var(--grey-400); display: block; margin-bottom: 8px;">search_off</span>
            No job postings found. Click "+ Add New Job Post" to create one.
          </td>
        </tr>
      `;
      return;
    }

    jobsTbody.innerHTML = filtered.map(j => {
      const isClosed = j.status === "closed";
      const statusBadge = isClosed
        ? `<span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; background: #fee2e2; color: #b91c1c;">CLOSED</span>`
        : `<span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; background: #ecfdf5; color: #047857;">ACTIVE</span>`;

      return `
        <tr data-id="${j.id}">
          <td style="font-family: monospace; font-weight: 600; color: var(--grey-600);">${j.id}</td>
          <td>
            <div style="font-weight: 700; color: var(--grey-800);">${j.title}</div>
            <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--teal);">${j.category || 'General'}</span>
          </td>
          <td><strong>${j.company}</strong></td>
          <td>${j.location}</td>
          <td>${j.salary || 'Competitive'}</td>
          <td><span class="meta-chip type" style="font-size: 0.75rem;">${j.job_type || 'Full Time'}</span></td>
          <td>${statusBadge}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn btn-outline edit-job-btn" data-edit-id="${j.id}" style="padding: 6px 10px; font-size: 0.8rem; margin-right: 6px;" title="Edit this job">
              <span class="material-symbols-outlined" style="font-size: 1rem;">edit</span>
            </button>
            <button type="button" class="btn delete-job-btn" data-delete-id="${j.id}" style="padding: 6px 10px; font-size: 0.8rem; background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;" title="Remove this job">
              <span class="material-symbols-outlined" style="font-size: 1rem;">delete</span>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Attach row action listeners
    document.querySelectorAll(".edit-job-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.editId;
        const targetJob = jobs.find(j => String(j.id) === String(id));
        if (targetJob) openEditModal(targetJob);
      });
    });

    document.querySelectorAll(".delete-job-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteId;
        const targetJob = jobs.find(j => String(j.id) === String(id));
        if (!targetJob) return;

        const confirmed = confirm(`Are you sure you want to remove the job "${targetJob.title}" at "${targetJob.company}"? This will delete it permanently.`);
        if (confirmed) {
          await deleteJob(id);
        }
      });
    });
  }

  // Delete Job Handler
  async function deleteJob(id) {
    try {
      await window.API.deleteJob(id);
      jobs = jobs.filter(j => String(j.id) !== String(id));
      renderTable();
      await refreshStats();
    } catch (err) {
      alert("Error deleting job: " + err.message);
    }
  }

  // Open Modal for Add
  function openAddModal() {
    modalHeading.textContent = "Add New Job Post";
    editJobIdField.value = "";
    jobEditorForm.reset();
    document.getElementById("form-job-vacancies").value = "5";
    document.getElementById("form-job-status").value = "active";
    jobModal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  // Open Modal for Edit
  function openEditModal(job) {
    modalHeading.textContent = `Edit Job: ${job.title}`;
    editJobIdField.value = job.id;
    document.getElementById("form-job-title").value = job.title || "";
    document.getElementById("form-job-company").value = job.company || "";
    document.getElementById("form-job-category").value = (job.category || "it").toLowerCase();
    document.getElementById("form-job-location").value = job.location || "";
    document.getElementById("form-job-type").value = job.job_type || "Full Time";
    document.getElementById("form-job-salary").value = job.salary || "";
    document.getElementById("form-job-experience").value = job.experience || "";
    document.getElementById("form-job-vacancies").value = job.vacancies || "1";
    document.getElementById("form-job-contact-phone").value = job.contact_phone || "";
    document.getElementById("form-job-status").value = job.status || "active";
    document.getElementById("form-job-skills").value = Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || "");
    document.getElementById("form-job-desc").value = job.description || "";
    document.getElementById("form-job-req").value = job.requirements || "";

    jobModal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeJobModal() {
    jobModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (addJobBtn) addJobBtn.addEventListener("click", openAddModal);
  if (jobModalCloseBtn) jobModalCloseBtn.addEventListener("click", closeJobModal);
  if (cancelFormBtn) cancelFormBtn.addEventListener("click", closeJobModal);

  // Form Save Handler (Add or Update)
  jobEditorForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById("save-job-submit-btn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saving to Database...";

    const existingId = editJobIdField.value;
    const skillsRaw = document.getElementById("form-job-skills").value;
    const skillsArr = skillsRaw ? skillsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

    const jobData = {
      id: existingId || "job-" + Date.now().toString().slice(-6),
      title: document.getElementById("form-job-title").value.trim(),
      company: document.getElementById("form-job-company").value.trim(),
      category: document.getElementById("form-job-category").value,
      location: document.getElementById("form-job-location").value.trim(),
      job_type: document.getElementById("form-job-type").value,
      salary: document.getElementById("form-job-salary").value.trim(),
      experience: document.getElementById("form-job-experience").value.trim(),
      vacancies: parseInt(document.getElementById("form-job-vacancies").value, 10) || 1,
      contact_phone: document.getElementById("form-job-contact-phone") ? document.getElementById("form-job-contact-phone").value.trim() : "",
      status: document.getElementById("form-job-status").value,
      skills: skillsArr,
      description: document.getElementById("form-job-desc").value.trim(),
      requirements: document.getElementById("form-job-req").value.trim(),
      posted_at: "Just now"
    };

    try {
      if (existingId) {
        await window.API.updateJob(existingId, jobData);
        const idx = jobs.findIndex(j => String(j.id) === String(existingId));
        if (idx !== -1) jobs[idx] = { ...jobs[idx], ...jobData };
      } else {
        const created = await window.API.createJob(jobData);
        jobs.unshift(created);
      }

      renderTable();
      await refreshStats();
      closeJobModal();
    } catch (err) {
      alert("Failed to save job post: " + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="material-symbols-outlined">save</span> Save Job Post';
    }
  });

  // Filter and search listeners
  if (searchInput) searchInput.addEventListener("input", renderTable);
  if (categoryFilter) categoryFilter.addEventListener("change", renderTable);

  // Submissions review modal handlers
  if (subsInfoBtn) {
    subsInfoBtn.addEventListener("click", async () => {
      subsModal.classList.add("open");
      document.body.style.overflow = "hidden";

      recentEmployersList.innerHTML = `<div style="padding: 12px; color: var(--grey-600);">Loading employer submissions from database...</div>`;
      recentCandidatesList.innerHTML = `<div style="padding: 12px; color: var(--grey-600);">Loading candidate applications from database...</div>`;

      try {
        const [employers, candidates] = await Promise.all([
          window.API.getEmployerSubmissions(),
          window.API.getCandidateApplications()
        ]);

        // Render employers
        if (!employers || employers.length === 0) {
          recentEmployersList.innerHTML = `<div style="padding: 12px; color: var(--grey-400);">No employer job submissions recorded yet.</div>`;
        } else {
          recentEmployersList.innerHTML = employers.map(e => `
            <div style="padding: 12px; border-bottom: 1px solid var(--grey-200); display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div>
                <strong>${e.job_title}</strong> at <strong>${e.company_name}</strong><br />
                <span style="font-size: 0.78rem; color: var(--grey-600);">
                  📍 ${e.location} • 👤 ${e.contact_person} (📞 ${e.phone} | ✉️ ${e.email})
                </span>
                ${e.salary_ctc ? `<br /><span style="font-size: 0.78rem; color: var(--green);">💰 CTC: ${e.salary_ctc}</span>` : ''}
              </div>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn btn-primary prefill-job-btn" style="padding: 6px 12px; font-size: 0.78rem;" data-employer='${JSON.stringify(e).replace(/'/g, "&#39;")}'>
                  Create Job Post
                </button>
              </div>
            </div>
          `).join("");
        }

        // Render candidates
        if (!candidates || candidates.length === 0) {
          recentCandidatesList.innerHTML = `<div style="padding: 12px; color: var(--grey-400);">No candidate applications recorded yet.</div>`;
        } else {
          recentCandidatesList.innerHTML = candidates.map(c => `
            <div style="padding: 12px; border-bottom: 1px solid var(--grey-200);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <strong>${c.full_name}</strong>
                <span style="font-size: 0.75rem; color: var(--grey-400);">${new Date(c.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--grey-600); margin: 4px 0;">
                🎓 ${c.qualification || 'Not specified'} (${c.passout_year || ''}) • 💼 Exp: ${c.experience || 'Fresher'} • 🎯 Role: ${c.role_category || 'Any'}
              </div>
              <div style="font-size: 0.8rem; color: var(--grey-600);">
                📞 ${c.phone} • ✉️ ${c.email} • 📍 ${c.location || 'India'}
              </div>
              ${c.resume_link ? `<div style="margin-top: 4px;"><a href="${c.resume_link}" target="_blank" style="font-size: 0.8rem; color: var(--teal); font-weight: 600;">🔗 View Candidate Resume</a></div>` : ''}
            </div>
          `).join("");
        }

        // Attach prefill listeners
        document.querySelectorAll(".prefill-job-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const empData = JSON.parse(btn.dataset.employer);
            subsModal.classList.remove("open");
            openAddModal();
            document.getElementById("form-job-title").value = empData.job_title || "";
            document.getElementById("form-job-company").value = empData.company_name || "";
            document.getElementById("form-job-location").value = empData.location || "";
            document.getElementById("form-job-salary").value = empData.salary_ctc || "";
            document.getElementById("form-job-type").value = empData.job_type || "Full Time";
            document.getElementById("form-job-vacancies").value = empData.vacancies || "1";
            document.getElementById("form-job-desc").value = empData.description || "";
          });
        });

      } catch (err) {
        recentEmployersList.innerHTML = `<div style="padding: 12px; color: red;">Error: ${err.message}</div>`;
        recentCandidatesList.innerHTML = `<div style="padding: 12px; color: red;">Error: ${err.message}</div>`;
      }
    });
  }

  if (closeSubsModalBtn) {
    closeSubsModalBtn.addEventListener("click", () => {
      subsModal.classList.remove("open");
      document.body.style.overflow = "";
    });
  }

  // Initial load
  await loadJobs();
});
