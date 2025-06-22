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

// Global DOM Elements (access from main.js as they are fixed on index.html)
const loader = document.getElementById('loader');
const appContainer = document.getElementById('app-container');
const modalContainer = document.getElementById('modal-container');
const mainHeader = document.getElementById('main-header');
const navLinksContainer = document.getElementById('nav-links');
const profileDropdown = document.getElementById('profile-dropdown');
const profileButton = document.getElementById('profile-button');
const profileName = document.getElementById('profile-name');

// Expose state and core functions globally for direct calls from other modules if needed,
// though passing them as arguments is often cleaner for specific functions.
window.state = state;
window.showAlert = showAlert;
window.setLoading = setLoading;
window.lucide = lucide; // Expose Lucide global function (assuming it's loaded from index.html)

// Helper to fetch global settings (still resides here as it's a core global operation for app state)
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

    // Re-attach data-page listeners for internal navigation
    appContainer.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(el.dataset.page);
        })
    });

    // Re-create icons after the new page content has been injected
    lucide.createIcons();

    // Call specific setup function for the page
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
    setLoading(true); // Shows global loader
    await fetchGlobalSettings(); // Fetches settings from global_settings table
    console.log("fetchGlobalSettings completed.");

    const { data: { session }, error } = await _supabase.auth.getSession(); // Checks for an active user session
    console.log("getSession completed, session:", session, "error:", error);

    if (error) {
        console.error("Error getting session:", error.message);
        showAlert('Session Error', 'Could not retrieve session. Please log in again.', () => handleLogout(true));
        setLoading(false); // Ensure loader is hidden even on error
        return;
    }

    if (session) {
        state.currentUser = session.user;
        // Fetches the user's profile from the 'profiles' table
        const { data: profile, error: profileError } = await _supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error("Error fetching profile:", profileError.message);
            showAlert('Profile Error', 'Could not load your profile. Please try logging in again.', () => handleLogout(true));
            setLoading(false); // Ensure loader is hidden on profile fetch error
        } else if (profile) {
            if (profile.status === 'approved') {
                state.profile = profile;
                state.isLoggedIn = true;
                renderNav(); // renderNav now imports state directly
                if (state.currentPage === 'login' || state.currentPage === 'signup') {
                    showPage('dashboard');
                } else {
                    // If already on a page (e.g., after refresh), re-render that page
                    showPage(state.currentPage);
                }
            } else {
                await _supabase.auth.signOut();
                showAlert('Account Pending', 'Your account is still awaiting admin approval. You can login once approved.', () => handleLogout(true));
                setLoading(false); // Ensure loader is hidden on pending account
            }
        }
    } else {
        handleLogout(true); // No session found, proceed to login page
    }
    // setLoading(false) is now handled by handleLogout or specific error paths within this function.
}

// Central function to handle logout (MODIFIED: Added 'export' keyword here)
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
    state.currentPage = 'login'; // Reset current page to login

    if (channels.length > 0) {
        channels.forEach(channel => _supabase.removeChannel(channel));
        channels = [];
    }

    renderNav(); // renderNav now imports state directly
    showPage('login');
    setLoading(false); // Ensure loader is always hidden after logout flow
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");
    modalContainer.innerHTML = Object.values(modalTemplates).join('');

    _supabase.auth.onAuthStateChange((event, session) => {
        console.log("onAuthStateChange fired. Event:", event, "Session:", session);
        checkUserSession();
    });

    // Event listeners for header navigation
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileButton && profileDropdown) {
        if (!profileButton._hasProfileToggleListener) { // Add flag to prevent duplicate listeners
            const toggleHandler = () => {
                profileDropdown.classList.toggle('hidden');
            };
            profileButton.addEventListener('click', toggleHandler);
            profileButton._hasProfileToggleListener = toggleHandler;

            document.addEventListener('click', (e) => {
                if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target) && !profileDropdown.classList.contains('hidden')) {
                    profileDropdown.classList.add('hidden');
                }
            });
        }
    }

    // Delegated click handler for data-page navigation (app-wide)
    document.body.addEventListener('click', (e) => {
        const pageButton = e.target.closest('[data-page]');
        if (pageButton) {
            e.preventDefault();
            // Close profile dropdown if open
            if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
            }
            showPage(pageButton.getAttribute('data-page'));
        }
    });
});
