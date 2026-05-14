const timeline = document.querySelector("#timeline");
const loadMoreButton = document.querySelector("#loadMoreButton");

const STORAGE_KEY = "timeline-diary.entries";
const dayMs = 24 * 60 * 60 * 1000;
let visibleDays = 18;
let entries = loadEntries();

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function todayKey() {
  return toDateKey(new Date());
}

function formatRelativeDay(date) {
  const today = fromDateKey(todayKey());
  const diff = Math.round((stripTime(today) - stripTime(date)) / dayMs);
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  if (diff === 2) return "前天";
  return new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(date);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatMonthDay(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "numeric",
  }).format(date);
}

function createDayList() {
  const start = stripTime(new Date());
  return Array.from({ length: visibleDays }, (_, index) => {
    const date = addDays(start, -index);
    const key = toDateKey(date);
    return { date, key };
  });
}

function countWords(text) {
  const compact = text.replace(/\s+/g, "");
  return compact.length;
}

function summarize(text) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return "未记录";
  return normalized.length > 70 ? `${normalized.slice(0, 70)}...` : normalized;
}

function renderTimeline() {
  const days = createDayList();
  timeline.innerHTML = "";
  const currentTodayKey = todayKey();

  days.forEach(({ date, key }) => {
    const text = entries[key] ?? "";
    const article = document.createElement("article");
    article.className = "day";
    article.dataset.date = key;
    if (text.trim()) article.classList.add("has-entry");
    if (key === currentTodayKey) article.classList.add("is-today");
    if (key === currentTodayKey) article.classList.add("is-open");

    const dateLabel = document.createElement("div");
    dateLabel.className = "date";

    const dayNumber = document.createElement("strong");
    dayNumber.textContent = String(date.getDate());

    const relative = document.createElement("span");
    relative.textContent = formatRelativeDay(date);

    dateLabel.append(dayNumber, relative);

    const node = document.createElement("button");
    node.className = "node-button";
    node.type = "button";
    node.setAttribute("aria-label", `打开 ${key} 的日记`);

    const entry = document.createElement("section");
    entry.className = "entry";

    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = text.trim() ? summarize(text) : formatMonthDay(date);

    const editor = document.createElement("div");
    editor.className = "editor";

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.placeholder = key === currentTodayKey ? "今天发生了什么？" : "补写这一天";
    textarea.setAttribute("aria-label", `${key} 日记`);

    const meta = document.createElement("div");
    meta.className = "meta";

    const words = document.createElement("span");
    words.textContent = `${countWords(text)} 字`;

    const saved = document.createElement("span");
    saved.textContent = text.trim() ? "已保存" : "空白";

    textarea.addEventListener("input", () => {
      entries[key] = textarea.value;
      if (!textarea.value.trim()) {
        delete entries[key];
      }
      saveEntries();
      summary.textContent = summarize(textarea.value);
      if (!textarea.value.trim()) {
        summary.textContent = formatMonthDay(date);
      }
      words.textContent = `${countWords(textarea.value)} 字`;
      saved.textContent = textarea.value.trim() ? "已保存" : "空白";
      article.classList.toggle("has-entry", Boolean(textarea.value.trim()));
    });

    node.addEventListener("click", () => {
      article.classList.toggle("is-open");
      if (article.classList.contains("is-open")) {
        textarea.focus();
      }
    });

    meta.append(words, saved);
    editor.append(textarea, meta);
    entry.append(summary, editor);
    article.append(dateLabel, node, entry);
    timeline.append(article);
  });
}

loadMoreButton.addEventListener("click", () => {
  visibleDays += 18;
  renderTimeline();
});

renderTimeline();
