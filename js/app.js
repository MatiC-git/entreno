// Claves con las que se guardan los entrenamientos y el historial en el navegador
const STORAGE_KEY = "entreno.workouts";
const HISTORY_KEY = "entreno.history";
const SESSION_KEY = "entreno.session"; // el entrenamiento en curso, para no perderlo si se cierra la app

// Descansos por defecto en segundos (también para entrenamientos guardados antes de tener estos campos):
// entre series de un mismo ejercicio, y entre un ejercicio y el siguiente
const DEFAULT_REST = 90;
const DEFAULT_REST_BETWEEN_EXERCISES = 120;

// Límites de cualquier descanso: de 0:05 a 10:00
const MIN_REST = 5;
const MAX_REST = 600;

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
const sessionBody = document.getElementById("session-body");
const sessionExercises = document.getElementById("session-exercises");
const sessionExerciseTemplate = document.getElementById("session-exercise-template");
const sessionSetTemplate = document.getElementById("session-set-template");
const exerciseCatalogList = document.getElementById("exercise-catalog");
const picker = document.getElementById("exercise-picker");
const pickerCancelBtn = document.getElementById("picker-cancel-btn");
const pickerSearch = document.getElementById("picker-search");
const pickerBody = document.getElementById("picker-body");
const pickerEmpty = document.getElementById("picker-empty");
const pickerList = document.getElementById("picker-list");
const sessionFinished = document.getElementById("session-finished");
const sessionSummary = document.getElementById("session-summary");
const sessionPlan = document.getElementById("session-plan");
const sessionPauseBtn = document.getElementById("session-pause-btn");
const sessionDoneBtn = document.getElementById("session-done-btn");
const pauseDialog = document.getElementById("pause-dialog");
const sessionFinishBtn = document.getElementById("session-finish-btn");
const sessionFinishedTitle = document.getElementById("session-finished-title");
const exitDialog = document.getElementById("exit-dialog");
const finishDialog = document.getElementById("finish-dialog");
const finishText = document.getElementById("finish-text");
const finishDone = document.getElementById("finish-done");
const finishDoneLabel = document.getElementById("finish-done-label");
const finishPending = document.getElementById("finish-pending");
const finishPendingLabel = document.getElementById("finish-pending-label");
const resumeBar = document.getElementById("resume-bar");
const resumeBarName = document.getElementById("resume-bar-name");
const resumeBarMeta = document.getElementById("resume-bar-meta");
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
const restDialog = document.getElementById("rest-dialog");
const restTitle = document.getElementById("rest-title");
const restText = document.getElementById("rest-text");
const restMinutesInput = document.getElementById("rest-minutes");
const restSecondsInput = document.getElementById("rest-seconds");
const reportEmpty = document.getElementById("report-empty");
const reportContent = document.getElementById("report-content");
const totalCount = document.getElementById("total-count");
const totalTime = document.getElementById("total-time");
const weekChart = document.getElementById("week-chart");
const thisWeekDays = document.getElementById("this-week-days");
const todayTime = document.getElementById("today-time");
const weeklyAverage = document.getElementById("weekly-average");
const recentHistory = document.getElementById("recent-history");
const historyEmpty = document.getElementById("history-empty");
const historyWeeks = document.getElementById("history-weeks");
const calendar = document.getElementById("calendar");
const calendarTitle = document.getElementById("calendar-title");
const calendarGrid = document.getElementById("calendar-grid");
const calendarPrevBtn = document.getElementById("calendar-prev");
const calendarNextBtn = document.getElementById("calendar-next");
const historyDetail = document.getElementById("history-detail");
const historyDetailBackBtn = document.getElementById("history-detail-back-btn");
const historyDetailMenuBtn = document.getElementById("history-detail-menu-btn");
const historyDetailTitle = document.getElementById("history-detail-title");
const historyDetailDate = document.getElementById("history-detail-date");
const historyDetailSummary = document.getElementById("history-detail-summary");
const historyDetailList = document.getElementById("history-detail-list");
const historyRepeatBtn = document.getElementById("history-repeat-btn");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importInput = document.getElementById("import-input");
const restTimer = document.getElementById("rest-timer");
const timerLabel = document.getElementById("timer-label");
const timerNextThumb = document.getElementById("timer-next-thumb");
const timerNextName = document.getElementById("timer-next-name");
const timerNextSet = document.getElementById("timer-next-set");
const timerTime = document.getElementById("timer-time");
const timerProgress = document.getElementById("timer-progress");
const timerDoneText = document.getElementById("timer-done-text");
const timerControls = document.getElementById("timer-controls");
const timerLessBtn = document.getElementById("timer-less-btn");
const timerMoreBtn = document.getElementById("timer-more-btn");
const timerSkipBtn = document.getElementById("timer-skip-btn");
const timerPauseBtn = document.getElementById("timer-pause-btn");

let workouts = loadWorkouts();

// Sesiones registradas, la más nueva primero ("history" no se usa: es un nombre del navegador)
let historyEntries = loadHistory();

// id del entrenamiento que se está editando; null si se está creando uno nuevo
let editingId = null;

// Descanso entre ejercicios del entrenamiento en el editor (se guarda recién con "Guardar")
let editorRestBetweenExercises = DEFAULT_REST_BETWEEN_EXERCISES;

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
  return {
    ...workout,
    restBetweenExercises: workout.restBetweenExercises ?? DEFAULT_REST_BETWEEN_EXERCISES,
    exercises: workout.exercises.map(migrateExercise),
  };
}

