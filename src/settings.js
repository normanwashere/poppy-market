// src/settings.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

export async function setupGlobalSettingsPage() {
    if (state.profile.role !== 'admin') { return; }

    const settingsContainer = document.getElementById('settings-list');
    if (!settingsContainer) return;

    // Re-render immediately on setup
    await renderGlobalSettings();

    // Real-time listener for global_settings changes
    const settingsChannel = _supabase.channel('public:global_settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'global_settings' }, payload => {
            // Re-fetch to update cached settings (state.globalSettings)
            fetchGlobalSettingsForSettingsPage(); // Use a dedicated fetch for this module
            renderGlobalSettings(); // Re-render the display
        })
        .subscribe();
    state.channels.push(settingsChannel); // Store channel to unsubscribe later
}

// This function needs to be aware of the global settings state, but can be local.
// A separate fetch for this module to avoid circular dependency if fetchGlobalSettings was exported from main.js
async function fetchGlobalSettingsForSettingsPage() {
    const { data, error } = await _supabase.from('global_settings').select('*');
    if (error) {
        console.error('Error fetching global settings for settings page:', error.message);
        return {};
    }
    // Update the shared global state
    state.globalSettings = data.reduce((acc, setting) => {
        let value;
        switch (setting.data_type) {
            case 'numeric': value = parseFloat(setting.value); break;
            case 'boolean': value = setting.value === 'true'; break;
            case 'json': try { value = JSON.parse(setting.value); } catch (e) { console.error(`Error parsing JSON for setting ${setting.key_name}:`, e); value = setting.value; } break;
            default: value = setting.value;
        }
        acc[setting.key_name] = value;
        return acc;
    }, {});
    console.log('Global Settings (from settings page) Loaded:', state.globalSettings);
}


export async function renderGlobalSettings() {
    const container = document.getElementById('settings-list');
    if (!container) return;

    const { data: settings, error } = await _supabase.from('global_settings').select('*').order('key_name');
    if (error) {
        showAlert('Error', 'Could not fetch global settings: ' + error.message);
        return;
    }

    if (settings.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">No global settings defined yet.</p>`;
        return;
    }

    container.innerHTML = settings.map(setting => `
        <div class="clay-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex-grow">
                <h3 class="font-playfair text-xl font-bold">${setting.key_name.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h3>
                <p class="text-gray-600 text-sm mt-1">${setting.description || 'No description provided.'}</p>
                <p class="text-xs text-gray-500 mt-2">Type: ${setting.data_type} | Editable: ${setting.admin_editable ? 'Yes' : 'No'}</p>
            </div>
            <div class="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                <span id="setting-value-${setting.key_name}" class="font-bold text-lg">${setting.data_type === 'numeric' ? parseFloat(setting.value).toLocaleString() : setting.value}</span>
                ${setting.admin_editable ? `<button class="edit-setting-btn clay-button !p-2" data-key="${setting.key_name}" data-value="${setting.value}" data-type="${setting.data_type}"><i data-lucide="pencil" class="h-4 w-4"></i></button>` : ''}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-setting-btn').forEach(button => {
        // Remove old listeners to prevent duplicates
        if (button._hasEditListener) {
            button.removeEventListener('click', button._hasEditListener);
        }
        const editHandler = async (e) => {
            const key = e.currentTarget.dataset.key;
            const currentValue = e.currentTarget.dataset.value;
            const dataType = e.currentTarget.dataset.type;

            let newValue;
            if (dataType === 'boolean') {
                const currentBool = currentValue === 'true';
                newValue = confirm(`Toggle "${key.replace(/_/g, ' ')}"? Current: ${currentBool ? 'TRUE' : 'FALSE'}`) ? (!currentBool).toString() : null;
            } else {
                newValue = prompt(`Edit "${key.replace(/_/g, ' ')}"\n(Current: ${currentValue}, Type: ${dataType}):`, currentValue);
            }

            if (newValue !== null) {
                e.currentTarget.disabled = true;
                e.currentTarget.innerHTML = '<div class="spinner h-4 w-4"></div>'; // Show spinner
                await updateGlobalSetting(key, newValue, dataType);
                e.currentTarget.disabled = false;
                e.currentTarget.innerHTML = '<i data-lucide="pencil" class="h-4 w-4"></i>'; // Restore icon
                lucide.createIcons(); // Re-create icon
            }
        };
        button.addEventListener('click', editHandler);
        button._hasEditListener = editHandler; // Store reference
    });
    lucide.createIcons(); // Ensure icons are created after rendering
}

export async function updateGlobalSetting(key_name, new_value, data_type) {
    let parsed_value = new_value;
    if (data_type === 'numeric') {
        parsed_value = parseFloat(new_value);
        if (isNaN(parsed_value)) {
            showAlert('Invalid Input', 'Please enter a valid number.');
            return;
        }
        parsed_value = parsed_value.toString();
    } else if (data_type === 'boolean') {
        parsed_value = (new_value.toLowerCase() === 'true' || new_value.toLowerCase() === '1').toString();
    } else if (data_type === 'json') {
        try {
            JSON.parse(new_value);
            parsed_value = new_value;
        } catch (e) {
            showAlert('Invalid Input', 'Please enter valid JSON.');
            return;
        }
    }

    const { error } = await _supabase.from('global_settings')
        .update({ value: parsed_value, last_updated_by: state.currentUser.id, updated_at: new Date() })
        .eq('key_name', key_name);

    if (error) {
        showAlert('Error', 'Failed to update setting: ' + error.message);
    } else {
        showAlert('Success', `Setting "${key_name}" updated.`);
        // Re-fetch global settings after update to ensure state.globalSettings is consistent
        await fetchGlobalSettingsForSettingsPage();
    }
}
