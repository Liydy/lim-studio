/* Автосервис Акара — интерактив */
(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ── Шапка, прогресс и активный раздел ──────────────── */

  const header = $("#site-header");
  const progress = $("#scroll-progress");
  const navLinks = $$(".nav a");
  const spySections = $$("main section[id]");
  let ticking = false;

  const updateOnScroll = () => {
    const y = window.scrollY;

    if (header) header.classList.toggle("is-scrolled", y > 8);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${Math.min(100, (y / max) * 100)}%` : "0%";
    }

    const marker = y + 170;
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
  window.addEventListener("resize", onScroll);
  updateOnScroll();

  /* ── Мобильное меню ─────────────────────────────────── */

  const burger = $(".burger");
  const mobileNav = $("#mobile-nav");
  const mobileClose = $(".mobile-nav-close");
  let lastFocused = null;

  const openMenu = () => {
    if (!mobileNav) return;
    lastFocused = document.activeElement;
    mobileNav.classList.add("is-open");
    mobileNav.setAttribute("aria-hidden", "false");
    if (burger) burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
    if (mobileClose) mobileClose.focus();
  };

  const closeMenu = (restoreFocus = true) => {
    if (!mobileNav || !mobileNav.classList.contains("is-open")) return;
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    if (burger) burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    if (restoreFocus && lastFocused) lastFocused.focus();
  };

  if (burger && mobileNav && mobileClose) {
    burger.addEventListener("click", openMenu);
    mobileClose.addEventListener("click", () => closeMenu());

    $$("a", mobileNav).forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    mobileNav.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = $$("a[href], button", mobileNav).filter(
        (element) => element.offsetParent !== null
      );
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
      .matchMedia("(min-width: 1101px)")
      .addEventListener("change", (event) => {
        if (event.matches) closeMenu(false);
      });
  }

  /* ── Появление блоков ───────────────────────────────── */

  const revealItems = $$(".reveal");

  if (!reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.06 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ── Счётчики ───────────────────────────────────────── */

  const counters = $$(".js-count");

  const animateCounter = (element) => {
    const target = parseFloat(element.dataset.count || "0");
    const decimals = parseInt(element.dataset.decimals || "0", 10);
    const duration = 1150;
    const start = performance.now();

    const frame = (now) => {
      const progressValue = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      const value = target * eased;
      element.textContent = value.toLocaleString("ru-RU", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      if (progressValue < 1) window.requestAnimationFrame(frame);
    };

    window.requestAnimationFrame(frame);
  };

  if (!reducedMotion && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  }

  /* ── Статус «открыто / закрыто» ─────────────────────── */

  const statusBox = $("#open-status");
  const statusText = $(".js-open-text");
  const statusSub = $(".js-open-sub");

  const updateOpenStatus = () => {
    if (!statusBox || !statusText || !statusSub) return;

    let hour = 0;
    let minute = 0;

    try {
      const parts = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date());

      const getPart = (type) => {
        const part = parts.find((item) => item.type === type);
        return part ? parseInt(part.value, 10) : 0;
      };

      hour = getPart("hour") % 24;
      minute = getPart("minute");
    } catch (error) {
      const now = new Date();
      hour = now.getHours();
      minute = now.getMinutes();
    }

    const isOpen = hour >= 9 && hour < 20;

    statusBox.classList.toggle("is-closed", !isOpen);

    if (isOpen) {
      const closingSoon = hour === 19 && minute > 30;
      statusText.textContent = closingSoon ? "Скоро закроемся" : "Сейчас открыто";
      statusSub.textContent = closingSoon
        ? "До 20:00 ещё можно приехать"
        : "Работаем до 20:00";
    } else if (hour < 9) {
      statusText.textContent = "Сейчас закрыто";
      statusSub.textContent = "Откроемся в 9:00";
    } else {
      statusText.textContent = "Сейчас закрыто";
      statusSub.textContent = "Откроемся завтра в 9:00";
    }
  };

  updateOpenStatus();
  window.setInterval(updateOpenStatus, 60000);

  /* ── Выбор услуги → форме ───────────────────────────── */

  const bookingSection = $("#booking");
  const serviceSelect = $("#bf-service");
  const nameInput = $("#bf-name");

  const pickService = (value) => {
    if (!bookingSection || !serviceSelect) return;

    const hasOption = $$("option", serviceSelect).some(
      (option) => option.value === value
    );

    if (hasOption) {
      serviceSelect.value = value;
      serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    bookingSection.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });

    if (nameInput) {
      window.setTimeout(
        () => nameInput.focus({ preventScroll: true }),
        reducedMotion ? 0 : 620
      );
    }
  };

  $$("[data-service]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      pickService(button.dataset.service || "");
    });
  });

  /* ── Лайтбокс ───────────────────────────────────────── */

  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightbox-img");
  const lightboxCaption = $("#lightbox-caption");
  const lightboxClose = $("#lightbox-close");
  let lastTrigger = null;

  $$(".gallery-item").forEach((button) => {
    button.addEventListener("click", () => {
      if (!lightbox || typeof lightbox.showModal !== "function") {
        window.open(button.dataset.full, "_blank", "noopener");
        return;
      }

      lastTrigger = button;
      const image = $("img", button);
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

  /* ── Форма записи ───────────────────────────────────── */

  const form = $("#booking-form");
  const success = $("#form-success");
  const resetButton = $("#form-reset");
  const phoneInput = $("#bf-phone");
  const dateInput = $("#bf-date");
  const consentInput = $("#bf-consent");
  const successName = $("#success-name");
  const waLink = $("#wa-send");

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
    const error = $(".field-error", field);
    if (error) error.textContent = message;
    input.setAttribute("aria-invalid", "true");
  };

  const clearError = (input) => {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.remove("is-invalid");
    const error = $(".field-error", field);
    if (error) error.textContent = "";
    input.removeAttribute("aria-invalid");
  };

  if (form) {
    if (resetButton) resetButton.hidden = true;

    [nameInput, phoneInput, serviceSelect, dateInput, consentInput].forEach(
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

      if (!serviceSelect.value) {
        showError(serviceSelect, "Выберите услугу или консультацию.");
        firstInvalid = firstInvalid || serviceSelect;
      }

      if (dateInput && dateInput.value && dateInput.value < todayISO) {
        showError(dateInput, "Дата уже прошла — выберите другую.");
        firstInvalid = firstInvalid || dateInput;
      }

      if (consentInput && !consentInput.checked) {
        showError(consentInput, "Без согласия отправить заявку нельзя.");
        firstInvalid = firstInvalid || consentInput;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const car = $("#bf-car").value.trim();
      const time = $("#bf-time").value;
      const comment = $("#bf-comment").value.trim();

      const message = [
        "Здравствуйте! Хочу записаться в автосервис «Акара».",
        "",
        `Имя: ${nameInput.value.trim()}`,
        `Телефон: ${phoneInput.value}`,
        car ? `Автомобиль: ${car}` : null,
        `Услуга: ${serviceSelect.value}`,
        dateInput && dateInput.value ? `Дата: ${dateInput.value}` : null,
        time ? `Время: ${time}` : null,
        comment ? `Комментарий: ${comment}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const whatsappUrl = `https://wa.me/79381008606?text=${encodeURIComponent(message)}`;

      if (successName) successName.textContent = nameInput.value.trim();
      if (waLink) waLink.href = whatsappUrl;

      form.hidden = true;
      if (success) {
        success.hidden = false;
        const heading = $("h3", success);
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
      }
      if (resetButton) resetButton.hidden = false;

      const popup = window.open(whatsappUrl, "_blank", "noopener");
      if (popup) popup.opener = null;
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (!form) return;
      form.reset();
      [nameInput, phoneInput, serviceSelect, dateInput, consentInput].forEach(
        (input) => {
          if (input) clearError(input);
        }
      );
      if (dateInput) dateInput.min = todayISO;
      if (success) success.hidden = true;
      form.hidden = false;
      resetButton.hidden = true;
      if (nameInput) nameInput.focus();
    });
  }

  /* ── Год в подвале ──────────────────────────────────── */

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
