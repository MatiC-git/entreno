// Claves con las que se guardan los entrenamientos y el historial en el navegador
const STORAGE_KEY = "entreno.workouts";
const HISTORY_KEY = "entreno.history";

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
const duplicateWorkoutBtn = document.getElementById("duplicate-workout-btn");
const editorTitle = document.getElementById("editor-title");
const editorBody = editor.querySelector(".editor__body");
const exerciseRowTemplate = document.getElementById("exercise-row-template");
const setRowTemplate = document.getElementById("set-row-template");
const sessionDialog = document.getElementById("workout-session");
const sessionTitle = document.getElementById("session-title");
const sessionCurrent = document.getElementById("session-current");
const sessionSet = document.getElementById("session-set");
const sessionExercise = document.getElementById("session-exercise");
const sessionImage = document.getElementById("session-image");
const sessionImageImg = document.getElementById("session-image-img");
const sessionImageCredit = document.getElementById("session-image-credit");
const exerciseCatalogList = document.getElementById("exercise-catalog");
const picker = document.getElementById("exercise-picker");
const pickerCancelBtn = document.getElementById("picker-cancel-btn");
const pickerSearch = document.getElementById("picker-search");
const pickerBody = document.getElementById("picker-body");
const pickerEmpty = document.getElementById("picker-empty");
const pickerList = document.getElementById("picker-list");
const sessionReps = document.getElementById("session-reps");
const sessionWeight = document.getElementById("session-weight");
const sessionFinished = document.getElementById("session-finished");
const sessionSummary = document.getElementById("session-summary");
const sessionPlan = document.getElementById("session-plan");
const sessionExitBtn = document.getElementById("session-exit-btn");
const sessionDoneBtn = document.getElementById("session-done-btn");
const exitDialog = document.getElementById("exit-dialog");
const exitText = document.getElementById("exit-text");
const views = [...document.querySelectorAll(".view")];
const viewButtons = [...document.querySelectorAll("[data-open-view]")];
const directorySearch = document.getElementById("directory-search");
const directoryEmpty = document.getElementById("directory-empty");
const directoryList = document.getElementById("directory-list");
const actionMenu = document.getElementById("action-menu");
const actionMenuTitle = document.getElementById("action-menu-title");
const actionMenuItems = document.getElementById("action-menu-items");
const preview = document.getElementById("workout-preview");
const previewBackBtn = document.getElementById("preview-back-btn");
const previewMenuBtn = document.getElementById("preview-menu-btn");
const previewTitle = document.getElementById("preview-title");
const previewSummary = document.getElementById("preview-summary");
const previewList = document.getElementById("preview-list");
const previewStartBtn = document.getElementById("preview-start-btn");
const previewEditBtn = document.getElementById("preview-edit-btn");
const renameDialog = document.getElementById("rename-dialog");
const renameInput = document.getElementById("rename-input");
const historyEmpty = document.getElementById("history-empty");
const historyList = document.getElementById("history-list");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importInput = document.getElementById("import-input");
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

// Sesiones registradas, la más nueva primero ("history" no se usa: es un nombre del navegador)
let historyEntries = loadHistory();

// id del entrenamiento que se está editando; null si se está creando uno nuevo
let editingId = null;

// --- Guardado (localStorage) ---

function loadWorkouts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const list = saved ? JSON.parse(saved) : [];
    return list.map(migrateWorkout);
  } catch {
    return [];
  }
}

// Pasa al formato actual un entrenamiento guardado (o importado) con un formato viejo
function migrateWorkout(workout) {
  return { ...workout, exercises: workout.exercises.map(migrateExercise) };
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

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries));
  } catch {
    // Igual que con los entrenamientos: sin guardado, dura hasta recargar
  }
}

// --- Lista de entrenamientos ---

function plural(count, singular, pluralWord) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

// Cuántos ejercicios se ven en cada tarjeta; el resto, en la vista previa
const CARD_EXERCISES = 3;