// Antes cada ejercicio guardaba la cantidad de series y unas reps para todas
// ({ sets: 3, reps: 10 }); ahora cada serie tiene las suyas ({ sets: [{ reps: 10 }, ...] })
function migrateExercise(exercise) {
  const rest = exercise.rest ?? DEFAULT_REST;
  if (Array.isArray(exercise.sets)) return { ...exercise, rest };

  const { reps, ...others } = exercise;
  return {
    ...others,
    rest,
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

// Pone el separador "—— ⏱ 2:00 ——" entre cada par de elementos de una lista.
// Con onEdit, cada separador es un botón para cambiar el descanso.
function withRestSeparators(items, seconds, onEdit) {
  return items.flatMap((item, index) => (index === 0 ? [item] : [createRestSeparator(seconds, onEdit), item]));
}

function createRestSeparator(seconds, onEdit) {
  const separator = document.createElement(onEdit ? "button" : "li");
  separator.className = "rest-separator";
  separator.innerHTML = '<svg class="icon"><use href="#icon-timer"></use></svg><span class="rest-separator__time"></span>';
  updateRestSeparatorTime(separator, seconds, Boolean(onEdit));
  if (!onEdit) return separator;

  separator.type = "button";
  separator.classList.add("rest-separator--editable");
  separator.addEventListener("click", onEdit);
  const item = document.createElement("li");
  item.append(separator);
  return item;
}

function updateRestSeparatorTime(separator, seconds, editable) {
  const time = formatTime(seconds);
  separator.querySelector(".rest-separator__time").textContent = time;
  separator.setAttribute(
    "aria-label",
    `Descanso entre ejercicios: ${time}${editable ? ". Tocar para cambiarlo" : ""}`
  );
}

function countSets(workout) {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

function describeWorkout(workout) {
  return `${plural(workout.exercises.length, "ejercicio", "ejercicios")} · ${plural(countSets(workout), "serie", "series")}`;
}

// --- Editor de entrenamiento ---

// Cada ejercicio es una tarjeta plegable. Si recibe un ejercicio, la completa con sus datos.
function addExerciseRow(exercise, { expanded = true } = {}) {
  const row = exerciseRowTemplate.content.firstElementChild.cloneNode(true);
  const nameInput = row.querySelector(".exercise-row__name");

  // El descanso entre series no tiene campo en la tarjeta: se cambia desde el menú ⋮
  row.dataset.rest = exercise?.rest ?? DEFAULT_REST;

  if (exercise) {
    nameInput.value = exercise.name;
    exercise.sets.forEach((set) => addSetRow(row, set));
  } else {
    for (let i = 0; i < DEFAULT_SETS; i++) addSetRow(row);
  }

  row.querySelector(".rest-separator").addEventListener("click", editRestBetweenExercises);
  updateRestSeparator(row);

  row.querySelector(".exercise-row__toggle").addEventListener("click", () => {
    setExpanded(row, row.querySelector(".exercise-row__body").hidden);
  });

  row.querySelector(".exercise-row__menu").addEventListener("click", () => openExerciseMenu(row));

  row.querySelector(".exercise-row__up").addEventListener("click", (event) => {
    exerciseFields.insertBefore(row, row.previousElementSibling);
    keepFocus(event.currentTarget, row.querySelector(".exercise-row__down"));
  });

  row.querySelector(".exercise-row__down").addEventListener("click", (event) => {
    exerciseFields.insertBefore(row, row.nextElementSibling?.nextElementSibling ?? null);
    keepFocus(event.currentTarget, row.querySelector(".exercise-row__up"));
  });
  row.querySelector(".exercise-row__pick").addEventListener("click", () => openPicker(nameInput));
  nameInput.addEventListener("input", () => updateExerciseHeader(row));

  row.querySelector(".exercise-row__add-set").addEventListener("click", () => {
    const setRow = addSetRow(row);
    setRow.querySelector(".set-row__weight").focus();
  });

  updateExerciseHeader(row);
  setExpanded(row, expanded);
  exerciseFields.append(row);
  updateMoveButtons();
  return row;
}

// ▲ no va en el primero ni ▼ en el último. Se llama después de agregar, mover o eliminar.
function updateMoveButtons() {
  const rows = [...exerciseFields.children];
  rows.forEach((row, index) => {
    row.querySelector(".exercise-row__up").disabled = index === 0;
    row.querySelector(".exercise-row__down").disabled = index === rows.length - 1;
  });
}

// Mover la tarjeta le saca el foco al botón; se lo devolvemos (o al opuesto si quedó deshabilitado)
// para poder seguir moviendo el mismo ejercicio sin volver a buscarlo
function keepFocus(button, fallback) {
  updateMoveButtons();
  (button.disabled ? fallback : button).focus();
  button.closest(".exercise-row").scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function setExpanded(row, expanded) {
  row.querySelector(".exercise-row__body").hidden = !expanded;
  row.querySelector(".exercise-row__toggle").setAttribute("aria-expanded", String(expanded));
}

// Cabecera de la tarjeta: nombre e imagen. La imagen solo se reemplaza si cambia
// el ejercicio del catálogo, así no parpadea con cada letra que se escribe.
function updateExerciseHeader(row) {
  const name = row.querySelector(".exercise-row__name").value.trim();
  const title = row.querySelector(".exercise-row__title");
  title.textContent = name || "Ejercicio nuevo";
  title.classList.toggle("exercise-row__title--empty", !name);

  const image = exerciseCatalog.get(normalizeName(name))?.image ?? "";
  if (row.dataset.image !== image) {
    row.dataset.image = image;
    row.querySelector(".exercise-row__thumb").replaceChildren(createExerciseThumb(name));
  }
}

// Menú ⋮ del ejercicio. Siempre tiene que quedar un ejercicio.
function openExerciseMenu(row) {
  const nameInput = row.querySelector(".exercise-row__name");
  const name = nameInput.value.trim() || "Ejercicio nuevo";
  const isOnly = exerciseFields.children.length === 1;

  openActionMenu(
    name,
    [
      { label: "Cambiar ejercicio", action: () => openPicker(nameInput) },
      {
        label: `Descanso entre series · ${formatTime(Number(row.dataset.rest))}`,
        action: () =>
          openRestDialog({
            title: "Descanso entre series",
            text: name,
            seconds: Number(row.dataset.rest),
            onSave: (seconds) => {
              row.dataset.rest = seconds;
              updateSetRows(row);
            },
          }),
      },
      !isOnly && { label: "Eliminar", danger: true, action: () => removeExercise(row) },
    ].filter(Boolean)
  );
}

// El separador de arriba de cada tarjeta muestra el descanso entre ejercicios del entrenamiento
function updateRestSeparator(row) {
  updateRestSeparatorTime(row.querySelector(".rest-separator"), editorRestBetweenExercises, true);
}

function editRestBetweenExercises() {
  openRestDialog({
    title: "Descanso entre ejercicios",
    text: "Se usa al pasar de un ejercicio al siguiente.",
    seconds: editorRestBetweenExercises,
    onSave: (seconds) => {
      editorRestBetweenExercises = seconds;
      [...exerciseFields.children].forEach(updateRestSeparator);
    },
  });
}

function removeExercise(row) {
  row.remove();
  updateMoveButtons();
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

// Renumera las series, actualiza "N series · descanso 1:30" en la cabecera y habilita o no los botones
// (mínimo 1 serie, máximo MAX_SETS)
function updateSetRows(exerciseRow) {
  const setRows = [...exerciseRow.querySelectorAll(".set-row")];

  setRows.forEach((setRow, index) => {
    setRow.querySelector(".set-row__label").textContent = index + 1;
    setRow.querySelector(".set-row__reps").setAttribute("aria-label", `Repeticiones de la serie ${index + 1}`);
    setRow.querySelector(".set-row__weight").setAttribute("aria-label", `Peso en kg de la serie ${index + 1}`);
    setRow.querySelector(".set-row__remove").disabled = setRows.length === 1;
  });

  exerciseRow.querySelector(".exercise-row__count").textContent =
    `${plural(setRows.length, "serie", "series")} · descanso ${formatTime(Number(exerciseRow.dataset.rest))}`;
  exerciseRow.querySelector(".exercise-row__add-set").disabled = setRows.length >= MAX_SETS;
}

// Sin argumento crea uno nuevo; con un entrenamiento, lo abre para editar.
// Con asCopy, carga sus datos pero al guardar se crea uno nuevo (el original no cambia).
function openEditor(workout = null, { asCopy = false } = {}) {
  const isEditing = workout && !asCopy;
  editingId = isEditing ? workout.id : null;

  form.reset();
  exerciseFields.replaceChildren();
  // Antes de agregar las tarjetas: sus separadores lo muestran
  editorRestBetweenExercises = workout?.restBetweenExercises ?? DEFAULT_REST_BETWEEN_EXERCISES;

  if (workout) {
    editorTitle.textContent = asCopy ? "Copia de entrenamiento" : "Editar entrenamiento";
    workoutNameInput.value = asCopy ? copyName(workout.name) : workout.name;
    // Solo la primera tarjeta abierta: así se ve el entrenamiento entero de un vistazo
    workout.exercises.forEach((exercise, index) => addExerciseRow(exercise, { expanded: index === 0 }));
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

// Un campo con error dentro de una tarjeta plegada no se puede mostrar: se abre la tarjeta.
// "invalid" no sube por el formulario, por eso se escucha en la fase de captura (true).
form.addEventListener(
  "invalid",
  (event) => {
    const row = event.target.closest(".exercise-row");
    if (row) setExpanded(row, true);
  },
  true
);

// El navegador valida los campos "required" antes de llegar acá
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const exercises = [...exerciseFields.children].map((row) => ({
    name: row.querySelector(".exercise-row__name").value.trim(),
    rest: Number(row.dataset.rest),
    sets: [...row.querySelectorAll(".set-row")].map((setRow) => ({
      reps: Number(setRow.querySelector(".set-row__reps").value),
      weight: readWeight(setRow.querySelector(".set-row__weight")),
    })),
  }));

  const name = workoutNameInput.value.trim();
  const restBetweenExercises = editorRestBetweenExercises;

  if (editingId) {
    // Reemplaza los datos y conserva el id y la fecha de creación
    workouts = workouts.map((workout) =>
      workout.id === editingId ? { ...workout, name, restBetweenExercises, exercises } : workout
    );
  } else {
    workouts.push({
      id: String(Date.now()),
      name,
      restBetweenExercises,
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
  previewList.replaceChildren(
    ...withRestSeparators(workout.exercises.map(renderPreviewItem), workout.restBetweenExercises)
  );
}

// Una fila por ejercicio: imagen, nombre y "3 series × 10 reps · descanso 1:30" (sin pesos)
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
  detail.textContent = `${describeSetsLong(exercise.sets)} · descanso ${formatTime(exercise.rest)}`;

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
  if (!confirmReplaceSession()) return;
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
      label: `Descanso entre ejercicios · ${formatTime(workout.restBetweenExercises)}`,
      action: () =>
        openRestDialog({
          title: "Descanso entre ejercicios",
          text: "Se usa al pasar de un ejercicio al siguiente.",
          seconds: workout.restBetweenExercises,
          onSave: (restBetweenExercises) => updateWorkout(workout.id, { restBetweenExercises }),
        }),
    },
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

  updateWorkout(previewId, { name: renameInput.value.trim() });
});

// Cambia algunos datos de un entrenamiento guardado (ej: el nombre) sin pasar por el editor
function updateWorkout(id, changes) {
  workouts = workouts.map((workout) => (workout.id === id ? { ...workout, ...changes } : workout));
  saveWorkouts();
  renderWorkouts();
}

// --- Cambiar un descanso (hoja con minutos y segundos) ---

// Qué hacer al guardar la hoja abierta; null si está cerrada
let onRestSave = null;

function openRestDialog({ title, text, seconds, onSave }) {
  onRestSave = onSave;
  restTitle.textContent = title;
  restText.textContent = text;
  restMinutesInput.value = Math.floor(seconds / 60);
  restSecondsInput.value = String(seconds % 60).padStart(2, "0");
  checkRestLimits();
  restDialog.returnValue = "";
  restDialog.showModal();
}

function readRestSeconds() {
  return Number(restMinutesInput.value) * 60 + Number(restSecondsInput.value);
}

// Cada campo tiene sus propios límites; acá se chequea el total (de 0:05 a 10:00)
function checkRestLimits() {
  const seconds = readRestSeconds();
  restSecondsInput.setCustomValidity(
    seconds < MIN_REST || seconds > MAX_REST
      ? `El descanso tiene que ser de ${formatTime(MIN_REST)} a ${formatTime(MAX_REST)}.`
      : ""
  );
}

restMinutesInput.addEventListener("input", checkRestLimits);
restSecondsInput.addEventListener("input", checkRestLimits);

// "save" = Guardar o Enter; vacío = Cancelar, Escape, "atrás" o tocar el fondo
restDialog.addEventListener("close", () => {
  if (restDialog.returnValue === "save") onRestSave(readRestSeconds());
  onRestSave = null;
});

// --- Timer de descanso ---

const TIMER_STEP_MS = 5000;

// Al terminar, cuánto queda abierta la hoja: lo justo para los tres pitidos y la vibración
const TIMER_CLOSE_DELAY_MS = 1500;

// Timer en curso; null si no hay ninguno. Se guarda la hora de fin (y no
// "segundos restantes") para que no se atrase si el celular congela la página.
// En pausa se guarda lo que faltaba (remainingMs).
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

// next: qué viene después ({ name, set: "Serie 2 de 3" }).
// label: "Descanso", o "Descanso entre ejercicios" al pasar al siguiente.
function startRestTimer(next, seconds, label = "Descanso") {
  prepareSound();

  timer = {
    totalMs: seconds * 1000,
    endsAt: Date.now() + seconds * 1000,
    paused: false,
    remainingMs: 0,
    done: false,
    intervalId: setInterval(updateTimer, 250),
    closeTimeoutId: null,
  };

  timerLabel.textContent = label;
  timerNextThumb.replaceChildren(createExerciseThumb(next.name));
  timerNextName.textContent = next.name;
  timerNextSet.textContent = next.set;
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

// Suena, vibra y la hoja se cierra sola: se sigue con la próxima serie sin tocar nada
function finishTimer() {
  timer.done = true;
  clearInterval(timer.intervalId);
  showTimerDone(true);
  navigator.vibrate?.([300, 150, 300, 150, 500]);
  playBeeps();
  timer.closeTimeoutId = setTimeout(() => restTimer.close(), TIMER_CLOSE_DELAY_MS);
}

function showTimerDone(done) {
  restTimer.classList.toggle("timer--done", done);
  timerDoneText.hidden = !done;
  timerControls.hidden = done;
}

// Suma o resta 5 segundos (también en pausa). Restar más de lo que queda lo termina (y suena).
function changeTimer(ms) {
  const left = timeLeftMs();
  const change = Math.max(ms, -left);
  if (timer.paused) {
    timer.remainingMs += change;
  } else {
    timer.endsAt += change;
  }
  timer.totalMs = Math.max(timer.totalMs + change, left + change, 1);
  updateTimer();
}

timerLessBtn.addEventListener("click", () => changeTimer(-TIMER_STEP_MS));
timerMoreBtn.addEventListener("click", () => changeTimer(TIMER_STEP_MS));

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

// Se cierra solo, con Omitir, con "atrás"/Escape o tocando el fondo: en todos los casos se frena el timer
restTimer.addEventListener("close", () => {
  clearInterval(timer?.intervalId);
  clearTimeout(timer?.closeTimeoutId);
  timer = null;
  if (!sessionActive()) releaseScreen();
});

// Al volver a la app, actualizar enseguida y volver a pedir que no se apague la pantalla
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  updateTimer();
  if ((timer && !timer.done) || sessionActive()) keepScreenOn();
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
  if (!timer && !sessionActive()) releaseScreen();
}

function releaseScreen() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

// --- Modo entrenar ---

// Entrenamiento en curso; null si no hay ninguno.
// sets: todas las series en orden, cada una con su estado y sus elementos
// ({ exerciseIndex, setIndex, done, result, row, check, weight, reps }); la serie actual es la primera sin hacer.
// result: lo que se hizo de verdad ({ reps, weight }), lo que va al historial.
// cards: la tarjeta de cada ejercicio.
// away: en pausa con "Ausente por un tiempo" (la pantalla está cerrada y se ve la barra "Continuar").
// El tiempo entrenado no cuenta las pausas: elapsedMs es lo acumulado hasta resumedAt (null si está en pausa).
let session = null;

function sessionActive() {
  return Boolean(session && !session.away);
}

// saved: lo guardado en el navegador (ver saveSessionState), para retomar donde quedó
function startSession(workout, saved = null) {
  session = {
    workout,
    finished: false,
    away: Boolean(saved),
    startedAt: saved?.startedAt ?? new Date().toISOString(),
    elapsedMs: saved?.elapsedMs ?? 0,
    resumedAt: saved ? null : Date.now(),
    sets: [],
    cards: [],
  };
  sessionTitle.textContent = workout.name;

  const cards = workout.exercises.map(renderSessionExercise);
  sessionPlan.replaceChildren(
    ...withRestSeparators(cards, workout.restBetweenExercises, editSessionRestBetweenExercises)
  );
  sessionExercises.hidden = false;
  sessionFinished.hidden = true;
  sessionFinishBtn.hidden = false;

  saved?.sets.forEach((savedSet, index) => restoreSet(session.sets[index], savedSet));

  // Solo el ejercicio que toca abierto; los demás se abren a medida que se llega a ellos
  setExpanded(cards[currentSet()?.exerciseIndex ?? 0], true);
  updateSession();

  if (saved) {
    renderResumeBar();
    return;
  }
  if (!sessionDialog.open) sessionDialog.showModal();
  sessionBody.scrollTop = 0;
  keepScreenOn();
}

// Tarjeta plegable como la del editor, con una fila por serie
function renderSessionExercise(exercise, exerciseIndex) {
  const card = sessionExerciseTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector(".exercise-row__thumb").replaceChildren(createExerciseThumb(exercise.name));
  card.querySelector(".exercise-row__title").textContent = exercise.name;

  const toggle = card.querySelector(".exercise-row__toggle");
  toggle.addEventListener("click", () => setExpanded(card, toggle.getAttribute("aria-expanded") !== "true"));
  card.querySelector(".exercise-row__menu").addEventListener("click", () => openSessionExerciseMenu(exercise));

  const setFields = card.querySelector(".set-fields");
  exercise.sets.forEach((set, setIndex) => {
    const row = sessionSetTemplate.content.firstElementChild.cloneNode(true);
    const entry = {
      exerciseIndex,
      setIndex,
      done: false,
      result: null,
      row,
      check: row.querySelector(".session-set__check"),
      weight: row.querySelector(".session-set__weight"),
      reps: row.querySelector(".session-set__reps"),
    };

    row.querySelector(".set-row__label").textContent = setIndex + 1;
    entry.check.setAttribute("aria-label", `Serie ${setIndex + 1} hecha`);
    entry.weight.setAttribute("aria-label", `Peso en kg de la serie ${setIndex + 1}`);
    entry.reps.setAttribute("aria-label", `Repeticiones de la serie ${setIndex + 1}`);

    // Último peso usado en esta serie; si nunca se cargó, el de la serie anterior
    entry.weight.value = set.weight ?? exercise.sets[setIndex - 1]?.weight ?? "";
    entry.reps.value = set.reps;

    entry.check.addEventListener("click", () => toggleSet(entry));
    // Corregir una serie ya marcada también cuenta. Lo escrito se guarda aunque no esté marcada.
    for (const input of [entry.weight, entry.reps]) {
      input.addEventListener("change", () => {
        if (entry.done) saveSetResult(entry);
        saveSessionState();
      });
    }

    session.sets.push(entry);
    setFields.append(row);
  });

  session.cards.push(card);
  return card;
}

function currentSet() {
  return session.sets.find((entry) => !entry.done) ?? null;
}

function countDoneSets() {
  return session.sets.filter((entry) => entry.done).length;
}

function sessionElapsedMs() {
  return session.elapsedMs + (session.resumedAt ? Date.now() - session.resumedAt : 0);
}

// Marca la serie actual, cuenta lo hecho por ejercicio, cambia el botón de abajo y guarda todo
function updateSession() {
  const current = currentSet();

  for (const entry of session.sets) {
    entry.row.classList.toggle("session-set--done", entry.done);
    entry.row.classList.toggle("session-set--current", entry === current);
    entry.check.setAttribute("aria-pressed", String(entry.done));
  }

  session.cards.forEach((card, exerciseIndex) => {
    const sets = session.sets.filter((entry) => entry.exerciseIndex === exerciseIndex);
    const done = sets.filter((entry) => entry.done).length;
    const complete = done === sets.length;
    const rest = formatTime(session.workout.exercises[exerciseIndex].rest);
    card.classList.toggle("exercise-row--done", complete);
    card.querySelector(".exercise-row__count").textContent =
      `${complete ? "✓ " : ""}${done}/${sets.length} hechas · descanso ${rest}`;
  });

  sessionDoneBtn.textContent = current ? "Registrar la siguiente serie" : "Terminar";
  saveSessionState();
}

// Anota lo hecho en la serie (va al historial). El peso además queda guardado en el entrenamiento:
// la próxima vez la serie arranca con ese valor. Las reps no: un día con menos no cambia el plan.
function saveSetResult(entry) {
  if (!entry.weight.checkValidity() || !entry.reps.checkValidity()) return;
  const weight = readWeight(entry.weight);
  entry.result = { reps: Number(entry.reps.value), weight };
  session.workout.exercises[entry.exerciseIndex].sets[entry.setIndex].weight = weight;
  saveWorkouts();
}

// Menú ⋮ del ejercicio en el modo entrenar: cambiar su descanso entre series
function openSessionExerciseMenu(exercise) {
  openActionMenu(exercise.name, [
    {
      label: `Descanso entre series · ${formatTime(exercise.rest)}`,
      action: () =>
        openRestDialog({
          title: "Descanso entre series",
          text: exercise.name,
          seconds: exercise.rest,
          onSave: (seconds) => {
            exercise.rest = seconds;
            saveWorkouts();
            updateSession();
          },
        }),
    },
  ]);
}

// Tocar un separador ⏱ cambia el descanso entre ejercicios (todos los separadores muestran el mismo)
function editSessionRestBetweenExercises() {
  const { workout } = session;
  openRestDialog({
    title: "Descanso entre ejercicios",
    text: "Se usa al pasar de un ejercicio al siguiente.",
    seconds: workout.restBetweenExercises,
    onSave: (seconds) => {
      workout.restBetweenExercises = seconds;
      saveWorkouts();
      saveSessionState();
      for (const separator of sessionPlan.querySelectorAll(".rest-separator")) {
        updateRestSeparatorTime(separator, seconds, true);
      }
    },
  });
}

// Marca o desmarca una serie (por si se tocó por error). Al marcarla arranca el descanso.
function toggleSet(entry) {
  if (entry.done) {
    entry.done = false;
    updateSession();
    return;
  }

  // Peso o reps inválidos (ej: negativo, vacío): mostrar el error del navegador y no marcarla
  if (!entry.weight.reportValidity() || !entry.reps.reportValidity()) return;

  entry.done = true;
  saveSetResult(entry);
  updateSession();

  const next = currentSet();
  if (!next) return; // todo hecho: el botón ya dice "Terminar"

  // Ejercicio completo: se pliega y se abre el que sigue
  const { workout, cards } = session;
  const card = cards[entry.exerciseIndex];
  if (card.classList.contains("exercise-row--done")) setExpanded(card, false);
  setExpanded(cards[next.exerciseIndex], true);
  next.row.scrollIntoView({ block: "center", behavior: "smooth" });

  // Entre series, el descanso del ejercicio; al pasar a otro, el del entrenamiento
  const exercise = workout.exercises[entry.exerciseIndex];
  const nextExercise = workout.exercises[next.exerciseIndex];
  const upNext = { name: nextExercise.name, set: `Serie ${next.setIndex + 1} de ${nextExercise.sets.length}` };
  if (next.exerciseIndex === entry.exerciseIndex) {
    startRestTimer(upNext, exercise.rest);
  } else {
    startRestTimer(upNext, workout.restBetweenExercises, "Descanso entre ejercicios");
  }
}

sessionDoneBtn.addEventListener("click", () => {
  if (session.finished) {
    endSession();
    return;
  }

  const current = currentSet();
  if (current) {
    // Si su tarjeta quedó plegada, se abre para que se vea (y el error del peso o las reps, si hay)
    setExpanded(session.cards[current.exerciseIndex], true);
    toggleSet(current);
  } else {
    finishSession();
  }
});

// "Terminar" de arriba: con todo hecho termina directo; si faltan series, pregunta con "¿Terminaste?"
sessionFinishBtn.addEventListener("click", () => {
  if (!currentSet()) {
    finishSession();
    return;
  }

  const done = countDoneSets();
  const pending = countSets(session.workout) - done;
  finishText.textContent = done
    ? "Solo las series completas se guardan en el historial."
    : "No marcaste ninguna serie: no se guarda nada en el historial.";
  finishDone.textContent = done;
  finishDoneLabel.textContent = done === 1 ? "Serie completa" : "Series completas";
  finishPending.textContent = pending;
  finishPendingLabel.textContent = pending === 1 ? "Serie incompleta" : "Series incompletas";
  finishDialog.returnValue = "";
  finishDialog.showModal();
});

// "finish" = Terminar; vacío = Seguir entrenando, Escape, "atrás" o tocar el fondo
finishDialog.addEventListener("close", () => {
  if (finishDialog.returnValue === "finish") finishSession();
});

// Guarda lo hecho en el historial y muestra el cierre. Sin series hechas no hay nada que guardar: sale directo.
function finishSession() {
  if (countDoneSets() === 0) {
    endSession();
    return;
  }

  const completed = currentSet() === null;
  session.finished = true;
  saveSessionToHistory(completed);
  clearSavedSession(); // ya está en el historial: si se cierra la app ahora, no hay nada que retomar

  sessionExercises.hidden = true;
  sessionFinished.hidden = false;
  sessionFinishBtn.hidden = true;
  sessionFinishedTitle.textContent = completed ? "¡Entrenamiento completo!" : "Entrenamiento terminado";
  sessionSummary.textContent = completed
    ? describeWorkout(session.workout)
    : `${countDoneSets()} de ${plural(countSets(session.workout), "serie", "series")}`;
  sessionDoneBtn.textContent = "Listo";
  sessionBody.scrollTop = 0;
}

// Copia lo hecho al historial (con el peso y las reps reales de cada serie).
// Es una copia: editar o borrar el entrenamiento después no la cambia.
// completed = false cuando se termina antes, con series sin hacer.
// durationMs: el tiempo entrenado, sin contar las pausas.
function saveSessionToHistory(completed) {
  const { workout, sets, startedAt } = session;

  const exercises = workout.exercises
    .map((exercise, index) => ({
      name: exercise.name,
      sets: sets.filter((entry) => entry.done && entry.exerciseIndex === index).map((entry) => entry.result),
    }))
    .filter((exercise) => exercise.sets.length > 0);

  historyEntries.unshift({
    id: String(Date.now()),
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: sessionElapsedMs(),
    completed,
    plannedSets: countSets(workout),
    exercises,
  });
  saveHistory();
}

// Sale del modo entrenar y se olvida de la sesión (ya guardada en el historial, o descartada)
function endSession() {
  clearSavedSession();
  session = null;
  if (sessionDialog.open) sessionDialog.close();
  renderResumeBar();
}

// --- Pausa: menú, "Ausente por un tiempo" y salir ---

function openPauseMenu() {
  if (session.finished) {
    endSession();
    return;
  }
  pauseDialog.returnValue = "";
  pauseDialog.showModal();
}

// returnValue vacío = Continuar, Escape, "atrás" o tocar el fondo: se sigue entrenando
pauseDialog.addEventListener("close", () => {
  const value = pauseDialog.returnValue;
  if (value === "away") goAway();
  else if (value === "restart") restartSession();
  else if (value === "exit") exitSession();
});

// Cierra el modo entrenar sin perder nada: queda guardado y la barra "Continuar" lo retoma
function goAway() {
  session.elapsedMs = sessionElapsedMs();
  session.resumedAt = null;
  session.away = true;
  saveSessionState();
  sessionDialog.close();
  renderResumeBar();
}

function resumeSession() {
  session.away = false;
  session.resumedAt = Date.now();
  saveSessionState();
  renderResumeBar();
  sessionDialog.showModal();
  currentSet()?.row.scrollIntoView({ block: "center" });
  keepScreenOn();
}

// Vuelve a empezar el mismo entrenamiento con todas las series sin marcar (los pesos usados quedan)
function restartSession() {
  if (countDoneSets() > 0 && !confirm("¿Reiniciar? Se desmarcan las series hechas.")) return;
  startSession(session.workout);
}

// Sin series hechas no hay nada que guardar ni descartar: sale directo. Si no, pregunta qué hacer con lo hecho.
function exitSession() {
  if (countDoneSets() === 0) {
    endSession();
    return;
  }
  exitDialog.returnValue = "";
  exitDialog.showModal();
}

// returnValue es el "value" del botón tocado; vacío si se cerró con Continuar, Escape o "atrás"
exitDialog.addEventListener("close", () => {
  if (exitDialog.returnValue === "save") finishSession();
  else if (exitDialog.returnValue === "discard") endSession();
});

sessionPauseBtn.addEventListener("click", openPauseMenu);

// "Atrás" en el celular o Escape: el mismo menú que "Pausa"
sessionDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  openPauseMenu();
});

// Se cierra al terminar, descartar o quedar en pausa
sessionDialog.addEventListener("close", () => {
  if (!timer) releaseScreen();
  renderWorkouts(); // las tarjetas muestran los pesos actualizados
  renderHistory(); // y el informe, la sesión recién guardada
});

// --- Sesión guardada en el navegador ---

// Lo justo para rearmar la pantalla: el entrenamiento (una copia, por si después se edita o se borra),
// los tiempos y, por serie, si está hecha y lo escrito en peso y reps
function saveSessionState() {
  if (!session || session.finished) return;
  const state = {
    workout: session.workout,
    startedAt: session.startedAt,
    elapsedMs: sessionElapsedMs(),
    sets: session.sets.map((entry) => ({
      done: entry.done,
      result: entry.result,
      weight: entry.weight.value,
      reps: entry.reps.value,
    })),
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Sin guardado, la sesión dura mientras la app esté abierta
  }
}

function clearSavedSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nada que borrar
  }
}

function restoreSet(entry, saved) {
  if (!entry || !saved) return;
  entry.done = saved.done;
  entry.result = saved.result;
  entry.weight.value = saved.weight;
  entry.reps.value = saved.reps;
}

// Al abrir la app: si quedó una sesión a medias, se retoma en pausa (se cerró la app o se fue "Ausente").
// Si el entrenamiento sigue igual, se usa el guardado (así los pesos nuevos le llegan); si se editó, la copia.
function loadSavedSession() {
  if (session) return; // ya se empezó otro antes de que terminara de cargar
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return;
  }
  if (!saved?.workout || !Array.isArray(saved.sets)) return;

  const workout = migrateWorkout(saved.workout);
  const live = workouts.find((item) => item.id === workout.id);
  startSession(live && sameStructure(live, workout) ? live : workout, saved);
}

// Mismos ejercicios, en el mismo orden y con la misma cantidad de series
function sameStructure(a, b) {
  return (
    a.exercises.length === b.exercises.length &&
    a.exercises.every(
      (exercise, index) =>
        exercise.name === b.exercises[index].name && exercise.sets.length === b.exercises[index].sets.length
    )
  );
}

// Al irse de la app (cambiar de app, apagar la pantalla) se guarda el tiempo hasta ese momento
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveSessionState();
});

