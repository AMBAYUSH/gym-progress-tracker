
/* ==========================================
   GYM PROGRESS TRACKER
   COMPLETE JAVASCRIPT
========================================== */

// ==========================================
// 1. SELECT HTML ELEMENTS
// ==========================================

const workoutForm = document.getElementById("workoutForm");

const exerciseInput = document.getElementById("exercise");
const setsInput = document.getElementById("sets");
const repsInput = document.getElementById("reps");
const weightInput = document.getElementById("weight");
const dateInput = document.getElementById("workoutDate");

const workoutList = document.getElementById("workoutList");
const personalRecordsList =
  document.getElementById("personalRecordsList");

const totalWorkouts = document.getElementById("totalWorkouts");
const totalSets = document.getElementById("totalSets");
const totalVolume = document.getElementById("totalVolume");
const averageWeight = document.getElementById("averageWeight");
const heaviestLift = document.getElementById("heaviestLift");
const totalPRs = document.getElementById("totalPRs");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const chartExercise = document.getElementById("chartExercise");
const chartMessage = document.getElementById("chartMessage");


// ==========================================
// 2. APPLICATION STATE
// ==========================================

const STORAGE_KEY = "gymWorkouts";

let workouts = loadWorkouts();
let editingId = null;

let strengthChart = null;
let volumeChart = null;


// ==========================================
// 3. LOCAL STORAGE
// ==========================================

function loadWorkouts() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    // Keep valid workouts, including older entries
    // that do not have a date.
    return saved.filter(function(workout) {
      return (
        workout &&
        typeof workout.exercise === "string" &&
        workout.exercise.trim() !== "" &&
        Number.isInteger(workout.sets) &&
        workout.sets > 0 &&
        Number.isInteger(workout.reps) &&
        workout.reps > 0 &&
        typeof workout.weight === "number" &&
        Number.isFinite(workout.weight) &&
        workout.weight >= 0
      );
    });

  } catch (error) {
    console.error("Unable to load workouts:", error);
    return [];
  }
}

function saveWorkouts() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(workouts)
    );

    return true;

  } catch (error) {
    console.error("Unable to save workouts:", error);

    alert(
      "Unable to save workouts. Check your browser storage."
    );

    return false;
  }
}


// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString() +
    Math.random().toString(36).slice(2)
  );
}

