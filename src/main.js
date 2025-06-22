// src/main.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert, setLoading } from './helpers.js';
import { pageTemplates, modalTemplates } from './templates.js';
import { renderNav } from './navigation.js';
import { setupLoginPage, setupSignupPage } from './auth.js';
import { setupDashboardPage } from './dashboard.js';
// import { initializeScheduler } from './scheduler.js'; // TEMPORARILY COMMENT THIS OUT
import { setupUserManagementPage, showUserDetailsModal } from './userManagement.js';
import { setupBonusRulesPage, setupRuleSetManagementPage, showRuleSetDetailsModal } from './rules.js';
import { setupBonusReviewPage, showReviewModal } from './bonusReview.js';
import { setupGlobalSettingsPage, renderGlobalSettings, updateGlobalSetting } from './settings.js';
import { setupUserProfilePage } from './userProfile.js';

// ... (rest of main.js code) ...

export function showPage(pageName) {
    // ... (existing code) ...

    switch (pageName) {
        case 'login': setupLoginPage(); break;
        case 'signup': setupSignupPage(); break;
        case 'dashboard': setupDashboardPage(); break;
        // case 'scheduler': initializeScheduler(); break; // TEMPORARILY COMMENT THIS OUT
        case 'userManagement': setupUserManagementPage(); break;
        case 'bonusRules': setupBonusRulesPage(); break;
        case 'bonusReview': setupBonusReviewPage(); break;
        case 'globalSettings': setupGlobalSettingsPage(); break;
        case 'ruleSetManagement': setupRuleSetManagementPage(); break;
        case 'userProfile': setupUserProfilePage(); break;
    }
}

// ... (rest of main.js code) ...
