// src/userProfile.js
import { _supabase, state } from './supabaseClient.js';
import { showAlert } from './helpers.js';

export async function setupUserProfilePage() {
    if (!state.profile) { return; } // main.js handles redirecting to login if no profile

    document.getElementById('profile-gcash').value = state.profile.gcash_number || '';
    document.getElementById('profile-contact').value = state.profile.contact_number || '';
    document.getElementById('profile-emergency').value = state.profile.emergency_contact || '';

    const profileInfoForm = document.getElementById('profile-info-form');
    if (!profileInfoForm) return;

    if (profileInfoForm._hasProfileInfoListener) {
        profileInfoForm.removeEventListener('submit', profileInfoForm._hasProfileInfoListener);
    }
    const handleInfoSubmit = async e => {
        e.preventDefault();
        const saveInfoButton = e.target.querySelector('button[type="submit"]');
        saveInfoButton.disabled = true;
        saveInfoButton.textContent = 'Saving...';

        const updates = {
            id: state.currentUser.id,
            gcash_number: document.getElementById('profile-gcash').value,
            contact_number: document.getElementById('profile-contact').value,
            emergency_contact: document.getElementById('profile-emergency').value,
            updated_at: new Date()
        };

        const { error } = await _supabase.from('profiles').upsert(updates);
        if (error) showAlert('Error', 'Failed to update profile: ' + error.message);
        else {
            // Update the local state with new profile info
            state.profile = { ...state.profile, ...updates };
            showAlert('Success', 'Your information has been updated.');
        }
        saveInfoButton.disabled = false;
        saveInfoButton.textContent = 'Save Information';
    };
    profileInfoForm.addEventListener('submit', handleInfoSubmit);
    profileInfoForm._hasProfileInfoListener = handleInfoSubmit;


    const passwordChangeForm = document.getElementById('password-change-form');
    if (!passwordChangeForm) return;

    if (passwordChangeForm._hasPasswordChangeListener) {
        passwordChangeForm.removeEventListener('submit', passwordChangeForm._hasPasswordChangeListener);
    }
    const handlePasswordChange = async e => {
        e.preventDefault();
        const newPassword = document.getElementById('profile-new-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;
        const changePasswordButton = e.target.querySelector('button[type="submit"]');

        if (!newPassword || newPassword !== confirmPassword) {
            showAlert('Error', 'Passwords do not match. Please try again.');
            return;
        }
        if (newPassword.length < (state.globalSettings.min_password_length || 8)) {
            showAlert('Error', `New password must be at least ${state.globalSettings.min_password_length || 8} characters long.`);
            return;
        }

        changePasswordButton.disabled = true;
        changePasswordButton.textContent = 'Changing...';

        const { error } = await _supabase.auth.updateUser({ password: newPassword });
        if (error) showAlert('Error', 'Failed to change password: ' + error.message);
        else {
            showAlert('Success', 'Your password has been changed successfully.');
            e.target.reset(); // Clear the password fields
        }
        changePasswordButton.disabled = false;
        changePasswordButton.textContent = 'Change Password';
    };
    passwordChangeForm.addEventListener('submit', handlePasswordChange);
    passwordChangeForm._hasPasswordChangeListener = handlePasswordChange;
}
