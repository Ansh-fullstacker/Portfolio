
/* =========================================================
   READVAULT — BOOK READING LIST APPLICATION
   Designed & Developed by Ansh
   ========================================================= */

"use strict";

/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const CONFIG = {
    storageKey: "readvault_books_v1",
    settingsKey: "readvault_settings_v1",
    defaultReadingGoal: 12,
    toastDuration: 3200,
    maxBooks: 500,
    maxStorageCharacters: 5_000_000
};

const STATUS = Object.freeze({
    WANT_TO_READ: "want-to-read",
    READING: "reading",
    COMPLETED: "completed"
});

const STATUS_LABELS = Object.freeze({
    [STATUS.WANT_TO_READ]: "Want to Read",
    [STATUS.READING]: "Currently Reading",
    [STATUS.COMPLETED]: "Completed"
});

const CATEGORY_COLORS = [
    "cover-tone-1",
    "cover-tone-2",
    "cover-tone-3",
    "cover-tone-4",
    "cover-tone-5",
    "cover-tone-6"
];


/* =========================================================
   2. DOM ELEMENTS
   ========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

const elements = {
    sidebar: $("#sidebar"),
    sidebarOverlay: $("#sidebar-overlay"),
    mobileMenuButton: $("#mobile-menu-btn"),

    breadcrumbTitle: $("#breadcrumb-title"),

    searchInput: $("#search-input"),
    searchBox: $(".search-box"),
    themeToggle: $("#theme-toggle"),
    profileButton: $("#profile-button"),

    addBookButton: $("#add-book-btn"),
    emptyAddButton: $("#empty-add-btn"),

    navTotal: $("#nav-total"),

    goalCompleted: $("#goal-completed"),
    goalTarget: $("#goal-target"),
    goalProgress: $("#goal-progress"),
    goalCaption: $("#goal-caption"),
    editGoalButton: $("#edit-goal-btn"),

    statTotal: $("#stat-total"),
    statReading: $("#stat-reading"),
    statCompleted: $("#stat-completed"),
    statWant: $("#stat-want"),

    sectionTitle: $("#section-title"),
    sectionCount: $("#section-count"),
    sectionDescription: $("#section-description"),

    bookGrid: $("#book-grid"),
    emptyState: $("#empty-state"),
    emptyTitle: $("#empty-title"),
    emptyDescription: $("#empty-description"),

    sortSelect: $("#sort-select"),

    bookModalBackdrop: $("#book-modal-backdrop"),
    bookModal: $("#book-modal"),
    bookForm: $("#book-form"),
    modalTitle: $("#modal-title"),
    bookId: $("#book-id"),
    bookTitle: $("#book-title"),
    bookAuthor: $("#book-author"),
    bookCategory: $("#book-category"),
    bookStatus: $("#book-status"),
    bookPages: $("#book-pages"),
    bookCover: $("#book-cover"),
    bookDescription: $("#book-description"),
    saveBookButton: $("#save-book-btn"),

    closeModalButton: $("#close-modal-btn"),
    cancelModalButton: $("#cancel-modal-btn"),

    progressModalBackdrop: $("#progress-modal-backdrop"),
    progressForm: $("#progress-form"),
    progressBookId: $("#progress-book-id"),
    progressBookName: $("#progress-book-name"),
    progressPages: $("#progress-pages"),
    progressPercentage: $("#progress-percentage"),
    progressPreviewFill: $("#progress-preview-fill"),

    closeProgressModalButton: $("#close-progress-modal-btn"),
    cancelProgressButton: $("#cancel-progress-btn"),

    toastContainer: $("#toast-container")
};


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

let books = [];

let settings = {
    readingGoal: CONFIG.defaultReadingGoal,
    theme: "dark"
};

let currentView = "all";
let currentFilter = "all";
let currentLayout = "grid";
let searchQuery = "";

let activeModal = null;
let previousFocusedElement = null;

let toastSequence = 0;


/* =========================================================
   4. GENERAL UTILITIES
   ========================================================= */

function createId() {
    if (typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}


function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase();
}


function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}


function getBookProgress(book) {
    if (book.status === STATUS.COMPLETED) {
        return 100;
    }

    if (!book.pages || book.pages < 1) {
        return 0;
    }

    return clamp(
        Math.round((book.pagesRead / book.pages) * 100),
        0,
        100
    );
}


function getBookById(id) {
    return books.find(book => book.id === id);
}


function getStatusIcon(status) {
    const icons = {
        [STATUS.WANT_TO_READ]: "fa-bookmark",
        [STATUS.READING]: "fa-book-open-reader",
        [STATUS.COMPLETED]: "fa-circle-check"
    };

    return icons[status] || "fa-book";
}


function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}


/* =========================================================
   5. STORAGE
   ========================================================= */

function isValidStatus(status) {
    return Object.values(STATUS).includes(status);
}


