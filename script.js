const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const subtaskGroup = document.getElementById("subtask-group");
const addSubtaskBtn = document.getElementById("add-subtask");
const ongoingList = document.getElementById("ongoing-tasks");
const completedList = document.getElementById("completed-tasks");

// CRUD-enabled structure: { id, title, editing, subtasks: [{text, done, editing}], completed, progress }
let tasks = JSON.parse(localStorage.getItem("tasks_advanced_v2")) || [];

function saveTasks() {
    localStorage.setItem("tasks_advanced_v2", JSON.stringify(tasks));
}

function reloadUI() {
    ongoingList.innerHTML = "";
    completedList.innerHTML = "";

    let ongoing = tasks.filter(t => !t.completed);
    let completed = tasks.filter(t => t.completed);

    for (const t of ongoing) ongoingList.appendChild(renderTaskCard(t, false));
    for (const t of completed) completedList.appendChild(renderTaskCard(t, true));
}

// --- Task Add/Edit/Delete/Undo ---
taskForm.onsubmit = function (e) {
    e.preventDefault();
    let subtasks = [];
    document.querySelectorAll(".subtask-input").forEach(stin => {
        if (stin.value.trim().length > 0)
            subtasks.push({ text: stin.value.trim(), done: false, editing: false });
    });
    let task = {
        id: Date.now() + Math.random().toString(36).substr(2, 6),
        title: taskInput.value.trim(),
        editing: false,
        subtasks,
        completed: false,
        progress: (subtasks.length === 0 ? 100 : 0)
    };
    tasks.push(task);
    saveTasks();
    resetTaskForm();
    reloadUI();
};

function resetTaskForm() {
    taskInput.value = "";
    subtaskGroup.innerHTML = `
    <div class="subtask-row">
      <input type="text" class="subtask-input" placeholder="Subtask (optional)" />
      <button type="button" class="remove-subtask" title="Remove subtask">&times;</button>
    </div>`;
}
addSubtaskBtn.onclick = function () {
    let div = document.createElement("div");
    div.className = "subtask-row";
    div.innerHTML = `<input type="text" class="subtask-input" placeholder="Subtask (optional)" />
    <button type="button" class="remove-subtask" title="Remove subtask">&times;</button>`;
    subtaskGroup.appendChild(div);
};
subtaskGroup.addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-subtask")) {
        e.target.parentNode.remove();
    }
});

