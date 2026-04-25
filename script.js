// script.js
let jsCounter = 2;
const outputTimers = new Map();
const paceByLanguage = {
  fortran: 360,
  lisp: 220,
  cobol: 460,
  c: 140,
  python: 190,
  javascript: 70,
  rust: 25,
  instant: 0
};

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

function renderCodeBlock(elementId, html) {
  const code = document.getElementById(elementId);
  if (!code) return;
  code.innerHTML = html;
  code.classList.add("code-ide");
}

function revealOutput(outputId) {
  const output = document.getElementById(outputId);
  const panel = output ? output.closest(".panel") : null;
  if (panel) panel.classList.remove("is-hidden");
}

function streamOutput(outputId, text, paceKey) {
  const output = document.getElementById(outputId);
  if (!output) return;

  const existingTimer = outputTimers.get(outputId);
  if (existingTimer) clearTimeout(existingTimer);

  revealOutput(outputId);

  const delay = paceByLanguage[paceKey] ?? paceByLanguage.python;
  if (delay === 0) {
    output.textContent = text;
    scheduleAutoFit();
    return;
  }

  const lines = text.split("\n");
  let index = 0;
  output.textContent = "";

  function renderNextLine() {
    output.textContent += `${index === 0 ? "" : "\n"}${lines[index]}`;
    scheduleAutoFit();
    index += 1;

    if (index >= lines.length) {
      outputTimers.delete(outputId);
      return;
    }

    const timer = setTimeout(renderNextLine, delay);
    outputTimers.set(outputId, timer);
  }

  renderNextLine();
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

const nextButton = document.getElementById("next-section");
const startButton = document.getElementById("start-timeline");
const heroSection = document.querySelector(".hero");
const navLinks = Array.from(document.querySelectorAll(".top-nav a"));
const timelineSections = Array.from(document.querySelectorAll("main.timeline > section"));
let currentSectionIndex = 0;
let hasStarted = false;
let fitAnimationFrame = null;
let sectionAnimationTimer = null;

function fitPreToPanel(pre, minScale) {
  if (!pre || pre.offsetParent === null) return;

  if (!pre.dataset.baseFontPx) {
    pre.dataset.baseFontPx = String(parseFloat(window.getComputedStyle(pre).fontSize));
  }

  const baseFont = Number(pre.dataset.baseFontPx);
  let currentFont = baseFont;
  const minFont = baseFont * minScale;

  pre.style.fontSize = `${baseFont}px`;

  while ((pre.scrollHeight > pre.clientHeight || pre.scrollWidth > pre.clientWidth) && currentFont > minFont) {
    currentFont -= 0.4;
    pre.style.fontSize = `${currentFont}px`;
  }
}

function autoFitVisiblePanels() {
  if (!hasStarted) return;
  const activeSection = timelineSections[currentSectionIndex];
  if (!activeSection) return;

  activeSection.querySelectorAll(".big-code").forEach((pre) => fitPreToPanel(pre, 0.72));
  activeSection.querySelectorAll(".big-output").forEach((pre) => fitPreToPanel(pre, 0.8));
}

function scheduleAutoFit() {
  if (fitAnimationFrame) cancelAnimationFrame(fitAnimationFrame);
  fitAnimationFrame = requestAnimationFrame(() => {
    fitAnimationFrame = null;
    autoFitVisiblePanels();
  });
}

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
    const theme = activeSection?.dataset?.theme || "analysis";
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

  scheduleAutoFit();
}

function startTimeline() {
  hasStarted = true;
  currentSectionIndex = 0;
  updateSectionVisibility();
  if (nextButton) nextButton.classList.remove("is-hidden");
}

function goToNextSection() {
  if (!timelineSections.length) return;

  if (!hasStarted) {
    startTimeline();
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

if (nextButton) {
  nextButton.addEventListener("click", () => {
    goToNextSection();
  });
}

if (startButton) {
  startButton.addEventListener("click", (event) => {
    event.preventDefault();
    startTimeline();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (navLinks.length) {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href")?.replace("#", "");
      if (!targetId) return;
      jumpToSectionById(targetId);
    });
  });
}

document.addEventListener("keydown", (event) => {
  if (isEditableTarget(event.target)) return;

  if (event.key === " " || event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    goToNextSection();
  }
});

updateSectionVisibility();

window.addEventListener("resize", scheduleAutoFit);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", scheduleAutoFit);
}

