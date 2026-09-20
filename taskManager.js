function initTaskManager() {
    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskInput = document.getElementById('task-input');
    const taskPriority = document.getElementById('task-priority');
    const taskDeadline = document.getElementById('task-deadline');
    const taskForm = document.getElementById('task-form');
    const filterBtns = document.querySelectorAll('#task-filters .filter-btn');

    let currentFilter = 'all';

    function renderTasks() {
        const tasks = Store.getTasks();
        taskList.innerHTML = '';

        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'pending') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });
        
        if (filteredTasks.length === 0) {
            const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed);
            
            if (currentFilter !== 'completed' && allTasksCompleted) {
                taskList.innerHTML = `
                    <div style="text-align: center; padding: 2rem 1rem;">
                        <i class="fa-solid fa-trophy" style="font-size: 2.5rem; color: var(--warning); margin-bottom: 1rem;"></i>
                        <h4 style="color: var(--success); margin-bottom: 0.5rem;">All Tasks Completed!</h4>
                        <p class="text-muted" style="font-size: 0.9rem;">Great job! You don't have any pending tasks right now.</p>
                    </div>
                `;
            } else {
                taskList.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem;">No tasks found.</p>';
            }
            return;
        }

        // Separate tasks by priority groups
        const groups = { High: [], Medium: [], Low: [] };
        
        filteredTasks.forEach(task => {
            groups[task.priority].push(task);
        });

        // Function to render a single list item
        const createListItem = (task) => {
            const li = document.createElement('li');
            li.className = `list-item priority-${task.priority.toLowerCase()} ${task.completed ? 'completed' : ''}`;
            
            // Format Date and Time
            let deadlineText = '';
            if (task.deadline) {
                const d = new Date(task.deadline);
                const today = new Date();
                today.setHours(0,0,0,0);
                const tDate = new Date(d);
                tDate.setHours(0,0,0,0);
                
                let dateBadge = '';
                if (tDate.getTime() === today.getTime()) {
                    dateBadge = `<span class="badge" style="background:#fee2e2;color:#ef4444;">Today</span>`;
                } else if (tDate.getTime() < today.getTime()) {
                    dateBadge = `<span class="badge" style="background:#fee2e2;color:#ef4444;">Overdue</span>`;
                } else {
                    dateBadge = `<span class="badge" style="background:#f1f5f9;color:#64748b;">${d.toLocaleDateString()}</span>`;
                }
                
                let timeBadge = '';
                if (task.time) {
                    timeBadge = `<span class="badge" style="background:#e0e7ff;color:#4f46e5;"><i class="fa-regular fa-clock"></i> ${task.time}</span>`;
                }
                
                deadlineText = dateBadge + ' ' + timeBadge;
            } else if (task.time) {
                 deadlineText = `<span class="badge" style="background:#e0e7ff;color:#4f46e5;"><i class="fa-regular fa-clock"></i> ${task.time}</span>`;
            }

            li.innerHTML = `
                <div class="item-content">
                    <div class="custom-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <div style="display:flex; flex-direction:column;">
                        <span class="item-text">${task.text}</span>
                        <div style="display:flex; gap:0.5rem; margin-top:0.25rem;">
                            <span class="badge priority-${task.priority.toLowerCase()}-text">${task.priority}</span>
                            ${deadlineText}
                        </div>
                    </div>
                </div>
                <button class="btn-icon delete" data-id="${task.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            `;
            return li;
        };

        // Render groups
        ['High', 'Medium', 'Low'].forEach(priority => {
            const priorityTasks = groups[priority];
            if (priorityTasks.length > 0) {
                // Add header
                const header = document.createElement('div');
                header.style.margin = '1rem 0 0.5rem';
                header.style.fontSize = '0.9rem';
                header.style.fontWeight = '600';
                header.style.color = `var(--priority-${priority.toLowerCase()}-text)`;
                header.style.textTransform = 'uppercase';
                header.innerText = `${priority} Priority`;
                taskList.appendChild(header);

                // Sort by completion within group
                priorityTasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

                priorityTasks.forEach(task => {
                    taskList.appendChild(createListItem(task));
                });
            }
        });
    }

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    // Toggle Form
    addTaskBtn.addEventListener('click', () => {
        if (taskForm.style.display === 'none') {
            taskForm.style.display = 'flex';
            taskInput.focus();
        } else {
            taskForm.style.display = 'none';
        }
    });

    // Add Task
    saveTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        const priority = taskPriority.value;
        const deadline = taskDeadline.value;
        const timeInput = document.getElementById('task-time');
        const time = timeInput ? timeInput.value : '';

        if (text) {
            Store.addTask(text, priority, deadline, time);
            taskInput.value = '';
            taskDeadline.value = '';
            if (timeInput) timeInput.value = '';
            taskPriority.value = 'Low';
            taskForm.style.display = 'none';
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveTaskBtn.click();
        }
    });

    // Handle Clicks (Check/Delete)
    taskList.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.custom-checkbox');
        const deleteBtn = e.target.closest('.delete');

        if (checkbox) {
            Store.toggleTask(checkbox.dataset.id);
        } else if (deleteBtn) {
            Store.deleteTask(deleteBtn.dataset.id);
        }
    });

    // Subscribe to store changes
    Store.subscribe(renderTasks);

    // Initial render
    renderTasks();
}
