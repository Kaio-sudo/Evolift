const STORAGE_KEY = "evolift.workout-planner.v1";
const DAYS = [
    { id: "monday", name: "Segunda-feira", shortName: "Segunda", initial: "S" },
    { id: "tuesday", name: "Terça-feira", shortName: "Terça", initial: "T" },
    { id: "wednesday", name: "Quarta-feira", shortName: "Quarta", initial: "Q" },
    { id: "thursday", name: "Quinta-feira", shortName: "Quinta", initial: "Q" },
    { id: "friday", name: "Sexta-feira", shortName: "Sexta", initial: "S" }
];

const elements = {
    app: document.querySelector("#app"),
    fatalError: document.querySelector("#fatal-error"),
    fatalErrorMessage: document.querySelector("#fatal-error-message"),
    greeting: document.querySelector("#greeting"),
    todayDate: document.querySelector("#today-date"),
    weekSelect: document.querySelector("#week-select"),
    weekRange: document.querySelector("#week-range"),
    previousWeek: document.querySelector("#previous-week"),
    nextWeek: document.querySelector("#next-week"),
    newWeek: document.querySelector("#new-week"),
    copyWeek: document.querySelector("#copy-week"),
    resetWeeks: document.querySelector("#reset-weeks"),
    resetWeeksDialog: document.querySelector("#reset-weeks-dialog"),
    resetWeeksForm: document.querySelector("#reset-weeks-form"),
    closeResetWeeksDialog: document.querySelector("#close-reset-weeks-dialog"),
    cancelResetWeeks: document.querySelector("#cancel-reset-weeks"),
    dayList: document.querySelector("#day-list"),
    selectedDayLabel: document.querySelector("#selected-day-label"),
    selectedDayName: document.querySelector("#selected-day-name"),
    workoutName: document.querySelector("#workout-name"),
    clearWorkout: document.querySelector("#clear-workout"),
    workoutContent: document.querySelector("#workout-content"),
    restButton: document.querySelector("#rest-button"),
    restState: document.querySelector("#rest-state"),
    restReason: document.querySelector("#rest-reason"),
    restPlannedWorkout: document.querySelector("#rest-planned-workout"),
    resumeWorkout: document.querySelector("#resume-workout"),
    exerciseCount: document.querySelector("#exercise-count"),
    emptyState: document.querySelector("#empty-state"),
    exerciseList: document.querySelector("#exercise-list"),
    addExercise: document.querySelector("#add-exercise"),
    emptyAddExercise: document.querySelector("#empty-add-exercise"),
    dialog: document.querySelector("#exercise-dialog"),
    exerciseForm: document.querySelector("#exercise-form"),
    dialogTitle: document.querySelector("#dialog-title"),
    activityTypePicker: document.querySelector("#activity-type-picker"),
    activityNameLabel: document.querySelector("#activity-name-label"),
    exerciseName: document.querySelector("#exercise-name"),
    exerciseFields: document.querySelector("#exercise-fields"),
    exerciseSeries: document.querySelector("#exercise-series"),
    setFields: document.querySelector("#set-fields"),
    cardioFields: document.querySelector("#cardio-fields"),
    cardioDuration: document.querySelector("#cardio-duration"),
    cardioDistance: document.querySelector("#cardio-distance"),
    cardioIntensity: document.querySelector("#cardio-intensity"),
    exerciseNotes: document.querySelector("#exercise-notes"),
    saveExercise: document.querySelector("#save-exercise"),
    closeDialog: document.querySelector("#close-dialog"),
    cancelDialog: document.querySelector("#cancel-dialog"),
    restDialog: document.querySelector("#rest-dialog"),
    restForm: document.querySelector("#rest-form"),
    restDialogTitle: document.querySelector("#rest-dialog-title"),
    restReasonInput: document.querySelector("#rest-reason-input"),
    saveRest: document.querySelector("#save-rest"),
    closeRestDialog: document.querySelector("#close-rest-dialog"),
    cancelRestDialog: document.querySelector("#cancel-rest-dialog"),
    toast: document.querySelector("#toast")
};

