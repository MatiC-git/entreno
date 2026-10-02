// Clave con la que se guardan los entrenamientos en el navegador
const STORAGE_KEY = "entreno.workouts";

// Descanso por defecto en segundos (también para entrenamientos guardados antes de tener este campo)
const DEFAULT_REST = 90;

// Cuántas series tiene un ejercicio nuevo, y el máximo permitido
const DEFAULT_SETS = 3;
const MAX_SETS = 20;

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
const setRowTemplate = document.getElementById("set-row-template");
const sessionDialog = document.getElementById("workout-session");
const sessionTitle = document.getElementById("session-title");
const sessionCurrent = document.getElementById("session-current");
const sessionSet = document.getElementById("session-set");
const sessionExercise = document.getElementById("session-exercise");
const sessionReps = document.getElementById("session-reps");
const sessionWeight = document.getElementById("session-weight");
const sessionFinished = document.getElementById("session-finished");
const sessionSummary = document.getElementById("session-summary");
const sessionPlan = document.getElementById("session-plan");
const sessionExitBtn = document.getElementById("session-exit-btn");
const sessionDoneBtn = document.getElementById("session-done-btn");
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
    const list = saved ? JSON.parse(saved) : [];
    return list.map((workout) => ({
      ...workout,
      exercises: workout.exercises.map(migrateExercise),
    }));
  } catch {
    return [];
  }
}

// Antes cada ejercicio guardaba la cantidad de series y unas reps para todas
// ({ sets: 3, reps: 10 }); ahora cada serie tiene las suyas ({ sets: [{ reps: 10 }, ...] })
function migrateExercise(exercise) {
  if (Array.isArray(exercise.sets)) return exercise;

  const { reps, ...others } = exercise;
  return {
    ...others,
    sets: Array.from({ length: exercise.sets }, () => ({ reps })),
  };
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
    summary.textContent = describeWorkout(workout);

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
      detail.textContent = describeSets(exercise.sets);

      const restBtn = document.createElement("button");
      restBtn.type = "button";
      restBtn.className = "rest-btn";
      restBtn.textContent = `⏱ ${formatTime(rest)}`;
      restBtn.setAttribute("aria-label", `Descanso de ${exercise.name}: ${formatTime(rest)}`);
      restBtn.addEventListener("click", () => startRestTimer(exercise.name, rest));

      line.append(name, detail, restBtn);
      exerciseList.append(line);
    }

    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "btn btn--primary workout-card__start";
    startBtn.textContent = "Empezar";
    startBtn.addEventListener("click", () => startSession(workout));

    card.append(openBtn, exerciseList, startBtn);
    workoutList.append(card);
  }
}

// Reps iguales: "3×10". Distintas: "12/10/8". Si hay peso, se suma: "3×10 · 40 kg" o "· 40–50 kg"
function describeSets(sets) {
  const reps = sets.map((set) => set.reps);
  const repsText = reps.every((value) => value === reps[0]) ? `${sets.length}×${reps[0]}` : reps.join("/");

  const weights = sets.map((set) => set.weight).filter((weight) => weight != null);
  if (weights.length === 0) return repsText;

  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const weightText = min === max ? formatWeight(min) : `${formatWeight(min)}–${formatWeight(max)}`;
  return `${repsText} · ${weightText} kg`;
}

// 22.5 → "22,5"
function formatWeight(weight) {
  return weight.toLocaleString("es-AR");
}

// Campo de peso vacío → null (ejercicio sin peso, ej: dominadas)
function readWeight(input) {
  return input.value === "" ? null : Number(input.value);
}

function describeWorkout(workout) {
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  return `${plural(workout.exercises.length, "ejercicio", "ejercicios")} · ${plural(totalSets, "serie", "series")}`;
}

// --- Editor de entrenamiento ---

