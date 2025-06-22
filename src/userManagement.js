// src/userManagement.js
import { _supabase, state } from './supabaseClient.js';
import { showAlert } from './helpers.js';

export async function setupUserManagementPage() {
    if (state.profile.role !== 'admin') { return; } // main.js handles redirect

    const userListContainer = document.getElementById('user-list-container');
    if (!userListContainer) return;

    // Attach listener for user details modal closure only once
    const closeUserDetailsBtn = document.getElementById('close-user-details-btn');
    if (closeUserDetailsBtn && !closeUserDetailsBtn._hasCloseListener) {
        closeUserDetailsBtn.addEventListener('click', () => {
            document.getElementById('user-details-modal').classList.add('hidden');
        });
        closeUserDetailsBtn._hasCloseListener = true;
    }

    await renderUserList();

    // Real-time listener for profiles table changes
    // Unsubscribe from previous channels in main.js showPage function
    const userChannel = _supabase.channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
            renderUserList(); // Re-render the list on any profile change
        })
        .subscribe();
    state.channels.push(userChannel); // Store channel to unsubscribe later
}

export async function renderUserList() {
    const container = document.getElementById('user-list-container');
    if (!container) return;

    const { data: users, error } = await _supabase.from('profiles').select('*').neq('role', 'admin').order('full_name');
    if (error) return showAlert('Error', 'Failed to fetch users: ' + error.message);

    if (users.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">No users found.</p>`;
        return;
    }

    container.innerHTML = `<div>${users.map((user, index) => `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 ${index % 2 !== 0 ? 'bg-[rgba(0,0,0,0.04)]' : ''}">
            <div class="text-center sm:text-left flex-grow cursor-pointer view-user-details" data-userid="${user.id}">
                <p class="font-bold">${user.full_name}</p>
                <p class="text-sm text-gray-600">${user.email}</p>
            </div>
            <div class="flex items-center gap-2 mt-2 sm:mt-0">
                ${user.status === 'pending' ?
                    `<button data-userid="${user.id}" class="approve-user-btn clay-button clay-button-approve px-3 py-2 text-sm">Approve</button>` :
                    `<span class="text-sm font-bold text-green-700 px-3 py-2">Approved</span>`
                }
            </div>
        </div>
    `).join('')}</div>`;

    document.querySelectorAll('.view-user-details').forEach(el => el.addEventListener('click', (e) => showUserDetailsModal(e.currentTarget.dataset.userid)));
    document.querySelectorAll('.approve-user-btn').forEach(button => {
        // Remove old listeners to prevent duplicates
        if (button._hasApproveListener) {
            button.removeEventListener('click', button._hasApproveListener);
        }
        const approveHandler = async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = 'Approving...';
            const userId = btn.dataset.userid;
            // Call the new RPC function to update role and status
            const { error } = await _supabase.rpc('update_user_role_and_status', {
                p_user_id: userId,
                p_new_role: 'seller', // Default to 'seller' role
                p_new_status: 'approved'
            });
            if (error) showAlert('Error', 'Failed to approve user: ' + error.message);
            else showAlert('Success', 'User has been approved.');
            btn.disabled = false;
            btn.textContent = 'Approve';
        };
        button.addEventListener('click', approveHandler);
        button._hasApproveListener = approveHandler; // Store reference
    });
}

// Assumed to be imported from helpers for other modules, but defined here for user management context
export async function showUserDetailsModal(userId) {
    const { data: user, error } = await _supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !user) return showAlert('Error', 'Could not fetch user details.');

    document.getElementById('user-details-name').textContent = user.full_name;
    document.getElementById('user-details-gcash').textContent = user.gcash_number || 'Not set';
    document.getElementById('user-details-contact').textContent = user.contact_number || 'Not set';
    document.getElementById('user-details-emergency').textContent = user.emergency_contact || 'Not set';
    document.getElementById('user-details-modal').classList.remove('hidden');
}
