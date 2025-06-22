// src/userManagement.js
import { _supabase, state, channels } from './supabaseClient.js'; // Correctly import channels
import { showAlert } from './helpers.js';

export async function setupUserManagementPage() {
    if (state.profile.role !== 'admin') { return; } 

    const userListContainer = document.getElementById('user-list-container');
    if (!userListContainer) return;

    const closeUserDetailsBtn = document.getElementById('close-user-details-btn');
    if (closeUserDetailsBtn && !closeUserDetailsBtn._hasCloseListener) {
        closeUserDetailsBtn.addEventListener('click', () => {
            document.getElementById('user-details-modal').classList.add('hidden');
        });
        closeUserDetailsBtn._hasCloseListener = true;
    }

    await renderUserList();

    const userChannel = _supabase.channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
            renderUserList();
        })
        .subscribe();
    
    // FIX: Push to the 'channels' array directly, not state.channels
    channels.push(userChannel);
}

export async function renderUserList() {
    // ... (rest of the function is correct and does not need changes)
}

export async function showUserDetailsModal(userId) {
    // ... (rest of the function is correct and does not need changes)
}