let state;
let editingExerciseId = null;
let editorActivityType = "exercise";
let editorSetValues = [];
let toastTimeout;

function toLocalISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getMondayISO(date) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const offset = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - offset);
    return toLocalISODate(monday);
}

function dateFromISO(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
}

function getWeekRange(startDate) {
    const start = dateFromISO(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
    const startMonth = monthFormatter.format(start).replace(".", "");
    const endMonth = monthFormatter.format(end).replace(".", "");
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
        return `${start.getDate()}–${end.getDate()} ${endMonth} ${endYear}`;
    }

    return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${endYear}`;
}

function createExerciseId() {
    return `exercise-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlankWeek(startDate, number) {
    return {
        id: `week-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        title: `Semana ${number}`,
        startDate,
        days: DAYS.map((day) => ({
            id: day.id,
            name: "",
            exercises: [],
            restReason: ""
        }))
    };
}

function isValidWeek(week) {
    return week &&
        typeof week.id === "string" &&
        typeof week.title === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(week.startDate) &&
        !Number.isNaN(dateFromISO(week.startDate).getTime()) &&
        Array.isArray(week.days) &&
        week.days.length === DAYS.length &&
        week.days.every((day, index) =>
            day &&
            day.id === DAYS[index].id &&
            typeof day.name === "string" &&
            (day.restReason === undefined || typeof day.restReason === "string") &&
            Array.isArray(day.exercises) &&
            day.exercises.every(isValidActivity)
        );
}

function isValidActivity(activity) {
    if (
        !activity ||
        typeof activity.id !== "string" ||
        typeof activity.name !== "string" ||
        (activity.notes !== undefined && typeof activity.notes !== "string")
    ) {
        return false;
    }

    if (activity.type === "cardio") {
        return Number.isInteger(activity.duration) &&
            activity.duration > 0 &&
            typeof activity.distance === "string" &&
            typeof activity.intensity === "string";
    }

    return (activity.type === undefined || activity.type === "exercise") &&
        Number.isInteger(activity.series) &&
        activity.series > 0 &&
        (activity.reps === undefined || typeof activity.reps === "string") &&
        (activity.load === undefined || typeof activity.load === "string") &&
        (activity.sets === undefined || (
            Array.isArray(activity.sets) &&
            activity.sets.length === activity.series &&
            activity.sets.every((set) =>
                set &&
                typeof set.weight === "string" &&
                typeof set.reps === "string"
            )
        ));
}

function normalizeActivity(activity) {
    if (activity.type === "cardio") {
        return {
            ...activity,
            distance: activity.distance || "",
            intensity: activity.intensity || "",
            notes: activity.notes || ""
        };
    }

    if (Array.isArray(activity.sets)) {
        return {
            ...activity,
            type: "exercise",
            sets: activity.sets.map((set) => ({
                weight: set.weight,
                reps: set.reps
            }))
        };
    }

    const legacyWeight = typeof activity.load === "string"
        ? activity.load.trim().replace(/\s*kg\s*$/i, "").trim()
        : "";
    const legacyReps = typeof activity.reps === "string" ? activity.reps : "";
    return {
        ...activity,
        type: "exercise",
        sets: Array.from({ length: activity.series }, () => ({
            weight: legacyWeight,
            reps: legacyReps
        }))
    };
}

function saveState() {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (error) {
        console.error("Não foi possível salvar os treinos.", error);
        showToast("Não foi possível salvar. Verifique o espaço disponível no navegador.", true);
        return false;
    }
}

function loadState() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        const initialWeek = createBlankWeek(getMondayISO(new Date()), 1);
        const initialState = {
            version: 1,
            selectedWeekId: initialWeek.id,
            selectedDayId: DAYS[0].id,
            weeks: [initialWeek]
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
        return initialState;
    }

    let parsed;
    try {
        parsed = JSON.parse(stored);
    } catch {
        throw new Error("Os dados salvos estão corrompidos. Nenhum registro foi alterado.");
    }

    if (
        !parsed ||
        parsed.version !== 1 ||
        !Array.isArray(parsed.weeks) ||
        parsed.weeks.length === 0 ||
        !parsed.weeks.every(isValidWeek)
    ) {
        throw new Error("Os dados salvos não estão em um formato válido. Nenhum registro foi alterado.");
    }

    const orderedWeeks = parsed.weeks
        .map((week) => ({
            ...week,
            days: week.days.map((day) => ({
                ...day,
                exercises: day.exercises.map(normalizeActivity)
            }))
        }))
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
    const selectedWeekId = orderedWeeks.some((week) => week.id === parsed.selectedWeekId)
        ? parsed.selectedWeekId
        : orderedWeeks[orderedWeeks.length - 1].id;
    const selectedDayId = DAYS.some((day) => day.id === parsed.selectedDayId)
        ? parsed.selectedDayId
        : DAYS[0].id;

    return {
        version: 1,
        selectedWeekId,
        selectedDayId,
        weeks: orderedWeeks
    };
}

function getOrderedWeeks() {
    return [...state.weeks].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function getSelectedWeek() {
    return state.weeks.find((week) => week.id === state.selectedWeekId);
}

function getSelectedDay() {
    const week = getSelectedWeek();
    return week.days.find((day) => day.id === state.selectedDayId);
}

function hasWorkout(day) {
    return Boolean(day.name.trim() || day.exercises.length);
}

function hasRest(day) {
    return Boolean(day.restReason && day.restReason.trim());
}

function showToast(message, isError = false) {
    elements.toast.textContent = message;
    elements.toast.classList.toggle("is-error", isError);
    elements.toast.classList.add("is-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
        elements.toast.classList.remove("is-visible");
    }, isError ? 6000 : 2800);
}

function renderGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Bom dia." : hour < 18 ? "Boa tarde." : "Boa noite.";
    elements.greeting.innerHTML = `${greeting} <span>Vamos organizar a semana?</span>`;
    elements.todayDate.textContent = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long"
    }).format(now).toLocaleUpperCase("pt-BR");
}

function renderWeekPicker() {
    const weeks = getOrderedWeeks();
    const options = weeks.map((week) => {
        const option = document.createElement("option");
        option.value = week.id;
        option.textContent = `${week.title} · ${getWeekRange(week.startDate)}`;
        option.selected = week.id === state.selectedWeekId;
        return option;
    });
    elements.weekSelect.replaceChildren(...options);
    elements.weekRange.textContent = `Segunda a sexta · ${getWeekRange(getSelectedWeek().startDate)}`;

    const selectedIndex = weeks.findIndex((week) => week.id === state.selectedWeekId);
    elements.previousWeek.disabled = selectedIndex <= 0;
    elements.nextWeek.disabled = selectedIndex === -1 || selectedIndex === weeks.length - 1;
    elements.resetWeeks.disabled = weeks.length === 0;
}

function renderDayList() {
    const week = getSelectedWeek();
    const dayButtons = week.days.map((day) => {
        const dayDetails = DAYS.find((entry) => entry.id === day.id);
        const button = document.createElement("button");
        button.className = "day-button";
        button.type = "button";
        button.dataset.dayId = day.id;
        button.setAttribute("aria-current", day.id === state.selectedDayId ? "true" : "false");
        if (day.id === state.selectedDayId) button.classList.add("is-selected");
        if (hasRest(day)) button.classList.add("is-rest");
        else if (hasWorkout(day)) button.classList.add("has-workout");

        const initial = document.createElement("span");
        initial.className = "day-initial";
        initial.setAttribute("aria-hidden", "true");
        initial.textContent = dayDetails.initial;

        const copy = document.createElement("span");
        copy.className = "day-copy";
        const name = document.createElement("span");
        name.className = "day-name";
        name.textContent = dayDetails.shortName;
        const summary = document.createElement("span");
        summary.className = "day-summary";
        summary.textContent = hasRest(day)
            ? "Descanso registrado"
            : day.name.trim() || (day.exercises.length ? `${day.exercises.length} atividades` : "Sem treino definido");
        copy.append(name, summary);

        const status = document.createElement("span");
        status.className = "day-status";
        status.setAttribute("aria-hidden", "true");
        button.append(initial, copy, status);
        return button;
    });
    elements.dayList.replaceChildren(...dayButtons);
}

function createExerciseDetail(text) {
    const detail = document.createElement("span");
    detail.className = "exercise-detail";
    detail.textContent = text;
    return detail;
}

function formatWeight(weight) {
    const value = weight.trim();
    if (!value) return "Sem carga";
    const numericValue = Number(value.replace(",", "."));
    return Number.isFinite(numericValue) ? `${value} kg` : value;
}

function createSeparator() {
    const separator = document.createElement("span");
    separator.className = "detail-separator";
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "·";
    return separator;
}

function createExerciseAction(action, label, iconPath, disabled = false) {
    const button = document.createElement("button");
    button.className = "exercise-action";
    button.type = "button";
    button.dataset.action = action;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.disabled = disabled;
    if (action === "delete") button.classList.add("is-delete");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", iconPath);
    icon.append(path);
    button.append(icon);
    return button;
}

function renderExercise(exercise, index, total) {
    const isCardio = exercise.type === "cardio";
    const item = document.createElement("li");
    item.className = "exercise-item";
    item.dataset.exerciseId = exercise.id;

    const number = document.createElement("span");
    number.className = "exercise-number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(index + 1).padStart(2, "0");

    const copy = document.createElement("div");
    copy.className = "exercise-copy";
    const title = document.createElement("span");
    title.className = "exercise-title";
    title.textContent = exercise.name;

    copy.append(title);
    if (isCardio) {
        const typeLabel = document.createElement("span");
        typeLabel.className = "activity-type-label is-cardio";
        typeLabel.textContent = "CARDIO";
        copy.append(typeLabel);

        const details = document.createElement("div");
        details.className = "cardio-meta";
        const duration = document.createElement("span");
        duration.className = "cardio-meta-item";
        duration.textContent = `${exercise.duration} min`;
        details.append(duration);
        if (exercise.distance) {
            const distance = document.createElement("span");
            distance.className = "cardio-meta-item";
            distance.textContent = `${exercise.distance} km`;
            details.append(distance);
        }
        if (exercise.intensity) {
            const intensity = document.createElement("span");
            intensity.className = "cardio-meta-item";
            intensity.textContent = exercise.intensity;
            details.append(intensity);
        }
        copy.append(details);
    } else {
        const setList = document.createElement("div");
        setList.className = "exercise-sets";
        setList.setAttribute("aria-label", `${exercise.series} ${exercise.series === 1 ? "série" : "séries"}`);
        exercise.sets.forEach((set, setIndex) => {
            const row = document.createElement("span");
            row.className = "exercise-set";
            const setName = document.createElement("span");
            setName.className = "set-name";
            setName.textContent = `Série ${setIndex + 1}`;
            const weight = document.createElement("span");
            weight.className = "set-weight";
            weight.textContent = formatWeight(set.weight);
            row.append(setName, weight);
            if (set.reps) {
                const repetitions = document.createElement("span");
                repetitions.className = "set-reps";
                repetitions.textContent = `${set.reps} repetições`;
                row.append(repetitions);
            }
            setList.append(row);
        });
        copy.append(setList);
    }

    if (exercise.notes) {
        const notes = document.createElement("span");
        notes.className = "exercise-note";
        notes.textContent = exercise.notes;
        copy.append(notes);
    }

    const actions = document.createElement("div");
    actions.className = "exercise-actions";
    actions.append(
        createExerciseAction("up", "Mover para cima", "m5 12 5-5 5 5", index === 0),
        createExerciseAction("down", "Mover para baixo", "m5 8 5 5 5-5", index === total - 1),
        createExerciseAction("edit", isCardio ? "Editar cardio" : "Editar exercício", "m12 5 3 3M4 16l3-.6L16 6.4 13.6 4 4.6 13 4 16Z"),
        createExerciseAction("delete", "Excluir exercício", "M4 6h12M8 6V4h4v2m2 0-.7 10H6.7L6 6m3 3v4m2-4v4")
    );

    item.append(number, copy, actions);
    return item;
}

function renderWorkout() {
    const day = getSelectedDay();
    const dayDetails = DAYS.find((entry) => entry.id === day.id);
    const resting = hasRest(day);

    elements.selectedDayLabel.textContent = dayDetails.name.toLocaleUpperCase("pt-BR");
    elements.selectedDayName.textContent = dayDetails.name;
    elements.restButton.textContent = resting ? "Editar descanso" : "Marcar descanso";
    elements.workoutContent.hidden = resting;
    elements.restState.hidden = !resting;
    elements.restReason.textContent = day.restReason || "";
    elements.restPlannedWorkout.hidden = !hasWorkout(day);
    if (hasWorkout(day)) {
        const activityCount = `${day.exercises.length} ${day.exercises.length === 1 ? "atividade" : "atividades"}`;
        elements.restPlannedWorkout.textContent = `${day.name.trim() || "Treino programado"} continua salvo · ${activityCount}`;
    }
    if (elements.workoutName.value !== day.name) {
        elements.workoutName.value = day.name;
    }
    elements.exerciseCount.textContent = `${day.exercises.length} ${day.exercises.length === 1 ? "atividade" : "atividades"}`;
    elements.emptyState.hidden = day.exercises.length > 0;
    elements.exerciseList.hidden = day.exercises.length === 0;
    elements.clearWorkout.hidden = resting || !hasWorkout(day);
    elements.addExercise.hidden = day.exercises.length === 0;

    if (day.exercises.length === 0) {
        elements.exerciseList.replaceChildren();
        return;
    }

    elements.exerciseList.replaceChildren(...day.exercises.map((exercise, index) =>
        renderExercise(exercise, index, day.exercises.length)
    ));
}

function render() {
    renderGreeting();
    renderWeekPicker();
    renderDayList();
    renderWorkout();
}

function selectWeek(weekId) {
    state.selectedWeekId = weekId;
    saveState();
    render();
}

function moveWeek(direction) {
    const weeks = getOrderedWeeks();
    const currentIndex = weeks.findIndex((week) => week.id === state.selectedWeekId);
    const targetWeek = weeks[currentIndex + direction];
    if (targetWeek) selectWeek(targetWeek.id);
}

function getNextWeekStartDate() {
    const weeks = getOrderedWeeks();
    const latestStart = dateFromISO(weeks[weeks.length - 1].startDate);
    latestStart.setDate(latestStart.getDate() + 7);
    return toLocalISODate(latestStart);
}

function getNextWeekNumber() {
    const currentNumbers = state.weeks
        .map((week) => Number(week.title.match(/\d+$/)?.[0] || 0));
    return Math.max(0, ...currentNumbers) + 1;
}

function createWeek(copySelected) {
    const nextWeek = createBlankWeek(getNextWeekStartDate(), getNextWeekNumber());
    if (copySelected) {
        const source = getSelectedWeek();
        nextWeek.days = source.days.map((day) => ({
            id: day.id,
            name: day.name,
            exercises: day.exercises.map((activity) => {
                const copiedActivity = { ...activity, id: createExerciseId() };
                if (Array.isArray(activity.sets)) {
                    copiedActivity.sets = activity.sets.map((set) => ({ ...set }));
                }
                return copiedActivity;
            })
        }));
    }

    state.weeks.push(nextWeek);
    state.selectedWeekId = nextWeek.id;
    state.selectedDayId = DAYS[0].id;
    const saved = saveState();
    render();
    if (saved) {
        showToast(copySelected ? "Cópia criada. Edite os treinos desta semana quando quiser." : "Semana em branco criada.");
    }
}

function openResetWeeksDialog() {
    elements.resetWeeksDialog.showModal();
}

function restartFromWeekOne(event) {
    event.preventDefault();
    const firstWeek = createBlankWeek(getMondayISO(new Date()), 1);
    const previousWeeks = state.weeks;
    const previousSelectedWeekId = state.selectedWeekId;
    const previousSelectedDayId = state.selectedDayId;

    state.weeks = [firstWeek];
    state.selectedWeekId = firstWeek.id;
    state.selectedDayId = DAYS[0].id;

    if (!saveState()) {
        state.weeks = previousWeeks;
        state.selectedWeekId = previousSelectedWeekId;
        state.selectedDayId = previousSelectedDayId;
        elements.resetWeeksDialog.close();
        render();
        return;
    }

    elements.resetWeeksDialog.close();
    render();
    showToast("Organização reiniciada na Semana 1.");
}

function setActivityType(type) {
    editorActivityType = type;
    const isCardio = type === "cardio";
    elements.exerciseFields.hidden = isCardio;
    elements.cardioFields.hidden = !isCardio;
    elements.exerciseSeries.disabled = isCardio;
    elements.cardioDuration.disabled = !isCardio;
    elements.cardioDistance.disabled = !isCardio;
    elements.cardioIntensity.disabled = !isCardio;
    elements.activityNameLabel.textContent = isCardio ? "Tipo de cardio" : "Nome do exercício";
    elements.exerciseName.placeholder = isCardio ? "Ex.: Corrida na esteira" : "Ex.: Supino inclinado com halteres";

    elements.activityTypePicker.querySelectorAll("button[data-activity-type]").forEach((button) => {
        const selected = button.dataset.activityType === type;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
}

function openActivityDialog(activity = null) {
    editingExerciseId = activity ? activity.id : null;
    const type = activity && activity.type === "cardio" ? "cardio" : "exercise";
    elements.exerciseForm.reset();
    elements.exerciseSeries.value = type === "exercise" && activity ? String(activity.series) : "3";
    elements.exerciseName.value = activity ? activity.name : "";
    elements.exerciseNotes.value = activity ? activity.notes || "" : "";
    elements.cardioDuration.value = type === "cardio" ? String(activity.duration) : "";
    elements.cardioDistance.value = type === "cardio" ? activity.distance : "";
    elements.cardioIntensity.value = type === "cardio" ? activity.intensity : "";
    editorSetValues = type === "exercise" && activity
        ? activity.sets.map((set) => ({ ...set }))
        : [];
    if (type === "exercise") renderSetFields(editorSetValues);
    else elements.setFields.replaceChildren();
    elements.activityTypePicker.hidden = Boolean(activity);
    setActivityType(type);
    const activityName = type === "cardio" ? "cardio" : "exercício";
    elements.dialogTitle.textContent = `${activity ? "Editar" : "Adicionar"} ${activityName}`;
    elements.saveExercise.textContent = activity ? "Salvar alterações" : `Adicionar ${activityName}`;
    elements.dialog.showModal();
    elements.exerciseName.focus();
}

function renderSetFields(values) {
    const count = Number(elements.exerciseSeries.value);
    if (!Number.isInteger(count) || count < 1 || count > 30) return;

    editorSetValues = Array.from({ length: count }, (_, index) => ({
        weight: values[index] ? values[index].weight : "",
        reps: values[index] ? values[index].reps : ""
    }));

    const rows = editorSetValues.map((set, index) => {
        const row = document.createElement("div");
        row.className = "set-field-row";

        const label = document.createElement("span");
        label.className = "set-field-name";
        label.textContent = `Série ${index + 1}`;

        const weightField = document.createElement("label");
        weightField.className = "set-input-field";
        const weightLabel = document.createElement("span");
        weightLabel.textContent = "Peso (kg)";
        const weightInput = document.createElement("input");
        weightInput.type = "text";
        weightInput.inputMode = "decimal";
        weightInput.maxLength = 12;
        weightInput.placeholder = "0";
        weightInput.value = set.weight;
        weightInput.setAttribute("aria-label", `Peso em kg da série ${index + 1}`);
        weightInput.addEventListener("input", (event) => {
            editorSetValues[index].weight = event.currentTarget.value.trim();
        });
        weightField.append(weightLabel, weightInput);

        const repsField = document.createElement("label");
        repsField.className = "set-input-field";
        const repsLabel = document.createElement("span");
        repsLabel.textContent = "Repetições";
        const repsOptional = document.createElement("small");
        repsOptional.textContent = "opcional";
        repsLabel.append(repsOptional);
        const repsInput = document.createElement("input");
        repsInput.type = "text";
        repsInput.inputMode = "numeric";
        repsInput.maxLength = 12;
        repsInput.placeholder = "—";
        repsInput.value = set.reps;
        repsInput.setAttribute("aria-label", `Repetições da série ${index + 1}, opcional`);
        repsInput.addEventListener("input", (event) => {
            editorSetValues[index].reps = event.currentTarget.value.trim();
        });
        repsField.append(repsLabel, repsInput);

        row.append(label, weightField, repsField);
        return row;
    });
    elements.setFields.replaceChildren(...rows);
}

function saveExercise(event) {
    event.preventDefault();
    const name = elements.exerciseName.value.trim();
    if (!name) {
        elements.exerciseName.setCustomValidity("Informe o nome do exercício.");
        elements.exerciseName.reportValidity();
        elements.exerciseName.setCustomValidity("");
        return;
    }

    const day = getSelectedDay();
    const existing = day.exercises.find((exercise) => exercise.id === editingExerciseId);
    let activity;

    if (editorActivityType === "cardio") {
        const duration = Number(elements.cardioDuration.value);
        if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
            elements.cardioDuration.setCustomValidity("Informe uma duração entre 1 e 1440 minutos.");
            elements.cardioDuration.reportValidity();
            elements.cardioDuration.setCustomValidity("");
            return;
        }

        activity = {
            id: existing ? existing.id : createExerciseId(),
            type: "cardio",
            name,
            duration,
            distance: elements.cardioDistance.value.trim(),
            intensity: elements.cardioIntensity.value.trim(),
            notes: elements.exerciseNotes.value.trim()
        };
    } else {
        const seriesCount = Number(elements.exerciseSeries.value);
        if (!Number.isInteger(seriesCount) || seriesCount < 1 || seriesCount > 30) {
            elements.exerciseSeries.setCustomValidity("Informe de 1 a 30 séries.");
            elements.exerciseSeries.reportValidity();
            elements.exerciseSeries.setCustomValidity("");
            return;
        }

        activity = {
            id: existing ? existing.id : createExerciseId(),
            type: "exercise",
            name,
            series: seriesCount,
            sets: editorSetValues.slice(0, seriesCount).map((set) => ({
                weight: set.weight.trim(),
                reps: set.reps.trim()
            })),
            notes: elements.exerciseNotes.value.trim()
        };
    }

    if (existing) {
        day.exercises[day.exercises.indexOf(existing)] = activity;
    } else {
        day.exercises.push(activity);
    }

    const saved = saveState();
    elements.dialog.close();
    renderDayList();
    renderWorkout();
    if (saved) {
        const label = editorActivityType === "cardio" ? "Cardio" : "Exercício";
        showToast(existing ? `${label} atualizado.` : `${label} adicionado.`);
    }
}

function handleExerciseAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;

    const day = getSelectedDay();
    const item = button.closest("[data-exercise-id]");
    const index = day.exercises.findIndex((exercise) => exercise.id === item.dataset.exerciseId);
    if (index < 0) return;

    if (button.dataset.action === "edit") {
        openActivityDialog(day.exercises[index]);
        return;
    }

    if (button.dataset.action === "delete") {
        const exercise = day.exercises[index];
        if (!window.confirm(`Excluir "${exercise.name}" deste treino?`)) return;
        day.exercises.splice(index, 1);
        const saved = saveState();
        renderDayList();
        renderWorkout();
        if (saved) showToast("Atividade excluída.");
        return;
    }

    const targetIndex = button.dataset.action === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= day.exercises.length) return;
    [day.exercises[index], day.exercises[targetIndex]] = [day.exercises[targetIndex], day.exercises[index]];
    saveState();
    renderWorkout();
}

function clearWorkout() {
    const day = getSelectedDay();
    if (!hasWorkout(day)) return;
    if (!window.confirm(`Limpar o treino de ${DAYS.find((entry) => entry.id === day.id).name}?`)) return;
    day.name = "";
    day.exercises = [];
    const saved = saveState();
    renderDayList();
    renderWorkout();
    if (saved) showToast("Treino limpo.");
}

function openRestDialog() {
    const day = getSelectedDay();
    const editing = hasRest(day);
    elements.restReasonInput.value = editing ? day.restReason : "";
    elements.restDialogTitle.textContent = editing ? "Editar justificativa" : "Registrar descanso";
    elements.saveRest.textContent = editing ? "Salvar justificativa" : "Salvar descanso";
    elements.restDialog.showModal();
    elements.restReasonInput.focus();
}

function saveRest(event) {
    event.preventDefault();
    const reason = elements.restReasonInput.value.trim();
    if (!reason) {
        elements.restReasonInput.setCustomValidity("Informe o motivo do descanso.");
        elements.restReasonInput.reportValidity();
        elements.restReasonInput.setCustomValidity("");
        return;
    }

    const day = getSelectedDay();
    day.restReason = reason;
    const saved = saveState();
    elements.restDialog.close();
    renderDayList();
    renderWorkout();
    if (saved) showToast("Descanso registrado com justificativa.");
}

function resumeWorkout() {
    const day = getSelectedDay();
    if (!hasRest(day)) return;
    day.restReason = "";
    const saved = saveState();
    renderDayList();
    renderWorkout();
    if (saved) showToast("Treino retomado. Seu planejamento continua salvo.");
}

elements.weekSelect.addEventListener("change", (event) => {
    selectWeek(event.currentTarget.value);
});

elements.previousWeek.addEventListener("click", () => moveWeek(-1));
elements.nextWeek.addEventListener("click", () => moveWeek(1));
elements.newWeek.addEventListener("click", () => createWeek(false));
elements.copyWeek.addEventListener("click", () => createWeek(true));
elements.resetWeeks.addEventListener("click", openResetWeeksDialog);
elements.resetWeeksForm.addEventListener("submit", restartFromWeekOne);
elements.closeResetWeeksDialog.addEventListener("click", () => elements.resetWeeksDialog.close());
elements.cancelResetWeeks.addEventListener("click", () => elements.resetWeeksDialog.close());

elements.dayList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-day-id]");
    if (!button) return;
    state.selectedDayId = button.dataset.dayId;
    saveState();
    renderDayList();
    renderWorkout();
});

elements.workoutName.addEventListener("input", (event) => {
    const day = getSelectedDay();
    day.name = event.currentTarget.value;
    saveState();
    renderDayList();
    elements.clearWorkout.hidden = !hasWorkout(day);
});

elements.exerciseSeries.addEventListener("input", () => {
    renderSetFields(editorSetValues);
});
elements.activityTypePicker.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-activity-type]");
    if (button) setActivityType(button.dataset.activityType);
});
elements.addExercise.addEventListener("click", () => openActivityDialog());
elements.emptyAddExercise.addEventListener("click", () => openActivityDialog());
elements.exerciseList.addEventListener("click", handleExerciseAction);
elements.exerciseForm.addEventListener("submit", saveExercise);
elements.closeDialog.addEventListener("click", () => elements.dialog.close());
elements.cancelDialog.addEventListener("click", () => elements.dialog.close());
elements.clearWorkout.addEventListener("click", clearWorkout);
elements.restButton.addEventListener("click", openRestDialog);
elements.restForm.addEventListener("submit", saveRest);
elements.closeRestDialog.addEventListener("click", () => elements.restDialog.close());
elements.cancelRestDialog.addEventListener("click", () => elements.restDialog.close());
elements.resumeWorkout.addEventListener("click", resumeWorkout);

try {
    state = loadState();
    render();
} catch (error) {
    console.error("Falha ao carregar os treinos do Evolift.", error);
    elements.app.hidden = true;
    elements.fatalError.hidden = false;
    elements.fatalErrorMessage.textContent = error.message || "Verifique o armazenamento local do navegador e tente novamente.";
}
