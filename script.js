const $setCount = document.getElementById("setCount");
const $seed = document.getElementById("seed");
const $result = document.getElementById("result");
const $history = document.getElementById("history");
const $historyCount = document.getElementById("historyCount");
const $toast = document.getElementById("toast");
const $themeToggle = document.getElementById("themeToggle");

const HISTORY_KEY = "lotto_history_v2";
const THEME_KEY = "lotto_theme_v1";

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function sfc32(a, b, c, d) {
  return function random() {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;

    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;

    return (t >>> 0) / 4294967296;
  };
}

function createRng(seedText) {
  if (!seedText) return Math.random;
  const seed = xmur3(seedText);
  return sfc32(seed(), seed(), seed(), seed());
}

function colorClass(n) {
  if (n <= 10) return "yellow";
  if (n <= 20) return "blue";
  if (n <= 30) return "red";
  if (n <= 40) return "gray";
  return "green";
}

function pickSet(rng) {
  const numbers = [];
  while (numbers.length < 6) {
    const n = 1 + Math.floor(rng() * 45);
    if (!numbers.includes(n)) numbers.push(n);
  }
  return numbers.sort((a, b) => a - b);
}

function toast(message) {
  $toast.textContent = message;
  $toast.classList.add("show");
  setTimeout(() => $toast.classList.remove("show"), 1300);
}

function nowString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderResult(sets) {
  $result.innerHTML = "";

  sets.forEach((set, index) => {
    const row = document.createElement("div");
    row.className = "set";

    const title = document.createElement("div");
    title.className = "set-title";
    title.textContent = `${index + 1}세트`;

    const balls = document.createElement("div");
    balls.className = "balls";

    set.forEach((n) => {
      const ball = document.createElement("div");
      ball.className = `ball ${colorClass(n)}`;
      ball.textContent = String(n);
      balls.appendChild(ball);
    });

    row.appendChild(title);
    row.appendChild(balls);
    $result.appendChild(row);
  });
}

function renderHistory() {
  const history = loadHistory();
  $history.innerHTML = "";
  $historyCount.textContent = `${history.length}개`;

  history.forEach((item) => {
    const li = document.createElement("li");
    const setsText = item.sets
      .map((set, i) => `${i + 1}세트: ${set.join(", ")}`)
      .join(" | ");

    li.textContent = `${item.time} ${item.seed ? `(seed: ${item.seed})` : ""} - ${setsText}`;
    $history.appendChild(li);
  });
}

function generate() {
  const setCount = Number.parseInt($setCount.value, 10);
  const seedText = $seed.value.trim();
  const rng = createRng(seedText);

  const sets = Array.from({ length: setCount }, () => pickSet(rng));
  renderResult(sets);

  const history = loadHistory();
  history.unshift({
    time: nowString(),
    seed: seedText,
    sets,
  });

  if (history.length > 50) history.length = 50;

  saveHistory(history);
  renderHistory();
  toast("번호를 생성했습니다.");
}

function copyResult() {
  const rows = Array.from($result.querySelectorAll(".set"));
  if (rows.length === 0) {
    toast("먼저 번호를 생성하세요.");
    return;
  }

  const text = rows
    .map((row, i) => {
      const nums = Array.from(row.querySelectorAll(".ball")).map((el) => el.textContent);
      return `${i + 1}세트: ${nums.join(", ")}`;
    })
    .join("\n");

  navigator.clipboard
    .writeText(text)
    .then(() => toast("결과를 복사했습니다."))
    .catch(() => {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      toast(copied ? "결과를 복사했습니다." : "복사에 실패했습니다.");
    });
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  toast("기록을 삭제했습니다.");
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  $themeToggle.textContent = nextTheme === "dark" ? "화이트모드" : "다크모드";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
    return;
  }

  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(systemPrefersDark ? "dark" : "light");
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

document.getElementById("generateBtn").addEventListener("click", generate);
document.getElementById("copyBtn").addEventListener("click", copyResult);
document.getElementById("clearBtn").addEventListener("click", clearHistory);
$themeToggle.addEventListener("click", toggleTheme);
$seed.addEventListener("keydown", (event) => {
  if (event.key === "Enter") generate();
});

initTheme();
renderHistory();
