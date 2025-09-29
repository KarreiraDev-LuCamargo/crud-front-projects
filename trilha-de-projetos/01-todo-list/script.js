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
const stopTestBtn = document.getElementById("stop-test-btn");

const alarmModal = document.getElementById("alarm-modal");
const alarmModalTitle = document.getElementById("alarm-modal-title");
const alarmModalNote = document.getElementById("alarm-modal-note");
const alarmModalTime = document.getElementById("alarm-modal-time");
const alarmCompleteBtn = document.getElementById("alarm-complete-btn");
const alarmSilenceBtn = document.getElementById("alarm-silence-btn");
const alarmCloseBtn = document.getElementById("alarm-close-btn");

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editText = document.getElementById("edit-text");
const editTime = document.getElementById("edit-time");
const editNote = document.getElementById("edit-note");
const editSaveBtn = document.getElementById("edit-save-btn");
const editCancelBtn = document.getElementById("edit-cancel-btn");

let tasks = [];
let editingTaskId = null;

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
    checkbox.setAttribute("aria-label", "Marcar tarefa como concluída");

    const content = document.createElement("div");
    content.className = "task-content";

    const top = document.createElement("div");
    top.className = "task-top";

    const h3 = document.createElement("h3");
    h3.textContent = task.text;

    top.appendChild(h3);
    content.appendChild(top);

    if (task.note) {
      const note = document.createElement("div");
      note.className = "task-note";
      note.textContent = task.note;
      note.style.fontSize = "0.9rem";
      note.style.color = "var(--note-color, #666)";
      content.appendChild(note);
    }

    if (task.alarmAt) {
      const small = document.createElement("small");
      try {
        small.textContent = `⏰ ${new Date(task.alarmAt).toLocaleString(
          "pt-BR"
        )}`;
      } catch (e) {
        small.textContent = `⏰ ${task.alarmAt}`;
      }
      content.appendChild(small);
    }

    label.appendChild(checkbox);
    label.appendChild(content);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "✏️";
    editBtn.title = "Editar tarefa";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Excluir tarefa";

    // silence button shown when alarmTriggered
    let silenceBtn = null;
    if (task.alarmTriggered) {
      silenceBtn = document.createElement("button");
      silenceBtn.type = "button";
      silenceBtn.innerHTML = "🔕";
      silenceBtn.className = "btn-silence";
      silenceBtn.title = "Parar alarme";
      silenceBtn.addEventListener("click", () => {
        if (window.AlarmManager) AlarmManager.silence(task.id);
        task.alarmTriggered = false;
        saveTasks();
        renderTasks();
      });
      actions.appendChild(silenceBtn);
    }

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(label);
    li.appendChild(actions);
    taskList.appendChild(li);

    // If task already alarmTriggered and visual class applied, ensure it persists visually until silenced
    if (task.alarmTriggered && window.AlarmManager) {
      const visualClass =
        AlarmManager && AlarmManager._visualClass
          ? AlarmManager._visualClass
          : null;
      // we rely on AlarmManager to add the class on fire; here just ensure class presence
      // (no direct access to private var; AlarmManager already handled class add)
    }

    /* -------- Events -------- */
    // checkbox
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      if (checkbox.checked && window.AlarmManager) {
        AlarmManager.silence(task.id);
        task.alarmTriggered = false;
      }
      saveTasks();
      updateProgress();
    });

    // editar -> abrir modal de edição preenchida
    editBtn.addEventListener("click", () => {
      openEditModal(task);
    });

    // excluir
    deleteBtn.addEventListener("click", () => {
      if (confirm("Deseja realmente excluir esta tarefa?")) {
        if (window.AlarmManager) AlarmManager.cancelTask(task.id);
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
    note: null,
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
   Theme toggle (mantido)
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
  alarmModalNote.textContent = task.note ? task.note : "";
  alarmModalTime.textContent =
    "⏰ Prazo: " +
    (task.alarmAt ? new Date(task.alarmAt).toLocaleString("pt-BR") : "—");
  alarmModal.classList.add("active");

  alarmCompleteBtn.onclick = () => {
    task.done = true;
    task.alarmTriggered = false;
    saveTasks();
    renderTasks();
    if (window.AlarmManager) AlarmManager.silence(task.id);
    closeAlarmModal();
  };
  alarmSilenceBtn.onclick = () => {
    if (window.AlarmManager) AlarmManager.silence(task.id);
    task.alarmTriggered = false;
    saveTasks();
    renderTasks();
    closeAlarmModal();
  };
  alarmCloseBtn.onclick = closeAlarmModal;
}
function closeAlarmModal() {
  alarmModal.classList.remove("active");
}

/* -------------------------
   Edit modal (editar texto, prazo, observação)
   ------------------------- */
function openEditModal(task) {
  editingTaskId = task.id;
  editText.value = task.text || "";
  editTime.value = task.alarmAt || "";
  editNote.value = task.note || "";
  editModal.classList.add("active");
}
function closeEditModal() {
  editingTaskId = null;
  editModal.classList.remove("active");
}

editCancelBtn.addEventListener("click", () => {
  closeEditModal();
});
editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!editingTaskId) return;
  const task = tasks.find((t) => t.id === editingTaskId);
  if (!task) return;
  task.text = editText.value.trim() || task.text;
  task.alarmAt = editTime.value || null;
  task.note = editNote.value.trim() || null;
  task.alarmTriggered = false; // reset trigger if editing
  saveTasks();

  // Re-register alarm if set
  if (window.AlarmManager) {
    AlarmManager.cancelTask(task.id);
    if (task.alarmAt) AlarmManager.registerTask(task);
  }

  renderTasks();
  closeEditModal();
});

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
    // show modal
    openAlarmModal(task);

    // native notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Lembrete de tarefa", {
        body:
          task.text +
          "\nPrazo: " +
          (task.alarmAt ? new Date(task.alarmAt).toLocaleString("pt-BR") : ""),
        icon: "logo.png",
      });
    }
  }
});

/* -------------------------
   Sound / Visual config + controls
   ------------------------- */
// select change -> set visual class on AlarmManager
alarmVisualSelect.addEventListener("change", (ev) => {
  const cls = ev.target.value || "alarm-zoom";
  if (window.AlarmManager) AlarmManager.setVisualClass(cls);
  localStorage.setItem("alarmVisual", cls);
});

// choose audio file -> set audio src
alarmAudioInput.addEventListener("change", (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    if (window.AlarmManager) AlarmManager.setAudioSrc(url);
    localStorage.setItem("alarmAudioName", file.name);
  }
});

// Test & stop test
testAlarmBtn.addEventListener("click", () => {
  if (window.AlarmManager) AlarmManager.playNow();
});
stopTestBtn.addEventListener("click", () => {
  if (window.AlarmManager) AlarmManager.silenceAll();
});

/* -------------------------
   Init
   ------------------------- */
loadTasks();

// request notification permission once
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// init AlarmManager default visual = zoom
if (window.AlarmManager) {
  const savedVisual = localStorage.getItem("alarmVisual") || "alarm-zoom";
  const savedAudio = localStorage.getItem("alarmAudioName")
    ? null
    : "alarm.mp3";
  AlarmManager.init({
    audioSrc: savedAudio || "alarm.mp3",
    visualClass: savedVisual,
  });

  // register pending alarms
  tasks.forEach((t) => {
    if (t.alarmAt && !t.alarmTriggered) AlarmManager.registerTask(t);
  });
} else {
  console.warn("AlarmManager não encontrado. Verifique alarm.js carregado.");
}

renderTasks();
updateProgress();