function runFortranDemo() {
  const mass = Number(document.getElementById("fortran-mass").value);
  const speed = Number(document.getElementById("fortran-speed").value);
  const energy = 0.5 * mass * speed * speed;
  const momentum = mass * speed;
  const targetDistance = 100;
  const travelTime = speed > 0 ? targetDistance / speed : null;

  renderCodeBlock("fortran-code", renderFortranCode(mass, speed, targetDistance));

  const outputText = `Rocket energy = ${formatNumber(energy)} joules
Momentum = ${formatNumber(momentum)} kg*m/s
Time to 100m = ${travelTime === null ? "N/A (speed must be > 0)" : `${formatNumber(travelTime)} seconds`}`;
  streamOutput("fortran-output", outputText, "fortran");
}

function getFortranCode(mass, speed, targetDistance) {
  return `program energy_demo
  implicit none
  real :: mass, speed, energy, momentum, target_distance, travel_time

  mass = ${mass.toFixed(1)}
  speed = ${speed.toFixed(1)}
  target_distance = ${targetDistance.toFixed(1)}
  energy = 0.5 * mass * speed**2
  momentum = mass * speed

  print '(A,F8.2,A)', "Rocket energy = ", energy, " joules"
  print '(A,F8.2,A)', "Momentum = ", momentum, " kg*m/s"

  if (speed > 0.0) then
    travel_time = target_distance / speed
    print '(A,F8.2,A)', "Time to 100m = ", travel_time, " seconds"
  else
    print *, "Time to 100m = N/A (speed must be > 0)"
  end if
end program energy_demo`;
}

function renderFortranCode(mass, speed, targetDistance) {
  return `<span class="code-kw">program</span> <span class="code-name">energy_demo</span>
  <span class="code-kw">implicit none</span>
  <span class="code-kw">real</span> :: mass, speed, energy, momentum, target_distance, travel_time

  mass = <span class="code-number">${mass.toFixed(1)}</span>
  speed = <span class="code-number">${speed.toFixed(1)}</span>
  target_distance = <span class="code-number">${targetDistance.toFixed(1)}</span>
  energy = <span class="code-number">0.5</span> * mass * speed**<span class="code-number">2</span>
  momentum = mass * speed

  <span class="code-call">print</span> <span class="code-string">&#39;(A,F8.2,A)&#39;</span>, <span class="code-string">&quot;Rocket energy = &quot;</span>, energy, <span class="code-string">&quot; joules&quot;</span>
  <span class="code-call">print</span> <span class="code-string">&#39;(A,F8.2,A)&#39;</span>, <span class="code-string">&quot;Momentum = &quot;</span>, momentum, <span class="code-string">&quot; kg*m/s&quot;</span>

  <span class="code-kw">if</span> (speed &gt; <span class="code-number">0.0</span>) <span class="code-kw">then</span>
    travel_time = target_distance / speed
    <span class="code-call">print</span> <span class="code-string">&#39;(A,F8.2,A)&#39;</span>, <span class="code-string">&quot;Time to 100m = &quot;</span>, travel_time, <span class="code-string">&quot; seconds&quot;</span>
  <span class="code-kw">else</span>
    <span class="code-call">print</span> *, <span class="code-string">&quot;Time to 100m = N/A (speed must be &gt; 0)&quot;</span>
  <span class="code-kw">end if</span>
<span class="code-kw">end program</span> <span class="code-name">energy_demo</span>`;
}

function runLispDemo() {
  const input = document.getElementById("lisp-input").value.trim();
  const tasks = input
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  renderCodeBlock("lisp-code", renderLispCode(tasks));

  if (!tasks.length) {
    const warningText = `Please enter at least one task.

Try:
buy milk, call mom, finish homework`;
    streamOutput("lisp-output", warningText, "lisp");
    return;
  }

  const outputText = `First task: ${tasks[0]}
Remaining tasks: ${tasks.slice(1).join(", ") || "None"}
Total tasks: ${tasks.length}`;
  streamOutput("lisp-output", outputText, "lisp");
}