function sanitizeBook(rawBook) {
    if (!rawBook || typeof rawBook !== "object") {
        return null;
    }

    if (typeof rawBook.title !== "string" ||
        typeof rawBook.author !== "string") {
        return null;
    }

    const title = rawBook.title.trim().slice(0, 120);
    const author = rawBook.author.trim().slice(0, 100);

    if (!title || !author) {
        return null;
    }

    const pages = Number(rawBook.pages);
    const pagesRead = Number(rawBook.pagesRead);

    const validPages =
        Number.isSafeInteger(pages) &&
        pages > 0 &&
        pages <= 100000
            ? pages
            : 0;

    const validPagesRead =
        Number.isSafeInteger(pagesRead) && pagesRead >= 0
            ? Math.min(pagesRead, validPages || pagesRead, 100000)
            : 0;

    const status = isValidStatus(rawBook.status)
        ? rawBook.status
        : STATUS.WANT_TO_READ;

    let normalizedPagesRead = validPagesRead;

    if (status === STATUS.COMPLETED && validPages) {
        normalizedPagesRead = validPages;
    }

    if (validPages && normalizedPagesRead >= validPages) {
        normalizedPagesRead = validPages;
    }

    let cover = "";

    if (typeof rawBook.cover === "string") {
        const candidate = rawBook.cover.trim();

        try {
            const url = new URL(candidate);

            if (url.protocol === "https:" || url.protocol === "http:") {
                cover = url.href.slice(0, 2048);
            }
        } catch {
            cover = "";
        }
    }

    const validCategories = [
        "Personal Growth",
        "Fiction",
        "Technology",
        "Business",
        "Psychology",
        "Biography",
        "Science",
        "Fantasy",
        "Other"
    ];

    const category = validCategories.includes(rawBook.category)
        ? rawBook.category
        : "Other";

    const createdAt = typeof rawBook.createdAt === "string" &&
        !Number.isNaN(Date.parse(rawBook.createdAt))
            ? rawBook.createdAt
            : new Date().toISOString();

    return {
        id: typeof rawBook.id === "string" && rawBook.id.length < 150
            ? rawBook.id
            : createId(),

        title,
        author,
        category,
        status,

        pages: validPages,
        pagesRead: normalizedPagesRead,

        cover,

        description: typeof rawBook.description === "string"
            ? rawBook.description.trim().slice(0, 500)
            : "",

        createdAt
    };
}


function loadBooks() {
    try {
        const rawData = localStorage.getItem(CONFIG.storageKey);

        if (!rawData) {
            return [];
        }

        if (rawData.length > CONFIG.maxStorageCharacters) {
            console.warn("ReadVault data exceeds the expected size.");
            return [];
        }

        const parsed = JSON.parse(rawData);

        if (!Array.isArray(parsed)) {
            return [];
        }

        const uniqueIds = new Set();

        return parsed
            .slice(0, CONFIG.maxBooks)
            .map(sanitizeBook)
            .filter(book => {
                if (!book || uniqueIds.has(book.id)) {
                    return false;
                }

                uniqueIds.add(book.id);

                return true;
            });
    } catch (error) {
        console.error("Could not load books:", error);

        return [];
    }
}


function loadSettings() {
    const defaults = {
        readingGoal: CONFIG.defaultReadingGoal,
        theme: "dark"
    };

    try {
        const rawSettings = localStorage.getItem(CONFIG.settingsKey);

        if (!rawSettings) {
            return defaults;
        }

        const parsed = JSON.parse(rawSettings);

        const readingGoal = Number(parsed.readingGoal);

        return {
            readingGoal:
                Number.isSafeInteger(readingGoal) &&
                readingGoal >= 1 &&
                readingGoal <= 10000
                    ? readingGoal
                    : defaults.readingGoal,

            theme: parsed.theme === "light" ? "light" : "dark"
        };
    } catch (error) {
        console.warn("Could not load settings:", error);

        return defaults;
    }
}


function saveBooks() {
    try {
        const serialized = JSON.stringify(books);

        if (serialized.length > CONFIG.maxStorageCharacters) {
            showToast(
                "Your library is too large to save in browser storage.",
                "error"
            );

            return false;
        }

        localStorage.setItem(CONFIG.storageKey, serialized);

        return true;
    } catch (error) {
        console.error("Could not save books:", error);

        showToast(
            "Unable to save changes. Check your browser storage.",
            "error"
        );

        return false;
    }
}


function saveSettings() {
    try {
        localStorage.setItem(
            CONFIG.settingsKey,
            JSON.stringify(settings)
        );

        return true;
    } catch (error) {
        console.error("Could not save settings:", error);

        showToast(
            "Settings could not be saved.",
            "error"
        );

        return false;
    }
}


/* =========================================================
   6. NOTIFICATIONS
   ========================================================= */

function showToast(message, type = "success") {
    if (!elements.toastContainer) {
        console.log(message);
        return;
    }

    const toast = document.createElement("div");

    const iconNames = {
        success: "fa-circle-check",
        error: "fa-circle-exclamation",
        info: "fa-circle-info"
    };

    const toastId = ++toastSequence;

    toast.className = `toast ${type === "error" ? "toast-error" : ""} ${
        type === "info" ? "toast-info" : ""
    }`;

    toast.dataset.toastId = String(toastId);

    const icon = document.createElement("span");
    icon.className = "toast-icon";

    const iconElement = document.createElement("i");
    iconElement.className = `fa-solid ${
        iconNames[type] || iconNames.success
    }`;

    icon.appendChild(iconElement);

    const messageElement = document.createElement("p");
    messageElement.className = "toast-message";
    messageElement.textContent = String(message);

    const closeButton = document.createElement("button");
    closeButton.className = "toast-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Dismiss notification");

    const closeIcon = document.createElement("i");
    closeIcon.className = "fa-solid fa-xmark";

    closeButton.appendChild(closeIcon);

    toast.append(icon, messageElement, closeButton);

    elements.toastContainer.appendChild(toast);

    let removed = false;

    const removeToast = () => {
        if (removed) {
            return;
        }

        removed = true;

        toast.classList.add("toast-leaving");

        window.setTimeout(() => {
            toast.remove();
        }, 280);
    };

    closeButton.addEventListener("click", removeToast);

    window.setTimeout(removeToast, CONFIG.toastDuration);
}


