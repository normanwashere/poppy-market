// src/main.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert, setLoading } from './helpers.js';
import { pageTemplates, modalTemplates } from './templates.js';
import { renderNav } from './navigation.js';
import { setupLoginPage, setupSignupPage } from './auth.js';
import { initializeScheduler } from './scheduler.js';
import { setupUserManagementPage, showUserDetailsModal } from './userManagement.js';
import { setupBonusRulesPage, setupRuleSetManagementPage, showRuleSetDetailsModal } from './rules.js';
import { setupBonusReviewPage, showReviewModal } from './bonusReview.js';
import { setupGlobalSettingsPage, renderGlobalSettings, updateGlobalSetting } from './settings.js';
import { setupUserProfilePage } from './userProfile.js';
import { setupDashboardPage } from './dashboard.js';

// Global DOM Elements
const appContainer = document.getElementById('app-container');
const modalContainer = document.getElementById('modal-container');

// Expose state and core functions globally for convenience
window.state = state;
window.showAlert = showAlert;
window.setLoading = setLoading;
window.lucide = lucide; 

async function fetchGlobalSettings() {
    const { data, error } = await _supabase.from('global_settings').select('*');
    if (error) {
        console.error('Error fetching global settings:', error.message);
        return;
    }
    state.globalSettings = data.reduce((acc, setting) => {
        let value;
        switch (setting.data_type) {
            case 'numeric': value = parseFloat(setting.value); break;
            case 'boolean': value = setting.value === 'true'; break;
            case 'json': try { value = JSON.parse(setting.value); } catch (e) { value = setting.value; } break;
            default: value = setting.value;
        }
        acc[setting.key_name] = value;
        return acc;
    }, {});
}

export function showPage(pageName) {
    if (channels.length > 0) {
        channels.forEach(channel => _supabase.removeChannel(channel));
        channels.length = 0;
    }

    if (!pageTemplates[pageName]) return;
    appContainer.innerHTML = pageTemplates[pageName];
    state.currentPage = pageName;

    appContainer.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(el.dataset.page);
        })
    });

    lucide.createIcons();

    switch (pageName) {
        case 'login': setupLoginPage(); break;
        case 'signup': setupSignupPage(); break;
        case 'dashboard': setupDashboardPage(); break;
        case 'scheduler': initializeScheduler(); break;
        case 'userManagement': setupUserManagementPage(); break;
        case 'bonusRules': setupBonusRulesPage(); break;
        case 'bonusReview': setupBonusReviewPage(); break;
        case 'globalSettings': setupGlobalSettingsPage(); break;
        case 'ruleSetManagement': setupRuleSetManagementPage(); break;
        case 'userProfile': setupUserProfilePage(); break;
    }
}

async function checkUserSession() {
    setLoading(true);
    await fetchGlobalSettings();

    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error) {
        showAlert('Session Error', 'Could not retrieve session.', () => handleLogout(true));
        return;
    }

    if (session) {
        state.currentUser = session.user;
        const { data: profile, error: profileError } = await _supabase.from('profiles').select('*').eq('id', session.user.id).single();

        if (profileError) {
            showAlert('Profile Error', 'Could not load your profile.', () => handleLogout(true));
        } else if (profile) {
            if (profile.status === 'approved') {
                state.profile = profile;
                state.isLoggedIn = true;
                renderNav();
                showPage(state.currentPage === 'login' ? 'dashboard' : state.currentPage);
            } else {
                showAlert('Account Pending', 'Your account is still awaiting admin approval.', () => handleLogout(true));
            }
        }
    } else {
        handleLogout(true);
    }
}

export async function handleLogout(isInitial = false) {
    if (!isInitial) {
        await _supabase.auth.signOut();
    }
    state.isLoggedIn = false;
    state.currentUser = null;
    state.profile = null;
    state.currentPage = 'login';

    if (channels.length > 0) {
        channels.forEach(channel => _supabase.removeChannel(channel));
        channels.length = 0;
    }

    renderNav();
    showPage('login');
    setLoading(false);
}

document.addEventListener('DOMContentLoaded', () => {
    modalContainer.innerHTML = Object.values(modalTemplates).join('');

    // --- FIX: SIMPLIFIED AND MORE STABLE STARTUP LOGIC ---
    _supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') {
            checkUserSession();
        } else if (event === 'SIGNED_IN') {
            checkUserSession();
        } else if (event === 'SIGNED_OUT') {
            handleLogout(true);
        }
    });

    document.body.addEventListener('click', (e) => {
        const pageButton = e.target.closest('[data-page]');
        if (pageButton) {
            e.preventDefault();
            const profileDropdown = document.getElementById('profile-dropdown');
            if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
            }
            showPage(pageButton.getAttribute('data-page'));
        }
    });
});
