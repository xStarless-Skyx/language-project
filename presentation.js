const nextButton = document.getElementById("next-section");
const startButton = document.getElementById("start-timeline");
const heroSection = document.querySelector(".hero");
const navLinks = Array.from(document.querySelectorAll(".top-nav a"));
const timelineSections = Array.from(document.querySelectorAll("main.timeline > section"));

let currentSectionIndex = 0;
let hasStarted = false;
let sectionAnimationTimer = null;

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPythonPresentationCode(text) {
  return `<span class="code-kw">import</span> re
<span class="code-kw">from</span> collections <span class="code-kw">import</span> Counter

text = <span class="code-string">&quot;&quot;&quot;${escapeHtml(text)}&quot;&quot;&quot;</span>
words = re.<span class="code-call">findall</span>(<span class="code-string">r&quot;[a-z&#39;]+&quot;</span>, text.<span class="code-call">lower</span>())
filtered = [w <span class="code-kw">for</span> w <span class="code-kw">in</span> words <span class="code-kw">if</span> <span class="code-call">len</span>(w) &gt;= <span class="code-number">4</span>]
top_words = <span class="code-name">Counter</span>(filtered).<span class="code-call">most_common</span>(<span class="code-number">3</span>)

<span class="code-call">print</span>(<span class="code-string">&quot;Word count:&quot;</span>, <span class="code-call">len</span>(words))
<span class="code-call">print</span>(<span class="code-string">&quot;Top keywords:&quot;</span>, top_words)`;
}

function renderJavascriptPresentationCode() {
  return `<span class="code-kw">const</span> ticketPrice = <span class="code-number">12</span>;
<span class="code-kw">const</span> taxRate = <span class="code-number">0.0825</span>;
<span class="code-kw">const</span> serviceFee = <span class="code-number">1.50</span>;

<span class="code-kw">function</span> <span class="code-name">updateCartFromSlider</span>(ticketCount) {
  <span class="code-kw">const</span> tickets = Math.<span class="code-call">max</span>(<span class="code-number">0</span>, Number(ticketCount));
  <span class="code-kw">const</span> subtotal = tickets * ticketPrice;
  <span class="code-kw">const</span> tax = subtotal * taxRate;
  <span class="code-kw">const</span> total = subtotal + tax + (tickets ? serviceFee : <span class="code-number">0</span>);
  document.<span class="code-call">getElementById</span>(<span class="code-string">&quot;js-counter&quot;</span>).<span class="code-prop">textContent</span> = tickets;
  document.<span class="code-call">getElementById</span>(<span class="code-string">&quot;js-live-total&quot;</span>).<span class="code-prop">textContent</span> = <span class="code-string">&quot;$&quot;</span> + total.<span class="code-call">toFixed</span>(<span class="code-number">2</span>);
}`;
}

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  await document.documentElement.requestFullscreen();
}

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "f") return;
  if (isEditableTarget(event.target)) return;

  event.preventDefault();
  toggleFullscreen();
});

function updateSectionVisibility() {
  timelineSections.forEach((section, index) => {
    if (hasStarted && index === currentSectionIndex) {
      section.classList.remove("section-hidden");
    } else {
      section.classList.add("section-hidden");
      section.classList.remove("section-enter");
    }
  });

  if (heroSection) {
    heroSection.classList.toggle("hero-hidden", hasStarted);
  }

  document.body.classList.toggle("presentation-started", hasStarted);

  if (hasStarted) {
    const activeSection = timelineSections[currentSectionIndex];
    const theme = activeSection?.dataset?.theme || "literature";
    document.body.setAttribute("data-theme", theme);
  } else {
    document.body.setAttribute("data-theme", "analysis");
  }

  if (nextButton) {
    const isLast = currentSectionIndex >= timelineSections.length - 1;
    nextButton.textContent = isLast ? "Back to top" : "Next";
    nextButton.setAttribute("aria-label", isLast ? "Back to top" : "Next section");
  }

  if (sectionAnimationTimer) {
    clearTimeout(sectionAnimationTimer);
    sectionAnimationTimer = null;
  }

  if (hasStarted) {
    const activeSection = timelineSections[currentSectionIndex];
    if (activeSection) {
      activeSection.classList.remove("section-enter");
      void activeSection.offsetWidth;
      activeSection.classList.add("section-enter");
      sectionAnimationTimer = setTimeout(() => {
        activeSection.classList.remove("section-enter");
        sectionAnimationTimer = null;
      }, 680);
    }
  }
}