// Si recibe un ejercicio, completa la fila con sus datos
function addExerciseRow(exercise) {
  const row = exerciseRowTemplate.content.firstElementChild.cloneNode(true);

  if (exercise) {
    row.querySelector(".exercise-row__name").value = exercise.name;
    row.querySelector(".exercise-row__rest").value = exercise.rest ?? DEFAULT_REST;
    exercise.sets.forEach((set) => addSetRow(row, set));
  } else {
    for (let i = 0; i < DEFAULT_SETS; i++) addSetRow(row);
  }

  row.querySelector(".exercise-row__remove").addEventListener("click", () => {
    row.remove();
    updateRemoveButtons();
  });

  row.querySelector(".exercise-row__add-set").addEventListener("click", () => {
    const setRow = addSetRow(row);
    setRow.querySelector(".set-row__reps").focus();
  });

  exerciseFields.append(row);
  updateRemoveButtons();
  return row;
}

// Si no recibe una serie, copia los valores de la última: lo más común es repetirlos
function addSetRow(exerciseRow, set) {
  const setFields = exerciseRow.querySelector(".set-fields");
  const setRow = setRowTemplate.content.firstElementChild.cloneNode(true);
  const repsInput = setRow.querySelector(".set-row__reps");
  const weightInput = setRow.querySelector(".set-row__weight");
  const previous = setFields.lastElementChild;

  if (set) {
    repsInput.value = set.reps;
    weightInput.value = set.weight ?? "";
  } else if (previous) {
    repsInput.value = previous.querySelector(".set-row__reps").value;
    weightInput.value = previous.querySelector(".set-row__weight").value;
  }

  setRow.querySelector(".set-row__remove").addEventListener("click", () => {
    setRow.remove();
    updateSetRows(exerciseRow);
  });

  setFields.append(setRow);
  updateSetRows(exerciseRow);
  return setRow;
}

// Renumera las series y habilita o no los botones (mínimo 1 serie, máximo MAX_SETS)
function updateSetRows(exerciseRow) {
  const setRows = [...exerciseRow.querySelectorAll(".set-row")];

  setRows.forEach((setRow, index) => {
    setRow.querySelector(".set-row__label").textContent = `Serie ${index + 1}`;
    setRow.querySelector(".set-row__reps").setAttribute("aria-label", `Repeticiones de la serie ${index + 1}`);
    setRow.querySelector(".set-row__weight").setAttribute("aria-label", `Peso en kg de la serie ${index + 1}`);
    setRow.querySelector(".set-row__remove").disabled = setRows.length === 1;
  });

  exerciseRow.querySelector(".exercise-row__add-set").disabled = setRows.length >= MAX_SETS;
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
    rest: Number(row.querySelector(".exercise-row__rest").value),
    sets: [...row.querySelectorAll(".set-row")].map((setRow) => ({
      reps: Number(setRow.querySelector(".set-row__reps").value),
      weight: readWeight(setRow.querySelector(".set-row__weight")),
    })),
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

// subtitle: el ejercicio, o qué viene después si se usa desde el modo entrenar
function startRestTimer(subtitle, seconds) {
  prepareSound();

  timer = {
    totalMs: seconds * 1000,
    endsAt: Date.now() + seconds * 1000,
    paused: false,
    remainingMs: 0,
    done: false,
    intervalId: setInterval(updateTimer, 250),
  };

  timerExercise.textContent = subtitle;
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
  if (!session) releaseScreen();
});

// Al volver a la app, actualizar enseguida y volver a pedir que no se apague la pantalla
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  updateTimer();
  if ((timer && !timer.done) || session) keepScreenOn();
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

// Evita que se apague la pantalla durante el timer o el modo entrenar (si el navegador lo permite)
async function keepScreenOn() {
  if (wakeLock && !wakeLock.released) return;
  try {
    wakeLock = (await navigator.wakeLock?.request("screen")) ?? null;
  } catch {
    wakeLock = null;
  }
  if (!timer && !session) releaseScreen();
}

function releaseScreen() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

// --- Modo entrenar ---

