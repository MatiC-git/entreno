// Referencias a los elementos de la página
const newWorkoutBtn = document.getElementById("new-workout-btn");

// Por ahora el botón solo avisa; la creación de entrenamientos llega en otra rama
newWorkoutBtn.addEventListener("click", () => {
  alert("Próximamente: crear entrenamiento");
});
