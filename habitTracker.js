function initHabitTracker() {
    const habitList = document.getElementById('habit-list');
    const addHabitBtn = document.getElementById('add-habit-btn');
    const saveHabitBtn = document.getElementById('save-habit-btn');
    const habitInput = document.getElementById('habit-input');
    const habitForm = document.getElementById('habit-form');

    function renderHabits() {
        const habits = Store.getHabits();
        habitList.innerHTML = '';
        
        if (habits.length === 0) {
            habitList.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem;">No habits added yet.</p>';
            return;
        }

        habits.forEach(habit => {
            const li = document.createElement('li');
            li.className = `list-item ${habit.completed ? 'completed' : ''}`;
            
            let timeBadge = '';
            if (habit.time) {
                timeBadge = `<span class="badge" style="background:#e0e7ff;color:#4f46e5;margin-left:0.5rem;font-size:0.7rem;"><i class="fa-regular fa-clock"></i> ${habit.time}</span>`;
            }

            li.innerHTML = `
                <div class="item-content">
                    <div class="custom-checkbox ${habit.completed ? 'checked' : ''}" data-id="${habit.id}">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <span class="item-text">${habit.text}${timeBadge}</span>
                    ${habit.streak > 0 ? `<span class="badge badge-streak"><i class="fa-solid fa-fire"></i> ${habit.streak}</span>` : ''}
                </div>
                <button class="btn-icon delete" data-id="${habit.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            `;
            habitList.appendChild(li);
        });
    }

    // Toggle Form
    addHabitBtn.addEventListener('click', () => {
        if (habitForm.style.display === 'none') {
            habitForm.style.display = 'flex';
            habitInput.focus();
        } else {
            habitForm.style.display = 'none';
        }
    });

    // Add Habit
    saveHabitBtn.addEventListener('click', () => {
        const text = habitInput.value.trim();
        const timeInput = document.getElementById('habit-time');
        const time = timeInput ? timeInput.value : '';

        if (text) {
            Store.addHabit(text, time);
            habitInput.value = '';
            if (timeInput) timeInput.value = '';
            habitForm.style.display = 'none';
        }
    });

    habitInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveHabitBtn.click();
        }
    });

    // Handle Clicks (Check/Delete)
    habitList.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.custom-checkbox');
        const deleteBtn = e.target.closest('.delete');

        if (checkbox) {
            Store.toggleHabit(checkbox.dataset.id);
        } else if (deleteBtn) {
            Store.deleteHabit(deleteBtn.dataset.id);
        }
    });

    // Subscribe to store changes
    Store.subscribe(renderHabits);

    // Initial render
    Store.resetDailyHabits();
    renderHabits();
}
