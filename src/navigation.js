// src/navigation.js
import { state } from './supabaseClient.js'; // Import state
import { showPage, handleLogout } from './main.js'; // Import central functions

export function renderNav() {
    const mainHeader = document.getElementById('main-header');
    const navLinksContainer = document.getElementById('nav-links');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileName = document.getElementById('profile-name');

    if (!mainHeader || !navLinksContainer || !profileDropdown || !profileName) {
        console.error("Navigation elements not found!");
        return;
    }

    if (state.isLoggedIn && state.profile) {
        mainHeader.classList.remove('hidden');
        profileName.textContent = state.profile.full_name || 'User';

        // Base navigation links for all logged-in users
        navLinksContainer.innerHTML = `
            <button data-page="dashboard" class="clay-button px-4 py-2 text-sm">Dashboard</button>
            <button data-page="scheduler" class="clay-button px-4 py-2 text-sm">Scheduler</button>
        `;

        // Profile dropdown links
        let dropdownLinks = `
            <a href="#" data-page="userProfile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-lavender rounded-lg">Profile</a>
        `;
        if (state.profile.role === 'admin') {
            dropdownLinks += `
                <a href="#" data-page="userManagement" class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-lavender rounded-lg">User Management</a>
                <a href="#" data-page="bonusRules" class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-lavender rounded-lg">Bonus Rules</a>
                <a href="#" data-page="bonusReview" class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-lavender rounded-lg">Bonus Review</a>
                <a href="#" data-page="globalSettings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-lavender rounded-lg">Global Settings</a>
                <a href="#" data-page="ruleSetManagement" class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-lavender rounded-lg">Rule Sets</a>
            `;
        }
        dropdownLinks += `
            <a href="#" id="logout-button" class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-lavender rounded-lg">Logout</a>
        `;
        profileDropdown.innerHTML = dropdownLinks;

        // Attach logout listener
        const logoutButton = profileDropdown.querySelector('#logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout(false);
            });
        }

        // Re-create lucide icons in the header
        lucide.createIcons();
    } else {
        mainHeader.classList.add('hidden');
    }
}
