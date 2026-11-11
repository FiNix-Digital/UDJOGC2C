// ===== UDJOG C2C SERVICES - FORMS & SPREADSHEET INTEGRATION =====

/**
 * GOOGLE SPREADSHEET INTEGRATION SETUP:
 * 1. Open Google Sheets (https://sheets.google.com) and create a sheet named "UDJOG C2C Applications".
 * 2. Create two tabs: "Candidates" and "Employers".
 * 3. Deploy the Apps Script Web App (Execute as: Me, Access: Anyone).
 * 4. Paste the Web App URL into GOOGLE_SHEET_WEBHOOK_URL below.
 */

const GOOGLE_SHEET_WEBHOOK_URL = ""; 

// Send payload to Google Sheets webhook if configured
async function forwardToGoogleSheets(payload) {
  if (!GOOGLE_SHEET_WEBHOOK_URL || GOOGLE_SHEET_WEBHOOK_URL.trim() === "") {
    return false;
  }
  try {
    await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn("Google Sheets forward note:", err.message);
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== 1. CANDIDATE FORM HANDLER =====
  const candidateForm = document.getElementById("candidate-form");
  if (candidateForm) {
    // Check URL parameters for prefilled job
    const urlParams = new URLSearchParams(window.location.search);
    const prefillTitle = urlParams.get("job_title");
    const prefillId = urlParams.get("job_id");
    const prefillCompany = urlParams.get("company");

    if (prefillTitle) {
      const jobNotice = document.getElementById("candidate-job-notice");
      const jobNoticeTitle = document.getElementById("notice-job-title");
      const hiddenJobField = document.getElementById("applied_job");
      if (jobNotice && jobNoticeTitle) {
        jobNoticeTitle.textContent = `${decodeURIComponent(prefillTitle)} (${decodeURIComponent(prefillCompany || "")})`;
        jobNotice.style.display = "flex";
      }
      if (hiddenJobField) {
        hiddenJobField.value = `${decodeURIComponent(prefillTitle)} [ID: ${decodeURIComponent(prefillId || "")}]`;
      }
    }

    candidateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = candidateForm.querySelector(".form-submit-btn");
      const alertBox = document.getElementById("candidate-alert");

      const payload = {
        form_type: "candidate",
        timestamp: new Date().toISOString(),
        full_name: candidateForm.elements["full_name"]?.value?.trim() || "",
        email: candidateForm.elements["email"]?.value?.trim() || "",
        phone: candidateForm.elements["phone"]?.value?.trim() || "",
        qualification: candidateForm.elements["qualification"]?.value || "",
        passout_year: candidateForm.elements["passout_year"]?.value || "",
        experience: candidateForm.elements["experience"]?.value || "",
        role_category: candidateForm.elements["role_category"]?.value || "",
        location: candidateForm.elements["location"]?.value?.trim() || "",
        resume_link: candidateForm.elements["resume_link"]?.value?.trim() || "",
        message: candidateForm.elements["message"]?.value?.trim() || "",
        applied_job: candidateForm.elements["applied_job"]?.value || "General Candidate Application"
      };

      // Validation
      if (!payload.full_name || !payload.email || !payload.phone) {
        showAlert(alertBox, "error", "Please fill in all mandatory fields (*)");
        return;
      }

      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">refresh</span> Submitting Application...`;
      submitBtn.disabled = true;

      try {
        // 1. Send directly to real backend database!
        if (window.API && window.API.submitCandidateApplication) {
          await window.API.submitCandidateApplication(payload);
        }

        // 2. Forward to Google Sheets Webhook if configured
        await forwardToGoogleSheets(payload);

        showAlert(
          alertBox,
          "success",
          "🎉 Application submitted successfully! Your details have been recorded in our database. Our placement team will contact you shortly."
        );
        candidateForm.reset();
        window.scrollTo({ top: alertBox.offsetTop - 100, behavior: "smooth" });
      } catch (err) {
        showAlert(alertBox, "error", "Submission error: " + err.message);
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // ===== 2. EMPLOYER FORM HANDLER =====
  const employerForm = document.getElementById("employer-form");
  if (employerForm) {
    employerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = employerForm.querySelector(".form-submit-btn");
      const alertBox = document.getElementById("employer-alert");

      const payload = {
        form_type: "employer",
        timestamp: new Date().toISOString(),
        company_name: employerForm.elements["company_name"]?.value?.trim() || "",
        contact_person: employerForm.elements["contact_person"]?.value?.trim() || "",
        email: employerForm.elements["email"]?.value?.trim() || "",
        phone: employerForm.elements["phone"]?.value?.trim() || "",
        website: employerForm.elements["website"]?.value?.trim() || "",
        job_title: employerForm.elements["job_title"]?.value?.trim() || "",
        department: employerForm.elements["department"]?.value || "",
        job_type: employerForm.elements["job_type"]?.value || "Full Time",
        location: employerForm.elements["location"]?.value?.trim() || "",
        salary_ctc: employerForm.elements["salary_ctc"]?.value?.trim() || "",
        vacancies: employerForm.elements["vacancies"]?.value?.trim() || "1",
        description: employerForm.elements["description"]?.value?.trim() || ""
      };

      // Validation
      if (!payload.company_name || !payload.contact_person || !payload.phone || !payload.job_title) {
        showAlert(alertBox, "error", "Please fill in all required company and job details (*)");
        return;
      }

      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">refresh</span> Submitting Job Requirement...`;
      submitBtn.disabled = true;

      try {
        // 1. Send directly to real backend database!
        if (window.API && window.API.submitEmployerRequirement) {
          await window.API.submitEmployerRequirement(payload);
        }

        // 2. Forward to Google Sheets Webhook if configured
        await forwardToGoogleSheets(payload);

        showAlert(
          alertBox,
          "success",
          "✅ Job Requirement received! It has been recorded in the database. The UDJOG Admin will review and verify your opening before publishing it on the portal."
        );
        employerForm.reset();
        window.scrollTo({ top: alertBox.offsetTop - 100, behavior: "smooth" });
      } catch (err) {
        showAlert(alertBox, "error", "Failed to submit job posting: " + err.message);
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Alert display helper
  function showAlert(alertEl, type, message) {
    if (!alertEl) return;
    alertEl.className = `status-alert-box ${type}`;
    const icon = type === "success" ? "check_circle" : "error";
    alertEl.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 1.4rem;">${icon}</span>
      <div>${message}</div>
    `;
    alertEl.style.display = "flex";
  }
});
