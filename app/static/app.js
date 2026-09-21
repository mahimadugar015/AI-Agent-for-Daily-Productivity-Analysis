// =====================================================
// ProdAI - Frontend JavaScript
// =====================================================

let latestRunId = null;


// =====================================================
// HELPERS
// =====================================================

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value).replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}


function showToast(message) {

    const toast = $("toast");
    const text = $("toast-message");

    if (!toast || !text) return;

    text.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


function formatMinutes(minutes) {

    minutes = Number(minutes || 0);

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }

    return `${mins} min`;
}


// =====================================================
// PAGE NAVIGATION
// =====================================================

function showSection(sectionId, button) {

    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active-section");
    });

    const section = $(sectionId);

    if (section) {
        section.classList.add("active-section");
    }


    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }


    const titles = {

        "dashboard": {
            label: "Overview",
            title: "Good morning, Mahima 👋"
        },

        "ai-agent": {
            label: "Artificial Intelligence",
            title: "AI Agent Center"
        },

        "analytics": {
            label: "Performance",
            title: "Productivity Analytics"
        },

        "tasks": {
            label: "Organize",
            title: "My Tasks"
        }

    };


    if (titles[sectionId]) {

        $("page-label").textContent =
            titles[sectionId].label;

        $("page-title").textContent =
            titles[sectionId].title;
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (sectionId === "tasks") {
        load();
    }
}


// =====================================================
// CURRENT DATE
// =====================================================

function setDate() {

    const today = new Date();

    const formatted = today.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

    $("current-date").textContent = formatted;
}


// =====================================================
// GET DASHBOARD DATA
// =====================================================

async function getDashboardData() {

    const response = await fetch("/api/dashboard");

    if (!response.ok) {
        throw new Error("Unable to load dashboard");
    }

    return await response.json();
}


// =====================================================
// LOAD EVERYTHING
// =====================================================

async function load() {

    try {

        const data = await getDashboardData();

        const tasks = data.tasks || [];

        const completed =
            tasks.filter(task => task.completed).length;

        const activity = data.activity || {};

        const focus =
            Number(activity.focus_minutes || 0);


        // -----------------------------
        // STATISTICS
        // -----------------------------

        $("completed-count").textContent = completed;

        $("focus-time").textContent = focus;

        $("hero-focus").textContent = focus;


        // -----------------------------
        // TASK LIST
        // -----------------------------

        renderTasks(tasks);

        renderAllTasks(tasks);


        // -----------------------------
        // LATEST AI RESULT
        // -----------------------------

        if (data.latest) {

            latestRunId = data.latest.id;

            renderLatestRun(data.latest);

        }

    }

    catch (error) {

        console.error(error);

        showToast(
            "Unable to load application data"
        );
    }
}


// =====================================================
// RENDER TASKS - DASHBOARD
// =====================================================

function renderTasks(tasks) {

    const container = $("task-list");

    if (!container) return;


    if (tasks.length === 0) {

        container.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    No tasks yet
                </h3>

                <p>
                    Add your first task and let AI
                    organize your day.
                </p>

                <button onclick="openTaskModal()">
                    Create Task
                </button>

            </div>

        `;

        return;
    }


    container.innerHTML =
        tasks.slice(0, 6).map(createTaskHTML).join("");
}


// =====================================================
// RENDER ALL TASKS
// =====================================================

function renderAllTasks(tasks) {

    const container = $("all-task-list");

    if (!container) return;


    if (tasks.length === 0) {

        container.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    No tasks available
                </h3>

                <p>
                    Create your first task to get started.
                </p>

                <button onclick="openTaskModal()">
                    Create Task
                </button>

            </div>

        `;

        return;
    }


    container.innerHTML =
        tasks.map(createTaskHTML).join("");
}


// =====================================================
// TASK HTML
// =====================================================