function getLispCode(tasks) {
  return `(defparameter *tasks* '(${tasks.map(task => `"${task}"`).join(" ")}))

(let ((first-task (first *tasks*))
      (remaining  (rest *tasks*))
      (count      (length *tasks*)))
  (format t "First task: ~A~%" first-task)
  (format t "Remaining tasks: ~A~%" remaining)
  (format t "Total tasks: ~D~%" count))`;
}

function renderLispCode(tasks) {
  const taskHtml = tasks.map((task) => `<span class="code-string">&quot;${escapeHtml(task)}&quot;</span>`).join(" ");
  return `(<span class="code-name">defparameter</span> <span class="code-prop">*tasks*</span> &#39;(${taskHtml}))

(<span class="code-name">let</span> ((first-task (<span class="code-call">first</span> <span class="code-prop">*tasks*</span>))
      (remaining  (<span class="code-call">rest</span> <span class="code-prop">*tasks*</span>))
      (count      (<span class="code-call">length</span> <span class="code-prop">*tasks*</span>)))
  (<span class="code-call">format</span> t <span class="code-string">&quot;First task: ~A~%&quot;</span> first-task)
  (<span class="code-call">format</span> t <span class="code-string">&quot;Remaining tasks: ~A~%&quot;</span> remaining)
  (<span class="code-call">format</span> t <span class="code-string">&quot;Total tasks: ~D~%&quot;</span> count))`;
}

function runCobolDemo() {
  const name = "Jordan Lee";
  const hours = Number(document.getElementById("cobol-hours").value);
  const rate = Number(document.getElementById("cobol-rate").value);
  const grossPay = hours * rate;

  renderCodeBlock("cobol-code", renderCobolCode(name, hours, rate));

  const outputText = `PAYROLL REPORT
-------------------------
Employee: ${name}
Hours: ${hours}
Rate: $${formatNumber(rate)}
Gross Pay: $${formatNumber(grossPay)}`;
  streamOutput("cobol-output", outputText, "cobol");
}

function getCobolCode(name, hours, rate) {
  return `IDENTIFICATION DIVISION.
PROGRAM-ID. PAYROLL.
ENVIRONMENT DIVISION.
DATA DIVISION.
WORKING-STORAGE SECTION.
01 EMPLOYEE-NAME         PIC X(20)  VALUE "${name}".
01 HOURS-WORKED          PIC 99V9   VALUE ${hours.toFixed(1)}.
01 HOURLY-RATE           PIC 99V99  VALUE ${formatNumber(rate)}.
01 GROSS-PAY             PIC 9(5)V99 VALUE 0.

PROCEDURE DIVISION.
    COMPUTE GROSS-PAY = HOURS-WORKED * HOURLY-RATE
    DISPLAY "EMPLOYEE: " EMPLOYEE-NAME
    DISPLAY "HOURS: " HOURS-WORKED
    DISPLAY "RATE: " HOURLY-RATE
    DISPLAY "GROSS PAY: " GROSS-PAY
    GOBACK.`;
}

function renderCobolCode(name, hours, rate) {
  return `<span class="code-kw">IDENTIFICATION DIVISION</span>.
<span class="code-kw">PROGRAM-ID</span>. <span class="code-name">PAYROLL</span>.
<span class="code-kw">ENVIRONMENT DIVISION</span>.
<span class="code-kw">DATA DIVISION</span>.
<span class="code-kw">WORKING-STORAGE SECTION</span>.
<span class="code-number">01</span> EMPLOYEE-NAME         <span class="code-kw">PIC</span> X(<span class="code-number">20</span>)  <span class="code-kw">VALUE</span> <span class="code-string">&quot;${escapeHtml(name)}&quot;</span>.
<span class="code-number">01</span> HOURS-WORKED          <span class="code-kw">PIC</span> <span class="code-number">99V9</span>   <span class="code-kw">VALUE</span> <span class="code-number">${hours.toFixed(1)}</span>.
<span class="code-number">01</span> HOURLY-RATE           <span class="code-kw">PIC</span> <span class="code-number">99V99</span>  <span class="code-kw">VALUE</span> <span class="code-number">${formatNumber(rate)}</span>.
<span class="code-number">01</span> GROSS-PAY             <span class="code-kw">PIC</span> <span class="code-number">9(5)V99</span> <span class="code-kw">VALUE</span> <span class="code-number">0</span>.

<span class="code-kw">PROCEDURE DIVISION</span>.
    <span class="code-kw">COMPUTE</span> GROSS-PAY = HOURS-WORKED * HOURLY-RATE
    <span class="code-kw">DISPLAY</span> <span class="code-string">&quot;EMPLOYEE: &quot;</span> EMPLOYEE-NAME
    <span class="code-kw">DISPLAY</span> <span class="code-string">&quot;HOURS: &quot;</span> HOURS-WORKED
    <span class="code-kw">DISPLAY</span> <span class="code-string">&quot;RATE: &quot;</span> HOURLY-RATE
    <span class="code-kw">DISPLAY</span> <span class="code-string">&quot;GROSS PAY: &quot;</span> GROSS-PAY
    <span class="code-kw">GOBACK</span>.`;
}

