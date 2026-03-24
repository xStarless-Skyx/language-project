// script.js
let jsCounter = 0;

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function revealOutput(outputId) {
  const output = document.getElementById(outputId);
  const panel = output ? output.closest(".panel") : null;
  if (panel) panel.classList.remove("is-hidden");
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

function updateSectionVisibility() {
  timelineSections.forEach((section, index) => {
    if (hasStarted && index === currentSectionIndex) {
      section.classList.remove("section-hidden");
    } else {
      section.classList.add("section-hidden");
    }
  });

  if (heroSection) {
    if (hasStarted) {
      heroSection.classList.add("hero-hidden");
    } else {
      heroSection.classList.remove("hero-hidden");
    }
  }

  if (nextButton) {
    const isLast = currentSectionIndex >= timelineSections.length - 1;
    nextButton.textContent = isLast ? "Back to top" : "Next";
    nextButton.setAttribute("aria-label", isLast ? "Back to top" : "Next section");
  }
}

function startTimeline() {
  hasStarted = true;
  currentSectionIndex = 0;
  updateSectionVisibility();
  if (nextButton) nextButton.classList.remove("is-hidden");
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
    if (!timelineSections.length) return;

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

updateSectionVisibility();

function runFortranDemo() {
  const mass = Number(document.getElementById("fortran-mass").value);
  const accel = Number(document.getElementById("fortran-accel").value);
  const force = mass * accel;

  document.getElementById("fortran-code").textContent =
`PROGRAM FORCE_DEMO
  REAL :: MASS, ACCEL, FORCE
  MASS = ${mass.toFixed(1)}
  ACCEL = ${accel.toFixed(1)}
  FORCE = MASS * ACCEL
  PRINT *, "FORCE =", FORCE
END PROGRAM FORCE_DEMO`;

  document.getElementById("fortran-output").textContent =
`Force = ${formatNumber(force)} newtons

This demo shows the kind of scientific calculation
FORTRAN made easier for engineers and scientists.`;

  revealOutput("fortran-output");
}

function runLispDemo() {
  const input = document.getElementById("lisp-input").value.trim();
  const output = document.getElementById("lisp-output");

  document.getElementById("lisp-code").textContent = input;

  const match = input.match(/^\(([\+\-\*\/])\s+([0-9\s.-]+)\)$/);

  if (!match) {
    output.textContent =
`Invalid expression.

Try:
(+ 2 3 4)
(* 5 6)
(- 10 3)`;
    revealOutput("lisp-output");
    return;
  }

  const operator = match[1];
  const numbers = match[2].trim().split(/\s+/).map(Number);

  let result;

  if (operator === "+") result = numbers.reduce((a, b) => a + b, 0);
  if (operator === "*") result = numbers.reduce((a, b) => a * b, 1);
  if (operator === "-") result = numbers.slice(1).reduce((a, b) => a - b, numbers[0]);
  if (operator === "/") result = numbers.slice(1).reduce((a, b) => a / b, numbers[0]);

  output.textContent =
`Result = ${result}

This demo shows how LISP uses list-like expressions
to represent operations and logic.`;

  revealOutput("lisp-output");
}

function runCobolDemo() {
  const name = "Example";
  const hours = Number(document.getElementById("cobol-hours").value);
  const rate = Number(document.getElementById("cobol-rate").value);
  const grossPay = hours * rate;

  document.getElementById("cobol-code").textContent =
`IDENTIFICATION DIVISION.
PROGRAM-ID. PAYROLL.

DATA DIVISION.
WORKING-STORAGE SECTION.
01 EMPLOYEE-NAME PIC X(20) VALUE "${name}".
01 HOURS-WORKED  PIC 99 VALUE ${Math.round(hours)}.
01 HOURLY-RATE   PIC 99V99 VALUE ${formatNumber(rate)}.
01 GROSS-PAY     PIC 9999V99.

PROCEDURE DIVISION.
    MULTIPLY HOURS-WORKED BY HOURLY-RATE GIVING GROSS-PAY
    DISPLAY "EMPLOYEE: ${name}"
    DISPLAY "GROSS PAY: ${formatNumber(grossPay)}"
    STOP RUN.`;

  document.getElementById("cobol-output").textContent =
`PAYROLL REPORT
-------------------------
Employee: ${name}
Hours: ${hours}
Rate: $${formatNumber(rate)}
Gross Pay: $${formatNumber(grossPay)}

This demo shows the business style COBOL was built for.`;

  revealOutput("cobol-output");
}

function runCDemo() {
  const raw = document.getElementById("c-input").value;
  const numbers = raw
    .split(",")
    .map(item => Number(item.trim()))
    .filter(item => !Number.isNaN(item));

  const sorted = [...numbers].sort((a, b) => a - b);

  document.getElementById("c-code").textContent =
`#include <stdio.h>

int main(void) {
    int values[] = { ${numbers.join(", ")} };
    int count = ${numbers.length};

    /* sort values here */

    return 0;
}`;

  document.getElementById("c-output").textContent =
`Original: ${numbers.join(", ")}
Sorted:   ${sorted.join(", ")}

This demo shows C's role in efficient, structured programming.`;

  revealOutput("c-output");
}

function runPythonDemo() {
  const text = document.getElementById("python-input").value.trim();
  const words = text.length ? text.split(/\s+/) : [];
  const longestWord = words.reduce((longest, current) =>
    current.length > longest.length ? current : longest, "");

  document.getElementById("python-code").textContent =
`text = """${text}"""
words = text.split()

print("Word count:", len(words))
print("Longest word:", max(words, key=len))`;

  document.getElementById("python-output").textContent =
`Word count: ${words.length}
Longest word: ${longestWord || "None"}

This demo shows Python's readable style and usefulness
for quick text processing.`;

  revealOutput("python-output");
}

function changeJsCounter(amount) {
  jsCounter += amount;

  document.getElementById("js-counter").textContent = jsCounter;

  document.getElementById("javascript-code").textContent =
`let count = ${jsCounter};

function changeCount(amount) {
  count += amount;
  return count;
}`;

  document.getElementById("javascript-output").textContent =
`Counter value: ${jsCounter}

This demo shows JavaScript creating live changes
directly in the browser.`;

  revealOutput("javascript-output");
}

function runRustDemo() {
  const steps = Number(document.getElementById("rust-steps").value);
  const lines = [];

  for (let i = 1; i <= steps; i++) {
    lines.push(`Step ${i}: completed safely`);
  }

  document.getElementById("rust-code").textContent =
`fn main() {
    let steps = ${steps};
    for i in 1..=steps {
        println!("Step {}", i);
    }
}`;

  document.getElementById("rust-output").textContent =
`${lines.join("\n")}

This demo shows Rust's focus on reliable, structured execution.`;

  revealOutput("rust-output");
}
