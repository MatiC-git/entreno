// Clave con la que se guardan los entrenamientos en el navegador
const STORAGE_KEY = "entreno.workouts";

// Descanso por defecto en segundos (también para entrenamientos guardados antes de tener este campo)
const DEFAULT_REST = 90;

// Referencias a los elementos de la página
const workoutList = document.getElementById("workout-list");
const emptyState = document.getElementById("empty-state");
const newWorkoutBtn = document.getElementById("new-workout-btn");
const editor = document.getElementById("workout-editor");
const form = document.getElementById("workout-form");
const workoutNameInput = document.getElementById("workout-name");
const exerciseFields = document.getElementById("exercise-fields");
const addExerciseBtn = document.getElementById("add-exercise-btn");
const cancelBtn = document.getElementById("cancel-btn");
const deleteWorkoutBtn = document.getElementById("delete-workout-btn");
const editorTitle = document.getElementById("editor-title");
const exerciseRowTemplate = document.getElementById("exercise-row-template");
const restTimer = document.getElementById("rest-timer");
const timerExercise = document.getElementById("timer-exercise");
const timerTime = document.getElementById("timer-time");
const timerProgress = document.getElementById("timer-progress");
const timerDoneText = document.getElementById("timer-done-text");
const timerControls = document.getElementById("timer-controls");
const timerAddBtn = document.getElementById("timer-add-btn");
const timerPauseBtn = document.getElementById("timer-pause-btn");
const timerSkipBtn = document.getElementById("timer-skip-btn");
const timerCloseBtn = document.getElementById("timer-close-btn");

let workouts = loadWorkouts();

// id del entrenamiento que se está editando; null si se está creando uno nuevo
let editingId = null;

// --- Guardado (localStorage) ---

function loadWorkouts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveWorkouts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  } catch {
    // Si el navegador no deja guardar, los datos quedan solo hasta recargar
  }
}

// --- Lista de entrenamientos ---

function plural(count, singular, pluralWord) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

function renderWorkouts() {
  workoutList.replaceChildren();
  emptyState.hidden = workouts.length > 0;

  for (const workout of workouts) {
    const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

    const card = document.createElement("li");
    card.className = "workout-card";

    // La parte de arriba es un botón: al tocarla se abre el editor con sus datos
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "workout-card__open";
    openBtn.addEventListener("click", () => openEditor(workout));

    const title = document.createElement("h2");
    title.className = "workout-card__title";
    title.textContent = workout.name;

    const summary = document.createElement("p");
    summary.className = "workout-card__summary";
    summary.textContent =
      `${plural(workout.exercises.length, "ejercicio", "ejercicios")} · ${plural(totalSets, "serie", "series")}`;

    openBtn.append(title, summary);

    // Lista de ejercicios, cada uno con su botón de descanso
    const exerciseList = document.createElement("ul");
    exerciseList.className = "workout-card__exercises";

    for (const exercise of workout.exercises) {
      const rest = exercise.rest ?? DEFAULT_REST;

      const line = document.createElement("li");
      line.className = "exercise-line";

      const name = document.createElement("span");
      name.className = "exercise-line__name";
      name.textContent = exercise.name;

      const detail = document.createElement("span");
      detail.className = "exercise-line__detail";
      detail.textContent = `${exercise.sets}×${exercise.reps}`;

      const restBtn = document.createElement("button");
      restBtn.type = "button";
      restBtn.className = "rest-btn";
      restBtn.textContent = `⏱ ${formatTime(rest)}`;
      restBtn.setAttribute("aria-label", `Descanso de ${exercise.name}: ${formatTime(rest)}`);
      restBtn.addEventListener("click", () => startRestTimer(exercise.name, rest));

      line.append(name, detail, restBtn);
      exerciseList.append(line);
    }

    card.append(openBtn, exerciseList);
    workoutList.append(card);
  }
}

// --- Editor de entrenamiento ---

// Si recibe un ejercicio, completa la fila con sus datos
function addExerciseRow(exercise) {
  const row = exerciseRowTemplate.content.firstElementChild.cloneNode(true);

  if (exercise) {
    row.querySelector(".exercise-row__name").value = exercise.name;
    row.querySelector(".exercise-row__sets").value = exercise.sets;
    row.querySelector(".exercise-row__reps").value = exercise.reps;
    row.querySelector(".exercise-row__rest").value = exercise.rest ?? DEFAULT_REST;
  }

  row.querySelector(".exercise-row__remove").addEventListener("click", () => {
    row.remove();
    updateRemoveButtons();
  });

  exerciseFields.append(row);
  updateRemoveButtons();
  return row;
}

// Siempre tiene que quedar al menos un ejercicio
function updateRemoveButtons() {
  const buttons = exerciseFields.querySelectorAll(".exercise-row__remove");
  buttons.forEach((button) => {
    button.disabled = buttons.length === 1;
  });
}

// Sin argumento crea uno nuevo; con un entrenamiento, lo abre para editar
function openEditor(workout = null) {
  editingId = workout ? workout.id : null;

  form.reset();
  exerciseFields.replaceChildren();

  if (workout) {
    editorTitle.textContent = "Editar entrenamiento";
    workoutNameInput.value = workout.name;
    workout.exercises.forEach((exercise) => addExerciseRow(exercise));
  } else {
    editorTitle.textContent = "Nuevo entrenamiento";
    addExerciseRow();
  }

  deleteWorkoutBtn.hidden = !workout;
  editor.showModal();
}

