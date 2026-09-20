class App {
    constructor() {
        this.sections = document.querySelectorAll('.page-section');
        this.navItems = document.querySelectorAll('.nav-item');
        this.mobileMenuBtn = document.getElementById('mobile-menu');
        this.navLinksContainer = document.getElementById('nav-links');
        
        this.init();
    }

    init() {
        // Initialize Authentication
        this.initAuth();

        // Initialize SPA Routing
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.dataset.target;
                if (targetId) {
                    this.navigate(targetId);
                }
            });
        });

        // Mobile Menu Toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => {
                this.navLinksContainer.classList.toggle('active');
            });
        }

        // Close mobile menu on link click
        this.navLinksContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                this.navLinksContainer.classList.remove('active');
            }
        });

        // Initialize Components
        initHabitTracker();
        initTaskManager();
        initDashboard();
        // Delay analytics init slightly to ensure canvas is ready
        setTimeout(initAnalytics, 100);

        // Initialize Alarm Checker
        this.initAlarmChecker();

        // Initialize Theme
        this.initTheme();

        // Check hash on load
        this.handleHashChange();
        window.addEventListener('hashchange', () => this.handleHashChange());
        
        // Expose navigate globally for inline onclicks
        window.app = this;
    }

    initAuth() {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const profileForm = document.getElementById('profile-form');
        const logoutBtn = document.getElementById('logout-btn');
        const googleLoginBtn = document.getElementById('google-login-btn');

        // Toggle Views
        const showSignupBtn = document.getElementById('show-signup-btn');
        const showLoginBtn = document.getElementById('show-login-btn');
        const showForgotBtn = document.getElementById('show-forgot-btn');
        const showLoginBtn2 = document.getElementById('show-login-btn-2');

        const loginView = document.getElementById('login-view');
        const signupView = document.getElementById('signup-view');
        const forgotView = document.getElementById('forgot-view');

        const switchView = (view) => {
            if(loginView) loginView.classList.add('hidden');
            if(signupView) signupView.classList.add('hidden');
            if(forgotView) forgotView.classList.add('hidden');
            if(view) view.classList.remove('hidden');
        };

        if (showSignupBtn) showSignupBtn.addEventListener('click', (e) => { e.preventDefault(); switchView(signupView); });
        if (showLoginBtn) showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); switchView(loginView); });
        if (showForgotBtn) showForgotBtn.addEventListener('click', (e) => { e.preventDefault(); switchView(forgotView); });
        if (showLoginBtn2) showLoginBtn2.addEventListener('click', (e) => { e.preventDefault(); switchView(loginView); });

        // Submit forms
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();
                const pass = document.getElementById('login-password').value;
                const res = Store.login(email, pass);
                if (res.success) {
                    this.updateUIForAuth();
                    this.navigate('dashboard');
                } else {
                    const err = document.getElementById('login-error');
                    err.textContent = res.message;
                    err.classList.remove('hidden');
                }
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('signup-name').value.trim();
                const email = document.getElementById('signup-email').value.trim();
                const pass = document.getElementById('signup-password').value;
                const res = Store.register(name, email, pass);
                if (res.success) {
                    Store.login(email, pass);
                    this.updateUIForAuth();
                    this.navigate('dashboard');
                } else {
                    const err = document.getElementById('signup-error');
                    err.textContent = res.message;
                    err.classList.remove('hidden');
                }
            });
        }

        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                Store.googleLogin();
                this.updateUIForAuth();
                this.navigate('dashboard');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Store.logout();
                this.updateUIForAuth();
                this.navigate('home');
            });
        }

        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('profile-name-input').value.trim();
                if (name) {
                    Store.setUsername(name);
                    this.updateUIForAuth();
                    alert('Profile updated successfully!');
                }
            });
        }

        this.updateUIForAuth();
    }

    updateUIForAuth() {
        const user = Store.getCurrentUser();
        const authReqItems = document.querySelectorAll('.auth-required');
        const loginBtn = document.getElementById('nav-login-btn');
        const profileBtn = document.getElementById('nav-profile-btn');
        const userNameSpan = document.getElementById('nav-user-name');

        if (user) {
            // Logged in
            authReqItems.forEach(item => item.style.display = '');
            if (loginBtn) loginBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = '';
            if (userNameSpan) userNameSpan.textContent = user.name.split(' ')[0]; // first name
            
            // Update Profile Page
            const pName = document.getElementById('profile-display-name');
            const pEmail = document.getElementById('profile-display-email');
            const pInput = document.getElementById('profile-name-input');
            if (pName) pName.textContent = user.name;
            if (pEmail) pEmail.textContent = user.email;
            if (pInput) pInput.value = user.name;

            // Re-render components for new user context
            Store.emitChange();
        } else {
            // Logged out
            authReqItems.forEach(item => item.style.display = 'none');
            if (loginBtn) loginBtn.style.display = '';
            if (profileBtn) profileBtn.style.display = 'none';
        }
    }

    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        const savedTheme = localStorage.getItem('trackwell_theme') || 'light';
        
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                icon.classList.replace('fa-moon', 'fa-sun');
                Chart.defaults.color = '#94a3b8';
                Chart.defaults.borderColor = '#334155';
            } else {
                document.documentElement.removeAttribute('data-theme');
                icon.classList.replace('fa-sun', 'fa-moon');
                Chart.defaults.color = '#64748b';
                Chart.defaults.borderColor = '#e2e8f0';
            }
            
            // Re-render charts if they exist
            const stats = Store.getStats();
            Store.emitChange(); // Force components to re-render, updating charts
        };

        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('trackwell_theme', newTheme);
            applyTheme(newTheme);
        });
    }

    handleHashChange() {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            this.navigate(hash);
        } else {
            this.navigate('home');
        }
    }

    navigate(sectionId) {
        // Navigation Guards
        const requiresAuth = ['dashboard', 'analytics', 'profile'].includes(sectionId);
        if (requiresAuth && !Store.getCurrentUser()) {
            sectionId = 'auth';
        }

        // Update Sections
        this.sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });

        // Update Nav Links
        this.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.target === sectionId && item.tagName === 'A') {
                item.classList.add('active');
            }
        });

        // Update Hash without triggering hashchange event
        if (window.location.hash !== `#${sectionId}`) {
            window.history.pushState(null, null, `#${sectionId}`);
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    initAlarmChecker() {
        const alarmModal = document.getElementById('alarm-modal');
        const alarmText = document.getElementById('alarm-task-text');
        const stopAlarmBtn = document.getElementById('stop-alarm-btn');
        const dismissAlarmBtn = document.getElementById('dismiss-alarm-btn');
        const alarmSound = document.getElementById('alarm-sound');
        
        let currentAlarmId = null;
        let isTaskAlarm = true;

        const checkAlarms = () => {
            const tasks = Store.getTasks();
            const habits = Store.getHabits();
            
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const currentHours = now.getHours().toString().padStart(2, '0');
            const currentMinutes = now.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentHours}:${currentMinutes}`;

            // Check Tasks
            const activeTask = tasks.find(t => 
                !t.completed && 
                !t.alarmNotified &&
                t.deadline === todayStr && 
                t.time === currentTimeStr
            );

            // Check Habits
            const activeHabit = habits.find(h => 
                !h.completed && 
                !h.alarmNotified &&
                h.time === currentTimeStr
            );

            let activeItem = activeTask || activeHabit;

            if (activeItem && currentAlarmId !== activeItem.id) {
                currentAlarmId = activeItem.id;
                isTaskAlarm = !!activeTask;
                
                // Show modal
                alarmText.innerText = activeItem.text;
                alarmModal.classList.remove('hidden');
                
                // Play sound if possible
                if(alarmSound) {
                    alarmSound.currentTime = 0;
                    alarmSound.play().catch(e => console.log('Audio autoplay blocked by browser', e));
                }
            }
        };

        // Check every 10 seconds
        setInterval(checkAlarms, 10000);
        // Check immediately on load
        checkAlarms();

        // Handle buttons
        stopAlarmBtn.addEventListener('click', () => {
            if (currentAlarmId) {
                if (isTaskAlarm) {
                    Store.toggleTask(currentAlarmId); // Completes the task
                    Store.updateTaskStatus(currentAlarmId, { alarmNotified: true });
                } else {
                    Store.toggleHabit(currentAlarmId);
                    Store.updateHabitStatus(currentAlarmId, { alarmNotified: true });
                }
                
                if(alarmSound) alarmSound.pause();
                alarmModal.classList.add('hidden');
                currentAlarmId = null;
            }
        });

        dismissAlarmBtn.addEventListener('click', () => {
            if (currentAlarmId) {
                if (isTaskAlarm) {
                    Store.updateTaskStatus(currentAlarmId, { alarmNotified: true });
                } else {
                    Store.updateHabitStatus(currentAlarmId, { alarmNotified: true });
                }
                if(alarmSound) alarmSound.pause();
                alarmModal.classList.add('hidden');
                currentAlarmId = null;
            }
        });
    }
}

// Bootstrap App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
