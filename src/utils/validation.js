// ===== UDJOG C2C SERVICES - VALIDATION UTILS =====

export function validateJob(job) {
  const errors = [];
  if (!job.title || typeof job.title !== "string" || job.title.trim().length < 3) {
    errors.push("Job title must be at least 3 characters");
  }
  if (!job.company || typeof job.company !== "string" || job.company.trim().length < 2) {
    errors.push("Company name is required");
  }
  if (!job.location || typeof job.location !== "string" || job.location.trim().length < 2) {
    errors.push("Location is required");
  }
  if (!job.category || typeof job.category !== "string") {
    errors.push("Category is required");
  }
  if (!job.description || typeof job.description !== "string" || job.description.trim().length < 10) {
    errors.push("Job description must be at least 10 characters");
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateCandidate(data) {
  const errors = [];
  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push("Full name is required");
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Valid email address is required");
  }
  if (!data.phone || data.phone.trim().length < 10) {
    errors.push("Valid 10-digit mobile number is required");
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateEmployer(data) {
  const errors = [];
  if (!data.company_name || data.company_name.trim().length < 2) {
    errors.push("Company name is required");
  }
  if (!data.contact_person || data.contact_person.trim().length < 2) {
    errors.push("Contact person name is required");
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Valid corporate email is required");
  }
  if (!data.phone || data.phone.trim().length < 10) {
    errors.push("Valid contact phone number is required");
  }
  if (!data.job_title || data.job_title.trim().length < 2) {
    errors.push("Job title to hire is required");
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

