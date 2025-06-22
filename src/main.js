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
const loader = document.getElementById('loader');
const appContainer = document.getElementById('app-container');
const modalContainer = document.getElementById('modal-container');
const mainHeader = document.getElementById('main-header');
const navLinksContainer = document.getElementById('nav-links');
const profileDropdown = document.getElementById('profile-dropdown');
const profileButton = document.getElementById('profile-button');
const profileName = document.getElementById('profile-name');

// Expose state and core functions globally for convenience
window.state = state;
window.showAlert = showAlert;
window.setLoading = setLoading;
window.lucide = lucide; 

// Helper to fetch global settings
async function fetchGlobalSettings() {
    console.log("Calling fetchGlobalSettings...");
    const { data, error } = await _supabase.from('global_settings').select('*');
    if (error) {
        console.error('Error fetching global settings:', error.message);
        return {};
    }
    state.globalSettings = data.reduce((acc, setting) => {
        let value;
        switch (setting.data_type) {
            case 'numeric': value = parseFloat(setting.value); break;
            case 'boolean': value = setting.value === 'true'; break;
            case 'json':
                try { value = JSON.parse(setting.value); } catch (e) {
                    console.error(`Error parsing JSON for setting ${setting.key_name}:`, e);
                    value = setting.value;
                }
                break;
            default: value = setting.value;
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
        // FIX: Clear the array by changing its length instead of reassigning it.
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

// Central function to handle user session checks
async function checkUserSession() {
    console.log("checkUserSession called.");
    setLoading(true);
    await fetchGlobalSettings();
    console.log("fetchGlobalSettings completed.");

    const { data: { session }, error } = await _supabase.auth.getSession();
    console.log("getSession completed, session:", session, "error:", error);

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
                renderNav();
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
export async function handleLogout(isInitial = false) {
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
        channels.length = 0; // Also apply the fix here for consistency
    }

    renderNav();
    showPage('login');
    setLoading(false);
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");
    modalContainer.innerHTML = Object.values(modalTemplates).join('');

    _supabase.auth.onAuthStateChange((event, session) => {
        console.log("onAuthStateChange fired. Event:", event, "Session:", session);
        // Do not call checkUserSession() directly here to avoid loops on sign out.
        // It's better to handle initial load and then specific events.
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            checkUserSession();
        } else if (event === 'SIGNED_OUT') {
            handleLogout(true);
        }
    });
    
    // Initial check in case there's no auth state change on first load
    checkUserSession();


    // Event listeners for header navigation
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileButton && profileDropdown) {
        if (!profileButton._hasProfileToggleListener) {
            const toggleHandler = () => profileDropdown.classList.toggle('hidden');
            profileButton.addEventListener('click', toggleHandler);
            profileButton._hasProfileToggleListener = toggleHandler;

            document.addEventListener('click', (e) => {
                if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target) && !profileDropdown.classList.contains('hidden')) {
                    profileDropdown.classList.add('hidden');
                }
            });
        }
    }

    // Delegated click handler for data-page navigation
    document.body.addEventListener('click', (e) => {
        const pageButton = e.target.closest('[data-page]');
        if (pageButton) {
            e.preventDefault();
            if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
            }
            showPage(pageButton.getAttribute('data-page'));
        }
    });
});
