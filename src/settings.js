// src/settings.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

export async function setupGlobalSettingsPage() {
    if (state.profile.role !== 'admin') { return; }

    const settingsContainer = document.getElementById('settings-list');
    if (!settingsContainer) return;

    await renderGlobalSettings();

    const settingsChannel = _supabase.channel('public:global_settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'global_settings' }, payload => {
            fetchGlobalSettingsForSettingsPage(); 
            renderGlobalSettings();
        })
        .subscribe();
    // FIX: Push to the 'channels' array directly
    channels.push(settingsChannel); 
}

async function fetchGlobalSettingsForSettingsPage() {
    // ... (rest of the function is correct) ...
}

export async function renderGlobalSettings() {
    // ... (rest of the function is correct) ...
}

export async function updateGlobalSetting(key_name, new_value, data_type) {
    // ... (rest of the function is correct) ...
}