function renderWorkouts() {
  workoutList.replaceChildren();
  emptyState.hidden = workouts.length > 0;

  for (const workout of workouts) {
    const item = document.createElement("li");

    // Toda la tarjeta es un botón que abre la vista previa.
    // Adentro de un botón no puede ir una lista (<ul>), por eso todo son <span>.
    const card = document.createElement("button");
    card.type = "button";
    card.className = "workout-card card";
    card.addEventListener("click", () => openPreview(workout));

    const title = document.createElement("span");
    title.className = "workout-card__title";
    title.textContent = workout.name;

    const exerciseList = document.createElement("span");
    exerciseList.className = "workout-card__exercises";

    for (const exercise of workout.exercises.slice(0, CARD_EXERCISES)) {
      const line = document.createElement("span");
      line.className = "exercise-line";

      const name = document.createElement("span");
      name.className = "exercise-line__name";
      name.textContent = exercise.name;

      const detail = document.createElement("span");
      detail.className = "exercise-line__detail";
      detail.textContent = describeSetsShort(exercise.sets);

      line.append(name, detail);
      exerciseList.append(line);
    }

    card.append(title, exerciseList);

    const hidden = workout.exercises.length - CARD_EXERCISES;
    if (hidden > 0) {
      const more = document.createElement("span");
      more.className = "workout-card__more";
      more.textContent = `Ver todos (${plural(hidden, "más", "más")})`;
      card.append(more);
    }

    item.append(card);
    workoutList.append(item);
  }

  // Si la vista previa está abierta (ej: se editó desde ahí), que muestre los datos nuevos
  if (preview.open) renderPreview();
}

function hasSameReps(sets) {
  return sets.every((set) => set.reps === sets[0].reps);
}

// Para la tarjeta: "3×10" si todas las series tienen las mismas reps; si no, "3 series"
function describeSetsShort(sets) {
  return hasSameReps(sets) ? `${sets.length}×${sets[0].reps}` : plural(sets.length, "serie", "series");
}

// Para la vista previa: "3 series × 10 reps", o "3 series · 12/10/8 reps" si varían
function describeSetsLong(sets) {
  const count = plural(sets.length, "serie", "series");
  if (hasSameReps(sets)) return `${count} × ${plural(sets[0].reps, "rep", "reps")}`;
  return `${count} · ${sets.map((set) => set.reps).join("/")} reps`;
}

// 22.5 → "22,5"
function formatWeight(weight) {
  return weight.toLocaleString("es-AR");
}

// Campo de peso vacío → null (ejercicio sin peso, ej: dominadas)
function readWeight(input) {
  return input.value === "" ? null : Number(input.value);
}

function countSets(workout) {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

function describeWorkout(workout) {
  return `${plural(workout.exercises.length, "ejercicio", "ejercicios")} · ${plural(countSets(workout), "serie", "series")}`;
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
    updateExerciseButtons();
  });

  row.querySelector(".exercise-row__pick").addEventListener("click", () => {
    openPicker(row.querySelector(".exercise-row__name"));
  });

  row.querySelector(".exercise-row__up").addEventListener("click", (event) => {
    row.previousElementSibling?.before(row);
    keepFocus(event.currentTarget, row.querySelector(".exercise-row__down"));
  });

  row.querySelector(".exercise-row__down").addEventListener("click", (event) => {
    row.nextElementSibling?.after(row);
    keepFocus(event.currentTarget, row.querySelector(".exercise-row__up"));
  });

  row.querySelector(".exercise-row__add-set").addEventListener("click", () => {
    const setRow = addSetRow(row);
    setRow.querySelector(".set-row__reps").focus();
  });

  exerciseFields.append(row);
  updateExerciseButtons();
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

// Siempre tiene que quedar al menos un ejercicio.
// También deshabilita ↑ en el primero y ↓ en el último, así que se llama después de cada cambio de orden.
function updateExerciseButtons() {
  const rows = [...exerciseFields.children];
  rows.forEach((row, index) => {
    row.querySelector(".exercise-row__remove").disabled = rows.length === 1;
    row.querySelector(".exercise-row__up").disabled = index === 0;
    row.querySelector(".exercise-row__down").disabled = index === rows.length - 1;
  });
}

