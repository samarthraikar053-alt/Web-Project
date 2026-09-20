// Data Layer for Track Well using LocalStorage

// New Auth Keys
const USERS_KEY = 'trackwell_users';
const CURRENT_USER_KEY = 'trackwell_current_user';

// Data Keys (we will append user email to these)
const HABITS_KEY_PREFIX = 'trackwell_habits_';
const TASKS_KEY_PREFIX = 'trackwell_tasks_';

// Default Data for demonstration if empty
const defaultHabits = [
    { id: '1', text: 'Study 2 Hours', completed: false, streak: 5, lastCompleted: null },
    { id: '2', text: 'Drink 3L Water', completed: true, streak: 12, lastCompleted: new Date().toDateString() },
    { id: '3', text: 'Exercise 30 Min', completed: false, streak: 2, lastCompleted: null }
];

const defaultTasks = [
    { id: '1', text: 'Finish Mini Project', completed: false, priority: 'High', deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { id: '2', text: 'Review Notes', completed: true, priority: 'Medium', deadline: new Date().toISOString().split('T')[0] },
    { id: '3', text: 'Email Professor', completed: false, priority: 'Low', deadline: '' }
];

const Store = {
    // --- Auth ---
    getUsers() {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    },
    saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },
    register(name, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already exists.' };
        }
        users.push({ name, email, password });
        this.saveUsers(users);
        return { success: true };
    },
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            this.emitChange();
            return { success: true, user };
        }
        return { success: false, message: 'Invalid credentials.' };
    },
    googleLogin() {
        // Mock Google Login
        const email = 'google_user@example.com';
        const users = this.getUsers();
        let user = users.find(u => u.email === email);
        if (!user) {
            user = { name: 'Google User', email, password: 'google_oauth_mock' };
            users.push(user);
            this.saveUsers(users);
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        this.emitChange();
        return { success: true, user };
    },
    logout() {
        localStorage.removeItem(CURRENT_USER_KEY);
        this.emitChange();
    },
    getCurrentUser() {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    // --- User (Legacy wrapper) ---
    getUsername() {
        const user = this.getCurrentUser();
        return user ? user.name : null;
    },
    setUsername(name) {
        const user = this.getCurrentUser();
        if (user) {
            user.name = name;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            
            // Also update in users list
            const users = this.getUsers();
            const u = users.find(x => x.email === user.email);
            if (u) u.name = name;
            this.saveUsers(users);
            
            this.emitChange();
        }
    },

    // Helper for scoped keys
    getHabitsKey() {
        const user = this.getCurrentUser();
        return user ? HABITS_KEY_PREFIX + user.email : 'trackwell_habits_guest';
    },
    getTasksKey() {
        const user = this.getCurrentUser();
        return user ? TASKS_KEY_PREFIX + user.email : 'trackwell_tasks_guest';
    },

    // --- Habits ---
    getHabits() {
        const habits = localStorage.getItem(this.getHabitsKey());
        if (!habits) {
            this.saveHabits(defaultHabits);
            return defaultHabits;
        }
        return JSON.parse(habits);
    },

    saveHabits(habits) {
        localStorage.setItem(this.getHabitsKey(), JSON.stringify(habits));
        this.emitChange();
    },

    addHabit(text, time) {
        const habits = this.getHabits();
        habits.push({
            id: Date.now().toString(),
            text,
            completed: false,
            streak: 0,
            lastCompleted: null,
            time,
            alarmNotified: false
        });
        this.saveHabits(habits);
    },

    updateHabitStatus(id, updates) {
        const habits = this.getHabits();
        const habit = habits.find(h => h.id === id);
        if (habit) {
            Object.assign(habit, updates);
            this.saveHabits(habits);
        }
    },

    toggleHabit(id) {
        const habits = this.getHabits();
        const habit = habits.find(h => h.id === id);
        if (habit) {
            habit.completed = !habit.completed;
            if (habit.completed) {
                habit.lastCompleted = new Date().toDateString();
                habit.streak += 1;
                habit.alarmNotified = true; // No need to notify if manually completed
            } else {
                habit.lastCompleted = null;
                habit.streak = Math.max(0, habit.streak - 1);
            }
            this.saveHabits(habits);
        }
    },

    deleteHabit(id) {
        let habits = this.getHabits();
        habits = habits.filter(h => h.id !== id);
        this.saveHabits(habits);
    },

    resetDailyHabits() {
        const habits = this.getHabits();
        let changed = false;
        const today = new Date().toDateString();
        habits.forEach(h => {
            if (h.lastCompleted !== today && h.completed) {
                h.completed = false;
                h.alarmNotified = false; // Reset alarm for the new day
                changed = true;
            } else if (h.lastCompleted !== today && !h.completed && h.alarmNotified) {
                // Also reset alarmNotified for uncompleted habits that rolled over
                h.alarmNotified = false;
                changed = true;
            }
            
            // Check if streak broken (last completed was before yesterday)
            if (h.lastCompleted && h.lastCompleted !== today) {
                const lastDate = new Date(h.lastCompleted);
                const currDate = new Date();
                const diffTime = Math.abs(currDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays > 1 && !h.completed) {
                    h.streak = 0;
                    changed = true;
                }
            }
        });
        if (changed) this.saveHabits(habits);
    },

    // --- Tasks ---
    getTasks() {
        const tasks = localStorage.getItem(this.getTasksKey());
        if (!tasks) {
            this.saveTasks(defaultTasks);
            return defaultTasks;
        }
        return JSON.parse(tasks);
    },

    saveTasks(tasks) {
        localStorage.setItem(this.getTasksKey(), JSON.stringify(tasks));
        this.emitChange();
    },

    addTask(text, priority, deadline, time) {
        const tasks = this.getTasks();
        tasks.push({
            id: Date.now().toString(),
            text,
            completed: false,
            priority,
            deadline,
            time,
            alarmNotified: false
        });
        this.saveTasks(tasks);
    },

    updateTaskStatus(id, updates) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            this.saveTasks(tasks);
        }
    },

    toggleTask(id) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks(tasks);
        }
    },

    deleteTask(id) {
        let tasks = this.getTasks();
        tasks = tasks.filter(t => t.id !== id);
        this.saveTasks(tasks);
    },

    // --- Analytics & Stats ---
    getStats() {
        const habits = this.getHabits();
        const tasks = this.getTasks();

        const completedHabits = habits.filter(h => h.completed).length;
        const totalHabits = habits.length;

        const pendingTasks = tasks.filter(t => !t.completed).length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;

        const totalItems = totalHabits + totalTasks;
        const completedItems = completedHabits + completedTasks;
        
        let completionRate = 0;
        if (totalItems > 0) {
            completionRate = Math.round((completedItems / totalItems) * 100);
        }

        // Calculate a mock 'Productivity Score' based on streaks and completion
        let score = completionRate;
        habits.forEach(h => { score += h.streak * 2; }); // Bonus points for streaks
        if (score > 100) score = 100; // Cap at 100%

        return {
            completedHabits,
            totalHabits,
            pendingTasks,
            completedTasks,
            totalTasks,
            completionRate,
            score
        };
    },

    // --- Event Emitter ---
    listeners: [],
    subscribe(listener) {
        this.listeners.push(listener);
    },
    emitChange() {
        this.listeners.forEach(listener => listener());
    }
};