// --- Barra "Continuar" ---

function renderResumeBar() {
  const visible = Boolean(session?.away);
  resumeBar.hidden = !visible;
  document.body.classList.toggle("has-resume-bar", visible);
  if (!visible) return;

  resumeBarName.textContent = session.workout.name;
  resumeBarMeta.textContent = [
    "En pausa",
    `${countDoneSets()}/${countSets(session.workout)} series`,
    formatMinutes(session.elapsedMs),
  ].join(" · ");
}

resumeBar.addEventListener("click", resumeSession);

// Empezar otro entrenamiento con uno en pausa: el de la pausa se descarta (preguntando antes)
function confirmReplaceSession() {
  if (!session) return true;
  if (!confirm(`Tenés "${session.workout.name}" en pausa. ¿Descartarlo y empezar este?`)) return false;
  endSession();
  return true;
}

// --- Historial ---

// Tarjetas: "jue, 2 oct · 19:42". Detalle: "Jueves, 2 de octubre de 2026 · 19:42"
const historyDayFormat = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" });
const historyTimeFormat = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23", // "21:33" en vez de "09:33 p. m."
});
const historyLongDateFormat = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Semanas: "28 sept – 4 oct" (con el año si no es el actual). Calendario: "Octubre de 2026" y "2 de octubre"
const weekDayFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
const weekDayYearFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" });
const calendarMonthFormat = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const calendarDayFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" });

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// 42 → "42 min", 75 → "1 h 15 min"
function describeMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

