// Clave con la que se guardan los entrenamientos en el navegador
const STORAGE_KEY = "entreno.workouts";

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

    const item = document.createElement("li");

    // La tarjeta es un botón: al tocarla se abre el editor con sus datos
    const card = document.createElement("button");
    card.type = "button";
    card.className = "workout-card";
    card.addEventListener("click", () => openEditor(workout));

    const title = document.createElement("h2");
    title.className = "workout-card__title";
    title.textContent = workout.name;

    const summary = document.createElement("p");
    summary.className = "workout-card__summary";
    summary.textContent =
      `${plural(workout.exercises.length, "ejercicio", "ejercicios")} · ${plural(totalSets, "serie", "series")}`;

    card.append(title, summary);
    item.append(card);
    workoutList.append(item);
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

renderWorkouts();
