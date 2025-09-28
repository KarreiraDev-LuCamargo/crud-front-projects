const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent =
        document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

// Atualizar progresso
function updateProgress() {
  const total = checkboxes.length;
  const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
  const percent = (checked / total) * 100;

  progressText.textContent = `${checked} de ${total} concluídos`;
  progressFill.style.width = `${percent}%`;
}

// Carregar estado salvo dos checkboxes
checkboxes.forEach((checkbox, index) => {
  const saved = localStorage.getItem(`project-${index}`);
  if (saved === "true") checkbox.checked = true;

  checkbox.addEventListener("change", () => {
    localStorage.setItem(`project-${index}`, checkbox.checked);
    updateProgress();
  });
});

// Dark mode
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light Mode";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙 Dark Mode";
  }
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  applyTheme(isDark ? "light" : "dark");
});

// Carregar tema salvo
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

// Inicializar progresso
updateProgress();