// Lo que dura una sesión, en milisegundos: al menos "1 min", para que no parezca que no se entrenó
function formatMinutes(ms) {
  return describeMinutes(Math.max(1, Math.round(ms / 60000)));
}

// Sumas del informe (total, hoy, media semanal): pueden dar "0 min"
function formatTotalMinutes(ms) {
  return describeMinutes(Math.round(ms / 60000));
}

// Las sesiones viejas no tienen durationMs (no había pausas): de la hora de inicio a la de fin
function entryDurationMs(entry) {
  return entry.durationMs ?? new Date(entry.finishedAt) - new Date(entry.startedAt);
}

function formatDuration(entry) {
  return formatMinutes(entryDurationMs(entry));
}

function sumDurations(entries) {
  return entries.reduce((sum, entry) => sum + entryDurationMs(entry), 0);
}

// Una serie del historial: "40 kg × 10" (peso antes que reps, como en el editor), o "10 reps" si no tenía peso
function describeDoneSet(set) {
  return set.weight == null ? plural(set.reps, "rep", "reps") : `${formatWeight(set.weight)} kg × ${set.reps}`;
}

function countEntrySets(entry) {
  return entry.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

// Lunes de la semana de una fecha, a las 0:00 (las semanas van de lunes a domingo)
function startOfWeek(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // getDay: 0 = domingo
  return monday;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Mes que muestra el calendario (su día 1); arranca en el actual
let calendarMonth = startOfMonth(new Date());

// De la más nueva a la más vieja (un backup importado podría venir en otro orden)
function sortedHistory() {
  return [...historyEntries].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

// Dibuja el informe y el historial completo (los dos salen de las mismas sesiones)
function renderHistory() {
  const hasHistory = historyEntries.length > 0;
  reportEmpty.hidden = hasHistory;
  reportContent.hidden = !hasHistory;
  historyEmpty.hidden = hasHistory;
  calendar.hidden = !hasHistory;
  renderReport();
  renderCalendar();
  renderHistoryWeeks();
}

// Sesiones por día: "2026-10-02" → [sesiones de ese día]
function historyByDay() {
  const byDay = new Map();
  for (const entry of historyEntries) {
    const key = localDateStamp(new Date(entry.startedAt));
    byDay.set(key, [...(byDay.get(key) ?? []), entry]);
  }
  return byDay;
}

// Fecha de la sesión más vieja; hoy si no hay historial
function oldestHistoryDate() {
  const oldest = historyEntries.reduce(
    (min, entry) => Math.min(min, new Date(entry.startedAt).getTime()),
    Date.now()
  );
  return new Date(oldest);
}

// Un día del calendario o de "Esta semana": un círculo, naranja si se entrenó y con anillo si es hoy.
// Solo los días entrenados son botones; al tocarlos se llama a onPick(date).
function renderCalendarDay(date, entries, onPick) {
  const key = localDateStamp(date);
  const today = localDateStamp();

  const cell = document.createElement(entries ? "button" : "span");
  cell.className = "calendar__day";
  cell.textContent = date.getDate();
  if (key === today) {
    cell.classList.add("calendar__day--today");
    cell.setAttribute("aria-current", "date");
  }
  if (key > today) cell.classList.add("calendar__day--future");
  if (entries) {
    cell.type = "button";
    cell.classList.add("calendar__day--trained");
    cell.setAttribute(
      "aria-label",
      `${calendarDayFormat.format(date)}: ${entries.map((entry) => entry.workoutName).join(", ")}`
    );
    cell.addEventListener("click", () => onPick(date));
  }
  return cell;
}

// --- Informe ---

const CHART_WEEKS = 8;
const RECENT_SESSIONS = 3;
const chartMonthFormat = new Intl.DateTimeFormat("es-AR", { month: "short" });

function renderReport() {
  totalCount.textContent = historyEntries.length;
  totalTime.textContent = formatTotalMinutes(sumDurations(historyEntries));
  renderWeekChart();
  renderThisWeek();
  recentHistory.replaceChildren(...sortedHistory().slice(0, RECENT_SESSIONS).map(renderHistoryCard));
}

// Lunes de hace "weeksAgo" semanas (0 = esta semana)
function mondayWeeksAgo(weeksAgo) {
  const monday = startOfWeek(new Date());
  monday.setDate(monday.getDate() - 7 * weeksAgo);
  return monday;
}

function renderWeekChart() {
  // De la más vieja a la actual, así la actual queda a la derecha
  const weeks = Array.from({ length: CHART_WEEKS }, (_, index) => ({
    monday: mondayWeeksAgo(CHART_WEEKS - 1 - index),
    count: 0,
  }));
  const byMonday = new Map(weeks.map((week) => [localDateStamp(week.monday), week]));
  for (const entry of historyEntries) {
    const week = byMonday.get(localDateStamp(startOfWeek(new Date(entry.startedAt))));
    if (week) week.count++;
  }

  weekChart.replaceChildren(
    ...weeks.map((week, index) => renderChartWeek(week, index === CHART_WEEKS - 1))
  );
}

// Una columna: el número arriba de la barra y, abajo, el lunes de la semana ("28 / sept").
// El alto máximo es 7 (los días de la semana), así las semanas se comparan siempre con la misma escala.
// Tope 7, por si hubo dos entrenamientos en un día.
function renderChartWeek({ monday, count }, current) {
  const item = document.createElement("li");
  item.className = current ? "week-chart__week week-chart__week--current" : "week-chart__week";
  item.setAttribute(
    "aria-label",
    `${current ? "Esta semana" : `Semana del ${weekDayFormat.format(monday)}`}: ${plural(count, "entrenamiento", "entrenamientos")}`
  );

  const column = document.createElement("span");
  column.className = "week-chart__column";
  column.setAttribute("aria-hidden", "true");

  const value = document.createElement("span");
  value.className = "week-chart__value";
  value.textContent = count || "";

  const bar = document.createElement("span");
  bar.className = "week-chart__bar";
  bar.style.setProperty("--days", Math.min(count, 7));

  const label = document.createElement("span");
  label.className = "week-chart__label";
  label.setAttribute("aria-hidden", "true");
  label.innerHTML = `<span>${monday.getDate()}</span><span>${chartMonthFormat.format(monday)}</span>`;

  column.append(value, bar);
  item.append(column, label);
  return item;
}

function renderThisWeek() {
  const byDay = historyByDay();
  const monday = mondayWeeksAgo(0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return renderCalendarDay(date, byDay.get(localDateStamp(date)), openHistoryDay);
  });
  thisWeekDays.replaceChildren(...days);

  todayTime.textContent = formatTotalMinutes(sumDurations(byDay.get(localDateStamp()) ?? []));

  // Media: el tiempo total repartido entre las semanas desde la primera sesión (incluida la actual)
  const weeks = Math.round((monday - startOfWeek(oldestHistoryDate())) / (7 * 24 * 60 * 60 * 1000)) + 1;
  weeklyAverage.textContent = formatTotalMinutes(sumDurations(historyEntries) / weeks);
}

// Desde "Esta semana": abre el historial con el calendario en ese mes y baja hasta el día
function openHistoryDay(date) {
  showView("historial");
  calendarMonth = startOfMonth(date);
  renderCalendar();
  scrollToWeek(date);
}

// --- Calendario ---

function renderCalendar() {
  calendarTitle.textContent = capitalize(calendarMonthFormat.format(calendarMonth));

  const byDay = historyByDay();
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  // Huecos antes del día 1, para que caiga bajo su día de la semana (la primera columna es el lunes)
  const blanks = (calendarMonth.getDay() + 6) % 7;
  const cells = Array.from({ length: blanks }, () => document.createElement("span"));

  // Tocar un día entrenado baja hasta su semana
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push(renderCalendarDay(date, byDay.get(localDateStamp(date)), scrollToWeek));
  }
  calendarGrid.replaceChildren(...cells);

  // No se puede ir más atrás del mes de la primera sesión ni más adelante del actual
  calendarPrevBtn.disabled = calendarMonth <= oldestHistoryMonth();
  calendarNextBtn.disabled = calendarMonth >= startOfMonth(new Date());
}

// Mes (su día 1) de la sesión más vieja; el actual si no hay historial
function oldestHistoryMonth() {
  return startOfMonth(oldestHistoryDate());
}

function moveCalendar(months) {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + months, 1);
  renderCalendar();
}