function runCDemo() {
  const raw = document.getElementById("c-input").value;
  const numbers = raw
    .split(",")
    .map(item => Number(item.trim()))
    .filter(item => !Number.isNaN(item));

  const sorted = [...numbers].sort((a, b) => a - b);
  const fastest = sorted[0];
  const slowest = sorted[sorted.length - 1];

  if (!numbers.length) {
    renderCodeBlock("c-code", renderCCode(numbers));

    streamOutput("c-output", "Please enter race times like: 12.4, 10.9, 11.3", "c");
    return;
  }

  renderCodeBlock("c-code", renderCCode(numbers));

  const outputText = `Original times: ${numbers.join(", ")}
Sorted times:   ${sorted.join(", ")}
Fastest runner: ${formatNumber(fastest)}s
Slowest runner: ${formatNumber(slowest)}s`;
  streamOutput("c-output", outputText, "c");
}

function getCCode(numbers) {
  if (!numbers.length) {
    return `#include <stdio.h>

int main(void) {
    int count = 0;
    /* no timing data entered */
    return 0;
}`;
  }

  return `#include <stdio.h>
#include <stdlib.h>

static int compare_doubles(const void *a, const void *b) {
    const double da = *(const double *)a;
    const double db = *(const double *)b;
    return (da > db) - (da < db);
}

int main(void) {
    double values[] = { ${numbers.join(", ")} };
    int count = ${numbers.length};

    qsort(values, count, sizeof(double), compare_doubles);
    printf("Fastest: %.2f\\n", values[0]);
    printf("Slowest: %.2f\\n", values[count - 1]);

    return 0;
}`;
}

function renderCCode(numbers) {
  if (!numbers.length) {
    return `<span class="code-kw">#include</span> <span class="code-string">&lt;stdio.h&gt;</span>

<span class="code-kw">int</span> <span class="code-name">main</span>(<span class="code-kw">void</span>) {
    <span class="code-kw">int</span> count = <span class="code-number">0</span>;
    <span class="code-string">/* no timing data entered */</span>
    <span class="code-kw">return</span> <span class="code-number">0</span>;
}`;
  }

  return `<span class="code-kw">#include</span> <span class="code-string">&lt;stdio.h&gt;</span>
<span class="code-kw">#include</span> <span class="code-string">&lt;stdlib.h&gt;</span>

<span class="code-kw">static int</span> <span class="code-name">compare_doubles</span>(<span class="code-kw">const void</span> *a, <span class="code-kw">const void</span> *b) {
    <span class="code-kw">const double</span> da = *(<span class="code-kw">const double</span> *)a;
    <span class="code-kw">const double</span> db = *(<span class="code-kw">const double</span> *)b;
    <span class="code-kw">return</span> (da &gt; db) - (da &lt; db);
}

<span class="code-kw">int</span> <span class="code-name">main</span>(<span class="code-kw">void</span>) {
    <span class="code-kw">double</span> values[] = { <span class="code-number">${numbers.join(", ")}</span> };
    <span class="code-kw">int</span> count = <span class="code-number">${numbers.length}</span>;

    <span class="code-call">qsort</span>(values, count, <span class="code-call">sizeof</span>(<span class="code-kw">double</span>), compare_doubles);
    <span class="code-call">printf</span>(<span class="code-string">&quot;Fastest: %.2f\\n&quot;</span>, values[<span class="code-number">0</span>]);
    <span class="code-call">printf</span>(<span class="code-string">&quot;Slowest: %.2f\\n&quot;</span>, values[count - <span class="code-number">1</span>]);

    <span class="code-kw">return</span> <span class="code-number">0</span>;
}`;
}

