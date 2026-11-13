// ===== UDJOG C2C SERVICES - MAIN JAVASCRIPT =====

document.addEventListener("DOMContentLoaded", () => {
  // ===== ACTIVE NAV LINK HIGHLIGHT =====
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");
  
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      const linkPath = href.split("/").pop().split("#")[0];
      if (
        (currentPath === "" || currentPath === "index.html") &&
        (linkPath === "" || linkPath === "index.html")
      ) {
        link.classList.add("active");
      } else if (linkPath && currentPath === linkPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    }
  });

  // ===== NAVBAR SCROLL EFFECT =====
  const navbar = document.getElementById("navbar");
  if (navbar) {
    const updateNavbar = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", updateNavbar, { passive: true });
    updateNavbar();
  }

  // ===== MOBILE MENU TOGGLE =====
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      if (navbar) navbar.classList.toggle("menu-open", isOpen);
    });

    // Close when clicking any menu link
    mobileMenu.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        if (navbar) navbar.classList.remove("menu-open");
      });
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !hamburger.contains(e.target) &&
        !mobileMenu.contains(e.target) &&
        mobileMenu.classList.contains("open")
      ) {
        mobileMenu.classList.remove("open");
        if (navbar) navbar.classList.remove("menu-open");
      }
    });
  }

  // ===== SCROLL FADE-IN ANIMATIONS =====
  function initAnimations() {
    const fadeEls = document.querySelectorAll(".fade-up");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );
      fadeEls.forEach((el) => observer.observe(el));
    } else {
      fadeEls.forEach((el) => el.classList.add("visible"));
    }
  }
  initAnimations();

  // ===== FAQ ACCORDION =====
  document.addEventListener("click", (e) => {
    const question = e.target.closest(".faq-question");
    if (question) {
      const item = question.parentElement;
      const isOpen = item.classList.contains("open");
      document
        .querySelectorAll(".faq-item.open")
        .forEach((i) => i.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    }
  });

  // ===== CONTACT INQUIRY FORM (contact.html) =====
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector(".form-submit-btn");
      const success = document.getElementById("form-success");

      const name = contactForm.elements["name"]?.value?.trim() || "";
      const email = contactForm.elements["email"]?.value?.trim() || "";
      const phone = contactForm.elements["phone"]?.value?.trim() || "";
      const qualification = contactForm.elements["qualification"]?.value || "";
      const interest = contactForm.elements["service_interest"]?.value || "General Query";
      const message = contactForm.elements["message"]?.value?.trim() || "";

      if (!name || !email || !phone) {
        alert("Please fill in your name, email, and phone number.");
        return;
      }

      const originalText = btn.innerHTML;
      btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">refresh</span> Sending Enquiry...`;
      btn.disabled = true;

      try {
        if (window.API && window.API.submitCandidateApplication) {
          await window.API.submitCandidateApplication({
            full_name: name,
            email,
            phone,
            qualification,
            role_category: interest,
            message,
            applied_job: `Contact Inquiry: ${interest}`
          });
        }
        btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Message Sent!';
        btn.style.background = "linear-gradient(135deg, #10b981, #059669)";
        if (success) success.style.display = "flex";

        setTimeout(() => {
          contactForm.reset();
          btn.innerHTML = originalText;
          btn.disabled = false;
          btn.style.background = "";
          if (success) success.style.display = "none";
        }, 4000);
      } catch (err) {
        alert("Error sending enquiry: " + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  // ===== COUNTER ANIMATION =====
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || "";
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current) + suffix;
      if (current >= target) clearInterval(timer);
    }, 16);
  }

  const counterEls = document.querySelectorAll("[data-target]");
  if (counterEls.length > 0 && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = "true";
            animateCounter(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counterEls.forEach((el) => counterObserver.observe(el));
  }

  // ===== FLOATING HERO CARDS ANIMATION =====
  const fb1 = document.querySelector(".floating-badge-1");
  const fb2 = document.querySelector(".floating-badge-2");
  if (fb1 && fb2) {
    let t = 0;
    function animateFloat() {
      t += 0.02;
      if (fb1) fb1.style.transform = `translateY(${Math.sin(t) * 8}px)`;
      if (fb2) fb2.style.transform = `translateY(${Math.sin(t + Math.PI) * 8}px)`;
      requestAnimationFrame(animateFloat);
    }
    animateFloat();
  }

  // ===== HERO INTRO ANIMATION =====
  function heroIntro() {
    const heroEls = document.querySelectorAll(
      ".hero-badge, .hero-title, .hero-tagline, .hero-subtitle, .hero-ctas, .hero-action-highlights, .hero-stats"
    );
    heroEls.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      setTimeout(() => {
        el.style.transition = "opacity 0.7s ease, transform 0.7s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 100 + i * 110);
    });
  }
  heroIntro();

  // ===== BACK TO TOP =====
  const backTop = document.getElementById("back-top");
  if (backTop) {
    window.addEventListener(
      "scroll",
      () => {
        backTop.style.opacity = window.scrollY > 400 ? "1" : "0";
        backTop.style.pointerEvents = window.scrollY > 400 ? "auto" : "none";
      },
      { passive: true }
    );
    backTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  // ===== CARTOON GUIDE BUDDY: TIME-BASED GREETING & BUTTON HIGHLIGHTER =====
  function initCartoonGuideBuddy() {
    const stickyDock = document.querySelector(".sticky-actions-dock");
    // Only display on public pages that have the action buttons dock (not admin, not candidates, not employers)
    if (!stickyDock) return;

    // Time-based greeting
    const hour = new Date().getHours();
    let timeGreeting = "Good morning!";
    let greetingIcon = "wb_sunny";
    if (hour >= 12 && hour < 17) {
      timeGreeting = "Good afternoon!";
      greetingIcon = "sunny";
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = "Good evening!";
      greetingIcon = "nights_stay";
    } else if (hour >= 21 || hour < 5) {
      timeGreeting = "Hello!";
      greetingIcon = "dark_mode";
    }

    // Create cartoon guide container
    const guideContainer = document.createElement("div");
    guideContainer.className = "guide-character-container";
    guideContainer.setAttribute("aria-label", "UDJOG Assistant Buddy");

    guideContainer.innerHTML = `
      <div class="guide-speech-bubble" id="guide-bubble" title="Click to dismiss or interact">
        <div class="guide-speech-greeting">
          <span class="material-symbols-outlined" style="font-size: 1rem;">${greetingIcon}</span>
          <span>${timeGreeting}</span>
        </div>
        <div>Tap <strong>Find a Job</strong> or <strong>Post a Job</strong> right here! 👇</div>
      </div>
      <div class="guide-character-wrap" id="guide-char" title="I am your UDJOG Career Buddy!">
        <div class="char-headphone-band"></div>
        <div class="char-headphone-left"></div>
        <div class="char-headphone-right"></div>
        <div class="char-body">
          <div class="char-eye left"></div>
          <div class="char-eye right"></div>
          <div class="char-blush left"></div>
          <div class="char-blush right"></div>
          <div class="char-smile"></div>
        </div>
        <div class="char-pointing-arm">
          <span class="char-pointing-hand">👉</span>
        </div>
      </div>
    `;

    document.body.appendChild(guideContainer);

    // Interactive speech bubble rotation messages on click
    const bubble = document.getElementById("guide-bubble");
    const guideChar = document.getElementById("guide-char");
    const hints = [
      `<div>Looking for work? Click <strong>Find a Job</strong>! 💼</div>`,
      `<div>Hiring talent? Click <strong>Post a Job</strong>! 🚀</div>`,
      `<div>All candidate placement is <strong>100% Free</strong>! ✨</div>`,
      `<div>Tap below to explore open vacancies! 🎯</div>`
    ];
    let hintIdx = 0;

    const changeHint = () => {
      hintIdx = (hintIdx + 1) % hints.length;
      bubble.innerHTML = `
        <div class="guide-speech-greeting">
          <span class="material-symbols-outlined" style="font-size: 1rem;">${greetingIcon}</span>
          <span>${timeGreeting}</span>
        </div>
        ${hints[hintIdx]}
      `;
    };

    if (bubble) bubble.addEventListener("click", changeHint);
    if (guideChar) guideChar.addEventListener("click", changeHint);

    // Subtle hand gesture alternating between pointing down at the buttons
    const hand = guideContainer.querySelector(".char-pointing-hand");
    let pointToggle = false;
    setInterval(() => {
      pointToggle = !pointToggle;
      if (hand) {
        hand.textContent = pointToggle ? "👇" : "👉";
      }
    }, 1600);
  }

  initCartoonGuideBuddy();
});