// Mover la fila le saca el foco al botón; se lo devolvemos (o al opuesto si quedó deshabilitado)
// para poder seguir moviendo el mismo ejercicio sin volver a buscarlo
function keepFocus(button, fallback) {
  updateExerciseButtons();
  (button.disabled ? fallback : button).focus();
  button.closest(".exercise-row").scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// Sin argumento crea uno nuevo; con un entrenamiento, lo abre para editar.
// Con asCopy, carga sus datos pero al guardar se crea uno nuevo (el original no cambia).
function openEditor(workout = null, { asCopy = false } = {}) {
  const isEditing = workout && !asCopy;
  editingId = isEditing ? workout.id : null;

  form.reset();
  exerciseFields.replaceChildren();

  if (workout) {
    editorTitle.textContent = asCopy ? "Copia de entrenamiento" : "Editar entrenamiento";
    workoutNameInput.value = asCopy ? copyName(workout.name) : workout.name;
    workout.exercises.forEach((exercise) => addExerciseRow(exercise));
  } else {
    editorTitle.textContent = "Nuevo entrenamiento";
    addExerciseRow();
  }

  deleteWorkoutBtn.hidden = !isEditing;
  duplicateWorkoutBtn.hidden = !isEditing;
  if (!editor.open) editor.showModal();

  // El <dialog> recuerda dónde quedó el scroll la vez anterior: siempre arrancar arriba.
  // Va después de showModal porque con la ventana cerrada no se puede mover el scroll.
  editorBody.scrollTop = 0;
}

// "Piernas" → "Piernas (copia)", recortando el nombre para no pasar el máximo del campo
function copyName(name) {
  const suffix = " (copia)";
  return name.slice(0, workoutNameInput.maxLength - suffix.length).trimEnd() + suffix;
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

function duplicateWorkout(workout) {
  openEditor(workout, { asCopy: true });
  workoutNameInput.focus();
  workoutNameInput.select();
}

// Devuelve false si el usuario se arrepiente en la confirmación
function deleteWorkout(workout) {
  if (!confirm(`¿Borrar "${workout.name}"? No se puede deshacer.`)) return false;

  workouts = workouts.filter((item) => item.id !== workout.id);
  saveWorkouts();
  renderWorkouts();
  return true;
}

// Usa lo guardado, no lo que esté escrito en el formulario: los cambios sin guardar no pasan a la copia
duplicateWorkoutBtn.addEventListener("click", () => {
  const workout = workouts.find((item) => item.id === editingId);
  if (workout) duplicateWorkout(workout);
});

deleteWorkoutBtn.addEventListener("click", () => {
  const workout = workouts.find((item) => item.id === editingId);
  if (workout && deleteWorkout(workout)) editor.close();
});

// --- Vista previa de un entrenamiento ---

// id del entrenamiento que muestra la vista previa. Se guarda el id (y no el entrenamiento)
// porque al editarlo se reemplaza por otro objeto en la lista.
let previewId = null;

function previewWorkout() {
  return workouts.find((workout) => workout.id === previewId);
}

function openPreview(workout) {
  previewId = workout.id;
  renderPreview();
  preview.showModal();
  preview.querySelector(".preview__body").scrollTop = 0;
}

// Si el entrenamiento ya no existe (se borró), cierra la vista previa
function renderPreview() {
  const workout = previewWorkout();
  if (!workout) {
    preview.close();
    return;
  }

  previewTitle.textContent = workout.name;
  previewSummary.textContent = describeWorkout(workout);
  previewList.replaceChildren(...workout.exercises.map(renderPreviewItem));
}

// Una fila por ejercicio: imagen, nombre y "3 series × 10 reps" (los pesos no se muestran acá)
function renderPreviewItem(exercise) {
  const item = document.createElement("li");
  item.className = "preview-item";

  const text = document.createElement("span");
  text.className = "preview-item__text";

  const name = document.createElement("span");
  name.className = "preview-item__name";
  name.textContent = exercise.name;

  const detail = document.createElement("span");
  detail.className = "preview-item__detail";
  detail.textContent = describeSetsLong(exercise.sets);

  text.append(name, detail);
  item.append(createExerciseThumb(exercise.name), text);
  return item;
}

// Imagen del catálogo; si el ejercicio no está (o la imagen no carga), un recuadro con un ícono
function createExerciseThumb(name) {
  const placeholder = document.createElement("span");
  placeholder.className = "exercise-thumb exercise-thumb--empty";
  placeholder.innerHTML = '<svg class="icon"><use href="#icon-workouts"></use></svg>';

  const entry = exerciseCatalog.get(normalizeName(name));
  if (!entry) return placeholder;

  const image = document.createElement("img");
  image.className = "exercise-thumb";
  image.src = entry.image;
  image.alt = "";
  image.width = 56;
  image.height = 56;
  image.addEventListener("error", () => image.replaceWith(placeholder));
  return image;
}

previewBackBtn.addEventListener("click", () => preview.close());

// Se cierra la vista previa antes de empezar: al terminar se vuelve a la lista
previewStartBtn.addEventListener("click", () => {
  const workout = previewWorkout();
  preview.close();
  startSession(workout);
});

// El editor se abre encima; al guardar, renderWorkouts actualiza la vista previa
previewEditBtn.addEventListener("click", () => openEditor(previewWorkout()));

previewMenuBtn.addEventListener("click", () => {
  const workout = previewWorkout();
  openActionMenu(workout.name, [
    { label: "Renombrar", action: () => openRename(workout) },
    {
      label: "Duplicar",
      action: () => {
        preview.close();
        duplicateWorkout(workout);
      },
    },
    { label: "Borrar", danger: true, action: () => deleteWorkout(workout) },
  ]);
});

preview.addEventListener("close", () => {
  previewId = null;
});

// --- Renombrar ---

function openRename(workout) {
  renameInput.value = workout.name;
  renameDialog.returnValue = "";
  renameDialog.showModal();
  renameInput.select();
}

// "save" = Guardar o Enter; vacío = Cancelar, Escape o "atrás"
renameDialog.addEventListener("close", () => {
  if (renameDialog.returnValue !== "save") return;

  const name = renameInput.value.trim();
  workouts = workouts.map((workout) => (workout.id === previewId ? { ...workout, name } : workout));
  saveWorkouts();
  renderWorkouts();
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
// doneSets anota cada serie hecha para guardarla después en el historial.
let session = null;

function startSession(workout) {
  session = {
    workout,
    exerciseIndex: 0,
    set: 1,
    finished: false,
    startedAt: new Date().toISOString(),
    doneSets: [],
  };
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
    showExerciseImage(exercise.name);
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
  const currentSet = exercise.sets[session.set - 1];
  currentSet.weight = readWeight(sessionWeight);
  saveWorkouts();

  session.doneSets.push({
    exerciseIndex: session.exerciseIndex,
    reps: currentSet.reps,
    weight: currentSet.weight,
  });

  const isLastSet = session.set === exercise.sets.length;
  const isLastExercise = session.exerciseIndex === workout.exercises.length - 1;

  // Última serie del último ejercicio: no hay descanso, se termina y queda en el historial
  if (isLastSet && isLastExercise) {
    session.finished = true;
    saveSessionToHistory(true);
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

// Copia lo hecho al historial. Es una copia: editar o borrar el entrenamiento después no la cambia.
// completed = false cuando se sale a la mitad y se elige "Guardar y salir".
function saveSessionToHistory(completed) {
  const { workout, doneSets, startedAt } = session;

  const exercises = workout.exercises
    .map((exercise, index) => ({
      name: exercise.name,
      sets: doneSets
        .filter((done) => done.exerciseIndex === index)
        .map(({ reps, weight }) => ({ reps, weight })),
    }))
    .filter((exercise) => exercise.sets.length > 0);

  historyEntries.unshift({
    id: String(Date.now()),
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt,
    finishedAt: new Date().toISOString(),
    completed,
    plannedSets: countSets(workout),
    exercises,
  });
  saveHistory();
}

// Sin series hechas (o ya terminado) no hay nada que guardar: sale directo.
// Si no, pregunta: guardar y salir, salir sin guardar o seguir entrenando.
function exitSession() {
  if (session.finished || session.doneSets.length === 0) {
    sessionDialog.close();
    return;
  }

  const planned = plural(countSets(session.workout), "serie", "series");
  exitText.textContent = `Hiciste ${session.doneSets.length} de ${planned}.`;
  exitDialog.returnValue = "";
  exitDialog.showModal();
}

// returnValue es el "value" del botón tocado; vacío si se cerró con Escape/atrás (= seguir)
exitDialog.addEventListener("close", () => {
  if (exitDialog.returnValue === "save") {
    saveSessionToHistory(false);
    sessionDialog.close();
  } else if (exitDialog.returnValue === "discard") {
    sessionDialog.close();
  }
});

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
  renderHistory(); // y el informe, la sesión recién guardada
});

// --- Historial ---

const historyDateFormat = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23", // "21:33" en vez de "09:33 p. m."
});

// 42 → "42 min", 75 → "1 h 15 min"
function formatDuration(startedAt, finishedAt) {
  const minutes = Math.max(1, Math.round((new Date(finishedAt) - new Date(startedAt)) / 60000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

// Una serie del historial: "10 × 40 kg", o "10 reps" si no tenía peso
function describeDoneSet(set) {
  return set.weight == null ? `${set.reps} reps` : `${set.reps} × ${formatWeight(set.weight)} kg`;
}

function renderHistory() {
  historyEmpty.hidden = historyEntries.length > 0;
  historyList.replaceChildren(...historyEntries.map(renderHistoryEntry));
}

// Cada sesión es un <details>: al tocar el resumen se despliega el detalle por ejercicio
function renderHistoryEntry(entry) {
  const doneSets = entry.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

  const item = document.createElement("li");
  item.className = "history-entry card";

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.className = "history-entry__summary";

  const title = document.createElement("span");
  title.className = "history-entry__title";
  title.textContent = entry.workoutName;

  const meta = document.createElement("span");
  meta.className = "history-entry__meta";
  meta.textContent = [
    historyDateFormat.format(new Date(entry.finishedAt)),
    formatDuration(entry.startedAt, entry.finishedAt),
    entry.completed ? plural(doneSets, "serie", "series") : `${doneSets}/${entry.plannedSets} series`,
  ].join(" · ");

  summary.append(title);
  if (!entry.completed) {
    const badge = document.createElement("span");
    badge.className = "history-entry__badge";
    badge.textContent = "Incompleto";
    summary.append(badge);
  }
  summary.append(meta);

  const exerciseList = document.createElement("ul");
  exerciseList.className = "history-entry__exercises";
  for (const exercise of entry.exercises) {
    const line = document.createElement("li");

    const name = document.createElement("span");
    name.className = "history-entry__exercise";
    name.textContent = exercise.name;

    const sets = document.createElement("span");
    sets.className = "history-entry__sets";
    sets.textContent = exercise.sets.map(describeDoneSet).join(" · ");

    line.append(name, sets);
    exerciseList.append(line);
  }

  details.append(summary, exerciseList);
  item.append(details);
  return item;
}

// --- Exportar e importar (backup) ---

// "2026-10-02" con la fecha local (toISOString usa UTC y de noche daría el día siguiente)
function localDateStamp(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Descarga un .json con los entrenamientos y el historial
function exportData() {
  const data = {
    app: "entreno",
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts,
    history: historyEntries,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `entreno-backup-${localDateStamp()}.json`;
  link.click();

  // Se libera después, para no cortar la descarga en algunos navegadores
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Lee el texto del archivo y chequea que sea un backup de entreno; si no, tira un error
function parseBackup(text) {
  const data = JSON.parse(text);
  const valid =
    data?.app === "entreno" &&
    Array.isArray(data.workouts) &&
    Array.isArray(data.history) &&
    data.workouts.every((workout) => typeof workout.name === "string" && Array.isArray(workout.exercises));

  if (!valid) throw new Error("No es un backup de entreno");
  return data;
}

async function importData(file) {
  let data;
  try {
    data = parseBackup(await file.text());
  } catch {
    alert("Ese archivo no es un backup válido de entreno.");
    return;
  }

  const summary =
    `${plural(data.workouts.length, "entrenamiento", "entrenamientos")} y ` +
    `${plural(data.history.length, "sesión", "sesiones")} de historial`;
  if (!confirm(`¿Reemplazar todo con este backup (${summary})? Lo que hay ahora en este navegador se pierde.`)) return;

  workouts = data.workouts.map(migrateWorkout);
  historyEntries = data.history;
  saveWorkouts();
  saveHistory();
  renderWorkouts();
  renderHistory();
}

exportBtn.addEventListener("click", exportData);
importBtn.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", () => {
  const file = importInput.files[0];
  importInput.value = ""; // así se puede volver a elegir el mismo archivo
  if (file) importData(file);
});

// --- Catálogo de ejercicios (imágenes de wger) ---

// Ejercicios de wger.de con nombre en español e imagen (lo genera tools/actualizar-catalogo.ps1).
// Clave: el nombre normalizado (o un alias); valor: { name, image, author, license }.
const exerciseCatalog = new Map();

// Los mismos ejercicios en orden alfabético, una vez cada uno (el Map repite los que tienen alias)
let exerciseEntries = [];

// "Press de Banca " → "press de banca": sin mayúsculas, tildes ni espacios de más
function normalizeName(name) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

async function loadExerciseCatalog() {
  try {
    const response = await fetch("data/exercises-es.json");
    const entries = await response.json();
    exerciseEntries = entries;

    for (const entry of entries) {
      for (const name of [entry.name, ...entry.aliases]) {
        exerciseCatalog.set(normalizeName(name), entry);
      }
    }
    exerciseCatalogList.replaceChildren(...entries.map((entry) => new Option(entry.name)));
  } catch {
    // Sin catálogo (ej: abriendo el archivo directo) la app funciona igual, sin imágenes ni sugerencias
  }
  renderDirectory();
}

// Muestra la imagen del ejercicio con su crédito, o nada si no está en el catálogo
function showExerciseImage(name) {
  const entry = exerciseCatalog.get(normalizeName(name));
  sessionImage.hidden = !entry;
  if (!entry) {
    sessionImageImg.removeAttribute("src");
    return;
  }

  sessionImageImg.src = entry.image;
  const link = document.createElement("a");
  link.href = "https://wger.de";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "wger.de";
  sessionImageCredit.replaceChildren(
    "Imagen: ",
    link,
    [entry.author, entry.license].filter(Boolean).map((text) => ` · ${text}`).join("")
  );
}

// Si la imagen no carga (ej: sin internet y nunca se vio antes), se oculta en vez de mostrarse rota
sessionImageImg.addEventListener("error", () => {
  sessionImage.hidden = true;
});

// --- Directorio de ejercicios (elegir uno del catálogo) ---

// Campo del nombre que completa el directorio abierto; null si está cerrado
let pickerTarget = null;

// Arranca buscando lo que ya esté escrito, así se puede cambiar por la versión del catálogo
function openPicker(nameInput) {
  pickerTarget = nameInput;
  pickerSearch.value = nameInput.value.trim();
  renderPicker();
  picker.showModal();
  pickerBody.scrollTop = 0;
  pickerSearch.focus();
  pickerSearch.select();
}

// "press banca" encuentra "Press de banca": cada palabra buscada tiene que aparecer en el nombre o un alias
function matchesSearch(entry, words) {
  const names = [entry.name, ...entry.aliases].map(normalizeName);
  return words.every((word) => names.some((name) => name.includes(word)));
}

// Lo usan el selector del editor y la sección Ejercicios. Con onPick, cada ejercicio es un botón para elegirlo.
function renderExerciseList({ search, list, empty, onPick }) {
  const words = normalizeName(search.value).split(" ").filter(Boolean);
  const results = exerciseEntries.filter((entry) => matchesSearch(entry, words));

  list.replaceChildren(...results.map((entry) => renderExerciseItem(entry, onPick)));
  empty.hidden = results.length > 0;
  if (exerciseEntries.length === 0) {
    empty.textContent = "No se pudo cargar el directorio.";
  } else {
    empty.textContent = `No hay ejercicios con "${search.value.trim()}".`;
  }
}

function renderPicker() {
  renderExerciseList({ search: pickerSearch, list: pickerList, empty: pickerEmpty, onPick: pickExercise });
  if (!pickerEmpty.hidden) pickerEmpty.textContent += " Podés cerrar y escribirlo a mano.";
}

// Por ahora la sección solo muestra el catálogo; el detalle de cada ejercicio llega en #38
function renderDirectory() {
  renderExerciseList({ search: directorySearch, list: directoryList, empty: directoryEmpty });
}

function renderExerciseItem(entry, onPick) {
  const item = document.createElement("li");

  const button = document.createElement(onPick ? "button" : "div");
  button.className = "picker-item";
  if (onPick) {
    button.type = "button";
    button.addEventListener("click", () => onPick(entry));
  }

  // loading="lazy": solo se descargan las imágenes que llegan a verse al bajar
  const image = document.createElement("img");
  image.className = "exercise-thumb";
  image.src = entry.image;
  image.alt = "";
  image.loading = "lazy";
  image.width = 56;
  image.height = 56;
  image.addEventListener("error", () => {
    image.style.visibility = "hidden";
  });

  const name = document.createElement("span");
  name.className = "picker-item__name";
  name.textContent = entry.name;

  button.append(image, name);
  item.append(button);
  return item;
}

function pickExercise(entry) {
  pickerTarget.value = entry.name;
  picker.close();
}

pickerSearch.addEventListener("input", () => {
  renderPicker();
  pickerBody.scrollTop = 0;
});

// Enter en el teclado del celular: elegir el primer resultado
pickerSearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  pickerList.querySelector(".picker-item")?.click();
});

pickerCancelBtn.addEventListener("click", () => picker.close());

picker.addEventListener("close", () => {
  pickerTarget = null;
});

directorySearch.addEventListener("input", renderDirectory);

// --- Menú ⋮ (hoja inferior con acciones) ---

// Acciones del menú abierto; el "value" de cada botón es su posición en esta lista
let menuItems = [];

// items: [{ label, action, danger }]
function openActionMenu(title, items) {
  menuItems = items;
  actionMenuTitle.textContent = title;
  actionMenuItems.replaceChildren(
    ...items.map((item, index) => {
      const button = document.createElement("button");
      button.className = item.danger ? "menu-item menu-item--danger" : "menu-item";
      button.value = String(index);
      button.textContent = item.label;
      return button;
    })
  );
  actionMenu.returnValue = "";
  actionMenu.showModal();
}

// La acción corre después de cerrar, así puede abrir otra pantalla (ej: el editor).
// returnValue vacío = Cancelar, Escape o "atrás".
actionMenu.addEventListener("close", () => {
  const value = actionMenu.returnValue;
  if (value !== "") menuItems[Number(value)]?.action();
  menuItems = [];
});

// --- Hojas inferiores: tocar el fondo oscuro las cierra ---

// Un toque en el fondo le llega al <dialog> mismo; uno en el contenido, a lo que está adentro.
// Se cierra sin "value", igual que con Cancelar: cada hoja lo trata como "no hacer nada".
for (const sheet of document.querySelectorAll(".sheet")) {
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) sheet.close();
  });
}

// --- Secciones (barra inferior) ---

const DEFAULT_VIEW = "entrenamientos";

// La sección queda en la dirección (#informe) para que al recargar se vuelva a la misma
function showView(name) {
  if (!views.some((view) => view.dataset.view === name)) name = DEFAULT_VIEW;

  for (const view of views) view.hidden = view.dataset.view !== name;
  for (const button of document.querySelectorAll(".nav-bar__item")) {
    const active = button.dataset.openView === name;
    button.classList.toggle("nav-bar__item--active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }

  // replaceState: cambiar de sección no suma pasos al botón "atrás"
  history.replaceState(null, "", `#${name}`);
  window.scrollTo(0, 0);
}

for (const button of viewButtons) {
  button.addEventListener("click", () => showView(button.dataset.openView));
}

renderWorkouts();
renderHistory();
showView(location.hash.slice(1));
loadExerciseCatalog();

// --- App instalable (PWA) ---

// El service worker solo funciona con https o localhost; abriendo el archivo directo falla y lo ignoramos
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
