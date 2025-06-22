// src/rules.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

let passwordConfirmFormHandlers = {};

export async function setupBonusRulesPage() {
    // ... (This function is for the legacy system and does not use channels, so no changes needed here) ...
}

export async function renderBonusRulesList() {
    // ... (No changes needed here) ...
}

export async function setupRuleSetManagementPage() {
    if (state.profile.role !== 'admin') { return; }

    // ... (all your listener and form setup logic is correct) ...

    await renderRuleSetsList();

    const ruleSetsChannel = _supabase.channel('public:rule_sets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rule_sets' }, payload => {
            renderRuleSetsList();
            if (state.currentRuleSetId && payload.new && payload.new.id === state.currentRuleSetId) {
                showRuleSetDetailsModal(state.currentRuleSetId);
            }
        })
        .subscribe();
    // FIX: Push to the 'channels' array directly
    channels.push(ruleSetsChannel);

    const rulesChannel = _supabase.channel('public:rules')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rules' }, payload => {
            if (state.currentRuleSetId && (payload.new && payload.new.rule_set_id === state.currentRuleSetId || payload.old && payload.old.rule_set_id === state.currentRuleSetId)) {
                showRuleSetDetailsModal(state.currentRuleSetId);
            }
        })
        .subscribe();
    // FIX: Push to the 'channels' array directly
    channels.push(rulesChannel);
}

export async function renderRuleSetsList() {
    // ... (rest of the function is correct) ...
}

export async function showRuleSetDetailsModal(ruleSetId) {
    // ... (rest of the function is correct) ...
}