function startPresentation() {
  hasStarted = true;
  currentSectionIndex = 0;
  updateSectionVisibility();
  if (nextButton) nextButton.classList.remove("is-hidden");
}

function goToNextSection() {
  if (!timelineSections.length) return;

  if (!hasStarted) {
    startPresentation();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const isLast = currentSectionIndex >= timelineSections.length - 1;

  if (isLast) {
    hasStarted = false;
    currentSectionIndex = 0;
    updateSectionVisibility();
    if (nextButton) nextButton.classList.add("is-hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  currentSectionIndex += 1;
  updateSectionVisibility();
}

function jumpToSectionById(sectionId) {
  const index = timelineSections.findIndex((section) => section.id === sectionId);
  if (index === -1) return;

  hasStarted = true;
  currentSectionIndex = index;
  updateSectionVisibility();
  if (nextButton) nextButton.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (startButton) {
  startButton.addEventListener("click", (event) => {
    event.preventDefault();
    startPresentation();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (nextButton) {
  nextButton.addEventListener("click", () => {
    goToNextSection();
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = link.getAttribute("href")?.replace("#", "");
    if (!targetId) return;
    jumpToSectionById(targetId);
  });
});

document.addEventListener("keydown", (event) => {
  if (isEditableTarget(event.target)) return;

  if (event.key === " " || event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    goToNextSection();
  }
});

function runPythonPresentationDemo() {
  const input = document.getElementById("python-input-presentation");
  const code = document.getElementById("python-code-presentation");
  const output = document.getElementById("python-output-presentation");
  if (!input || !code || !output) return;

  const text = input.value.trim();
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  const counts = {};

  words.forEach((word) => {
    if (word.length < 4) return;
    counts[word] = (counts[word] || 0) + 1;
  });

  const topWords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  code.innerHTML = renderPythonPresentationCode(text);
  code.classList.add("code-ide");

  output.textContent = `Word count: ${words.length}
Top keywords:
${topWords.map(([word, count]) => `- ${word}: ${count}`).join("\n") || "- None"}`;
}

function showPythonPresentationSampleCode() {
  const input = document.getElementById("python-input-presentation");
  const code = document.getElementById("python-code-presentation");
  if (!input || !code) return;

  const text = input.value.trim();
  code.innerHTML = renderPythonPresentationCode(text);
  code.classList.add("code-ide");
}

function updateJavascriptPresentationDemo(ticketCount) {
  const tickets = Math.max(0, Math.min(20, Number(ticketCount)));
  const ticketPrice = 12;
  const taxRate = 0.0825;
  const serviceFee = tickets > 0 ? 1.5 : 0;
  const subtotal = tickets * ticketPrice;
  const tax = subtotal * taxRate;
  const total = subtotal + tax + serviceFee;

  const slider = document.getElementById("js-ticket-slider-presentation");
  const counter = document.getElementById("js-counter-presentation");
  const liveTotal = document.getElementById("js-live-total-presentation");
  const code = document.getElementById("javascript-code-presentation");
  const output = document.getElementById("javascript-output-presentation");
  if (!slider || !counter || !liveTotal || !code || !output) return;

  slider.value = String(tickets);
  counter.textContent = String(tickets);

  code.innerHTML = renderJavascriptPresentationCode();
  code.classList.add("code-ide");

  if (tickets === 0) {
    liveTotal.textContent = "--";
    output.textContent = "";
    return;
  }

  liveTotal.textContent = `$${formatNumber(total)}`;

  output.textContent = `Tickets selected: ${tickets}
Subtotal: $${formatNumber(subtotal)}
Tax (8.25%): $${formatNumber(tax)}
Service fee: $${formatNumber(serviceFee)}
Total cost: $${formatNumber(total)}`;
}

const pythonButton = document.getElementById("run-python-presentation");
if (pythonButton) {
  pythonButton.addEventListener("click", runPythonPresentationDemo);
}

const jsPresentationSlider = document.getElementById("js-ticket-slider-presentation");
if (jsPresentationSlider) {
  jsPresentationSlider.addEventListener("input", (event) => {
    updateJavascriptPresentationDemo(event.target.value);
  });
}

updateSectionVisibility();
showPythonPresentationSampleCode();
updateJavascriptPresentationDemo(0);