newWorkoutBtn.addEventListener("click", () => openEditor());

addExerciseBtn.addEventListener("click", () => {
  const row = addExerciseRow();
  row.querySelector(".exercise-row__name").focus();
});

cancelBtn.addEventListener("click", () => editor.close());

// El navegador valida los campos "required" antes de llegar acá
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const exercises = [...exerciseFields.children].map((row) => ({
    name: row.querySelector(".exercise-row__name").value.trim(),
    sets: Number(row.querySelector(".exercise-row__sets").value),
    reps: Number(row.querySelector(".exercise-row__reps").value),
    rest: Number(row.querySelector(".exercise-row__rest").value),
  }));

  const name = workoutNameInput.value.trim();

  if (editingId) {
    // Reemplaza los datos y conserva el id y la fecha de creación
    workouts = workouts.map((workout) =>
      workout.id === editingId ? { ...workout, name, exercises } : workout
    );
  } else {
    workouts.push({
      id: String(Date.now()),
      name,
      exercises,
      createdAt: new Date().toISOString(),
    });
  }

  saveWorkouts();
  renderWorkouts();
  editor.close();
});

deleteWorkoutBtn.addEventListener("click", () => {
  const workout = workouts.find((item) => item.id === editingId);
  if (!workout || !confirm(`¿Borrar "${workout.name}"? No se puede deshacer.`)) return;

  workouts = workouts.filter((item) => item.id !== editingId);
  saveWorkouts();
  renderWorkouts();
  editor.close();
});

// --- Timer de descanso ---

const TIMER_STEP_MS = 15000;

// Timer en curso; null si no hay ninguno. Se guarda la hora de fin (y no
// "segundos restantes") para que no se atrase si el celular congela la página.
let timer = null;
let audioContext = null;
let wakeLock = null;

// 90 → "1:30"
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function timeLeftMs() {
  return timer.paused ? timer.remainingMs : Math.max(0, timer.endsAt - Date.now());
}

function startRestTimer(exerciseName, seconds) {
  prepareSound();

  timer = {
    totalMs: seconds * 1000,
    endsAt: Date.now() + seconds * 1000,
    paused: false,
    remainingMs: 0,
    done: false,
    intervalId: setInterval(updateTimer, 250),
  };

  timerExercise.textContent = exerciseName;
  timerPauseBtn.textContent = "Pausar";
  showTimerDone(false);
  updateTimer();
  keepScreenOn();
  restTimer.showModal();
}

function updateTimer() {
  if (!timer) return;

  const left = timeLeftMs();
  timerTime.textContent = formatTime(Math.ceil(left / 1000));
  timerProgress.style.width = `${(left / timer.totalMs) * 100}%`;

  if (left === 0 && !timer.done) finishTimer();
}

function finishTimer() {
  timer.done = true;
  clearInterval(timer.intervalId);
  showTimerDone(true);
  navigator.vibrate?.([300, 150, 300, 150, 500]);
  playBeeps();
}

function showTimerDone(done) {
  restTimer.classList.toggle("timer--done", done);
  timerDoneText.hidden = !done;
  timerControls.hidden = done;
  timerCloseBtn.hidden = !done;
}

timerAddBtn.addEventListener("click", () => {
  if (timer.paused) {
    timer.remainingMs += TIMER_STEP_MS;
  } else {
    timer.endsAt += TIMER_STEP_MS;
  }
  timer.totalMs += TIMER_STEP_MS;
  updateTimer();
});

timerPauseBtn.addEventListener("click", () => {
  if (timer.paused) {
    timer.endsAt = Date.now() + timer.remainingMs;
    timer.paused = false;
    timerPauseBtn.textContent = "Pausar";
  } else {
    timer.remainingMs = timeLeftMs();
    timer.paused = true;
    timerPauseBtn.textContent = "Seguir";
  }
});

timerSkipBtn.addEventListener("click", () => restTimer.close());
timerCloseBtn.addEventListener("click", () => restTimer.close());

// Se cierra con un botón o con "atrás"/Escape: en todos los casos se frena el timer
restTimer.addEventListener("close", () => {
  clearInterval(timer?.intervalId);
  timer = null;
  releaseScreen();
});

// Al volver a la app, actualizar enseguida y volver a pedir que no se apague la pantalla
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !timer) return;
  updateTimer();
  if (!timer.done) keepScreenOn();
});

// El celular solo deja reproducir sonido si se prepara durante un toque del usuario
function prepareSound() {
  try {
    audioContext ??= new AudioContext();
    audioContext.resume();
  } catch {
    audioContext = null;
  }
}

// Tres pitidos cortos, el último más agudo
function playBeeps() {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  [0, 0.25, 0.5].forEach((delay, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = index === 2 ? 1320 : 880;
    gain.gain.setValueAtTime(0.3, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + 0.2);
  });
}

// Evita que se apague la pantalla mientras corre el timer (si el navegador lo permite)
async function keepScreenOn() {
  try {
    wakeLock = await navigator.wakeLock?.request("screen");
  } catch {
    wakeLock = null;
  }
  if (!timer) releaseScreen();
}

function releaseScreen() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

renderWorkouts();