function getToday() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeExercise(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function formatNumber(value) {
  return Number(value.toFixed(1))
    .toLocaleString("en-US");
}

function isValidDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(value + "T12:00:00");

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return value === `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!isValidDate(value)) {
    return "Date not recorded";
  }

  const date = new Date(value + "T12:00:00");

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function calculateVolume(workout) {
  return (
    workout.sets *
    workout.reps *
    workout.weight
  );
}

function calculateOneRM(workout) {
  // Epley estimated one-rep max formula
  return workout.weight *
    (1 + workout.reps / 30);
}


// ==========================================
// 5. READ AND VALIDATE FORM
// ==========================================

function getFormData() {
  const exercise = exerciseInput.value.trim();

  const sets = Number(setsInput.value);
  const reps = Number(repsInput.value);
  const weight = Number(weightInput.value);

  const date = dateInput.value;

  if (
    !exercise ||
    setsInput.value.trim() === "" ||
    !Number.isInteger(sets) ||
    sets < 1 ||
    repsInput.value.trim() === "" ||
    !Number.isInteger(reps) ||
    reps < 1 ||
    weightInput.value.trim() === "" ||
    !Number.isFinite(weight) ||
    weight < 0 ||
    !isValidDate(date)
  ) {
    alert("Please enter valid workout details.");
    return null;
  }

  return {
    exercise,
    sets,
    reps,
    weight,
    date
  };
}


// ==========================================
// 6. ADD OR UPDATE WORKOUT
// ==========================================

workoutForm.addEventListener(
  "submit",
  function(event) {
    event.preventDefault();

    const formData = getFormData();

    if (!formData) return;

    if (editingId !== null) {

      const workout = workouts.find(function(item) {
        return item.id === editingId;
      });

      if (!workout) {
        alert("Workout not found.");
        resetForm();
        return;
      }

      Object.assign(workout, formData);

    } else {

      const workout = {
        id: generateId(),
        ...formData
      };

      workouts.push(workout);
    }

    saveWorkouts();
    renderApp();
    resetForm();
  }
);


// ==========================================
// 7. EDIT WORKOUT
// ==========================================

function editWorkout(id) {
  const workout = workouts.find(function(item) {
    return item.id === id;
  });

  if (!workout) return;

  editingId = id;

  exerciseInput.value = workout.exercise;
  setsInput.value = workout.sets;
  repsInput.value = workout.reps;
  weightInput.value = workout.weight;

  dateInput.value = isValidDate(workout.date)
    ? workout.date
    : getToday();

  formTitle.textContent = "Edit Workout";
  submitBtn.textContent = "Save Changes";

  cancelEditBtn.hidden = false;

  workoutForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  exerciseInput.focus();
}


// ==========================================
// 8. RESET FORM
// ==========================================

function resetForm() {
  workoutForm.reset();

  editingId = null;

  dateInput.value = getToday();

  formTitle.textContent = "Log Your Workout";
  submitBtn.textContent = "+ Log Workout";

  cancelEditBtn.hidden = true;
}

cancelEditBtn.addEventListener(
  "click",
  resetForm
);


// ==========================================
// 9. DELETE WORKOUT
// ==========================================

function deleteWorkout(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this workout?"
  );

  if (!confirmed) return;

  workouts = workouts.filter(function(workout) {
    return workout.id !== id;
  });

  if (editingId === id) {
    resetForm();
  }

  saveWorkouts();
  renderApp();
}


// ==========================================
// 10. DISPLAY WORKOUT HISTORY
// ==========================================

function displayWorkouts() {
  workoutList.innerHTML = "";

  if (workouts.length === 0) {
    const empty = document.createElement("p");

    empty.className = "empty-state";
    empty.textContent = "No workouts logged yet.";

    workoutList.appendChild(empty);
    return;
  }

  const sortedWorkouts = [...workouts].sort(
    function(a, b) {
      return (b.date || "").localeCompare(
        a.date || ""
      );
    }
  );

  sortedWorkouts.forEach(function(workout) {

    const card = document.createElement("div");
    card.className = "workout-card";

    const info = document.createElement("div");
    info.className = "workout-info";

    const title = document.createElement("h3");
    title.textContent = workout.exercise;

    const details = document.createElement("p");
    details.textContent =
      `${workout.sets} sets × ` +
      `${workout.reps} reps × ` +
      `${workout.weight} lbs`;

    const date = document.createElement("span");
    date.className = "workout-date";
    date.textContent = formatDate(workout.date);

    info.append(title, details, date);

    const actions = document.createElement("div");
    actions.className = "workout-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";

    editBtn.addEventListener("click", function() {
      editWorkout(workout.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", function() {
      deleteWorkout(workout.id);
    });

    actions.append(editBtn, deleteBtn);

    card.append(info, actions);
    workoutList.appendChild(card);

  });
}


// ==========================================
// 11. CALCULATE PERSONAL RECORDS
// ==========================================

function getPersonalRecords() {
  const records = new Map();

  workouts.forEach(function(workout) {

    const key = normalizeExercise(workout.exercise);

    const estimatedOneRM =
      calculateOneRM(workout);

    const existing = records.get(key);

    if (
      !existing ||
      estimatedOneRM > existing.estimatedOneRM
    ) {
      records.set(key, {
        exercise: workout.exercise,
        weight: workout.weight,
        reps: workout.reps,
        estimatedOneRM
      });
    }

  });

  return [...records.values()].sort(
    function(a, b) {
      return a.exercise.localeCompare(b.exercise);
    }
  );
}


// ==========================================
// 12. DISPLAY PERSONAL RECORDS
// ==========================================

function displayPersonalRecords() {
  personalRecordsList.innerHTML = "";

  const records = getPersonalRecords();

  if (records.length === 0) {
    const empty = document.createElement("p");

    empty.className = "empty-state";
    empty.textContent = "No personal records yet.";

    personalRecordsList.appendChild(empty);
    return;
  }

  records.forEach(function(record) {

    const card = document.createElement("div");
    card.className = "pr-card";

    const info = document.createElement("div");
    info.className = "pr-info";

    const title = document.createElement("h3");
    title.textContent = record.exercise;

    const details = document.createElement("p");
    details.textContent =
      `${record.weight} lbs × ${record.reps} reps`;

    info.append(title, details);

    const result = document.createElement("div");
    result.className = "pr-result";

    const value = document.createElement("strong");
    value.textContent =
      formatNumber(record.estimatedOneRM) + " lbs";

    const label = document.createElement("span");
    label.textContent = "Estimated 1RM";

    result.append(value, label);

    card.append(info, result);
    personalRecordsList.appendChild(card);

  });
}


// ==========================================
// 13. UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStats() {

  totalWorkouts.textContent = workouts.length;

  const sets = workouts.reduce(
    function(total, workout) {
      return total + workout.sets;
    },
    0
  );

  totalSets.textContent = sets;

  const volume = workouts.reduce(
    function(total, workout) {
      return total + calculateVolume(workout);
    },
    0
  );

  totalVolume.textContent = formatNumber(volume);

  const weightSum = workouts.reduce(
    function(total, workout) {
      return total + workout.weight;
    },
    0
  );

  const average = workouts.length > 0
    ? weightSum / workouts.length
    : 0;

  averageWeight.textContent =
    formatNumber(average);

  const heaviest = workouts.reduce(
    function(max, workout) {
      return Math.max(max, workout.weight);
    },
    0
  );

  heaviestLift.textContent =
    formatNumber(heaviest);

  totalPRs.textContent =
    getPersonalRecords().length;
}


// ==========================================
// 14. GET EXERCISES FOR CHARTS
// ==========================================

function getChartExercises() {
  const exercises = new Map();

  workouts.forEach(function(workout) {

    if (!isValidDate(workout.date)) {
      return;
    }

    const key = normalizeExercise(workout.exercise);

    if (!exercises.has(key)) {
      exercises.set(key, workout.exercise);
    }

  });

  return [...exercises.entries()].sort(
    function(a, b) {
      return a[1].localeCompare(b[1]);
    }
  );
}


// ==========================================
// 15. UPDATE CHART EXERCISE DROPDOWN
// ==========================================

function updateExerciseDropdown() {

  const previousSelection = chartExercise.value;

  const exercises = getChartExercises();

  chartExercise.replaceChildren();

  if (exercises.length === 0) {

    const option = new Option(
      "No dated workouts available",
      ""
    );

    chartExercise.add(option);
    chartExercise.disabled = true;

    return;
  }

  chartExercise.disabled = false;

  exercises.forEach(function([key, name]) {
    chartExercise.add(
      new Option(name, key)
    );
  });

  const stillExists = exercises.some(
    function([key]) {
      return key === previousSelection;
    }
  );

  chartExercise.value = stillExists
    ? previousSelection
    : exercises[0][0];
}


// ==========================================
// 16. GET PROGRESS DATA BY EXERCISE
// ==========================================

function getExerciseProgress(exerciseKey) {

  const dailyData = new Map();

  workouts.forEach(function(workout) {

    if (
      !isValidDate(workout.date) ||
      normalizeExercise(workout.exercise) !==
        exerciseKey
    ) {
      return;
    }

    const date = workout.date;
    const oneRM = calculateOneRM(workout);
    const workoutVolume = calculateVolume(workout);

    if (!dailyData.has(date)) {

      dailyData.set(date, {
        date: date,
        oneRM: oneRM,
        volume: workoutVolume
      });

    } else {

      const day = dailyData.get(date);

      day.oneRM = Math.max(
        day.oneRM,
        oneRM
      );

      day.volume += workoutVolume;

    }

  });

  return [...dailyData.values()].sort(
    function(a, b) {
      return a.date.localeCompare(b.date);
    }
  );
}


// ==========================================
// 17. CREATE CHART
// ==========================================

function createProgressChart(
  canvasId,
  label,
  data,
  color
) {

  const canvas = document.getElementById(canvasId);

  return new Chart(canvas, {

    type: "line",

    data: {

      labels: data.map(function(item) {
        return formatDate(item.date);
      }),

      datasets: [{
        label: label,

        data: data.map(function(item) {
          return item.value;
        }),

        borderColor: color,
        backgroundColor: color,

        borderWidth: 3,
        tension: 0.25,

        pointRadius: 5,
        pointHoverRadius: 7,

        fill: false
      }]
    },

    options: {

      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index"
      },

      plugins: {

        legend: {
          labels: {
            color: "#cbd5e1"
          }
        },

        tooltip: {
          callbacks: {

            label: function(context) {
              return (
                context.dataset.label +
                ": " +
                formatNumber(context.parsed.y) +
                " lbs"
              );
            }

          }
        }
      },

      scales: {

        x: {
          ticks: {
            color: "#94a3b8"
          },

          grid: {
            color: "#243247"
          }
        },

        y: {
          beginAtZero: true,

          ticks: {
            color: "#94a3b8"
          },

          grid: {
            color: "#243247"
          }
        }

      }
    }

  });
}


// ==========================================
// 18. RENDER PROGRESS CHARTS
// ==========================================

function renderCharts() {

  // Remove old chart instances before redrawing
  if (strengthChart) {
    strengthChart.destroy();
    strengthChart = null;
  }

  if (volumeChart) {
    volumeChart.destroy();
    volumeChart = null;
  }

  updateExerciseDropdown();

  if (typeof Chart === "undefined") {

    chartMessage.textContent =
      "Chart.js could not load. " +
      "Please check your internet connection.";

    return;
  }

  const exerciseKey = chartExercise.value;

  if (!exerciseKey) {

    chartMessage.textContent =
      "Log a workout with a date " +
      "to see your progress.";

    return;
  }

  const progress = getExerciseProgress(exerciseKey);

  const strengthData = progress.map(function(day) {
    return {
      date: day.date,
      value: day.oneRM
    };
  });

  const volumeData = progress.map(function(day) {
    return {
      date: day.date,
      value: day.volume
    };
  });

  strengthChart = createProgressChart(
    "strengthChart",
    "Estimated 1RM",
    strengthData,
    "#60a5fa"
  );

  volumeChart = createProgressChart(
    "volumeChart",
    "Training Volume",
    volumeData,
    "#22c55e"
  );

  if (progress.length === 1) {

    chartMessage.textContent =
      "Add another workout on a different " +
      "date to see your progress.";

  } else {

    chartMessage.textContent =
      `Showing progress across ` +
      `${progress.length} workout dates.`;

  }
}


// ==========================================
// 19. CHANGE SELECTED EXERCISE
// ==========================================

chartExercise.addEventListener(
  "change",
  renderCharts
);


// ==========================================
// 20. RENDER ENTIRE APPLICATION
// ==========================================

function renderApp() {
  displayWorkouts();
  displayPersonalRecords();
  updateStats();
  renderCharts();
}


// ==========================================
// 21. INITIALIZE APPLICATION
// ==========================================

resetForm();
renderApp();