calendarPrevBtn.addEventListener("click", () => moveCalendar(-1));
calendarNextBtn.addEventListener("click", () => moveCalendar(1));

function scrollToWeek(date) {
  const week = historyWeeks.querySelector(`[data-week="${localDateStamp(startOfWeek(date))}"]`);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  week?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  flashDay(date);
}

// Resalta un momento las tarjetas de ese día, para que se vea cuáles son dentro de la semana
function flashDay(date) {
  for (const card of historyWeeks.querySelectorAll(`[data-day="${localDateStamp(date)}"]`)) {
    // Sacar y volver a poner la clase reinicia la animación si se toca el mismo día dos veces
    card.classList.remove("history-card--flash");
    void card.offsetWidth;
    card.classList.add("history-card--flash");
    card.addEventListener("animationend", () => card.classList.remove("history-card--flash"), { once: true });
  }
}

// --- Lista por semana ---

function renderHistoryWeeks() {
  // "2026-09-28" (el lunes) → { monday, entries }; el Map respeta el orden: la semana más nueva primero
  const weeks = new Map();
  for (const entry of sortedHistory()) {
    const monday = startOfWeek(new Date(entry.startedAt));
    const key = localDateStamp(monday);
    if (!weeks.has(key)) weeks.set(key, { monday, entries: [] });
    weeks.get(key).entries.push(entry);
  }
  historyWeeks.replaceChildren(...[...weeks].map(([key, week]) => renderHistoryWeek(key, week)));
}

