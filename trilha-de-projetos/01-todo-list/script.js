"use strict";

/* -------------------------
   Elements
   ------------------------- */
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskTimeInput = document.getElementById("task-time");
const taskList = document.getElementById("task-list");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const themeToggle = document.getElementById("theme-toggle");

const alarmAudioInput = document.getElementById("alarm-audio-input");
const alarmVisualSelect = document.getElementById("alarm-visual-select");
const testAlarmBtn = document.getElementById("test-alarm-btn");

const alarmModal = document.getElementById("alarm-modal");
const alarmModalTitle = document.getElementById("alarm-modal-title");
const alarmModalTime = document.getElementById("alarm-modal-time");
const alarmCompleteBtn = document.getElementById("alarm-complete-btn");
const alarmSilenceBtn = document.getElementById("alarm-silence-btn");
const alarmCloseBtn = document.getElementById("alarm-close-btn");

let tasks = [];

/* -------------------------
   Storage
   ------------------------- */
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
function loadTasks() {
  const raw = localStorage.getItem("tasks");
  tasks = raw ? JSON.parse(raw) : [];
}

/* -------------------------
   Render
   ------------------------- */
function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Nenhuma tarefa ainda. Adicione uma acima.";
    p.style.textAlign = "center";
    p.style.padding = "12px";
    taskList.appendChild(p);
    updateProgress();
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!task.done;

    const h3 = document.createElement("h3");
    h3.textContent = task.text;

    label.appendChild(checkbox);
    label.appendChild(h3);

    if (task.alarmAt) {
      const small = document.createElement("small");
      small.textContent = `⏰ ${new Date(task.alarmAt).toLocaleString(
        "pt-BR"
      )}`;
      label.appendChild(small);
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(label);
    li.appendChild(actions);
    taskList.appendChild(li);

    // checkbox
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      if (checkbox.checked && window.AlarmManager) {
        AlarmManager.silence(task.id);
      }
      saveTasks();
      updateProgress();
    });

    // editar
    editBtn.addEventListener("click", () => {
      const newText = prompt("Editar tarefa:", task.text);
      if (newText !== null) {
        task.text = newText.trim() || task.text;
        saveTasks();
        renderTasks();
      }
    });

    // excluir
    deleteBtn.addEventListener("click", () => {
      if (confirm("Deseja excluir esta tarefa?")) {
        if (window.AlarmManager) {
          AlarmManager.cancelTask(task.id);
        }
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
      }
    });
  });

  updateProgress();
}

/* -------------------------
   Progress
   ------------------------- */
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.done).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressText.textContent = `${completed} de ${total} concluídos`;
  progressFill.style.width = `${percent}%`;
}

/* -------------------------
   Add task
   ------------------------- */
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  const alarmAt = taskTimeInput.value || null;
  if (!text) return;

  const newTask = {
    id: Date.now().toString(),
    text,
    done: false,
    createdAt: new Date().toISOString(),
    alarmAt,
    alarmTriggered: false,
  };

  tasks.unshift(newTask);
  saveTasks();

  if (window.AlarmManager && newTask.alarmAt) {
    AlarmManager.registerTask(newTask);
  }

  renderTasks();
  taskInput.value = "";
  taskTimeInput.value = "";
});

/* -------------------------
   Theme toggle
   ------------------------- */
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
applyTheme(localStorage.getItem("theme") || "light");

/* -------------------------
   Modal de Alarme
   ------------------------- */
function openAlarmModal(task) {
  alarmModalTitle.textContent = "Tarefa: " + task.text;
  alarmModalTime.textContent =
    "⏰ Prazo: " + new Date(task.alarmAt).toLocaleString("pt-BR");
  alarmModal.classList.add("active");

  alarmCompleteBtn.onclick = () => {
    task.done = true;
    saveTasks();
    renderTasks();
    if (window.AlarmManager) AlarmManager.silence(task.id);
    closeAlarmModal();
  };
  alarmSilenceBtn.onclick = () => {
    if (window.AlarmManager) AlarmManager.silence(task.id);
    closeAlarmModal();
  };
  alarmCloseBtn.onclick = closeAlarmModal;
}
function closeAlarmModal() {
  alarmModal.classList.remove("active");
}

/* -------------------------
   Eventos do AlarmManager
   ------------------------- */
window.addEventListener("alarm:fired", (e) => {
  const id = e.detail && e.detail.id;
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.alarmTriggered = true;
    saveTasks();
    renderTasks();
    openAlarmModal(task);

    // 🔔 Notificação nativa
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Lembrete de tarefa", {
        body:
          task.text +
          "\nPrazo: " +
          new Date(task.alarmAt).toLocaleString("pt-BR"),
        icon: "logo.png",
      });
    }
  }
});

/* -------------------------
   Configuração de som/visual
   ------------------------- */
alarmAudioInput.addEventListener("change", (ev) => {
  const file = ev.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    if (window.AlarmManager) AlarmManager.setAudioSrc(url);
  }
});
alarmVisualSelect.addEventListener("change", (ev) => {
  if (window.AlarmManager) AlarmManager.setVisualClass(ev.target.value);
});
testAlarmBtn.addEventListener("click", () => {
  if (window.AlarmManager) AlarmManager.playNow();
});

/* -------------------------
   Init
   ------------------------- */
loadTasks();

// Solicitar permissão para notificações no primeiro acesso
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

if (window.AlarmManager) {
  AlarmManager.init({ audioSrc: "alarm.mp3", visualClass: "alarm-active" });
  tasks.forEach((t) => {
    if (t.alarmAt && !t.alarmTriggered) AlarmManager.registerTask(t);
  });
}
renderTasks();
updateProgress();