function createTaskHTML(task) {

    const priority =
        String(task.priority || "Medium").toLowerCase();


    return `

        <div class="task-item">

            <button
                class="task-check"
                onclick="toggleTask(${task.id})"
                title="Mark task complete">

                ${task.completed ? "✓" : ""}

            </button>


            <div class="task-name">

                <strong
                    style="
                        ${task.completed
                            ? "text-decoration:line-through;color:#9aa1af;"
                            : ""}
                    "
                >

                    ${escapeHTML(task.title)}

                </strong>


                <span>

                    ${escapeHTML(task.category || "Study")}

                    ·

                    ${task.duration_minutes || 30} min

                    ${
                        task.deadline
                            ? " · Deadline " +
                              escapeHTML(task.deadline)
                            : ""
                    }

                </span>

            </div>


            <span class="priority ${priority}">

                ${escapeHTML(task.priority || "Medium")}

            </span>


            <button
                onclick="deleteTask(${task.id})"
                style="
                    background:none;
                    color:#b0b6c2;
                    font-size:18px;
                    padding:5px;
                "
                title="Delete task">

                ×

            </button>

        </div>

    `;
}


// =====================================================
// OPEN TASK MODAL
// =====================================================

function openTaskModal() {

    const modal = $("task-modal");

    if (!modal) return;

    modal.classList.add("show");


    setTimeout(() => {

        const title = $("task-title");

        if (title) {
            title.focus();
        }

    }, 100);
}


// =====================================================
// CLOSE TASK MODAL
// =====================================================

function closeTaskModal() {

    const modal = $("task-modal");

    if (!modal) return;

    modal.classList.remove("show");
}


// =====================================================
// CREATE TASK
// =====================================================

async function createTask(event) {

    event.preventDefault();


    const title =
        $("task-title").value.trim();

    const description =
        $("task-description").value.trim();

    const priority =
        $("task-priority").value;

    const duration =
        Number($("task-minutes").value || 30);


    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!title) {

        showToast(
            "Please enter a task title"
        );

        $("task-title").focus();

        return;
    }


    if (duration < 5) {

        showToast(
            "Task duration must be at least 5 minutes"
        );

        return;
    }


    // -----------------------------
    // API REQUEST
    // -----------------------------

    try {

        const response = await fetch(
            "/api/tasks",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    title: title,

                    category: "Study",

                    priority:
                        priority.charAt(0).toUpperCase() +
                        priority.slice(1),

                    duration_minutes:
                        duration,

                    deadline: ""

                })
            }
        );


        if (!response.ok) {

            const error =
                await response.text();

            console.error(error);

            throw new Error(
                "Task creation failed"
            );
        }


        const result =
            await response.json();

        console.log(
            "Task created:",
            result
        );


        // -----------------------------
        // RESET FORM
        // -----------------------------

        $("task-form").reset();

        $("task-minutes").value = 30;

        $("task-priority").value = "medium";


        // -----------------------------
        // CLOSE MODAL
        // -----------------------------

        closeTaskModal();


        // -----------------------------
        // RELOAD TASKS
        // -----------------------------

        await load();


        showToast(
            "✓ Task created successfully"
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "Could not create task"
        );
    }
}


// =====================================================
// TOGGLE TASK
// =====================================================

async function toggleTask(id) {

    try {

        const response =
            await fetch(
                `/api/tasks/${id}/complete`,
                {
                    method: "PATCH"
                }
            );


        if (!response.ok) {
            throw new Error(
                "Unable to update task"
            );
        }


        await load();


        showToast(
            "Task updated"
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "Could not update task"
        );
    }
}


// =====================================================
// DELETE TASK
// =====================================================

async function deleteTask(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this task?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/tasks/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {
            throw new Error(
                "Unable to delete task"
            );
        }


        await load();


        showToast(
            "Task deleted"
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "Could not delete task"
        );
    }
}


// =====================================================
// RUN AI AGENT
// =====================================================

async function runAgent() {

    showToast(
        "✦ AI agents are analyzing your day..."
    );


    try {

        const response =
            await fetch(
                "/api/agent/run",
                {
                    method: "POST"
                }
            );


        if (!response.ok) {

            throw new Error(
                "AI agent failed"
            );
        }


        const result =
            await response.json();


        latestRunId =
            result.run_id;


        renderRun(result);


        await load();


        showToast(
            "✓ AI analysis completed"
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "AI analysis could not be completed"
        );
    }
}


// =====================================================
// RENDER AI RESULT
// =====================================================