function renderHistoryWeek(key, { monday, entries }) {
  const section = document.createElement("section");
  section.className = "history-week";
  section.dataset.week = key;

  const header = document.createElement("div");
  header.className = "history-week__header";

  const title = document.createElement("h4");
  title.className = "history-week__title";
  title.textContent = describeWeek(monday);

  const count = document.createElement("span");
  count.className = "history-week__count";
  count.textContent = plural(entries.length, "entrenamiento", "entrenamientos");

  const list = document.createElement("ul");
  list.className = "history-list";
  list.append(...entries.map(renderHistoryCard));

  header.append(title, count);
  section.append(header, list);
  return section;
}

// "28 sept – 4 oct", o "21 – 27 sept" si es todo el mismo mes; si es de otro año, "29 dic – 4 ene 2026"
function describeWeek(monday) {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const endFormat = sunday.getFullYear() === new Date().getFullYear() ? weekDayFormat : weekDayYearFormat;
  const start = monday.getMonth() === sunday.getMonth() ? monday.getDate() : weekDayFormat.format(monday);
  return `${start} – ${endFormat.format(sunday)}`;
}

// Toda la tarjeta es un botón que abre el detalle. Como en las de entrenamientos, adentro todo son <span>.
function renderHistoryCard(entry) {
  const startedAt = new Date(entry.startedAt);
  const doneSets = countEntrySets(entry);

  const item = document.createElement("li");
  const card = document.createElement("button");
  card.type = "button";
  card.className = "history-card card";
  card.dataset.day = localDateStamp(startedAt);
  card.addEventListener("click", () => openHistoryDetail(entry));

  const top = document.createElement("span");
  top.className = "history-card__top";

  const title = document.createElement("span");
  title.className = "history-card__title";
  title.textContent = entry.workoutName;
  top.append(title);

  if (!entry.completed) {
    const badge = document.createElement("span");
    badge.className = "history-card__badge";
    badge.textContent = "Incompleto";
    top.append(badge);
  }
  top.insertAdjacentHTML("beforeend", '<svg class="icon history-card__chevron"><use href="#icon-chevron"></use></svg>');

  const date = document.createElement("span");
  date.className = "history-card__meta";
  date.textContent = `${historyDayFormat.format(startedAt)} · ${historyTimeFormat.format(startedAt)}`;

  const stats = document.createElement("span");
  stats.className = "history-card__meta";
  stats.textContent = [
    formatDuration(entry),
    entry.completed ? plural(doneSets, "serie", "series") : `${doneSets}/${entry.plannedSets} series`,
  ].join(" · ");

  card.append(top, date, stats);
  item.append(card);
  return item;
}

