(() => {
    "use strict";

    /* ---------- 1. SELECTORS ---------- */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const codeInput = $("#codeInput");
    const output = $("#output");
    const improveBtn = $("#improveBtn");
    const copyBtn = $("#copyBtn");
    const clearBtn = $("#clearBtn");
    const copyOutputBtn = $("#copyOutput");
    const downloadBtn = $("#downloadBtn");
    const themeToggle = $("#themeToggle");
    const toast = $("#as-toast");
    const snakeContainer = $(".snake-container");

    let toastTimer = null;
    let snakeTimer = null;

    /* ---------- 2. PYTHON EXAMPLES ---------- */

    const examples = {
        factorial: `# Factorial of a number
# Created by Ansh

def factorial(n):
    if n < 0:
        raise ValueError("Negative numbers are not allowed")

    result = 1

    for i in range(1, n + 1):
        result *= i

    return result


number = 5

print("Number:", number)
print("Factorial:", factorial(number))
`,

        fibonacci: `# Fibonacci Series
# Created by Ansh

def fibonacci(n):
    if n < 0:
        raise ValueError("Number of terms cannot be negative")

    a, b = 0, 1
    series = []

    for _ in range(n):
        series.append(a)
        a, b = b, a + b

    return series


terms = 10

print("Fibonacci Series:")
print(fibonacci(terms))
`,

        structure: `# Structure to Dictionary Conversion
# Created by Ansh

from dataclasses import asdict, dataclass


@dataclass
class Student:
    name: str
    roll_no: int
    course: str


student = Student(
    name="Ansh",
    roll_no=101,
    course="Computer Science",
)

student_dict = asdict(student)

print("Student Object:")
print(student)

print("\\nDictionary:")
print(student_dict)
`,

        clean: `# Clean Python Code Example
# Created by Ansh

def calculate_average(numbers):
    """Calculate the average of a list of numbers."""

    if not numbers:
        return 0

    return sum(numbers) / len(numbers)


marks = [85, 90, 78, 92, 88]

average = calculate_average(marks)

print("Marks:", marks)
print("Average:", round(average, 2))
`
    };


    /* ---------- 3. TOAST NOTIFICATIONS ---------- */

    function showToast(message) {
        if (!toast) return;

        clearTimeout(toastTimer);

        toast.textContent = message;
        toast.classList.remove("show", "active");

        // Restart the CSS animation.
        void toast.offsetWidth;

        toast.classList.add("show");

        toastTimer = setTimeout(() => {
            toast.classList.remove("show", "active");
        }, 2800);
    }


    /* ---------- 4. COBRA REACTION ---------- */

    function reactSnake() {
        if (!snakeContainer) return;

        clearTimeout(snakeTimer);

        snakeContainer.classList.remove("snake-react");

        // Restart animation even on repeated clicks.
        void snakeContainer.offsetWidth;

        snakeContainer.classList.add("snake-react");

        snakeTimer = setTimeout(() => {
            snakeContainer.classList.remove("snake-react");
        }, 750);
    }


    /* ---------- 5. BUTTON CLICK ANIMATION ---------- */

    function animateButton(button) {
        if (!button) return;

        button.classList.remove("button-clicked");

        void button.offsetWidth;

        button.classList.add("button-clicked");

        setTimeout(() => {
            button.classList.remove("button-clicked");
        }, 450);
    }


    /* ---------- 6. LOAD PROGRAM EXAMPLES ---------- */

    function loadExample(name) {
        const example = examples[name];

        if (!example || !codeInput) {
            showToast("Example could not be loaded.");
            return;
        }

        codeInput.value = example;

        if (output) {
            output.value = "";
        }

        reactSnake();

        showToast(
            `🐍 ${name.charAt(0).toUpperCase() + name.slice(1)} example loaded!`
        );

        const editorSection = $("#editor");

        if (editorSection) {
            editorSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        setTimeout(() => {
            codeInput.focus({
                preventScroll: true
            });
        }, 350);
    }

    $$("[data-example]").forEach(button => {
        button.addEventListener("click", () => {
            loadExample(button.dataset.example);
            animateButton(button);
        });
    });


    /* ---------- 7. PYTHON CODE CLEANER ---------- */

    /*
       This cleaner:
       1. Removes trailing spaces.
       2. Converts indentation tabs into four spaces.
       3. Removes unnecessary blank lines.
       4. Adds spacing around top-level functions/classes.
       5. Preserves triple-quoted strings.
       6. Does not intentionally change Python logic.

       Note: This is not a full Python parser or compiler.
    */

    function updateTripleQuoteState(line, state) {
        let quote = state;
        let i = 0;

        while (i < line.length) {

            // Currently inside a triple-quoted string.
            if (quote) {
                if (
                    line.startsWith(quote, i) &&
                    line[i - 1] !== "\\"
                ) {
                    quote = null;
                    i += 3;
                } else {
                    i++;
                }

                continue;
            }

            // A comment begins outside a string.
            if (line[i] === "#") {
                break;
            }

            // Detect triple-quoted strings.
            if (
                line.startsWith("'''", i) ||
                line.startsWith('"""', i)
            ) {
                const delimiter = line.slice(i, i + 3);

                const closing = line.indexOf(
                    delimiter,
                    i + 3
                );

                if (closing === -1) {
                    quote = delimiter;
                    i = line.length;
                } else {
                    i = closing + 3;
                }

                continue;
            }

            // Skip ordinary quoted strings.
            if (line[i] === "'" || line[i] === '"') {
                const delimiter = line[i];

                i++;

                while (i < line.length) {
                    if (line[i] === "\\") {
                        i += 2;
                        continue;
                    }

                    if (line[i] === delimiter) {
                        i++;
                        break;
                    }

                    i++;
                }

                continue;
            }

            i++;
        }

        return quote;
    }


    function formatPythonCode(source) {

        // Normalize Windows and old-style line endings.
        const originalLines = source
            .replace(/\r\n?/g, "\n")
            .split("\n");

        const result = [];

        let tripleQuote = null;
        let blankCount = 0;

        for (const originalLine of originalLines) {

            const insideMultilineString = Boolean(tripleQuote);

            let line = originalLine;

            // Do not modify the contents of multiline strings.
            if (!insideMultilineString) {

                // Remove trailing spaces and tabs.
                line = line.replace(/[ \t]+$/g, "");

                // Convert indentation tabs into four spaces.
                const indentMatch = line.match(/^[\t ]*/);

                if (indentMatch) {
                    const normalizedIndent =
                        indentMatch[0].replace(/\t/g, "    ");

                    line =
                        normalizedIndent +
                        line.slice(indentMatch[0].length);
                }

                // Limit consecutive blank lines.
                if (line.trim() === "") {

                    blankCount++;

                    if (blankCount > 2) {
                        tripleQuote = updateTripleQuoteState(
                            originalLine,
                            tripleQuote
                        );

                        continue;
                    }

                } else {

                    blankCount = 0;

                    /*
                       Add two blank lines before top-level
                       functions and classes where appropriate.
                    */

                    if (
                        /^(async\s+def|def|class)\s+/.test(line) &&
                        result.length
                    ) {

                        while (
                            result.length &&
                            result[result.length - 1].trim() === ""
                        ) {
                            result.pop();
                        }

                        if (result.length) {
                            result.push("");
                            result.push("");
                        }
                    }
                }
            }

            result.push(line);

            tripleQuote = updateTripleQuoteState(
                originalLine,
                tripleQuote
            );
        }

        // Remove blank lines from the start.
        while (
            result.length &&
            result[0].trim() === ""
        ) {
            result.shift();
        }

        // Remove blank lines from the end.
        while (
            result.length &&
            result[result.length - 1].trim() === ""
        ) {
            result.pop();
        }

        return result.length
            ? `${result.join("\n")}\n`
            : "";
    }


    /* ---------- 8. BASIC PYTHON ISSUE DETECTION ---------- */

    function findCommonIssues(source) {
        const issues = [];

        // Possible empty function body.
        if (
            /\bdef\s+\w+\s*\([^)]*\)\s*:\s*\n\s*(?:#.*\n\s*)?(?:\n|$)/.test(
                source
            )
        ) {
            issues.push(
                "A function may have an empty body."
            );
        }

        // Common factorial off-by-one mistake.
        if (
            /\brange\(\s*1\s*,\s*[A-Za-z_]\w*\s*\)/.test(source) &&
            /factorial/i.test(source)
        ) {
            issues.push(
                "Possible factorial off-by-one bug: check whether range(..., n + 1) is needed."
            );
        }

        // Possible missing colon after an if statement.
        if (
            /^\s*if\s+.+[^:]\s*$/m.test(source) &&
            /^\s*if\s+/m.test(source)
        ) {
            const ifLines = source
                .split("\n")
                .filter(line => /^\s*if\s+/.test(line));

            if (
                ifLines.some(line => !line.trimEnd().endsWith(":"))
            ) {
                issues.push(
                    "An if statement may be missing its colon."
                );
            }
        }

        // Possible accidental assignment inside print().
        if (
            /\bprint\s*\([^\n]*\b[A-Za-z_]\w*\s*=\s*[^\n]*\)/.test(
                source
            )
        ) {
            issues.push(
                "Check print() arguments for accidental assignment-like syntax."
            );
        }

        return issues;
    }


    /* ---------- 9. IMPROVE CODE BUTTON ---------- */

    function improveCode() {

        if (!codeInput || !output) {
            showToast(
                "Editor/output field nahi mila. HTML IDs check karo."
            );

            return;
        }

        const source = codeInput.value;

        if (!source.trim()) {
            showToast(
                "⚠️ Pehle editor mein Python code likho!"
            );

            reactSnake();
            codeInput.focus();

            return;
        }

        const formatted = formatPythonCode(source);

        output.value = formatted;

        output.dispatchEvent(
            new Event("input", {
                bubbles: true
            })
        );

        reactSnake();
        animateButton(improveBtn);

        const issues = findCommonIssues(formatted);

        if (issues.length) {

            showToast(
                `✨ Formatting done; review: ${issues[0]}`
            );

        } else if (formatted === source) {

            showToast(
                "✅ Code is already clean! Formatting only; logic not executed."
            );

        } else {

            showToast(
                "✨ Code formatting cleaned successfully!"
            );
        }
    }

    if (improveBtn) {
        improveBtn.addEventListener("click", improveCode);
    }


    /* ---------- 10. COPY TO CLIPBOARD ---------- */

    async function copyText(text, successMessage) {

        if (!text || !text.trim()) {
            showToast(
                "⚠️ Copy karne ke liye code nahi hai!"
            );

            return;
        }

        try {

            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {
                await navigator.clipboard.writeText(text);
            } else {
                throw new Error("Clipboard API unavailable");
            }

        } catch (error) {

            // Fallback for browsers where Clipboard API is unavailable.
            const temporaryTextarea =
                document.createElement("textarea");

            temporaryTextarea.value = text;

            temporaryTextarea.setAttribute(
                "readonly",
                ""
            );

            temporaryTextarea.style.position = "fixed";
            temporaryTextarea.style.left = "-9999px";

            document.body.appendChild(temporaryTextarea);

            temporaryTextarea.select();

            let copied = false;

            try {
                copied = document.execCommand("copy");
            } catch (_) {
                copied = false;
            }

            temporaryTextarea.remove();

            if (!copied) {
                showToast(
                    "Copy failed. Code select karke manually copy karo."
                );

                return;
            }
        }

        reactSnake();
        showToast(successMessage);
    }


    if (copyBtn) {
        copyBtn.addEventListener("click", () => {

            copyText(
                codeInput ? codeInput.value : "",
                "📋 Python code copied!"
            );

            animateButton(copyBtn);
        });
    }


    if (copyOutputBtn) {
        copyOutputBtn.addEventListener("click", () => {

            copyText(
                output ? output.value : "",
                "📋 Cleaned code copied!"
            );

            animateButton(copyOutputBtn);
        });
    }


    /* ---------- 11. CLEAR EDITOR ---------- */

    if (clearBtn) {

        clearBtn.addEventListener("click", () => {

            if (codeInput) {
                codeInput.value = "";
            }

            if (output) {
                output.value = "";
            }

            if (codeInput) {
                codeInput.focus();
            }

            reactSnake();
            animateButton(clearBtn);

            showToast("🧹 Editor cleared!");
        });
    }


    /* ---------- 12. DOWNLOAD PYTHON FILE ---------- */

    function downloadPythonFile() {

        if (
            !codeInput ||
            !codeInput.value.trim()
        ) {
            showToast(
                "⚠️ Download se pehle code likho!"
            );

            return;
        }

        const blob = new Blob(
            [codeInput.value],
            {
                type: "text/x-python;charset=utf-8"
            }
        );

        const downloadURL = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = downloadURL;
        link.download = "ansh_python_program.py";

        document.body.appendChild(link);

        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(downloadURL);
        }, 1000);

        reactSnake();

        showToast("⬇️ Python file downloaded!");
    }


    if (downloadBtn) {

        downloadBtn.addEventListener("click", () => {

            downloadPythonFile();

            animateButton(downloadBtn);
        });
    }


    /* ---------- 13. DARK / LIGHT THEME ---------- */

    function applyTheme(isLight, persist = true) {

        document.body.classList.toggle(
            "light-theme",
            isLight
        );

        if (themeToggle) {

            themeToggle.textContent =
                isLight ? "☀️" : "🌙";

            themeToggle.setAttribute(
                "aria-label",
                isLight
                    ? "Switch to dark theme"
                    : "Switch to light theme"
            );

            themeToggle.setAttribute(
                "aria-pressed",
                String(isLight)
            );
        }

        if (persist) {

            try {

                localStorage.setItem(
                    "improve_code_AS_theme",
                    isLight ? "light" : "dark"
                );

            } catch (_) {
                // Theme still works if storage is blocked.
            }
        }
    }


    function toggleTheme() {

        const isLight =
            !document.body.classList.contains("light-theme");

        applyTheme(isLight);

        reactSnake();
        animateButton(themeToggle);

        showToast(
            isLight
                ? "☀️ Light mode enabled!"
                : "🌙 Dark mode enabled!"
        );
    }


    // Restore the previously selected theme.
    try {

        applyTheme(
            localStorage.getItem("improve_code_AS_theme") === "light",
            false
        );

    } catch (_) {

        applyTheme(false, false);
    }


    if (themeToggle) {
        themeToggle.addEventListener(
            "click",
            toggleTheme
        );
    }


    /* ---------- 14. KEYBOARD SHORTCUTS ---------- */

    if (codeInput) {

        codeInput.addEventListener("keydown", event => {

            // Tab inserts four spaces instead of moving focus.
            if (event.key === "Tab") {

                event.preventDefault();

                const start = codeInput.selectionStart;
                const end = codeInput.selectionEnd;

                codeInput.setRangeText(
                    "    ",
                    start,
                    end,
                    "end"
                );
            }

            // Ctrl + Enter formats the current code.
            if (
                event.key === "Enter" &&
                (event.ctrlKey || event.metaKey)
            ) {

                event.preventDefault();

                improveCode();
            }
        });
    }


    /* ---------- 15. SMOOTH SCROLL FOR ANCHORS ---------- */

    $$('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", event => {

            const targetID =
                anchor.getAttribute("href");

            if (
                !targetID ||
                targetID === "#"
            ) {
                return;
            }

            let target = null;

            try {
                target = $(targetID);
            } catch (_) {
                return;
            }

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });


    /* ---------- 16. SCROLL REVEAL ANIMATIONS ---------- */

    const revealTargets = $$(
        ".program-card, .about-card, .editor-panel"
    );

    if (
        "IntersectionObserver" in window &&
        !window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
    ) {

        const revealObserver = new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("revealed");

                    entry.target.style.opacity = "1";

                    entry.target.style.transform =
                        "translateY(0)";

                    revealObserver.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12
            }
        );

        revealTargets.forEach((element, index) => {

            element.style.opacity = "0";

            element.style.transform =
                "translateY(22px)";

            const delay =
                Math.min(index % 4, 3) * 90;

            element.style.transition =
                `opacity 650ms ease ${delay}ms, ` +
                `transform 650ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms, ` +
                "border-color 300ms ease, box-shadow 300ms ease";

            revealObserver.observe(element);
        });
    }


    /* ---------- 17. FOOTER YEAR ---------- */

    const currentYear = $("#currentYear");

    if (currentYear) {
        currentYear.textContent =
            new Date().getFullYear();
    }


    /* ---------- 18. OPTIONAL BACK-TO-TOP ---------- */

    const backToTop = $("#backToTop");

    if (backToTop) {

        backToTop.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            reactSnake();
        });
    }


    /* ---------- 19. WELCOME ---------- */

    console.log(
        "%c improve_code_AS ",
        "background:#00e5a8;color:#04130f;font-size:16px;font-weight:bold;padding:8px;"
    );

    console.log(
        "%c Crafted by Ansh 🐍",
        "color:#00e5a8;font-size:12px;font-weight:bold;"
    );

    console.log(
        "Website ready. Python code is formatted in-browser; it is not executed."
    );

    // Small entrance reaction after the page loads.
    setTimeout(reactSnake, 900);

})();