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
const exerciseRowTemplate = document.getElementById("exercise-row-template");

let workouts = loadWorkouts();

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
    item.className = "workout-card";

    const title = document.createElement("h2");
    title.className = "workout-card__title";
    title.textContent = workout.name;

    const summary = document.createElement("p");
    summary.className = "workout-card__summary";
    summary.textContent =
      `${plural(workout.exercises.length, "ejercicio", "ejercicios")} · ${plural(totalSets, "serie", "series")}`;

    item.append(title, summary);
    workoutList.append(item);
  }
}

// --- Editor de entrenamiento ---

function addExerciseRow() {
  const row = exerciseRowTemplate.content.firstElementChild.cloneNode(true);

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

function openEditor() {
  form.reset();
  exerciseFields.replaceChildren();
  addExerciseRow();
  editor.showModal();
}

newWorkoutBtn.addEventListener("click", openEditor);

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

  workouts.push({
    id: String(Date.now()),
    name: workoutNameInput.value.trim(),
    exercises,
    createdAt: new Date().toISOString(),
  });

  saveWorkouts();
  renderWorkouts();
  editor.close();
});

renderWorkouts();