/* =========================================================
   7. THEME MANAGEMENT
   ========================================================= */

function applyTheme() {
    const isLight = settings.theme === "light";

    document.body.classList.toggle("light-theme", isLight);

    if (elements.themeToggle) {
        const icon = $("i", elements.themeToggle);

        if (icon) {
            icon.className = isLight
                ? "fa-solid fa-sun"
                : "fa-regular fa-moon";
        }

        elements.themeToggle.setAttribute(
            "aria-label",
            isLight ? "Switch to dark theme" : "Switch to light theme"
        );

        elements.themeToggle.title = isLight
            ? "Switch to dark theme"
            : "Switch to light theme";
    }

    const themeColor = $("meta[name='theme-color']");

    if (themeColor) {
        themeColor.content = isLight ? "#f5f4fa" : "#0b0b12";
    }
}


function toggleTheme() {
    settings.theme = settings.theme === "dark" ? "light" : "dark";

    applyTheme();

    if (saveSettings()) {
        showToast(
            `${settings.theme === "light" ? "Light" : "Dark"} theme enabled.`,
            "success"
        );
    }
}


/* =========================================================
   8. BOOK COVER RENDERING
   ========================================================= */

function getCoverMarkup(book) {
    const title = escapeHTML(book.title);

    if (book.cover) {
        return `
            <img
                class="book-cover"
                src="${escapeHTML(book.cover)}"
                alt="Cover of ${title}"
                loading="lazy"
                referrerpolicy="no-referrer">
        `;
    }

    const index = [...book.title].reduce(
        (total, character) => total + character.charCodeAt(0),
        0
    );

    const tone = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

    return `
        <div class="book-cover-placeholder ${tone}">
            <i class="fa-solid fa-book-open" aria-hidden="true"></i>
            <span>${title}</span>
        </div>
    `;
}


/* =========================================================
   9. BOOK CARD TEMPLATE
   ========================================================= */

