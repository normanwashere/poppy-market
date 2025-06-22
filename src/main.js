// src/main.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert, setLoading, parseDateAsUTC, getWeekRange, getMonthRange } from './helpers.js';
import { pageTemplates, modalTemplates } from './templates.js';
import { renderNav } from './navigation.js';
import { setupLoginPage, setupSignupPage } from './auth.js';
import { setupDashboardPage } from './dashboard.js';
import { setupSchedulerPage } from './scheduler.js';
import { setupUserManagementPage } from './userManagement.js';
import { setupBonusRulesPage } from './rules.js'; // Assuming this now covers old bonus_rules and new rule_sets/rules
import { setupBonusReviewPage } from './bonusReview.js';
import { setupGlobalSettingsPage } from './settings.js';
import { setupRuleSetManagementPage } from './rules.js'; // Rule Set Management
import { setupUserProfilePage } from './userProfile.js';

// Global DOM Elements
const loader = document.getElementById('loader');
const appContainer = document.getElementById('app-container');
const modalContainer = document.getElementById('modal-container');
const mainHeader = document.getElementById('main-header');
const navLinksContainer = document.getElementById('nav-links');
const profileDropdown = document.getElementById('profile-dropdown');
const profileButton = document.getElementById('profile-button');
const profileName = document.getElementById('profile-name');

// Make global state and helper functions accessible by other modules that need them
// This is often done by passing them as arguments or having a central 'context' module,
// but for initial migration, we'll export direct references for now.
// In a more advanced app, you might use a shared event bus or a state management library.
window.state = state; // Expose state globally for now for simplicity
window.showAlert = showAlert; // Expose showAlert globally
window.setLoading = setLoading; // Expose setLoading globally
window.lucide = lucide; // Expose Lucide global function

// Helper to fetch global settings (still resides here as it's a core global operation)
async function fetchGlobalSettings() {
    const { data, error } = await _supabase.from('global_settings').select('*');
    if (error) {
        console.error('Error fetching global settings:', error.message);
        return {};
    }
    state.globalSettings = data.reduce((acc, setting) => {
        let value;
        switch (setting.data_type) {
            case 'numeric':
                value = parseFloat(setting.value);
                break;
            case 'boolean':
                value = setting.value === 'true';
                break;
            case 'json':
                try {
                    value = JSON.parse(setting.value);
                } catch (e) {
                    console.error(`Error parsing JSON for setting ${setting.key_name}:`, e);
                    value = setting.value; // Fallback to raw string
                }
                break;
            default:
                value = setting.value;
        }
        acc[setting.key_name] = value;
        return acc;
    }, {});
    console.log('Global Settings Loaded:', state.globalSettings);
}

// Central function to show pages
export function showPage(pageName) {
    // Unsubscribe from all existing channels before showing a new page
    if (channels.length > 0) {
        channels.forEach(channel => {
            _supabase.removeChannel(channel);
        });
        channels = []; // Clear the array after removing channels
    }

    if (!pageTemplates[pageName]) return;
    appContainer.innerHTML = pageTemplates[pageName];
    state.currentPage = pageName;

    appContainer.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(el.dataset.page);
        })
    })

    // Only create icons after the page content has been injected
    lucide.createIcons();

    switch (pageName) {
        case 'login': setupLoginPage(_supabase, state, showAlert, showPage); break;
        case 'signup': setupSignupPage(_supabase, state, showAlert, showPage); break;
        case 'dashboard': setupDashboardPage(_supabase, state, showAlert); break;
        case 'scheduler': setupSchedulerPage(_supabase, state, showAlert); break;
        case 'userManagement': setupUserManagementPage(_supabase, state, showAlert); break;
        case 'bonusRules': setupBonusRulesPage(_supabase, state, showAlert); break;
        case 'bonusReview': setupBonusReviewPage(_supabase, state, showAlert); break;
        case 'globalSettings': setupGlobalSettingsPage(_supabase, state, showAlert, fetchGlobalSettings); break;
        case 'ruleSetManagement': setupRuleSetManagementPage(_supabase, state, showAlert); break;
        case 'userProfile': setupUserProfilePage(_supabase, state, showAlert); break;
    }
}

// Central function to handle user session checks
async function checkUserSession() {
    setLoading(true);
    await fetchGlobalSettings();
    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error) {
        console.error("Error getting session:", error.message);
        showAlert('Session Error', 'Could not retrieve session. Please log in again.', () => handleLogout(true));
        setLoading(false);
        return;
    }

    if (session) {
        state.currentUser = session.user;
        const { data: profile, error: profileError } = await _supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error("Error fetching profile:", profileError.message);
            showAlert('Profile Error', 'Could not load your profile. Please try logging in again.', () => handleLogout(true));
            setLoading(false);
        } else if (profile) {
            if (profile.status === 'approved') {
                state.profile = profile;
                state.isLoggedIn = true;
                renderNav(state, showPage, handleLogout); // Pass dependencies
                if (state.currentPage === 'login' || state.currentPage === 'signup') {
                    showPage('dashboard');
                } else {
                    showPage(state.currentPage);
                }
            } else {
                await _supabase.auth.signOut();
                showAlert('Account Pending', 'Your account is still awaiting admin approval. You can login once approved.', () => handleLogout(true));
                setLoading(false);
            }
        }
    } else {
        handleLogout(true);
    }
}

// Central function to handle logout
export async function handleLogout(isInitial = false) { // Exported for navigation module
    if (!isInitial) {
        const { error } = await _supabase.auth.signOut();
        if (error) {
            showAlert('Logout Error', error.message);
            return;
        }
    }
    state.isLoggedIn = false;
    state.currentUser = null;
    state.profile = null;
    state.currentPage = 'login';

    if (channels.length > 0) {
        channels.forEach(channel => _supabase.removeChannel(channel));
        channels = [];
    }

    renderNav(state, showPage, handleLogout); // Pass dependencies
    showPage('login');
    setLoading(false);
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    modalContainer.innerHTML = Object.values(modalTemplates).join('');

    _supabase.auth.onAuthStateChange((event, session) => {
        checkUserSession();
    });

    document.body.addEventListener('click', (e) => {
        const pageButton = e.target.closest('[data-page]');
        if (pageButton) {
            e.preventDefault();
            if (!profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
            }
            showPage(pageButton.getAttribute('data-page'));
        }
    });

    profileButton.addEventListener('click', () => {
        profileDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
});