// Entrenamiento en curso; null si no hay ninguno. set empieza en 1.
let session = null;

function startSession(workout) {
  session = { workout, exerciseIndex: 0, set: 1, finished: false };
  sessionTitle.textContent = workout.name;
  renderSession();
  sessionDialog.showModal();
  keepScreenOn();
}

function renderSession() {
  const { workout, exerciseIndex, set, finished } = session;
  const exercise = workout.exercises[exerciseIndex];

  sessionCurrent.hidden = finished;
  sessionFinished.hidden = !finished;
  sessionDoneBtn.textContent = finished ? "Terminar" : "Serie hecha ✓";

  if (finished) {
    sessionSummary.textContent = describeWorkout(workout);
  } else {
    sessionSet.textContent = `Serie ${set} de ${exercise.sets.length}`;
    sessionExercise.textContent = exercise.name;
    sessionReps.textContent = plural(exercise.sets[set - 1].reps, "repetición", "repeticiones");

    // Último peso usado en esta serie; si nunca se cargó, el de la serie anterior
    const weight = exercise.sets[set - 1].weight ?? exercise.sets[set - 2]?.weight;
    sessionWeight.value = weight ?? "";
  }

  // Lista de ejercicios con cuántas series van hechas de cada uno
  const steps = workout.exercises.map((item, index) => {
    const totalSets = item.sets.length;
    let doneSets = 0;
    if (finished || index < exerciseIndex) doneSets = totalSets;
    else if (index === exerciseIndex) doneSets = set - 1;

    const step = document.createElement("li");
    step.className = "session-step";
    step.classList.toggle("session-step--current", !finished && index === exerciseIndex);
    step.classList.toggle("session-step--done", doneSets === totalSets);

    const name = document.createElement("span");
    name.className = "session-step__name";
    name.textContent = item.name;

    const count = document.createElement("span");
    count.className = "session-step__count";
    count.textContent = `${doneSets === totalSets ? "✓ " : ""}${doneSets}/${totalSets}`;

    step.append(name, count);
    return step;
  });
  sessionPlan.replaceChildren(...steps);
}

sessionDoneBtn.addEventListener("click", () => {
  if (session.finished) {
    sessionDialog.close();
    return;
  }

  // Peso inválido (ej: negativo): mostrar el error del navegador y no avanzar
  if (!sessionWeight.reportValidity()) return;

  const { workout } = session;
  const exercise = workout.exercises[session.exerciseIndex];

  // Guardar el peso usado: la próxima vez esta serie arranca con ese valor
  exercise.sets[session.set - 1].weight = readWeight(sessionWeight);
  saveWorkouts();

  const isLastSet = session.set === exercise.sets.length;
  const isLastExercise = session.exerciseIndex === workout.exercises.length - 1;

  // Última serie del último ejercicio: no hay descanso, se termina
  if (isLastSet && isLastExercise) {
    session.finished = true;
    renderSession();
    return;
  }

  if (isLastSet) {
    session.exerciseIndex += 1;
    session.set = 1;
  } else {
    session.set += 1;
  }
  renderSession();

  // Descanso del ejercicio recién hecho, avisando qué viene después
  const next = workout.exercises[session.exerciseIndex];
  startRestTimer(
    `Siguiente: ${next.name} · serie ${session.set} de ${next.sets.length}`,
    exercise.rest ?? DEFAULT_REST
  );
});

function exitSession() {
  const started = session.exerciseIndex > 0 || session.set > 1;
  if (started && !session.finished && !confirm("¿Salir del entrenamiento? Se pierde el progreso.")) return;
  sessionDialog.close();
}

sessionExitBtn.addEventListener("click", exitSession);

// "Atrás" en el celular o Escape: pasar por la misma confirmación que "Salir"
sessionDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  exitSession();
});

sessionDialog.addEventListener("close", () => {
  session = null;
  if (!timer) releaseScreen();
  renderWorkouts(); // las tarjetas muestran los pesos actualizados
});

renderWorkouts();