function createBookCard(book, index) {
    const progress = getBookProgress(book);

    const statusLabel = STATUS_LABELS[book.status];
    const statusIcon = getStatusIcon(book.status);

    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const category = escapeHTML(book.category);
    const description = escapeHTML(book.description);

    const bookId = escapeHTML(book.id);

    const progressText = book.pages > 0
        ? `${book.pagesRead} of ${book.pages} pages`
        : book.status === STATUS.COMPLETED
            ? "Finished reading"
            : "Page count not set";

    const progressLabel = book.status === STATUS.COMPLETED
        ? "Completed"
        : book.status === STATUS.READING
            ? "Your progress"
            : "Reading progress";

    return `
        <article
            class="book-card"
            data-book-id="${bookId}"
            style="animation-delay: ${Math.min(index * 45, 300)}ms">

            <div class="book-cover-wrap">

                ${getCoverMarkup(book)}

                <span class="book-status status-${book.status}">
                    <i class="fa-solid ${statusIcon}" aria-hidden="true"></i>
                    ${statusLabel}
                </span>

                <div class="book-card-actions">

                    <button
                        class="book-action-btn"
                        type="button"
                        data-action="edit"
                        data-id="${bookId}"
                        aria-label="Edit ${title}"
                        title="Edit book">

                        <i class="fa-solid fa-pen" aria-hidden="true"></i>
                    </button>

                    <button
                        class="book-action-btn delete"
                        type="button"
                        data-action="delete"
                        data-id="${bookId}"
                        aria-label="Delete ${title}"
                        title="Delete book">

                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                    </button>

                </div>

            </div>

            <div class="book-card-body">

                <span class="book-category">${category}</span>

                <h3 class="book-title">${title}</h3>

                <p class="book-author">by ${author}</p>

                ${
                    description
                        ? `<p class="book-description">${description}</p>`
                        : ""
                }

                <div class="book-progress-section">

                    <div class="book-progress-top">
                        <span>${progressLabel}</span>
                        <strong>${progress}%</strong>
                    </div>

                    <div
                        class="book-progress-track"
                        role="progressbar"
                        aria-label="Reading progress for ${title}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="${progress}">

                        <div
                            class="book-progress-fill"
                            style="width: ${progress}%">
                        </div>

                    </div>

                </div>

                <div class="book-card-footer">

                    <span class="book-pages">${progressText}</span>

                    ${
                        book.status !== STATUS.COMPLETED
                            ? `
                                <button
                                    type="button"
                                    data-action="progress"
                                    data-id="${bookId}">

                                    <i class="fa-solid fa-arrow-trend-up"
                                       aria-hidden="true"></i>

                                    Update
                                </button>
                            `
                            : `
                                <span class="book-pages">
                                    <i class="fa-solid fa-check"
                                       aria-hidden="true"></i>
                                    Finished
                                </span>
                            `
                    }

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   10. FILTERING & SORTING
   ========================================================= */

function getVisibleBooks() {
    let result = [...books];

    if (currentView !== "all") {
        result = result.filter(book => book.status === currentView);
    }

    if (currentFilter !== "all") {
        result = result.filter(book => book.status === currentFilter);
    }

    if (searchQuery) {
        result = result.filter(book => {
            const searchableText = [
                book.title,
                book.author,
                book.category,
                book.description
            ].join(" ");

            return normalizeText(searchableText).includes(searchQuery);
        });
    }

    const sortMode = elements.sortSelect?.value || "recent";

    switch (sortMode) {
        case "title":
            result.sort((a, b) =>
                a.title.localeCompare(b.title, undefined, {
                    sensitivity: "base"
                })
            );
            break;

        case "author":
            result.sort((a, b) =>
                a.author.localeCompare(b.author, undefined, {
                    sensitivity: "base"
                })
            );
            break;

        case "progress":
            result.sort((a, b) => getBookProgress(b) - getBookProgress(a));
            break;

        case "recent":
        default:
            result.sort((a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            break;
    }

    return result;
}


/* =========================================================
   11. EMPTY STATE
   ========================================================= */

function updateEmptyState(visibleBooks) {
    if (!elements.emptyState || !elements.bookGrid) {
        return;
    }

    const isEmpty = visibleBooks.length === 0;

    elements.emptyState.classList.toggle("hidden", !isEmpty);
    elements.bookGrid.hidden = isEmpty;

    if (!isEmpty) {
        return;
    }

    const isSearching = searchQuery.length > 0;

    if (isSearching) {
        elements.emptyTitle.textContent = "No matching books found.";

        elements.emptyDescription.textContent =
            "Try another title, author, category, or search term.";

        elements.emptyAddButton.hidden = true;

        return;
    }

    const isEntireLibraryEmpty = books.length === 0;

    elements.emptyTitle.textContent = isEntireLibraryEmpty
        ? "Your library is waiting."
        : "No books in this collection yet.";

    elements.emptyDescription.textContent = isEntireLibraryEmpty
        ? "Add your first book and start building your collection."
        : "Try another filter or add a book to this collection.";

    elements.emptyAddButton.hidden = false;
}


/* =========================================================
   12. DASHBOARD STATISTICS
   ========================================================= */

function updateStatistics() {
    const total = books.length;

    const reading = books.filter(
        book => book.status === STATUS.READING
    ).length;

    const completed = books.filter(
        book => book.status === STATUS.COMPLETED
    ).length;

    const wantToRead = books.filter(
        book => book.status === STATUS.WANT_TO_READ
    ).length;

    elements.statTotal.textContent = total;
    elements.statReading.textContent = reading;
    elements.statCompleted.textContent = completed;
    elements.statWant.textContent = wantToRead;

    elements.navTotal.textContent = total;

    elements.goalCompleted.textContent = completed;
    elements.goalTarget.textContent = settings.readingGoal;

    const goalPercentage = clamp(
        Math.round((completed / settings.readingGoal) * 100),
        0,
        100
    );

    elements.goalProgress.style.width = `${goalPercentage}%`;

    elements.goalProgress.setAttribute(
        "aria-label",
        `${goalPercentage}% of reading goal completed`
    );

    if (completed >= settings.readingGoal) {
        elements.goalCaption.textContent =
            "Amazing! You reached your reading goal!";
    } else {
        const remaining = settings.readingGoal - completed;

        elements.goalCaption.textContent =
            `${remaining} more ${remaining === 1 ? "book" : "books"} to reach your goal.`;
    }
}


/* =========================================================
   13. SECTION TITLES
   ========================================================= */

function updateSectionHeading(visibleBooks) {
    const views = {
        all: {
            title: "Your Library",
            description: "All your favourite stories, in one place."
        },

        [STATUS.READING]: {
            title: "Currently Reading",
            description: "Pick up where your latest story left off."
        },

        [STATUS.COMPLETED]: {
            title: "Completed Books",
            description: "Every finished book is another achievement."
        },

        [STATUS.WANT_TO_READ]: {
            title: "Your Reading Wishlist",
            description: "Your next adventures are waiting here."
        }
    };

    const section = views[currentView] || views.all;

    elements.sectionTitle.childNodes[0].textContent =
        `${section.title} `;

    elements.sectionCount.textContent = visibleBooks.length;

    elements.sectionDescription.textContent = searchQuery
        ? `Search results for "${searchQuery}"`
        : section.description;

    elements.breadcrumbTitle.textContent = section.title;

    $$(".nav-item").forEach(button => {
        const isActive = button.dataset.view === currentView;

        button.classList.toggle("active", isActive);

        button.setAttribute("aria-current", isActive ? "page" : "false");
    });

    $$(".filter-tab").forEach(button => {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);

        button.setAttribute("aria-pressed", String(isActive));
    });
}


/* =========================================================
   14. RENDER LIBRARY
   ========================================================= */

function renderBooks() {
    const visibleBooks = getVisibleBooks();

    elements.bookGrid.classList.toggle(
        "list-view",
        currentLayout === "list"
    );

    elements.bookGrid.innerHTML = visibleBooks
        .map((book, index) => createBookCard(book, index))
        .join("");

    updateEmptyState(visibleBooks);
    updateStatistics();
    updateSectionHeading(visibleBooks);
}


/* =========================================================
   15. MODAL MANAGEMENT
   ========================================================= */

function showModal(backdrop, preferredFocusElement) {
    if (!backdrop) {
        return;
    }

    closeSidebar();

    if (activeModal && activeModal !== backdrop) {
        activeModal.classList.add("hidden");
    }

    previousFocusedElement = document.activeElement;

    activeModal = backdrop;

    backdrop.classList.remove("hidden");

    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
        if (
            preferredFocusElement &&
            document.contains(preferredFocusElement)
        ) {
            preferredFocusElement.focus();
        }
    });
}


function closeModal(backdrop) {
    if (!backdrop || backdrop.classList.contains("hidden")) {
        return;
    }

    backdrop.classList.add("hidden");

    if (activeModal === backdrop) {
        activeModal = null;
    }

    document.body.style.overflow = "";

    const elementToFocus = previousFocusedElement;

    previousFocusedElement = null;

    if (
        elementToFocus &&
        document.contains(elementToFocus) &&
        typeof elementToFocus.focus === "function"
    ) {
        elementToFocus.focus();
    }
}


function closeActiveModal() {
    if (activeModal) {
        closeModal(activeModal);
    }
}


/* =========================================================
   16. ADD BOOK MODAL
   ========================================================= */

function openAddBookModal() {
    elements.bookForm.reset();

    elements.bookId.value = "";

    elements.bookCategory.value = "Personal Growth";
    elements.bookStatus.value = STATUS.WANT_TO_READ;

    elements.modalTitle.textContent = "Add a new book";

    elements.saveBookButton.innerHTML = `
        <i class="fa-solid fa-plus" aria-hidden="true"></i>
        Save Book
    `;

    showModal(elements.bookModalBackdrop, elements.bookTitle);
}


function openEditBookModal(bookId) {
    const book = getBookById(bookId);

    if (!book) {
        showToast("This book could not be found.", "error");
        return;
    }

    elements.bookForm.reset();

    elements.bookId.value = book.id;
    elements.bookTitle.value = book.title;
    elements.bookAuthor.value = book.author;
    elements.bookCategory.value = book.category;
    elements.bookStatus.value = book.status;
    elements.bookPages.value = book.pages || "";
    elements.bookCover.value = book.cover;
    elements.bookDescription.value = book.description;

    elements.modalTitle.textContent = "Edit your book";

    elements.saveBookButton.innerHTML = `
        <i class="fa-solid fa-check" aria-hidden="true"></i>
        Save Changes
    `;

    showModal(elements.bookModalBackdrop, elements.bookTitle);
}


function validateBookForm() {
    const title = elements.bookTitle.value.trim();
    const author = elements.bookAuthor.value.trim();

    if (!title || !author) {
        showToast("Book title and author are required.", "error");
        return null;
    }

    const pagesText = elements.bookPages.value.trim();

    let pages = 0;

    if (pagesText !== "") {
        pages = Number(pagesText);

        if (
            !Number.isSafeInteger(pages) ||
            pages < 1 ||
            pages > 100000
        ) {
            showToast(
                "Enter a valid total page count between 1 and 100000.",
                "error"
            );

            return null;
        }
    }

    const status = elements.bookStatus.value;

    if (!isValidStatus(status)) {
        showToast("Select a valid reading status.", "error");
        return null;
    }

    const category = elements.bookCategory.value;

    const validCategories = [
        "Personal Growth",
        "Fiction",
        "Technology",
        "Business",
        "Psychology",
        "Biography",
        "Science",
        "Fantasy",
        "Other"
    ];

    if (!validCategories.includes(category)) {
        showToast("Select a valid book category.", "error");
        return null;
    }

    const coverText = elements.bookCover.value.trim();

    let cover = "";

    if (coverText) {
        try {
            const url = new URL(coverText);

            if (url.protocol !== "https:" && url.protocol !== "http:") {
                throw new Error("Unsupported URL protocol");
            }

            cover = url.href;
        } catch {
            showToast(
                "Enter a valid HTTP or HTTPS cover image URL.",
                "error"
            );

            return null;
        }
    }

    return {
        title: title.slice(0, 120),
        author: author.slice(0, 100),
        category,
        status,
        pages,
        cover,
        description: elements.bookDescription.value.trim().slice(0, 500)
    };
}


/* =========================================================
   17. ADD / UPDATE BOOK
   ========================================================= */

function handleBookSubmit(event) {
    event.preventDefault();

    if (!elements.bookForm.reportValidity()) {
        return;
    }

    const formData = validateBookForm();

    if (!formData) {
        return;
    }

    const existingId = elements.bookId.value;

    if (existingId) {
        updateExistingBook(existingId, formData);
        return;
    }

    addNewBook(formData);
}


function addNewBook(formData) {
    if (books.length >= CONFIG.maxBooks) {
        showToast(
            `Your library can contain up to ${CONFIG.maxBooks} books.`,
            "error"
        );

        return;
    }

    const book = {
        id: createId(),

        ...formData,

        pagesRead: 0,

        createdAt: new Date().toISOString()
    };

    if (book.status === STATUS.COMPLETED && book.pages > 0) {
        book.pagesRead = book.pages;
    }

    if (book.status === STATUS.READING && book.pages === 0) {
        book.pagesRead = 0;
    }

    books.unshift(book);

    if (!saveBooks()) {
        books.shift();
        return;
    }

    currentView = "all";
    currentFilter = "all";

    syncFilterButtons();
    renderBooks();

    closeModal(elements.bookModalBackdrop);

    showToast(`"${book.title}" added to your library.`);

    announceLibraryChange();
}


function updateExistingBook(bookId, formData) {
    const index = books.findIndex(book => book.id === bookId);

    if (index === -1) {
        showToast("This book no longer exists.", "error");
        return;
    }

    const oldBook = books[index];

    const updatedBook = {
        ...oldBook,
        ...formData
    };

    if (updatedBook.status === STATUS.COMPLETED) {
        updatedBook.pagesRead = updatedBook.pages || oldBook.pagesRead;
    } else if (updatedBook.pages === 0) {
        updatedBook.pagesRead = 0;
    } else {
        updatedBook.pagesRead = Math.min(
            oldBook.pagesRead,
            updatedBook.pages
        );
    }

    books[index] = updatedBook;

    if (!saveBooks()) {
        books[index] = oldBook;
        return;
    }

    renderBooks();

    closeModal(elements.bookModalBackdrop);

    showToast(`"${updatedBook.title}" updated successfully.`);

    announceLibraryChange();
}


/* =========================================================
   18. DELETE BOOK
   ========================================================= */

function deleteBook(bookId) {
    const index = books.findIndex(book => book.id === bookId);

    if (index === -1) {
        showToast("This book could not be found.", "error");
        return;
    }

    const book = books[index];

    const confirmed = window.confirm(
        `Remove "${book.title}" by ${book.author} from your library?`
    );

    if (!confirmed) {
        return;
    }

    books.splice(index, 1);

    if (!saveBooks()) {
        books.splice(index, 0, book);
        return;
    }

    renderBooks();

    showToast(`"${book.title}" removed from your library.`);

    announceLibraryChange();
}


/* =========================================================
   19. READING PROGRESS
   ========================================================= */

function openProgressModal(bookId) {
    const book = getBookById(bookId);

    if (!book) {
        showToast("This book could not be found.", "error");
        return;
    }

    if (book.status === STATUS.COMPLETED) {
        showToast("This book is already completed.", "info");
        return;
    }

    if (!book.pages) {
        showToast(
            "Edit this book and enter its total page count first.",
            "info"
        );

        return;
    }

    elements.progressForm.reset();

    elements.progressBookId.value = book.id;

    elements.progressBookName.textContent = book.title;

    elements.progressPages.max = String(book.pages);
    elements.progressPages.value = String(book.pagesRead);

    updateProgressPreview();

    showModal(
        elements.progressModalBackdrop,
        elements.progressPages
    );
}


function updateProgressPreview() {
    const book = getBookById(elements.progressBookId.value);

    if (!book || !book.pages) {
        elements.progressPercentage.textContent = "0%";
        elements.progressPreviewFill.style.width = "0%";

        return;
    }

    const rawValue = elements.progressPages.value;

    const pagesRead = rawValue === ""
        ? 0
        : clamp(
            Number(rawValue) || 0,
            0,
            book.pages
        );

    const percentage = Math.round(
        (pagesRead / book.pages) * 100
    );

    elements.progressPercentage.textContent = `${percentage}%`;

    elements.progressPreviewFill.style.width = `${percentage}%`;
}


function handleProgressSubmit(event) {
    event.preventDefault();

    const book = getBookById(elements.progressBookId.value);

    if (!book) {
        showToast("This book could not be found.", "error");
        return;
    }

    if (!book.pages) {
        showToast("The book's page count is missing.", "error");
        return;
    }

    const rawPages = elements.progressPages.value;

    if (rawPages.trim() === "") {
        showToast("Enter the number of pages read.", "error");
        return;
    }

    const pagesRead = Number(rawPages);

    if (
        !Number.isSafeInteger(pagesRead) ||
        pagesRead < 0 ||
        pagesRead > book.pages
    ) {
        showToast(
            `Pages read must be between 0 and ${book.pages}.`,
            "error"
        );

        return;
    }

    const index = books.findIndex(item => item.id === book.id);

    const oldBook = { ...books[index] };

    book.pagesRead = pagesRead;

    if (pagesRead >= book.pages) {
        book.status = STATUS.COMPLETED;
        book.pagesRead = book.pages;
    } else {
        book.status = pagesRead > 0
            ? STATUS.READING
            : STATUS.WANT_TO_READ;
    }

    if (!saveBooks()) {
        books[index] = oldBook;
        return;
    }

    renderBooks();

    closeModal(elements.progressModalBackdrop);

    if (book.status === STATUS.COMPLETED) {
        showToast(`Congratulations! You completed "${book.title}"!`);
    } else {
        showToast("Reading progress updated successfully.");
    }

    announceLibraryChange();
}


/* =========================================================
   20. READING GOAL
   ========================================================= */

function editReadingGoal() {
    const answer = window.prompt(
        "How many books do you want to read?\nEnter a number between 1 and 10000.",
        String(settings.readingGoal)
    );

    if (answer === null) {
        return;
    }

    const target = answer.trim();

    if (!/^\d+$/.test(target)) {
        showToast("Enter a valid whole number.", "error");
        return;
    }

    const newGoal = Number(target);

    if (
        !Number.isSafeInteger(newGoal) ||
        newGoal < 1 ||
        newGoal > 10000
    ) {
        showToast(
            "Your reading goal must be between 1 and 10000 books.",
            "error"
        );

        return;
    }

    const previousGoal = settings.readingGoal;

    settings.readingGoal = newGoal;

    if (!saveSettings()) {
        settings.readingGoal = previousGoal;
        return;
    }

    updateStatistics();

    showToast(`Your new reading goal is ${newGoal} books.`);
}


/* =========================================================
   21. VIEW & FILTER CONTROLS
   ========================================================= */

function syncFilterButtons() {
    $$(".filter-tab").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === currentFilter
        );
    });
}


function setView(view) {
    const validViews = [
        "all",
        STATUS.READING,
        STATUS.COMPLETED,
        STATUS.WANT_TO_READ
    ];

    if (!validViews.includes(view)) {
        return;
    }

    currentView = view;

    currentFilter = "all";

    syncFilterButtons();

    renderBooks();
}


function setFilter(filter) {
    const validFilters = [
        "all",
        STATUS.READING,
        STATUS.COMPLETED,
        STATUS.WANT_TO_READ
    ];

    if (!validFilters.includes(filter)) {
        return;
    }

    currentFilter = filter;

    currentView = "all";

    syncFilterButtons();

    renderBooks();
}


function setLayout(layout) {
    if (!["grid", "list"].includes(layout)) {
        return;
    }

    currentLayout = layout;

    $$(".view-button").forEach(button => {
        const isActive = button.dataset.layout === layout;

        button.classList.toggle("active", isActive);

        button.setAttribute("aria-pressed", String(isActive));
    });

    elements.bookGrid.classList.toggle(
        "list-view",
        layout === "list"
    );
}


/* =========================================================
   22. SEARCH
   ========================================================= */

function handleSearch(event) {
    searchQuery = normalizeText(event.target.value);

    renderBooks();
}


function focusSearch() {
    if (!elements.searchInput) {
        return;
    }

    if (window.matchMedia("(max-width: 600px)").matches) {
        elements.searchBox.classList.add("search-open");
    }

    elements.searchInput.focus();
}


/* =========================================================
   23. MOBILE SIDEBAR
   ========================================================= */

function openSidebar() {
    elements.sidebar.classList.add("open");

    elements.sidebarOverlay.classList.add("active");

    elements.mobileMenuButton.setAttribute("aria-expanded", "true");

    document.body.style.overflow = "hidden";
}


function closeSidebar() {
    elements.sidebar.classList.remove("open");

    elements.sidebarOverlay.classList.remove("active");

    elements.mobileMenuButton.setAttribute("aria-expanded", "false");

    if (!activeModal) {
        document.body.style.overflow = "";
    }
}


function toggleSidebar() {
    const isOpen = elements.sidebar.classList.contains("open");

    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}


/* =========================================================
   24. ACCESSIBILITY ANNOUNCEMENTS
   ========================================================= */

function announceLibraryChange() {
    const total = books.length;

    document.title = total > 0
        ? `ReadVault (${total}) — Your Personal Reading Space`
        : "ReadVault — Your Personal Reading Space";
}


/* =========================================================
   25. BOOK CARD EVENT DELEGATION
   ========================================================= */

function handleBookGridClick(event) {
    const button = event.target.closest("button[data-action]");

    if (!button || !elements.bookGrid.contains(button)) {
        return;
    }

    const bookId = button.dataset.id;
    const action = button.dataset.action;

    switch (action) {
        case "edit":
            openEditBookModal(bookId);
            break;

        case "delete":
            deleteBook(bookId);
            break;

        case "progress":
            openProgressModal(bookId);
            break;

        default:
            console.warn("Unknown book action:", action);
    }
}


/* =========================================================
   26. BOOK COVER ERROR HANDLING
   ========================================================= */

function handleBookGridError(event) {
    const image = event.target;

    if (!(image instanceof HTMLImageElement)) {
        return;
    }

    if (!image.classList.contains("book-cover")) {
        return;
    }

    const bookCard = image.closest(".book-card");

    if (!bookCard) {
        return;
    }

    const book = getBookById(bookCard.dataset.bookId);

    if (!book) {
        return;
    }

    const placeholder = document.createElement("div");

    const index = [...book.title].reduce(
        (total, character) => total + character.charCodeAt(0),
        0
    );

    placeholder.className =
        `book-cover-placeholder ${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}`;

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-book-open";
    icon.setAttribute("aria-hidden", "true");

    const title = document.createElement("span");
    title.textContent = book.title;

    placeholder.append(icon, title);

    image.replaceWith(placeholder);
}


/* =========================================================
   27. KEYBOARD SHORTCUTS
   ========================================================= */

function handleKeyboardShortcuts(event) {
    const isTyping = event.target instanceof HTMLElement &&
        (
            event.target.matches("input, textarea, select") ||
            event.target.isContentEditable
        );

    if (event.key === "Escape") {
        if (activeModal) {
            closeActiveModal();
            return;
        }

        if (elements.sidebar.classList.contains("open")) {
            closeSidebar();
            return;
        }

        elements.searchBox.classList.remove("search-open");

        return;
    }

    if ((event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k") {
        event.preventDefault();

        focusSearch();

        return;
    }

    if (isTyping || event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }

    if (event.key.toLowerCase() === "n") {
        event.preventDefault();

        openAddBookModal();
    }
}


/* =========================================================
   28. MODAL BACKDROP INTERACTIONS
   ========================================================= */

function handleBackdropClick(event) {
    if (event.target === elements.bookModalBackdrop) {
        closeModal(elements.bookModalBackdrop);
    }

    if (event.target === elements.progressModalBackdrop) {
        closeModal(elements.progressModalBackdrop);
    }
}


/* =========================================================
   29. ACCESSIBLE MODAL FOCUS MANAGEMENT
   ========================================================= */

function trapModalFocus(event) {
    if (event.key !== "Tab" || !activeModal) {
        return;
    }

    const focusableElements = $$(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        activeModal
    ).filter(element => {
        return !element.hidden &&
            element.getAttribute("aria-hidden") !== "true" &&
            element.getClientRects().length > 0;
    });

    if (focusableElements.length === 0) {
        event.preventDefault();
        return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (
        !event.shiftKey &&
        document.activeElement === last
    ) {
        event.preventDefault();
        first.focus();
    }
}


/* =========================================================
   30. EVENT LISTENERS
   ========================================================= */

function registerEventListeners() {

    // Theme
    elements.themeToggle.addEventListener("click", toggleTheme);

    // Add book
    elements.addBookButton.addEventListener("click", openAddBookModal);

    elements.emptyAddButton.addEventListener("click", openAddBookModal);

    // Book form
    elements.bookForm.addEventListener("submit", handleBookSubmit);

    elements.closeModalButton.addEventListener("click", () => {
        closeModal(elements.bookModalBackdrop);
    });

    elements.cancelModalButton.addEventListener("click", () => {
        closeModal(elements.bookModalBackdrop);
    });

    // Reading progress
    elements.progressForm.addEventListener("submit", handleProgressSubmit);

    elements.progressPages.addEventListener("input", updateProgressPreview);

    elements.closeProgressModalButton.addEventListener("click", () => {
        closeModal(elements.progressModalBackdrop);
    });

    elements.cancelProgressButton.addEventListener("click", () => {
        closeModal(elements.progressModalBackdrop);
    });

    // Reading goal
    elements.editGoalButton.addEventListener("click", editReadingGoal);

    // Navigation
    $$(".nav-item").forEach(button => {
        button.addEventListener("click", () => {
            setView(button.dataset.view);

            closeSidebar();
        });
    });

    // Filters
    $$(".filter-tab").forEach(button => {
        button.addEventListener("click", () => {
            setFilter(button.dataset.filter);
        });
    });

    // Layout
    $$(".view-button").forEach(button => {
        button.addEventListener("click", () => {
            setLayout(button.dataset.layout);
        });
    });

    // Sorting
    elements.sortSelect.addEventListener("change", renderBooks);

    // Search
    elements.searchInput.addEventListener("input", handleSearch);

    // On mobile, open the search field when its container is clicked.
    elements.searchBox.addEventListener("click", event => {
        if (
            window.matchMedia("(max-width: 600px)").matches &&
            !elements.searchBox.classList.contains("search-open")
        ) {
            event.preventDefault();

            elements.searchBox.classList.add("search-open");

            elements.searchInput.focus();
        }
    });

    // Mobile menu
    elements.mobileMenuButton.addEventListener("click", toggleSidebar);

    elements.sidebarOverlay.addEventListener("click", closeSidebar);

    // Book card actions
    elements.bookGrid.addEventListener("click", handleBookGridClick);

    // Invalid external cover images
    elements.bookGrid.addEventListener("error", handleBookGridError, true);

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);

    document.addEventListener("keydown", trapModalFocus);

    // Close modals when clicking the backdrop.
    elements.bookModalBackdrop.addEventListener("click", handleBackdropClick);

    elements.progressModalBackdrop.addEventListener("click", handleBackdropClick);

    // Developer information
    elements.profileButton.addEventListener("click", () => {
        showToast(
            "ReadVault — designed and developed by Ansh.",
            "info"
        );
    });

    // If the screen expands, close the mobile navigation.
    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeSidebar();
        }

        if (window.innerWidth > 600) {
            elements.searchBox.classList.remove("search-open");
        }
    });
}


/* =========================================================
   31. INITIALIZE APPLICATION
   ========================================================= */

function initializeReadVault() {

    // Load saved information.
    books = loadBooks();

    settings = loadSettings();

    // Apply the saved appearance.
    applyTheme();

    // Connect all application controls.
    registerEventListeners();

    // Set the initial layout.
    setLayout("grid");

    // Render the user's collection.
    renderBooks();

    // Update page metadata.
    announceLibraryChange();

    console.info(
        `ReadVault initialized successfully. ${books.length} book(s) loaded.`
    );
}


/* =========================================================
   32. START APPLICATION
   ========================================================= */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeReadVault,
        { once: true }
    );
} else {
    initializeReadVault();
}