// --- Detalle de una sesión ---

// Sesión que muestra el detalle; null si está cerrado
let detailEntry = null;

function openHistoryDetail(entry) {
  detailEntry = entry;
  const startedAt = new Date(entry.startedAt);
  const doneSets = countEntrySets(entry);

  historyDetailTitle.textContent = entry.workoutName;
  historyDetailDate.textContent =
    `${capitalize(historyLongDateFormat.format(startedAt))} · ${historyTimeFormat.format(startedAt)}`;
  historyDetailSummary.textContent = [
    formatDuration(entry),
    entry.completed ? plural(doneSets, "serie", "series") : `${doneSets} de ${entry.plannedSets} series`,
    !entry.completed && "Incompleto",
  ]
    .filter(Boolean)
    .join(" · ");
  historyDetailList.replaceChildren(...entry.exercises.map(renderHistoryExercise));

  historyDetail.showModal();
  historyDetail.querySelector(".preview__body").scrollTop = 0;
}

// Una tarjeta por ejercicio: imagen, nombre y las series numeradas ("① 30 kg × 8")
function renderHistoryExercise(exercise) {
  const item = document.createElement("li");
  item.className = "history-exercise card";

  const header = document.createElement("div");
  header.className = "history-exercise__header";

  const name = document.createElement("span");
  name.className = "history-exercise__name";
  name.textContent = exercise.name;
  header.append(createExerciseThumb(exercise.name), name);

  const sets = document.createElement("ol");
  sets.className = "history-sets";
  exercise.sets.forEach((set, index) => {
    const line = document.createElement("li");
    line.className = "history-set";

    // El número ya lo anuncia la lista (<ol>): el círculo es solo visual
    const number = document.createElement("span");
    number.className = "history-set__number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = index + 1;

    const text = document.createElement("span");
    text.textContent = describeDoneSet(set);

    line.append(number, text);
    sets.append(line);
  });

  item.append(header, sets);
  return item;
}

