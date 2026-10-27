
const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

window.addEventListener("load", () => {
  const loader = $(".page-loader");

  if (loader) {
    setTimeout(() => {
      loader.classList.add("done");
    }, 650);
  }
});

const yearElement = $("#year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const revealElements = $$(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -30px 0px"
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${(index % 4) * 70}ms`;
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("visible");
  });
}

const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$(".nav-link", navLinks).forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const pageSections = $$("main section[id]");
const navigationLinks = $$(".nav-link");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navigationLinks.forEach((link) => {
          const isActive =
            link.getAttribute("href") === `#${entry.target.id}`;

          link.classList.toggle("active", isActive);
        });
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px"
    }
  );

  pageSections.forEach((section) => {
    sectionObserver.observe(section);
  });
}

const cursorGlow = $(".cursor-glow");
const finePointer = window.matchMedia("(pointer: fine)").matches;
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (cursorGlow && finePointer && !reducedMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    },
    { passive: true }
  );
}

if (finePointer && !reducedMotion) {
  $$(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();

      const offsetX =
        event.clientX - rect.left - rect.width / 2;

      const offsetY =
        event.clientY - rect.top - rect.height / 2;

      button.style.transform =
        `translate(${offsetX * 0.08}px, ${offsetY * 0.12}px)`;
    });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

const particleCanvas = $("#particles");

if (
  particleCanvas &&
  !reducedMotion &&
  particleCanvas.getContext
) {
  const ctx = particleCanvas.getContext("2d");

  let canvasWidth = 0;
  let canvasHeight = 0;
  let particles = [];
  let animationFrame = null;

  const mouse = {
    x: -1000,
    y: -1000,
    radius: 100
  };

  function createParticle() {
    return {
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      radius: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.25 + 0.06,
      opacity: Math.random() * 0.5 + 0.15,
      drift: (Math.random() - 0.5) * 0.2
    };
  }

  function resizeCanvas() {
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      1.7
    );

    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    particleCanvas.width = Math.floor(canvasWidth * pixelRatio);
    particleCanvas.height = Math.floor(canvasHeight * pixelRatio);

    particleCanvas.style.width = `${canvasWidth}px`;
    particleCanvas.style.height = `${canvasHeight}px`;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const particleCount = canvasWidth < 700 ? 24 : 55;

    particles = Array.from(
      { length: particleCount },
      createParticle
    );
  }

  function drawParticles() {
    if (document.hidden) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += particle.drift;

      if (particle.y < -5) {
        particle.y = canvasHeight + 5;
        particle.x = Math.random() * canvasWidth;
      }

      if (particle.x < -5) {
        particle.x = canvasWidth + 5;
      }

      if (particle.x > canvasWidth + 5) {
        particle.x = -5;
      }

      const dx = particle.x - mouse.x;
      const dy = particle.y - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouse.radius && distance > 0) {
        const force = (mouse.radius - distance) / mouse.radius;

        particle.x += (dx / distance) * force * 0.7;
        particle.y += (dy / distance) * force * 0.7;
      }

      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = `rgba(255, 38, 62, ${particle.opacity})`;
      ctx.fill();
    });

    animationFrame = requestAnimationFrame(drawParticles);
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  window.addEventListener("resize", resizeCanvas, {
    passive: true
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
    } else {
      drawParticles();
    }
  });

  resizeCanvas();
  drawParticles();
}

$$('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const targetId = anchor.getAttribute("href");

    if (!targetId || targetId === "#") return;

    const target = $(targetId);

    if (!target) return;

    event.preventDefault();

    target.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start"
    });
  });
});

if (finePointer && !reducedMotion) {
  $$(".skill-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();

      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      const rotateY = (x - 0.5) * 5;
      const rotateX = (0.5 - y) * 5;

      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) ` +
        `rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

$$(".skill-card, .project-feature").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();

    card.style.setProperty(
      "--mouse-x",
      `${event.clientX - rect.left}px`
    );

    card.style.setProperty(
      "--mouse-y",
      `${event.clientY - rect.top}px`
    );
  });
});

if (reducedMotion) {
  $$(".reveal").forEach((element) => {
    element.classList.add("visible");
  });
}

console.log(
  "%c ANSH SONI ",
  "background:#ff263e;color:#080607;font-size:20px;font-weight:bold;padding:8px 16px;"
);

