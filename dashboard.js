function initDashboard() {
    const scoreEl = document.getElementById('stat-score');
    const tasksEl = document.getElementById('stat-tasks');
    const habitsEl = document.getElementById('stat-habits');
    const rateEl = document.getElementById('stat-rate');
    const dateEl = document.getElementById('current-date');
    const remindersPanel = document.getElementById('reminders-panel');
    const welcomeMessageEl = document.getElementById('welcome-message');

    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = `Today is ${new Date().toLocaleDateString('en-US', options)}`;

    function updateStats() {
        const stats = Store.getStats();
        const username = Store.getUsername();

        if (username) {
            welcomeMessageEl.innerHTML = `Welcome Back, ${username}! <span class="wave">👋</span>`;
        } else {
            welcomeMessageEl.innerHTML = `Welcome Back! <span class="wave">👋</span>`;
        }

        // Animate numbers (simple implementation)
        scoreEl.textContent = `${stats.score}%`;
        tasksEl.textContent = stats.pendingTasks;
        habitsEl.textContent = `${stats.completedHabits}/${stats.totalHabits}`;
        rateEl.textContent = `${stats.completionRate}%`;

        updateReminders();
    }

    function updateReminders() {
        remindersPanel.innerHTML = '';
        const tasks = Store.getTasks();
        const habits = Store.getHabits();

        const today = new Date();
        today.setHours(0,0,0,0);

        let reminders = [];

        // Check for urgent tasks (due today or overdue)
        tasks.filter(t => !t.completed && t.deadline).forEach(t => {
            const d = new Date(t.deadline);
            d.setHours(0,0,0,0);
            if (d.getTime() <= today.getTime()) {
                reminders.push({
                    text: `Task "${t.text}" is due ${d.getTime() < today.getTime() ? 'OVERDUE' : 'TODAY'}!`,
                    urgent: true,
                    icon: 'fa-triangle-exclamation'
                });
            }
        });

        // Check for pending habits if late in the day
        const currentHour = new Date().getHours();
        if (currentHour >= 18) {
            const pendingHabitsCount = habits.filter(h => !h.completed).length;
            if (pendingHabitsCount > 0) {
                reminders.push({
                    text: `You have ${pendingHabitsCount} habits left to complete today. Keep it up!`,
                    urgent: false,
                    icon: 'fa-fire'
                });
            }
        }

        // Render reminders
        if (reminders.length === 0) {
            remindersPanel.innerHTML = `
                <div class="reminder-alert" style="background: var(--priority-low); color: var(--priority-low-text);">
                    <i class="fa-solid fa-check-circle"></i>
                    <span>All caught up! No urgent reminders.</span>
                </div>
            `;
        } else {
            reminders.forEach(r => {
                const div = document.createElement('div');
                div.className = `reminder-alert ${r.urgent ? 'urgent' : ''}`;
                div.innerHTML = `
                    <i class="fa-solid ${r.icon}"></i>
                    <span>${r.text}</span>
                `;
                remindersPanel.appendChild(div);
            });
        }
    }

    Store.subscribe(updateStats);
    updateStats(); // Initial call
}
