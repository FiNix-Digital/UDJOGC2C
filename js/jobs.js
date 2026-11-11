// ===== UDJOG C2C SERVICES - JOBS PORTAL LOGIC =====

document.addEventListener("DOMContentLoaded", async () => {
  const jobsGrid = document.getElementById("jobs-portal-grid");
  if (!jobsGrid) return;

  const searchInput = document.getElementById("job-search-input");
  const categorySelect = document.getElementById("job-category-select");
  const locationSelect = document.getElementById("job-location-select");
  const typeSelect = document.getElementById("job-type-select");
  const searchBtn = document.getElementById("job-search-btn");
  const jobCountEl = document.getElementById("job-count-display");
  const filterChips = document.querySelectorAll(".filter-chip[data-cat]");

  // Job Details Modal elements
  const modalBackdrop = document.getElementById("job-details-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalTitle = document.getElementById("modal-job-title");
  const modalCompany = document.getElementById("modal-job-company");
  const modalLocation = document.getElementById("modal-job-location");
  const modalSalary = document.getElementById("modal-job-salary");
  const modalType = document.getElementById("modal-job-type");
  const modalExp = document.getElementById("modal-job-exp");
  const modalVacancies = document.getElementById("modal-job-vacancies");
  const modalDesc = document.getElementById("modal-job-desc");
  const modalReq = document.getElementById("modal-job-req");
  const modalSkills = document.getElementById("modal-job-skills");
  const modalApplyBtn = document.getElementById("modal-apply-btn");

  let allJobs = [];

  // Parse URL query parameter for category/filter if present
  const urlParams = new URLSearchParams(window.location.search);
  const initialCat = urlParams.get("category");
  if (initialCat && categorySelect) {
    categorySelect.value = initialCat;
    filterChips.forEach(chip => {
      chip.classList.toggle("active", chip.dataset.cat === initialCat);
    });
  }

  // Fetch jobs from backend database
  async function fetchJobsFromDatabase() {
    try {
      jobsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--grey-600);">
          <div class="material-symbols-outlined" style="font-size: 2.5rem; color: var(--teal); animation: spin 1s infinite linear; margin-bottom: 12px;">refresh</div>
          <p>Connecting to database & loading verified jobs...</p>
        </div>
      `;
      if (window.API && window.API.getJobs) {
        allJobs = await window.API.getJobs();
      } else {
        const res = await fetch("/api/jobs");
        allJobs = await res.json();
      }
    } catch (e) {
      console.warn("Loading from database note:", e);
      const cached = localStorage.getItem("udjog_jobs");
      if (cached) {
        try { allJobs = JSON.parse(cached); } catch (err) {}
      }
    }
    filterJobs();
  }

  function getInitials(name) {
    return name
      ? name
          .split(" ")
          .map(w => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "UJ";
  }

  function renderJobs(jobs) {
    if (jobCountEl) {
      jobCountEl.textContent = jobs.length;
    }

    if (!jobs || jobs.length === 0) {
      jobsGrid.innerHTML = `
        <div class="empty-jobs-state">
          <div class="material-symbols-outlined empty-icon">search_off</div>
          <h3 style="font-family: var(--font-head); font-size: 1.3rem; margin-bottom: 8px;">No Matching Jobs Found</h3>
          <p style="color: var(--grey-600); max-width: 460px; margin: 0 auto 20px;">
            We couldn't find any positions matching your search criteria. Try clearing some filters or submit your resume directly.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button id="reset-filters-btn" class="btn btn-outline" style="padding: 10px 20px; border-color: var(--grey-400); color: var(--grey-800);">Reset All Filters</button>
            <a href="candidates.html" class="btn btn-primary" style="padding: 10px 20px;">Submit General Application</a>
          </div>
        </div>
      `;
      const resetBtn = document.getElementById("reset-filters-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          if (searchInput) searchInput.value = "";
          if (categorySelect) categorySelect.value = "all";
          if (locationSelect) locationSelect.value = "all";
          if (typeSelect) typeSelect.value = "all";
          filterChips.forEach(c => c.classList.toggle("active", c.dataset.cat === "all"));
          renderJobs(allJobs);
        });
      }
      return;
    }

    jobsGrid.innerHTML = jobs
      .map(job => {
        const initials = getInitials(job.company);
        const skillsList = Array.isArray(job.skills)
          ? job.skills.slice(0, 3).map(s => `<span class="meta-chip">${s}</span>`).join("")
          : (typeof job.skills === "string" ? job.skills.split(",").slice(0, 3).map(s => `<span class="meta-chip">${s.trim()}</span>`).join("") : "");

        return `
          <div class="job-card-item fade-up visible" data-id="${job.id}">
            <div class="job-card-top">
              <div class="job-company-avatar">${initials}</div>
              <div class="job-header-info">
                <span class="job-category-tag">${(job.category || "General").toUpperCase()}</span>
                <h3 class="job-card-title">${job.title}</h3>
                <div class="job-card-company">
                  <span class="material-symbols-outlined" style="font-size: 1rem; color: var(--grey-400);">corporate_fare</span>
                  <strong>${job.company}</strong>
                  <span>•</span>
                  <span class="material-symbols-outlined" style="font-size: 1rem; color: var(--grey-400);">location_on</span>
                  <span>${job.location}</span>
                </div>
              </div>
            </div>

            <div class="job-details-chips">
              <span class="meta-chip salary">
                <span class="material-symbols-outlined" style="font-size: 0.95rem;">payments</span>
                ${job.salary || "Competitive"}
              </span>
              <span class="meta-chip type">
                <span class="material-symbols-outlined" style="font-size: 0.95rem;">schedule</span>
                ${job.job_type || "Full Time"}
              </span>
              <span class="meta-chip">
                <span class="material-symbols-outlined" style="font-size: 0.95rem;">badge</span>
                ${job.experience || "Freshers"}
              </span>
            </div>

            <p class="job-desc-preview">${job.description || ""}</p>

            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
              ${skillsList}
            </div>

            <div class="job-card-footer">
              <span class="job-posted-time">
                <span class="material-symbols-outlined" style="font-size: 0.9rem;">access_time</span>
                ${job.posted_at || "Recent"}
              </span>
              <div class="job-actions-wrap">
                <button type="button" class="btn-details" data-view-id="${job.id}">
                  Details
                </button>
                <a href="candidates.html?job_id=${encodeURIComponent(job.id)}&job_title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}" class="btn-apply-direct">
                  Apply Now
                  <span class="material-symbols-outlined" style="font-size: 1rem;">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Attach view details listeners
    document.querySelectorAll("[data-view-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const jobId = btn.dataset.viewId;
        const job = allJobs.find(j => String(j.id) === String(jobId));
        if (job) openModal(job);
      });
    });
  }

  function filterJobs() {
    const keyword = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const cat = categorySelect ? categorySelect.value.toLowerCase() : "all";
    const loc = locationSelect ? locationSelect.value.toLowerCase() : "all";
    const type = typeSelect ? typeSelect.value.toLowerCase() : "all";

    const filtered = (allJobs || []).filter(job => {
      const titleMatch = (job.title || "").toLowerCase().includes(keyword);
      const companyMatch = (job.company || "").toLowerCase().includes(keyword);
      const descMatch = (job.description || "").toLowerCase().includes(keyword);
      const skillsStr = Array.isArray(job.skills) ? job.skills.join(" ") : (job.skills || "");
      const skillsMatch = skillsStr.toLowerCase().includes(keyword);
      const matchesKeyword = !keyword || titleMatch || companyMatch || descMatch || skillsMatch;

      const matchesCat = cat === "all" || (job.category || "").toLowerCase() === cat;
      const matchesLoc = loc === "all" || (job.location || "").toLowerCase().includes(loc);
      const matchesType = type === "all" || (job.job_type || "").toLowerCase().includes(type);
      const isActive = !job.status || job.status === "active";

      return matchesKeyword && matchesCat && matchesLoc && matchesType && isActive;
    });

    renderJobs(filtered);
  }

  // Filter triggers
  if (searchInput) searchInput.addEventListener("input", filterJobs);
  if (categorySelect) categorySelect.addEventListener("change", () => {
    const selectedCat = categorySelect.value;
    filterChips.forEach(c => c.classList.toggle("active", c.dataset.cat === selectedCat));
    filterJobs();
  });
  if (locationSelect) locationSelect.addEventListener("change", filterJobs);
  if (typeSelect) typeSelect.addEventListener("change", filterJobs);
  if (searchBtn) searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    filterJobs();
  });

  // Filter chips click
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const cat = chip.dataset.cat;
      if (categorySelect) categorySelect.value = cat;
      filterJobs();
    });
  });

  // Modal handlers
  function openModal(job) {
    if (!modalBackdrop) return;
    if (modalTitle) modalTitle.textContent = job.title;
    if (modalCompany) modalCompany.textContent = job.company;
    if (modalLocation) modalLocation.textContent = job.location;
    if (modalSalary) modalSalary.textContent = job.salary || "Competitive";
    if (modalType) modalType.textContent = job.job_type || "Full Time";
    if (modalExp) modalExp.textContent = job.experience || "Freshers";
    if (modalVacancies) modalVacancies.textContent = `${job.vacancies || 1} Openings`;
    if (modalDesc) modalDesc.textContent = job.description;
    if (modalReq) modalReq.textContent = job.requirements || "Refer to description";

    if (modalSkills) {
      let skillsArr = Array.isArray(job.skills) ? job.skills : (typeof job.skills === "string" ? job.skills.split(",") : []);
      if (skillsArr.length > 0) {
        modalSkills.innerHTML = skillsArr
          .map(s => `<span class="meta-chip">${s.trim()}</span>`)
          .join("");
      } else {
        modalSkills.innerHTML = `<span class="meta-chip">General Requirements</span>`;
      }
    }

    if (modalApplyBtn) {
      modalApplyBtn.setAttribute(
        "href",
        `candidates.html?job_id=${encodeURIComponent(job.id)}&job_title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`
      );
    }

    modalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop && modalBackdrop.classList.contains("open")) {
      closeModal();
    }
  });

  // Fetch initial data
  await fetchJobsFromDatabase();
});