function runPythonDemo() {
  const text = document.getElementById("python-input").value.trim();
  const words = text
    .toLowerCase()
    .match(/[a-z']+/g) || [];
  const counts = {};

  words.forEach((word) => {
    if (word.length < 4) return;
    counts[word] = (counts[word] || 0) + 1;
  });

  const topWords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  renderCodeBlock("python-code", renderPythonCode(text));

  const outputText = `Word count: ${words.length}
Top keywords:
${topWords.map(([word, count]) => `- ${word}: ${count}`).join("\n") || "- None"}`;
  streamOutput("python-output", outputText, "python");
}

function getPythonCode(text) {
  return `import re
from collections import Counter

text = """${text}"""
words = re.findall(r"[a-z']+", text.lower())
filtered = [w for w in words if len(w) >= 4]
top_words = Counter(filtered).most_common(3)

print("Word count:", len(words))
print("Top keywords:", top_words)`;
}

function renderPythonCode(text) {
  return `<span class="code-kw">import</span> re
<span class="code-kw">from</span> collections <span class="code-kw">import</span> Counter

text = <span class="code-string">&quot;&quot;&quot;${escapeHtml(text)}&quot;&quot;&quot;</span>
words = re.<span class="code-call">findall</span>(<span class="code-string">r&quot;[a-z&#39;]+&quot;</span>, text.<span class="code-call">lower</span>())
filtered = [w <span class="code-kw">for</span> w <span class="code-kw">in</span> words <span class="code-kw">if</span> <span class="code-call">len</span>(w) &gt;= <span class="code-number">4</span>]
top_words = <span class="code-name">Counter</span>(filtered).<span class="code-call">most_common</span>(<span class="code-number">3</span>)

<span class="code-call">print</span>(<span class="code-string">&quot;Word count:&quot;</span>, <span class="code-call">len</span>(words))
<span class="code-call">print</span>(<span class="code-string">&quot;Top keywords:&quot;</span>, top_words)`;
}

function updateJavascriptCart(ticketCount) {
  jsCounter = Math.max(0, Math.min(20, Number(ticketCount)));
  const ticketPrice = 12;
  const taxRate = 0.0825;
  const serviceFee = jsCounter > 0 ? 1.5 : 0;
  const subtotal = jsCounter * ticketPrice;
  const tax = subtotal * taxRate;
  const total = subtotal + tax + serviceFee;

  const counter = document.getElementById("js-counter");
  const liveTotal = document.getElementById("js-live-total");
  const slider = document.getElementById("js-ticket-slider");

  if (counter) counter.textContent = jsCounter;
  if (liveTotal) liveTotal.textContent = `$${formatNumber(total)}`;
  if (slider && Number(slider.value) !== jsCounter) slider.value = String(jsCounter);

  renderCodeBlock("javascript-code", renderJavascriptCode());

  const outputText = `Tickets selected: ${jsCounter}
Subtotal: $${formatNumber(subtotal)}
Tax (8.25%): $${formatNumber(tax)}
Service fee: $${formatNumber(serviceFee)}
Total cost: $${formatNumber(total)}`;
  streamOutput("javascript-output", outputText, "instant");
}

function getJavascriptCode() {
  return `const ticketPrice = 12;
const taxRate = 0.0825;
const serviceFee = 1.50;

function updateCartFromSlider(ticketCount) {
  const tickets = Math.max(0, Number(ticketCount));
  const subtotal = tickets * ticketPrice;
  const tax = subtotal * taxRate;
  const total = subtotal + tax + (tickets ? serviceFee : 0);
  document.getElementById("js-counter").textContent = tickets;
  document.getElementById("js-live-total").textContent = "$" + total.toFixed(2);
}

document.getElementById("js-ticket-slider")
  .addEventListener("change", (event) => {
    updateCartFromSlider(event.target.value);
  });`;
}

function renderJavascriptCode() {
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
}

document.<span class="code-call">getElementById</span>(<span class="code-string">&quot;js-ticket-slider&quot;</span>)
  .<span class="code-call">addEventListener</span>(<span class="code-string">&quot;change&quot;</span>, (event) =&gt; {
    <span class="code-call">updateCartFromSlider</span>(event.target.value);
  });`;
}

const jsTicketSlider = document.getElementById("js-ticket-slider");
if (jsTicketSlider) {
  jsTicketSlider.addEventListener("change", (event) => {
    updateJavascriptCart(event.target.value);
  });
}

function runRustDemo() {
  const requested = Number(document.getElementById("rust-steps").value);
  const safeLimit = 80;
  const packages = Math.max(1, Math.min(requested, safeLimit));
  const lines = [];

  for (let i = 1; i <= Math.min(packages, 8); i++) {
    lines.push(`Package ${i}: checked and approved`);
  }

  renderCodeBlock("rust-code", renderRustCode(requested));

  const outputText = `Requested packages: ${requested}
Safe approved amount: ${packages}
${requested > safeLimit ? "Warning: request exceeded safe limit, value was clamped.\n" : ""}${lines.join("\n")}`;
  streamOutput("rust-output", outputText, "rust");
}

function getRustCode(requested) {
  return `fn main() {
    let requested: i32 = ${requested};
    let safe_limit: i32 = 80;
    let approved = requested.clamp(1, safe_limit);

    if requested > safe_limit {
        eprintln!("Warning: request exceeded safe limit.");
    }

    for i in 1..=approved {
        println!("Package {i} approved");
    }
}`;
} 

function renderRustCode(requested) {
  return `<span class="code-kw">fn</span> <span class="code-name">main</span>() {
    <span class="code-kw">let</span> requested: <span class="code-name">i32</span> = <span class="code-number">${requested}</span>;
    <span class="code-kw">let</span> safe_limit: <span class="code-name">i32</span> = <span class="code-number">80</span>;
    <span class="code-kw">let</span> approved = requested.<span class="code-call">clamp</span>(<span class="code-number">1</span>, safe_limit);

    <span class="code-kw">if</span> requested &gt; safe_limit {
        <span class="code-call">eprintln!</span>(<span class="code-string">&quot;Warning: request exceeded safe limit.&quot;</span>);
    }

    <span class="code-kw">for</span> i <span class="code-kw">in</span> <span class="code-number">1</span>..=approved {
        <span class="code-call">println!</span>(<span class="code-string">&quot;Package {i} approved&quot;</span>);
    }
}`;
}

function showInitialCodeSamples() {
  const mass = Number(document.getElementById("fortran-mass")?.value || 10);
  const speed = Number(document.getElementById("fortran-speed")?.value || 12);
  const lispInput = document.getElementById("lisp-input")?.value.trim() || "";
  const lispTasks = lispInput.split(",").map(item => item.trim()).filter(Boolean);
  const hours = Number(document.getElementById("cobol-hours")?.value || 40);
  const rate = Number(document.getElementById("cobol-rate")?.value || 18.5);
  const cNumbers = (document.getElementById("c-input")?.value || "")
    .split(",")
    .map(item => Number(item.trim()))
    .filter(item => !Number.isNaN(item));
  const pythonText = document.getElementById("python-input")?.value.trim() || "";
  const requested = Number(document.getElementById("rust-steps")?.value || 12);
  const counter = document.getElementById("js-counter");
  const liveTotal = document.getElementById("js-live-total");

  renderCodeBlock("fortran-code", renderFortranCode(mass, speed, 100));
  renderCodeBlock("lisp-code", renderLispCode(lispTasks));
  renderCodeBlock("cobol-code", renderCobolCode("Jordan Lee", hours, rate));
  renderCodeBlock("c-code", renderCCode(cNumbers));
  renderCodeBlock("python-code", renderPythonCode(pythonText));
  renderCodeBlock("javascript-code", renderJavascriptCode());
  renderCodeBlock("rust-code", renderRustCode(requested));

  if (counter) counter.textContent = String(jsCounter);
  if (liveTotal) liveTotal.textContent = `$${formatNumber(jsCounter * 12 + jsCounter * 12 * 0.0825 + (jsCounter > 0 ? 1.5 : 0))}`;
}

showInitialCodeSamples();
