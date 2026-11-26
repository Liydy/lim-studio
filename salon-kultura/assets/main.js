/* Культура Красоты — демо-сайт салона */
(() => {
  "use strict";

  const header = document.getElementById("site-header");
  const navLinks = Array.from(document.querySelectorAll(".nav a"));
  const spySections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  let ticking = false;

  const updateOnScroll = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    const marker = window.scrollY + 150;
    let current = "";

    spySections.forEach((section) => {
      if (section.offsetTop <= marker) current = section.id;
    });

    navLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${current}`) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateOnScroll();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  updateOnScroll();

  /* ── мобильное меню ─────────────────────────────────── */

  const burger = document.querySelector(".burger");
  const mobileNav = document.getElementById("mobile-nav");
  const mobileClose = document.querySelector(".mobile-nav-close");
  let lastFocused = null;

  const openMenu = () => {
    if (!mobileNav) return;
    lastFocused = document.activeElement;
    mobileNav.classList.add("is-open");
    mobileNav.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
    mobileClose.focus();
  };

  const closeMenu = (restoreFocus = true) => {
    if (!mobileNav || !mobileNav.classList.contains("is-open")) return;
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    if (restoreFocus && lastFocused) lastFocused.focus();
  };

  if (burger && mobileNav && mobileClose) {
    burger.addEventListener("click", openMenu);
    mobileClose.addEventListener("click", () => closeMenu());

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    mobileNav.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        mobileNav.querySelectorAll("a[href], button")
      ).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window
      .matchMedia("(min-width: 901px)")
      .addEventListener("change", (event) => {
        if (event.matches) closeMenu(false);
      });
  }

  /* ── появление блоков ───────────────────────────────── */

  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ── форма записи ───────────────────────────────────── */

  const form = document.getElementById("booking-form");
  const success = document.getElementById("form-success");
  const resetButton = document.getElementById("form-reset");
  const nameInput = document.getElementById("bf-name");
  const phoneInput = document.getElementById("bf-phone");
  const serviceInput = document.getElementById("bf-service");
  const dateInput = document.getElementById("bf-date");
  const consentInput = document.getElementById("bf-consent");
  const successName = document.getElementById("success-name");

  const today = new Date();
  const todayISO = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

  if (dateInput) dateInput.min = todayISO;

  const formatPhone = (raw) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
    if (digits.startsWith("7")) digits = digits.slice(1);
    digits = digits.slice(0, 10);

    if (!digits) return "";

    let result = "+7";
    result += ` (${digits.slice(0, 3)}`;
    if (digits.length >= 3) result += ")";
    if (digits.length > 3) result += ` ${digits.slice(3, 6)}`;
    if (digits.length > 6) result += `-${digits.slice(6, 8)}`;
    if (digits.length > 8) result += `-${digits.slice(8, 10)}`;
    return result;
  };

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhone(phoneInput.value);
    });
  }

  const showError = (input, message) => {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.add("is-invalid");
    const error = field.querySelector(".field-error");
    if (error) error.textContent = message;
    input.setAttribute("aria-invalid", "true");
  };

  const clearError = (input) => {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.remove("is-invalid");
    const error = field.querySelector(".field-error");
    if (error) error.textContent = "";
    input.removeAttribute("aria-invalid");
  };

  if (form) {
    [nameInput, phoneInput, serviceInput, dateInput, consentInput].forEach(
      (input) => {
        if (!input) return;
        const eventName =
          input.type === "checkbox" || input.tagName === "SELECT"
            ? "change"
            : "input";
        input.addEventListener(eventName, () => clearError(input));
      }
    );

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let firstInvalid = null;

      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        showError(nameInput, "Напишите имя — хотя бы два символа.");
        firstInvalid = firstInvalid || nameInput;
      }

      const phoneDigits = phoneInput.value
        .replace(/\D/g, "")
        .replace(/^[78]/, "");

      if (phoneDigits.length !== 10) {
        showError(phoneInput, "Нужен номер из 10 цифр после +7.");
        firstInvalid = firstInvalid || phoneInput;
      }

      if (!serviceInput.value) {
        showError(serviceInput, "Выберите услугу или консультацию.");
        firstInvalid = firstInvalid || serviceInput;
      }

      if (dateInput.value && dateInput.value < todayISO) {
        showError(dateInput, "Дата уже прошла — выберите другую.");
        firstInvalid = firstInvalid || dateInput;
      }

      if (!consentInput.checked) {
        showError(consentInput, "Без согласия отправить заявку нельзя.");
        firstInvalid = firstInvalid || consentInput;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      if (successName) successName.textContent = nameInput.value.trim();
      form.hidden = true;
      success.hidden = false;

      const heading = success.querySelector("h3");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      form.reset();
      [nameInput, phoneInput, serviceInput, dateInput, consentInput].forEach(
        (input) => {
          if (input) clearError(input);
        }
      );
      success.hidden = true;
      form.hidden = false;
      nameInput.focus();
    });
  }

  /* ── лайтбокс галереи ───────────────────────────────── */

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  let lastTrigger = null;

  document.querySelectorAll(".gallery-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!lightbox || typeof lightbox.showModal !== "function") {
        window.open(button.dataset.full, "_blank", "noopener");
        return;
      }

      lastTrigger = button;
      const image = button.querySelector("img");
      const fullSrc = button.dataset.full || "";
      const thumbSrc = image ? image.currentSrc || image.src : "";

      lightboxImage.src = thumbSrc || fullSrc;
      lightboxImage.alt = image ? image.alt : "";
      lightboxCaption.textContent = button.dataset.caption || "";

      if (fullSrc && fullSrc !== thumbSrc) {
        const preload = new Image();
        preload.onload = () => {
          if (lightbox.open) lightboxImage.src = fullSrc;
        };
        preload.src = fullSrc;
      }

      lightbox.showModal();
      document.body.classList.add("lightbox-open");
    });
  });

  if (lightbox) {
    lightboxClose.addEventListener("click", () => lightbox.close());

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) lightbox.close();
    });

    lightbox.addEventListener("close", () => {
      document.body.classList.remove("lightbox-open");
      lightboxImage.removeAttribute("src");
      if (lastTrigger) lastTrigger.focus();
    });
  }
})();