console.log(
  "%c DEVIL-CORE SYSTEM ONLINE",
  "color:#ff263e;font-size:12px;font-weight:bold;"
);

console.log(
  "%c Build with intent. Learn without limits.",
  "color:#a39499;font-size:11px;"
);
document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const sections = document.querySelectorAll(
        ".about-section, .academics-section, .arsenal-section"
    );

    sections.forEach((section) => {
        section.querySelectorAll(
            ".about-image, .about-text, .academic-card, " +
            ".arsenal-category, .arsenal-item, .detail-item"
        ).forEach((element, index) => {
            element.classList.add("interactive-reveal");
            element.style.setProperty(
                "--reveal-delay",
                `${Math.min(index % 8, 7) * 75}ms`
            );
        });
    });

    const revealElements = document.querySelectorAll(
        ".interactive-reveal"
    );

    if ("IntersectionObserver" in window && !reducedMotion) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("interactive-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -35px 0px"
            }
        );

        revealElements.forEach((element) => {
            revealObserver.observe(element);
        });
    } else {
        revealElements.forEach((element) => {
            element.classList.add("interactive-visible");
        });
    }

    if (!reducedMotion) {
        document.querySelectorAll(".arsenal-item").forEach((card) => {
            card.addEventListener("pointermove", (event) => {
                const rect = card.getBoundingClientRect();

                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                card.style.setProperty("--mouse-x", `${x}px`);
                card.style.setProperty("--mouse-y", `${y}px`);
            });

            card.addEventListener("pointerleave", () => {
                card.style.removeProperty("--mouse-x");
                card.style.removeProperty("--mouse-y");
            });
        });

        document.querySelectorAll(".academic-card").forEach((card) => {
            card.addEventListener("pointermove", (event) => {
                if (event.pointerType === "touch") return;

                const rect = card.getBoundingClientRect();

                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;

                const rotateY = (x - 0.5) * 8;
                const rotateX = (0.5 - y) * 8;

                card.style.transform =
                    `perspective(800px) rotateX(${rotateX}deg) ` +
                    `rotateY(${rotateY}deg) translateY(-5px)`;
            });

            card.addEventListener("pointerleave", () => {
                card.style.removeProperty("transform");
            });
        });

        const aboutImage = document.querySelector(".about-image");

        if (aboutImage) {
            aboutImage.addEventListener("pointermove", (event) => {
                if (event.pointerType === "touch") return;

                const rect = aboutImage.getBoundingClientRect();

                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;

                aboutImage.style.setProperty(
                    "--image-rotate-x",
                    `${(0.5 - y) * 5}deg`
                );

                aboutImage.style.setProperty(
                    "--image-rotate-y",
                    `${(x - 0.5) * 5}deg`
                );
            });

            aboutImage.addEventListener("pointerleave", () => {
                aboutImage.style.removeProperty("--image-rotate-x");
                aboutImage.style.removeProperty("--image-rotate-y");
            });
        }
    }

    const style = document.createElement("style");

    style.textContent =
        `.interactive-reveal {
            opacity: 0;
            transform: translateY(24px);
            transition:
                opacity 650ms ease,
                transform 650ms cubic-bezier(0.2, 0.7, 0.2, 1);
            transition-delay: var(--reveal-delay, 0ms);
        }

        .interactive-reveal.interactive-visible {
            opacity: 1;
            transform: translateY(0);
        }

        .arsenal-item {
            position: relative;
            isolation: isolate;
        }

        .arsenal-item::after {
            content: "";
            position: absolute;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            opacity: 0;
            background: radial-gradient(
                180px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                rgba(255, 25, 60, 0.15),
                transparent 75%
            );
            transition: opacity 250ms ease;
        }

        .arsenal-item:hover::after {
            opacity: 1;
        }

        .about-image img {
            transform:
                perspective(800px)
                rotateX(var(--image-rotate-x, 0deg))
                rotateY(var(--image-rotate-y, 0deg));
        }

        @media (prefers-reduced-motion: reduce) {
            .interactive-reveal {
                opacity: 1;
                transform: none;
                transition: none;
            }
        }
      `;

    document.head.appendChild(style);

    const academicScores = document.querySelectorAll(".academic-score");

    const animateScore = (element) => {
        const rawValue = element.textContent.trim();
        const target = Number(rawValue);

        if (!Number.isFinite(target) || element.dataset.animated === "true") {
            return;
        }

        element.dataset.animated = "true";

        if (reducedMotion) {
            element.textContent = target.toFixed(1);
            return;
        }

        const duration = 1200;
        const startTime = performance.now();

        const updateScore = (currentTime) => {
            const progress = Math.min(
                (currentTime - startTime) / duration,
                1
            );

            const easedProgress = 1 - Math.pow(1 - progress, 4);
            const currentValue = target * easedProgress;

            element.textContent = currentValue.toFixed(1);

            if (progress < 1) {
                requestAnimationFrame(updateScore);
            } else {
                element.textContent = target.toFixed(1);
            }
        };

        requestAnimationFrame(updateScore);
    };

    if ("IntersectionObserver" in window) {
        const scoreObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateScore(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        academicScores.forEach((score) => {
            scoreObserver.observe(score);
        });
    } else {
        academicScores.forEach(animateScore);
    }
});