// Si el entrenamiento todavía existe se usa ese (con los pesos de ahora);
// si se borró, se arma uno con lo que se hizo ese día
function workoutFromHistory(entry) {
  return migrateWorkout({
    id: entry.workoutId,
    name: entry.workoutName,
    exercises: entry.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets.map((set) => ({ reps: set.reps, weight: set.weight })),
    })),
  });
}

historyRepeatBtn.addEventListener("click", () => {
  if (!confirmReplaceSession()) return;
  const workout = workouts.find((item) => item.id === detailEntry.workoutId) ?? workoutFromHistory(detailEntry);
  historyDetail.close();
  startSession(workout);
});

historyDetailBackBtn.addEventListener("click", () => historyDetail.close());

historyDetailMenuBtn.addEventListener("click", () => {
  const entry = detailEntry;
  openActionMenu(entry.workoutName, [
    { label: "Borrar sesión", danger: true, action: () => deleteHistoryEntry(entry) },
  ]);
});

// Se compara por referencia: el detalle guarda la misma sesión que está en historyEntries
function deleteHistoryEntry(entry) {
  const date = historyLongDateFormat.format(new Date(entry.startedAt));
  if (!confirm(`¿Borrar la sesión de "${entry.workoutName}" del ${date}? No se puede deshacer.`)) return;

  historyEntries = historyEntries.filter((item) => item !== entry);
  saveHistory();

  // Si se borró la única sesión de los meses más viejos, el calendario no puede quedar antes de la primera
  if (calendarMonth < oldestHistoryMonth()) calendarMonth = oldestHistoryMonth();

  historyDetail.close();
  renderHistory();
}

historyDetail.addEventListener("close", () => {
  detailEntry = null;
});

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

// Avisa con "input" como si se hubiera escrito, así la tarjeta actualiza su nombre e imagen
function pickExercise(entry) {
  pickerTarget.value = entry.name;
  pickerTarget.dispatchEvent(new Event("input", { bubbles: true }));
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

  // Una pantalla sin botón propio (el historial) resalta el de su sección (data-nav)
  const navName = views.find((view) => view.dataset.view === name).dataset.nav ?? name;
  for (const button of document.querySelectorAll(".nav-bar__item")) {
    const active = button.dataset.openView === navName;
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
// La sesión guardada se rearma después del catálogo, así sus tarjetas tienen imagen
loadExerciseCatalog().then(loadSavedSession);

// --- App instalable (PWA) ---

// El service worker solo funciona con https o localhost; abriendo el archivo directo falla y lo ignoramos
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