function renderRun(result) {

    if (!result) return;


    const score =
        Math.round(
            Number(result.score || 0)
        );


    // SCORE

    if ($("productivity-score")) {

        $("productivity-score").textContent =
            `${score}%`;
    }


    if ($("hero-score")) {

        $("hero-score").textContent =
            `${score}%`;
    }


    // INSIGHTS

    const insights =
        result.analysis &&
        result.analysis.insights
            ? result.analysis.insights
            : [];


    const insightContainer =
        $("agent-insights");


    if (insightContainer) {

        if (insights.length === 0) {

            insightContainer.innerHTML = `

                <div class="empty insight-empty">

                    <div class="ai-empty-icon">
                        ✦
                    </div>

                    <h3>
                        Analysis completed
                    </h3>

                    <p>
                        Your productivity data has been analyzed.
                    </p>

                </div>

            `;

        }

        else {

            insightContainer.innerHTML =
                insights.map(
                    insight => `

                        <div
                            style="
                                padding:13px;
                                background:#f7f6ff;
                                border:1px solid #ece9ff;
                                border-radius:10px;
                                margin-bottom:9px;
                                font-size:11px;
                                line-height:1.6;
                                color:#555d70;
                            "
                        >

                            <span
                                style="
                                    color:#6c5ce7;
                                    margin-right:7px;
                                    font-weight:bold;
                                "
                            >
                                ✦
                            </span>

                            ${escapeHTML(insight)}

                        </div>

                    `
                ).join("");
        }
    }


    // SCHEDULE

    const scheduleContainer =
        $("schedule-list");


    const schedule =
        result.schedule || [];


    if (scheduleContainer) {

        if (schedule.length === 0) {

            scheduleContainer.innerHTML = `

                <div class="empty small-empty">

                    <p>
                        No pending tasks available for scheduling.
                    </p>

                </div>

            `;

        }

        else {

            scheduleContainer.innerHTML =
                schedule.map(
                    item => `

                        <div
                            style="
                                padding:12px 0;
                                border-bottom:1px solid #f0f1f4;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    font-size:11px;
                                "
                            >

                                ${escapeHTML(item.time)}
                                —
                                ${escapeHTML(item.task)}

                            </strong>

                            <span
                                style="
                                    display:block;
                                    color:#969ead;
                                    font-size:9px;
                                    margin-top:4px;
                                "
                            >

                                ${escapeHTML(item.priority)}
                                priority ·
                                ${item.duration} min

                            </span>

                        </div>

                    `
                ).join("");
        }
    }


    // RECOMMENDATIONS

    const recommendationContainer =
        $("recommendation-list");


    const recommendations =
        result.recommendations || [];


    if (recommendationContainer) {

        if (recommendations.length === 0) {

            recommendationContainer.innerHTML = `

                <div class="empty small-empty">

                    <p>
                        No recommendations available.
                    </p>

                </div>

            `;

        }

        else {

            recommendationContainer.innerHTML =
                recommendations.map(
                    recommendation => `

                        <div
                            style="
                                padding:13px;
                                background:#faf9ff;
                                border-radius:9px;
                                margin-bottom:8px;
                                font-size:10px;
                                line-height:1.6;
                            "
                        >

                            <span
                                style="
                                    color:#6c5ce7;
                                    font-weight:bold;
                                    margin-right:5px;
                                "
                            >
                                ✦
                            </span>

                            ${escapeHTML(recommendation)}

                        </div>

                    `
                ).join("");
        }
    }
}


// =====================================================
// RENDER SAVED AI RESULT
// =====================================================

function renderLatestRun(latest) {

    if (!latest) return;


    renderRun({

        score: latest.score,

        analysis:
            latest.analysis,

        schedule:
            latest.schedule,

        recommendations:
            latest.recommendations

    });
}


// =====================================================
// FORM EVENT
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {


        // Date

        setDate();


        // Task form

        const form =
            $("task-form");


        if (form) {

            form.addEventListener(
                "submit",
                createTask
            );
        }


        // Close modal when clicking outside

        const modal =
            $("task-modal");


        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal
                    ) {

                        closeTaskModal();

                    }

                }
            );
        }


        // Load application

        load();

    }
);