/* Added project-card interaction (keeps the existing portfolio scripts intact). */
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".project-card");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  cards.forEach((card) => {
    if (!reduceMotion) {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--pointer-x", `${x}%`);
        card.style.setProperty("--pointer-y", `${y}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--pointer-x");
        card.style.removeProperty("--pointer-y");
      });
    }
  });
});

/* =========================================================
   NOVA AI — ANSH SONI PORTFOLIO CHATBOT
   Local assistant — No API key required
   ========================================================= */

(() => {
  "use strict";

  function initNovaChat() {
    const widget = document.getElementById("novaChatWidget");
    const launcher = document.getElementById("novaChatLauncher");
    const panel = document.getElementById("novaChatPanel");
    const closeButton = document.getElementById("novaChatClose");
    const form = document.getElementById("novaChatForm");
    const input = document.getElementById("userInput");
    const sendButton = document.getElementById("sendButton");
    const messages = document.getElementById("chatMessages");
    const status = document.getElementById("chatStatus");

    // Check that all required HTML elements exist.
    if (
      !widget ||
      !launcher ||
      !panel ||
      !closeButton ||
      !form ||
      !input ||
      !sendButton ||
      !messages
    ) {
      console.warn("NOVA: Required chatbot elements are missing.");
      return;
    }

    // Prevent duplicate event listeners.
    if (widget.dataset.novaInitialized === "true") return;
    widget.dataset.novaInitialized = "true";

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* =========================
       PORTFOLIO KNOWLEDGE BASE
       ========================= */

    const knowledge = {
      about:
        "I'm Ansh Soni, a B.Tech Computer Science student at JECRC University, Jaipur. I'm passionate about web development, programming, and building useful digital experiences.",

      education:
        "Ansh is pursuing B.Tech in Computer Science at JECRC University, Jaipur. His reported academic scores are 8.0 in Semester 1 and 8.6 in Semester 2.",

      skills:
        "Ansh is developing his skills in HTML, CSS, JavaScript, C, C++, and Python. He is also exploring APIs, Git, and full-stack development.",

      projects:
        "Here are Ansh's three featured projects:\n\n1. WEATHER FORECASTER — A live weather application.\n\n2. PYTHON IMPROVER — A tool designed to make Python code easier to read and maintain.\n\n3. READ VAULT — A personal reading-list application for organizing books and tracking reading progress.",

      weather:
        "WEATHER FORECASTER\n\nA live weather application built with web technologies and a weather API.\n\nOpen project: https://anshweathernews.netlify.app/",

      python:
        "PYTHON IMPROVER\n\nA code-improvement project focused on making messy Python code easier to understand and maintain.\n\nOpen project: https://anshpython-b9038.netlify.app/",

      vault:
        "READ VAULT\n\nA personal reading-list application to organize books and track your reading progress.\n\nOpen project: https://anshreadvault-ed8079.netlify.app/",

      contact:
        "You can connect with Ansh through the Contact section of this portfolio. Please note that the email address currently shown on the website is a placeholder and should be replaced with the real email address.",

      goals:
        "Ansh is focused on strengthening his programming fundamentals, improving JavaScript, building practical projects, and progressing toward full-stack development.",

      stack:
        "Ansh's current learning stack includes HTML, CSS, JavaScript, C, C++, and Python basics. He is also exploring APIs, Git, and full-stack development."
    };

    /* =========================
       CHAT STATUS
       ========================= */

    function setStatus(message = "") {
      if (status) {
        status.textContent = message;
      }
    }

    /* =========================
       OPEN / CLOSE CHAT PANEL
       ========================= */

    function setChatOpen(isOpen) {
  panel.classList.toggle("is-open", isOpen);

  panel.setAttribute(
    "aria-hidden",
    String(!isOpen)
  );

  panel.inert = !isOpen;

  launcher.setAttribute(
    "aria-expanded",
    String(isOpen)
  );

  widget.classList.toggle("chat-open", isOpen);

  if (isOpen) {
    window.setTimeout(() => {
      input.focus();
    }, reducedMotion ? 0 : 180);
  } else {
    setStatus("");
    launcher.focus({ preventScroll: true });
  }
}

panel.classList.toggle("is-open", isOpen);
widget.classList.toggle("is-open", isOpen);

    /* =========================
       SCROLL TO LATEST MESSAGE
       ========================= */

    function scrollToLatest() {
      messages.scrollTop = messages.scrollHeight;
    }

    /* =========================
       CREATE CHAT MESSAGE
       ========================= */

    function addMessage(text, sender = "bot") {
      const message = document.createElement("div");

      message.className =
        `nova-message nova-message-${sender}`;

      const tag = document.createElement("span");

      tag.className = "nova-message-tag";

      tag.textContent =
        sender === "user" ? "YOU" : "NOVA";

      const paragraph = document.createElement("p");

      // Use textContent to prevent HTML injection.
      paragraph.textContent = text;

      message.append(tag, paragraph);

      messages.appendChild(message);

      scrollToLatest();

      return message;
    }

    /* =========================
       NORMALIZE USER QUESTIONS
       ========================= */

    function normalize(text) {
      return text
        .toLowerCase()
        .replace(/[’']/g, "")
        .replace(/[^a-z0-9+#.\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function containsAny(text, keywords) {
      return keywords.some((keyword) =>
        text.includes(keyword)
      );
    }

    /* =========================
       SMART RESPONSE ENGINE
       ========================= */

    function getReply(userMessage) {
      const text = normalize(userMessage);

      if (!text) {
        return "Please type a question. I'll help you explore Ansh's portfolio.";
      }

      // Greetings
      if (
        containsAny(text, [
          "hello",
          "hi",
          "hey",
          "good morning",
          "good evening",
          "namaste"
        ])
      ) {
        return "Hey! Welcome to Ansh's digital portfolio. I'm NOVA, your portfolio assistant. Ask me about Ansh, his skills, projects, or education.";
      }

      // Thanks
      if (
        containsAny(text, [
          "thank",
          "thanks",
          "thx"
        ])
      ) {
        return "You're welcome! Thanks for exploring Ansh's portfolio. Feel free to check out the projects.";
      }

      // Bot identity
      if (
        containsAny(text, [
          "who are you",
          "your name",
          "what are you",
          "nova"
        ])
      ) {
        return "I'm NOVA, Ansh's portfolio assistant. I use a local JavaScript response system to answer questions about his portfolio. I don't currently use a live AI API.";
      }

      // Contact
      if (
        containsAny(text, [
          "contact",
          "email",
          "connect",
          "hire",
          "reach",
          "linkedin",
          "github"
        ])
      ) {
        return knowledge.contact;
      }

      // Weather project
      if (
        containsAny(text, [
          "weather",
          "forecast",
          "temperature"
        ])
      ) {
        return knowledge.weather;
      }

      // Python Improver
      if (
        containsAny(text, [
          "python improver",
          "improve code",
          "code cleaner",
          "refactor",
          "python tool"
        ])
      ) {
        return knowledge.python;
      }

      // Read Vault
      if (
        containsAny(text, [
          "read vault",
          "reading list",
          "books",
          "reading app",
          "book app"
        ])
      ) {
        return knowledge.vault;
      }

      // Projects
      if (
        containsAny(text, [
          "project",
          "projects",
          "work",
          "built",
          "portfolio project",
          "apps",
          "application"
        ])
      ) {
        return knowledge.projects;
      }

      // Skills
      if (
        containsAny(text, [
          "skill",
          "skills",
          "technology",
          "technologies",
          "tech stack",
          "programming language",
          "languages",
          "know"
        ])
      ) {
        return knowledge.skills;
      }

      // Education
      if (
        containsAny(text, [
          "education",
          "college",
          "university",
          "degree",
          "semester",
          "cgpa",
          "sgpa",
          "marks",
          "study"
        ])
      ) {
        return knowledge.education;
      }

      // Career and goals
      if (
        containsAny(text, [
          "goal",
          "future",
          "career",
          "placement",
          "2027",
          "aim",
          "learning"
        ])
      ) {
        return knowledge.goals;
      }

      // About Ansh
      if (
        containsAny(text, [
          "about",
          "who is ansh",
          "tell me about ansh",
          "introduce",
          "background",
          "bio"
        ])
      ) {
        return knowledge.about;
      }

      // Technologies
      if (
        containsAny(text, [
          "html",
          "css",
          "javascript",
          "python",
          "mern",
          "full stack",
          "fullstack",
          "api"
        ])
      ) {
        return knowledge.stack;
      }

      // Help
      if (
        containsAny(text, [
          "help",
          "what can you do",
          "suggest",
          "options"
        ])
      ) {
        return "Here's what you can ask me:\n\n• Tell me about Ansh\n• What skills does he know?\n• Show me his projects\n• Tell me about Read Vault\n• What is Python Improver?\n• What are his academic scores?\n• How can I contact him?";
      }

      // Default response
      return "I don't have that information in my current portfolio knowledge base. Try asking about Ansh, his education, skills, projects, or contact information.";
    }

    /* =========================
       TYPING INDICATOR
       ========================= */

    function showTyping() {
      const typing = document.createElement("div");

      typing.className =
        "nova-message nova-message-bot nova-typing";

      typing.setAttribute(
        "aria-label",
        "NOVA is preparing a response"
      );

      const tag = document.createElement("span");

      tag.className = "nova-message-tag";
      tag.textContent = "NOVA";

      const paragraph = document.createElement("p");

      paragraph.textContent = "Processing your query...";

      typing.append(tag, paragraph);

      messages.appendChild(typing);

      scrollToLatest();

      return typing;
    }

    /* =========================
       SEND MESSAGE
       ========================= */

    let isSending = false;

    function sendMessage(rawText) {
      const text = rawText.trim();

      if (!text || isSending) {
        return;
      }

      addMessage(text, "user");

      input.value = "";

      isSending = true;

      sendButton.disabled = true;

      setStatus("NOVA is thinking...");

      const typing = showTyping();

      const delay = reducedMotion
        ? 80
        : 350 + Math.min(text.length * 5, 550);

      window.setTimeout(() => {
        typing.remove();

        const response = getReply(text);

        addMessage(response, "bot");

        isSending = false;

        sendButton.disabled = false;

        setStatus("Response ready");

        if (
          panel.getAttribute("aria-hidden") === "false"
        ) {
          input.focus();
        }
      }, delay);
    }

    /* =========================
       EVENT LISTENERS
       ========================= */

    // Open chatbot
    launcher.addEventListener("click", () => {
      const currentlyClosed =
        panel.getAttribute("aria-hidden") !== "false";

      setChatOpen(currentlyClosed);
    });

    // Close chatbot
    closeButton.addEventListener("click", () => {
      setChatOpen(false);
    });

    // Submit messages
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      sendMessage(input.value);
    });

    // Suggested question buttons
    widget.querySelectorAll("[data-prompt]").forEach(
      (button) => {
        button.addEventListener("click", () => {
          const prompt =
            button.getAttribute("data-prompt");

          if (!prompt) return;

          if (
            panel.getAttribute("aria-hidden") !== "false"
          ) {
            setChatOpen(true);
          }

          sendMessage(prompt);
        });
      }
    );

    // Escape key closes chatbot
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        panel.getAttribute("aria-hidden") === "false"
      ) {
        setChatOpen(false);
      }
    });

    // Keep the message area updated on resize
    window.addEventListener(
      "resize",
      () => {
        if (
          panel.getAttribute("aria-hidden") === "false"
        ) {
          scrollToLatest();
        }
      },
      { passive: true }
    );

    // Initialize chatbot in the closed state
    setChatOpen(false);

    console.log(
      "%c NOVA CHAT SYSTEM ONLINE ",
      "background:#ff263e;color:#080607;font-weight:bold;padding:6px;"
    );
  }

  // Initialize after the HTML has loaded
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initNovaChat,
      { once: true }
    );
  } else {
    initNovaChat();
  }
})();