// --- Renderable CRUD Task Card ---
function renderTaskCard(task, isCompletedSection) {
    let card = document.createElement("li");
    card.className = "task-card";
    let tRow = document.createElement("div");
    tRow.className = "task-title-row";

    // TITLE (view/edit)
    if (task.editing) {
        let editInput = document.createElement("input");
        editInput.type = "text";
        editInput.value = task.title;
        editInput.className = "edit-task-input";
        editInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") finishEditTask();
            if (e.key === "Escape") cancelEditTask();
        });
        editInput.addEventListener("blur", finishEditTask);
        function finishEditTask() {
            let value = editInput.value.trim();
            if (value) task.title = value;
            task.editing = false;
            saveTasks();
            reloadUI();
        }
        function cancelEditTask() {
            task.editing = false;
            reloadUI();
        }
        tRow.appendChild(editInput);
        setTimeout(() => editInput.focus(), 100);
    } else {
        let tTitle = document.createElement("span");
        tTitle.className = "task-title";
        tTitle.innerText = task.title;
        tRow.appendChild(tTitle);
    }

    // ACTIONS
    let actions = document.createElement("div");
    actions.className = "task-actions";

    // Edit task
    if (!task.editing) {
        let editBtn = document.createElement("button");
        editBtn.className = "action-btn";
        editBtn.textContent = "Edit";
        editBtn.onclick = () => {
            task.editing = true;
            reloadUI();
        };
        actions.appendChild(editBtn);
    }

    // Complete/Undo Task (for no-subtasks)
    if (task.subtasks.length === 0) {
        let completeBtn = document.createElement("button");
        completeBtn.className = "action-btn";
        completeBtn.textContent = task.completed ? "Undo" : "Complete";
        completeBtn.onclick = function () {
            task.completed = !task.completed;
            task.progress = task.completed ? 100 : 0;
            saveTasks();
            reloadUI();
        };
        actions.appendChild(completeBtn);
    }

    // Undo for completed tasks with subtasks
    if (isCompletedSection && task.subtasks.length > 0) {
        let undoBtn = document.createElement("button");
        undoBtn.className = "action-btn undo";
        undoBtn.textContent = "Undo";
        undoBtn.onclick = function () {
            task.completed = false;
            for (let st of task.subtasks) st.done = false;
            task.progress = 0;
            saveTasks();
            reloadUI();
        };
        actions.appendChild(undoBtn);
    }

    // Delete task
    let delBtn = document.createElement("button");
    delBtn.className = "action-btn delete";
    delBtn.textContent = "Delete";
    delBtn.onclick = function () {
        tasks = tasks.filter(tt => tt.id !== task.id);
        saveTasks();
        reloadUI();
    };
    actions.appendChild(delBtn);

    tRow.appendChild(actions);
    card.appendChild(tRow);

    // SUBTASKS CRUD
    if (task.subtasks.length > 0) {
        let stUl = document.createElement("ul");
        stUl.className = "subtasks-list";

        for (let i = 0; i < task.subtasks.length; ++i) {
            let stLi = document.createElement("li");
            // Edit/view subtask text
            if (task.subtasks[i].editing) {
                let stEditInput = document.createElement("input");
                stEditInput.type = "text";
                stEditInput.value = task.subtasks[i].text;
                stEditInput.className = "edit-task-input";
                stEditInput.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") finishEditSubtask();
                    if (e.key === "Escape") cancelEditSubtask();
                });
                stEditInput.addEventListener("blur", finishEditSubtask);
                function finishEditSubtask() {
                    let nv = stEditInput.value.trim();
                    if (nv) task.subtasks[i].text = nv;
                    task.subtasks[i].editing = false;
                    saveTasks();
                    reloadUI();
                }
                function cancelEditSubtask() {
                    task.subtasks[i].editing = false;
                    reloadUI();
                }
                stLi.appendChild(stEditInput);
                setTimeout(() => stEditInput.focus(), 100);
            } else {
                let stcb = document.createElement("input");
                stcb.type = "checkbox";
                stcb.className = "subtask-check";
                stcb.checked = !!task.subtasks[i].done;
                stcb.onchange = function () {
                    task.subtasks[i].done = stcb.checked;
                    let doneCount = task.subtasks.filter(st => st.done).length;
                    task.progress = (100 * doneCount / task.subtasks.length);
                    task.completed = (doneCount === task.subtasks.length);
                    saveTasks();
                    reloadUI();
                };
                stLi.appendChild(stcb);

                let stSpan = document.createElement("span");
                stSpan.textContent = task.subtasks[i].text;
                stLi.appendChild(stSpan);

                // Edit subtask btn
                let stEditBtn = document.createElement("button");
                stEditBtn.textContent = "✏️";
                stEditBtn.className = "action-btn";
                stEditBtn.style.padding = "2px 5px";
                stEditBtn.title = "Edit subtask";
                stEditBtn.onclick = function () {
                    task.subtasks[i].editing = true;
                    reloadUI();
                };
                stLi.appendChild(stEditBtn);

                // Delete subtask btn
                let stDelBtn = document.createElement("button");
                stDelBtn.textContent = "🗑️";
                stDelBtn.className = "action-btn delete";
                stDelBtn.style.padding = "2px 5px";
                stDelBtn.title = "Delete subtask";
                stDelBtn.onclick = function () {
                    task.subtasks.splice(i, 1);
                    let doneCount = task.subtasks.filter(st => st.done).length;
                    task.progress = (task.subtasks.length === 0 ? 100 : (100 * doneCount / task.subtasks.length));
                    task.completed = (task.subtasks.length > 0 && doneCount === task.subtasks.length);
                    saveTasks();
                    reloadUI();
                };
                stLi.appendChild(stDelBtn);
            }
            stUl.appendChild(stLi);
        }
        card.appendChild(stUl);

        // Progress bar
        let pbarWrap = document.createElement("div");
        pbarWrap.className = "progress-bar-bg";
        let pbar = document.createElement("div");
        pbar.className = "progress-bar";
        pbar.style.width = `${Math.round(task.progress)}%`;
        pbarWrap.appendChild(pbar);
        card.appendChild(pbarWrap);
    }

    // --- Add Subtask Button for ongoing tasks ---
    if (!isCompletedSection) {
        let addSubtaskDiv = document.createElement("div");
        addSubtaskDiv.className = "add-subtask-section";
        addSubtaskDiv.style.marginTop = "8px";

        let addBtn = document.createElement("button");
        addBtn.className = "action-btn";
        addBtn.textContent = "Add Subtask";

        let input = document.createElement("input");
        input.type = "text";
        input.placeholder = "New subtask";
        input.style.display = "none";
        input.className = "add-subtask-input";

        // Toggle input display
        addBtn.onclick = () => {
            if (input.style.display === "none") {
                input.style.display = "inline-block";
                input.focus();
            } else if (input.value.trim()) {
                // Add subtask when input visible and has text
                task.subtasks.push({ text: input.value.trim(), done: false, editing: false });
                let doneCount = task.subtasks.filter(st => st.done).length;
                task.completed = false;
                task.progress = (100 * doneCount / task.subtasks.length);
                saveTasks();
                reloadUI();
            } else {
                // If input empty, just hide
                input.style.display = "none";
            }
        };


        // Add new subtask on Enter
        input.onkeydown = (e) => {
            if (e.key === "Enter" && input.value.trim()) {
                task.subtasks.push({ text: input.value.trim(), done: false, editing: false });
                // Update progress & completion
                let doneCount = task.subtasks.filter(st => st.done).length;
                task.completed = false;
                task.progress = (100 * doneCount / task.subtasks.length);
                saveTasks();
                reloadUI();
            }
        };

        addSubtaskDiv.appendChild(input);
        addSubtaskDiv.appendChild(addBtn);
        card.appendChild(addSubtaskDiv);
    }

    return card;
}

reloadUI();
resetTaskForm();
