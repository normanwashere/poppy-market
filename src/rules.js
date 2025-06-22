// src/rules.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

let passwordConfirmFormHandlers = {}; // Store handlers for delete confirmation

export async function setupBonusRulesPage() {
    if (state.profile.role !== 'admin') { return; }

    const createRuleBtn = document.getElementById('create-new-rule-btn');
    const modal = document.getElementById('create-bonus-rule-modal');
    const form = document.getElementById('bonus-rule-form');
    const cancelBtn = document.getElementById('cancel-bonus-rule-btn');
    const passwordConfirmModal = document.getElementById('password-confirm-modal');
    const passwordConfirmForm = document.getElementById('password-confirm-form');
    const deletePasswordInput = document.getElementById('delete-password-input');
    const cancelPasswordConfirmBtn = document.getElementById('cancel-password-confirm-btn');

    // Remove existing listener to prevent duplicates
    if (form._hasBonusRuleSubmitListener) {
        form.removeEventListener('submit', form._hasBonusRuleSubmitListener);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        // This still inserts into the old 'bonus_rules' table as per your current code.
        // In a full refactor, this logic would be moved to create entries in 'rule_sets' and 'rules'.
        const newRule = {
            name: document.getElementById('rule-name').value,
            description: document.getElementById('rule-description').value,
            effective_start_date: document.getElementById('effective-start-date').value,
            effective_end_date: document.getElementById('effective-end-date').value || null,
            live_hours_target: parseFloat(document.getElementById('rule-live-hours').value),
            branded_items_target: parseInt(document.getElementById('rule-branded-items').value),
            free_size_target: parseInt(document.getElementById('rule-free-size').value),
            bonus_cadence: document.getElementById('rule-time-frame').value,
            bonus_reset_day: document.getElementById('rule-reset-day').value || null,
            bonus_amount: parseFloat(document.getElementById('rule-bonus-amount').value),
            admin_id: state.currentUser.id,
            is_active: true
        };
        const { error } = await _supabase.from('bonus_rules').insert(newRule);
        if (error) showAlert('Error', 'Failed to create rule: ' + error.message);
        else {
            renderBonusRulesList();
            modal.classList.add('hidden');
            showAlert('Success', 'New bonus rule has been created.');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Rule';
    };
    form.addEventListener('submit', handleSubmit);
    form._hasBonusRuleSubmitListener = handleSubmit;

    createRuleBtn.addEventListener('click', () => { form.reset(); modal.classList.remove('hidden'); });
    cancelBtn.addEventListener('click', () => { modal.classList.add('hidden'); });

    // Handle password confirmation for deletion (centralized handler)
    const deleteConfirmForm = document.getElementById('delete-confirm-form');
    if (deleteConfirmForm && !deleteConfirmForm._hasDeleteConfirmFormListener) {
        const handleDeleteConfirmForm = async (e) => {
            e.preventDefault();
            document.getElementById('delete-confirmation-modal').classList.add('hidden');
            passwordConfirmModal.classList.remove('hidden');
            deletePasswordInput.value = '';

            // This ensures only ONE listener is active for passwordConfirmForm
            const existingPasswordConfirmHandler = passwordConfirmFormHandlers[deleteConfirmForm._deleteType];
            if (existingPasswordConfirmHandler) {
                passwordConfirmForm.removeEventListener('submit', existingPasswordConfirmHandler);
            }

            const handlePasswordConfirmSubmit = async (e) => {
                e.preventDefault();
                const password = deletePasswordInput.value;
                const confirmDeleteBtn = e.target.querySelector('button[type="submit"]');

                if (!password) {
                    showAlert('Error', 'Please enter your password.');
                    return;
                }

                confirmDeleteBtn.disabled = true;
                confirmDeleteBtn.textContent = 'Verifying...';

                const { error: authError } = await _supabase.auth.signInWithPassword({
                    email: state.currentUser.email,
                    password: password,
                });

                if (authError) {
                    showAlert('Authentication Failed', 'Incorrect password. Please try again.');
                    deletePasswordInput.value = '';
                    confirmDeleteBtn.disabled = false;
                    confirmDeleteBtn.textContent = 'Confirm Delete';
                    return;
                }

                // Execute the specific deletion logic
                const deleteType = deleteConfirmForm._deleteType; // Retrieve type from stored property
                let deleteError;

                if (deleteType === 'ruleset') {
                    const { error: rsDeleteError } = await _supabase.from('rule_sets').delete().eq('id', state.ruleToDelete);
                    deleteError = rsDeleteError;
                } else if (deleteType === 'bonusRule') {
                    const { error: brDeleteError } = await _supabase.from('bonus_rules').delete().eq('id', state.ruleToDelete);
                    deleteError = brDeleteError;
                } else if (deleteType === 'individualRule') { // For rules within a ruleset
                    const { error: indDeleteError } = await _supabase.from('rules').delete().eq('id', state.ruleToDelete);
                    deleteError = indDeleteError;
                }

                if (deleteError) {
                    showAlert('Error', 'Failed to delete: ' + deleteError.message);
                } else {
                    if (deleteType === 'ruleset') {
                        renderRuleSetsList();
                        showAlert('Success', 'Rule set and associated rules deleted.');
                    } else if (deleteType === 'bonusRule') {
                        renderBonusRulesList(); // Re-render the old bonus rules list
                        showAlert('Success', 'Bonus rule has been deleted.');
                    } else if (deleteType === 'individualRule') {
                         showRuleSetDetailsModal(state.currentRuleSetId); // Re-render the ruleset details
                         showAlert('Success', 'Rule deleted successfully.');
                    }
                }
                state.ruleToDelete = null; // Clear the state
                passwordConfirmModal.classList.add('hidden');
                document.getElementById('delete-confirmation-modal').classList.add('hidden');
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Confirm Delete';

                // Clean up this specific listener reference
                passwordConfirmForm.removeEventListener('submit', handlePasswordConfirmSubmit);
                passwordConfirmFormHandlers[deleteType] = null;
            };
            passwordConfirmForm.addEventListener('submit', handlePasswordConfirmSubmit);
            passwordConfirmFormHandlers[deleteConfirmForm._deleteType] = handlePasswordConfirmSubmit; // Store reference

        };
        deleteConfirmForm.addEventListener('submit', handleDeleteConfirmForm);
        deleteConfirmForm._hasDeleteConfirmFormListener = handleDeleteConfirmForm; // Set flag
    }


    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        document.getElementById('delete-confirmation-modal').classList.add('hidden');
    });
    cancelPasswordConfirmBtn.addEventListener('click', () => {
        passwordConfirmModal.classList.add('hidden');
        document.getElementById('delete-confirmation-modal').classList.add('hidden');
    });

    await renderBonusRulesList(); // Initial render for this page
}

export async function renderBonusRulesList() { // Exported for setupBonusRulesPage to call
    const container = document.getElementById('bonus-rules-list');
    if (!container) return;

    const { data: rules, error } = await _supabase.from('bonus_rules').select('*').order('created_at', { ascending: false });

    if (error) {
        showAlert('Error', 'Could not fetch bonus rules: ' + error.message);
        return;
    }

    if (rules.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">No bonus rules created yet.</p>`;
        return;
    }

    container.innerHTML = rules.map(rule => `
        <div class="clay-card p-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                   <h3 class="font-playfair text-2xl font-bold">${rule.name}</h3>
                   <p class="text-gray-600 text-sm mt-1">${rule.description}</p>
                </div>
                <button class="delete-rule-btn clay-button !p-2" data-ruleid="${rule.id}"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div class="clay-inset p-3"><span class="block text-sm font-semibold text-gray-500 uppercase">Live Hours</span><span class="block text-xl font-bold">${rule.live_hours_target}</span></div>
                <div class="clay-inset p-3"><span class="block text-sm font-semibold text-gray-500 uppercase">Branded</span><span class="block text-xl font-bold">${rule.branded_items_target}</span></div>
                <div class="clay-inset p-3"><span class="block text-sm font-semibold text-gray-500 uppercase">Free Size</span><span class="block text-xl font-bold">${rule.free_size_target}</span></div>
                <div class="clay-inset p-3"><span class="block text-sm font-semibold text-gray-500 uppercase">Bonus</span><span class="block text-xl font-bold">₱${rule.bonus_amount.toFixed(2)}</span></div>
            </div>
            <div class="text-xs text-gray-500 mt-4 text-center">Active: ${new Date(rule.effective_start_date).toLocaleDateString()} to ${rule.effective_end_date ? new Date(rule.effective_end_date).toLocaleDateString() : 'Indefinite'} | Evaluated ${rule.bonus_cadence.charAt(0).toUpperCase() + rule.bonus_cadence.slice(1)}</div>
        </div>
    `).join('');

    document.querySelectorAll('.delete-rule-btn').forEach(button => {
        // Remove old listeners to prevent duplicates
        if (button._hasDeleteRuleListener) {
            button.removeEventListener('click', button._hasDeleteRuleListener);
        }
        const deleteHandler = (e) => {
            state.ruleToDelete = e.currentTarget.dataset.ruleid;
            document.getElementById('delete-confirm-message').textContent = 'Are you sure you want to delete this bonus rule? This action cannot be undone.';
            document.getElementById('delete-confirmation-modal').classList.remove('hidden');
            const deleteConfirmForm = document.getElementById('delete-confirm-form');
            deleteConfirmForm._deleteType = 'bonusRule'; // Set type for central handler
        };
        button.addEventListener('click', deleteHandler);
        button._hasDeleteRuleListener = deleteHandler; // Store reference
    });
    lucide.createIcons();
}

export async function setupRuleSetManagementPage() {
    if (state.profile.role !== 'admin') { return; }

    const createRuleSetBtn = document.getElementById('create-new-ruleset-btn');
    const createRuleSetModal = document.getElementById('create-ruleset-modal');
    const ruleSetForm = document.getElementById('ruleset-form');
    const cancelRuleSetBtn = document.getElementById('cancel-ruleset-btn');
    const ruleSetTypeSelect = document.getElementById('ruleset-type');

    const viewRuleSetDetailsModal = document.getElementById('view-ruleset-details-modal');
    const addRuleToRuleSetBtn = document.getElementById('add-rule-to-ruleset-btn');
    const toggleRulesetActiveBtn = document.getElementById('toggle-ruleset-active-btn');
    const deleteRulesetBtn = document.getElementById('delete-ruleset-btn');
    const closeRuleSetDetailsBtn = document.getElementById('close-ruleset-details-btn');
    const editRuleModal = document.getElementById('edit-rule-modal');
    const editRuleForm = document.getElementById('edit-rule-form');
    const cancelEditRuleBtn = document.getElementById('cancel-edit-rule-btn');


    const { data: ruleTypes, error: rtError } = await _supabase.from('rule_types').select('id, name');
    if (rtError) { console.error('Error fetching rule types:', rtError.message); showAlert('Error', 'Could not fetch rule types.'); }
    else {
        ruleSetTypeSelect.innerHTML = ruleTypes.map(type => `<option value="${type.id}">${type.name}</option>`).join('');
    }

    createRuleSetBtn.addEventListener('click', () => { ruleSetForm.reset(); createRuleSetModal.classList.remove('hidden'); });
    cancelRuleSetBtn.addEventListener('click', () => { createRuleSetModal.classList.add('hidden'); });

    closeRuleSetDetailsBtn.addEventListener('click', () => { viewRuleSetDetailsModal.classList.add('hidden'); state.currentRuleSetId = null; });
    cancelEditRuleBtn.addEventListener('click', () => { editRuleModal.classList.add('hidden'); });


    if (ruleSetForm._hasRuleSetSubmitListener) {
        ruleSetForm.removeEventListener('submit', ruleSetForm._hasRuleSetSubmitListener);
    }
    const handleRuleSetSubmit = async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        const newRuleSet = {
            name: document.getElementById('ruleset-name').value,
            description: document.getElementById('ruleset-description').value,
            rule_type_id: parseInt(document.getElementById('ruleset-type').value),
            effective_start_date: document.getElementById('ruleset-start-date').value,
            effective_end_date: document.getElementById('ruleset-end-date').value || null,
            created_by: state.currentUser.id,
            is_active: false
        };

        const { error } = await _supabase.from('rule_sets').insert(newRuleSet);
        if (error) showAlert('Error', 'Failed to create rule set: ' + error.message);
        else {
            showAlert('Success', 'New rule set created. It is currently inactive.');
            createRuleSetModal.classList.add('hidden');
            renderRuleSetsList();
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Rule Set';
    };
    ruleSetForm.addEventListener('submit', handleRuleSetSubmit);
    ruleSetForm._hasRuleSetSubmitListener = handleRuleSetSubmit;


    if (editRuleForm._hasEditRuleSubmitListener) {
        editRuleForm.removeEventListener('submit', editRuleForm._hasEditRuleSubmitListener);
    }
    const handleEditRuleSubmit = async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const ruleId = editRuleForm.dataset.ruleId;
        const ruleSetId = state.currentRuleSetId;

        const ruleData = {
            rule_name: document.getElementById('edit-rule-name').value,
            criteria_field: document.getElementById('edit-criteria-field').value,
            operator: document.getElementById('edit-operator').value,
            target_value: parseFloat(document.getElementById('edit-target-value').value),
            payout_type: document.getElementById('edit-payout-type').value,
            payout_value: parseFloat(document.getElementById('edit-payout-value').value),
            cadence: document.getElementById('edit-cadence').value || null,
            priority: parseInt(document.getElementById('edit-priority').value) || null,
        };

        let error;
        if (ruleId === 'new') {
            const { error: insertError } = await _supabase.from('rules').insert({ ...ruleData, rule_set_id: ruleSetId });
            error = insertError;
        } else {
            const { error: updateError } = await _supabase.from('rules').update(ruleData).eq('id', ruleId);
            error = updateError;
        }

        if (error) showAlert('Error', 'Failed to save rule: ' + error.message);
        else {
            showAlert('Success', 'Rule saved successfully.');
            editRuleModal.classList.add('hidden');
            showRuleSetDetailsModal(ruleSetId); // Re-render details after save
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Rule';
    };
    editRuleForm.addEventListener('submit', handleEditRuleSubmit);
    editRuleForm._hasEditRuleSubmitListener = handleEditRuleSubmit;


    addRuleToRuleSetBtn.addEventListener('click', () => {
        editRuleForm.reset();
        editRuleForm.dataset.ruleId = 'new';
        document.getElementById('edit-rule-name').value = '';
        editRuleModal.classList.remove('hidden');
    });

    if (toggleRulesetActiveBtn && !toggleRulesetActiveBtn._hasToggleListener) {
        const toggleHandler = async (e) => {
            const button = e.currentTarget;
            button.disabled = true;
            button.textContent = 'Updating...';
            const ruleSetId = state.currentRuleSetId;
            const currentStatus = (button.dataset.isactive === 'true');
            const newStatus = !currentStatus;

            const { error } = await _supabase.from('rule_sets').update({ is_active: newStatus }).eq('id', ruleSetId);
            if (error) showAlert('Error', 'Failed to toggle rule set status: ' + error.message);
            else {
                showAlert('Success', `Rule set ${newStatus ? 'activated' : 'deactivated'}.`);
                button.dataset.isactive = newStatus;
                button.textContent = newStatus ? 'Deactivate' : 'Activate';
                button.classList.toggle('clay-button-deny', newStatus);
                button.classList.toggle('clay-button-approve', !newStatus);
                renderRuleSetsList();
            }
            button.disabled = false;
        };
        toggleRulesetActiveBtn.addEventListener('click', toggleHandler);
        toggleRulesetActiveBtn._hasToggleListener = toggleHandler;
    }


    if (deleteRulesetBtn && !deleteRulesetBtn._hasDeleteRulesetListener) {
        const deleteHandler = async (e) => {
            state.ruleToDelete = e.currentTarget.dataset.rulesetid;
            document.getElementById('delete-confirm-message').textContent = 'Are you sure you want to delete this rule set and all its associated rules? This action cannot be undone.';
            document.getElementById('delete-confirmation-modal').classList.remove('hidden');
            const deleteConfirmForm = document.getElementById('delete-confirm-form');
            deleteConfirmForm._deleteType = 'ruleset';
        };
        deleteRulesetBtn.addEventListener('click', deleteHandler);
        deleteRulesetBtn._hasDeleteRulesetListener = deleteHandler;
    }


    await renderRuleSetsList();

    // Real-time listener for rule_sets and rules
    // Ensure channels are cleared before adding new ones in main.js showPage
    const ruleSetsChannel = _supabase.channel('public:rule_sets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rule_sets' }, payload => {
            renderRuleSetsList();
            if (state.currentRuleSetId && payload.new && payload.new.id === state.currentRuleSetId) {
                showRuleSetDetailsModal(state.currentRuleSetId);
            }
        })
        .subscribe();
    state.channels.push(ruleSetsChannel);

    const rulesChannel = _supabase.channel('public:rules')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rules' }, payload => {
            if (state.currentRuleSetId && (payload.new && payload.new.rule_set_id === state.currentRuleSetId || payload.old && payload.old.rule_set_id === state.currentRuleSetId)) {
                showRuleSetDetailsModal(state.currentRuleSetId);
            }
        })
        .subscribe();
    state.channels.push(rulesChannel);
}

export async function renderRuleSetsList() {
    const container = document.getElementById('rulesets-list');
    if (!container) return;

    const { data: ruleSets, error } = await _supabase
        .from('rule_sets')
        .select(`
            id,
            name,
            description,
            is_active,
            effective_start_date,
            effective_end_date,
            rule_types(name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        showAlert('Error', 'Could not fetch rule sets: ' + error.message);
        return;
    }

    if (ruleSets.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">No rule sets defined yet.</p>`;
        return;
    }

    container.innerHTML = ruleSets.map(set => `
        <div class="clay-card p-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="font-playfair text-2xl font-bold">${set.name}</h3>
                    <p class="text-gray-600 text-sm mt-1">${set.description || 'No description.'}</p>
                    <p class="text-xs text-gray-500 mt-2">
                        Type: ${set.rule_types.name} | Status: <span class="font-semibold ${set.is_active ? 'text-primary-mint' : 'text-action-red'}">${set.is_active ? 'Active' : 'Inactive'}</span>
                        <br>Effective: ${new Date(set.effective_start_date).toLocaleDateString()} to ${set.effective_end_date ? new Date(set.effective_end_date).toLocaleDateString() : 'Indefinite'}
                    </p>
                </div>
                <div class="flex flex-col sm:flex-row gap-2">
                    <button class="view-ruleset-btn clay-button !p-2" data-rulesetid="${set.id}"><i data-lucide="eye" class="h-4 w-4"></i> View</button>
                    ${set.is_active ? `<button class="toggle-ruleset-active-btn clay-button clay-button-deny !p-2" data-rulesetid="${set.id}" data-isactive="true"><i data-lucide="toggle-right" class="h-4 w-4"></i> Deactivate</button>` : `<button class="toggle-ruleset-active-btn clay-button clay-button-approve !p-2" data-rulesetid="${set.id}" data-isactive="false"><i data-lucide="toggle-left" class="h-4 w-4"></i> Activate</button>`}
                    <button class="delete-ruleset-btn clay-button !p-2" data-rulesetid="${set.id}"><i data-lucide="trash-2" class="h-4 w-4"></i> Delete</button>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.view-ruleset-btn').forEach(button => {
        // Remove old listeners
        if (button._hasViewRulesetListener) {
            button.removeEventListener('click', button._hasViewRulesetListener);
        }
        const viewHandler = (e) => showRuleSetDetailsModal(e.currentTarget.dataset.rulesetid);
        button.addEventListener('click', viewHandler);
        button._hasViewRulesetListener = viewHandler;
    });

    document.querySelectorAll('.toggle-ruleset-active-btn').forEach(button => {
         // Remove old listeners
         if (button._hasToggleRulesetListener) {
            button.removeEventListener('click', button._hasToggleRulesetListener);
        }
        const toggleHandler = async (e) => {
            const ruleSetId = e.currentTarget.dataset.rulesetid;
            const isActive = e.currentTarget.dataset.isactive === 'true';
            const newStatus = !isActive;

            e.currentTarget.disabled = true;
            e.currentTarget.textContent = 'Updating...';

            const { error } = await _supabase.from('rule_sets').update({ is_active: newStatus }).eq('id', ruleSetId);
            if (error) showAlert('Error', 'Failed to toggle rule set status: ' + error.message);
            else {
                showAlert('Success', `Rule set ${newStatus ? 'activated' : 'deactivated'}.`);
                button.dataset.isactive = newStatus;
                button.textContent = newStatus ? 'Deactivate' : 'Activate';
                button.classList.toggle('clay-button-deny', newStatus);
                button.classList.toggle('clay-button-approve', !newStatus);
                renderRuleSetsList();
            }
            button.disabled = false;
        };
        button.addEventListener('click', toggleHandler);
        button._hasToggleRulesetListener = toggleHandler;
    });

    document.querySelectorAll('.delete-ruleset-btn').forEach(button => {
        // Remove old listeners
        if (button._hasDeleteRulesetListener) {
            button.removeEventListener('click', button._hasDeleteRulesetListener);
        }
        const deleteHandler = async (e) => {
            state.ruleToDelete = e.currentTarget.dataset.rulesetid;
            document.getElementById('delete-confirm-message').textContent = 'Are you sure you want to delete this rule set and all its associated rules? This action cannot be undone.';
            document.getElementById('delete-confirmation-modal').classList.remove('hidden');
            const deleteConfirmForm = document.getElementById('delete-confirm-form');
            deleteConfirmForm._deleteType = 'ruleset'; // Set type for central handler
        };
        button.addEventListener('click', deleteHandler);
        button._hasDeleteRulesetListener = deleteHandler;
    });
    lucide.createIcons();
}

export async function showRuleSetDetailsModal(ruleSetId) {
    state.currentRuleSetId = ruleSetId;

    const { data: ruleSet, error: ruleSetError } = await _supabase
        .from('rule_sets')
        .select(`*, rule_types(name)`)
        .eq('id', ruleSetId)
        .single();
    if (ruleSetError) { showAlert('Error', 'Could not fetch rule set details: ' + ruleSetError.message); return; }

    const { data: rulesInSet, error: rulesError } = await _supabase
        .from('rules')
        .select('*')
        .eq('rule_set_id', ruleSetId)
        .order('priority', { ascending: true });
    if (rulesError) { showAlert('Error', 'Could not fetch rules for this set: ' + rulesError.message); return; }

    document.getElementById('view-ruleset-name').textContent = ruleSet.name;
    document.getElementById('view-ruleset-description').textContent = ruleSet.description || 'No description provided.';
    document.getElementById('view-ruleset-status').textContent = `Type: ${ruleSet.rule_types.name} | Status: ${ruleSet.is_active ? 'Active' : 'Inactive'}`;
    document.getElementById('view-ruleset-dates').textContent = `Effective: ${new Date(ruleSet.effective_start_date).toLocaleDateString()} to ${ruleSet.effective_end_date ? new Date(set.effective_end_date).toLocaleDateString() : 'Indefinite'}`;

    const toggleRulesetActiveBtn = document.getElementById('toggle-ruleset-active-btn');
    toggleRulesetActiveBtn.dataset.isactive = ruleSet.is_active;
    toggleRulesetActiveBtn.textContent = ruleSet.is_active ? 'Deactivate' : 'Activate';
    toggleRulesetActiveBtn.classList.toggle('clay-button-deny', ruleSet.is_active);
    toggleRulesetActiveBtn.classList.toggle('clay-button-approve', !ruleSet.is_active);


    const rulesListContainer = document.getElementById('rules-in-set-list');
    rulesListContainer.innerHTML = '';

    if (rulesInSet.length === 0) {
        rulesListContainer.innerHTML = `<p class="text-center text-gray-500">No rules defined in this set yet.</p>`;
    } else {
        rulesInSet.forEach(rule => {
            const ruleDiv = document.createElement('div');
            ruleDiv.className = 'clay-card p-4 flex justify-between items-center';
            ruleDiv.innerHTML = `
                <div>
                    <p class="font-semibold">${rule.rule_name}</p>
                    <p class="text-sm text-gray-600">${rule.criteria_field.replace(/_/g, ' ').toUpperCase()} ${rule.operator} ${rule.target_value} -> ${rule.payout_type.replace(/_/g, ' ').toUpperCase()}: ${state.globalSettings.default_currency_symbol || '₱'}${rule.payout_value} ${rule.payout_type === 'percentage' ? '%' : ''}</p>
                    <p class="text-xs text-gray-500">Cadence: ${rule.cadence || 'N/A'} | Priority: ${rule.priority || 'N/A'}</p>
                </div>
                <div class="flex gap-2">
                    <button class="edit-rule-btn clay-button !p-2" data-rule='${JSON.stringify(rule)}'><i data-lucide="pencil" class="h-4 w-4"></i> Edit</button>
                    <button class="delete-individual-rule-btn clay-button !p-2" data-ruleid="${rule.id}"><i data-lucide="trash-2" class="h-4 w-4"></i> Delete</button>
                </div>
            `;
            rulesListContainer.appendChild(ruleDiv);
        });

        document.querySelectorAll('.edit-rule-btn').forEach(button => {
            if (button._hasEditRuleListener) {
                button.removeEventListener('click', button._hasEditRuleListener);
            }
            const editHandler = (e) => {
                const ruleData = JSON.parse(e.currentTarget.dataset.rule);
                editRuleForm.dataset.ruleId = ruleData.id;
                document.getElementById('edit-rule-name').value = ruleData.rule_name;
                document.getElementById('edit-criteria-field').value = ruleData.criteria_field;
                document.getElementById('edit-operator').value = ruleData.operator;
                document.getElementById('edit-target-value').value = ruleData.target_value;
                document.getElementById('edit-payout-type').value = ruleData.payout_type;
                document.getElementById('edit-payout-value').value = ruleData.payout_value;
                document.getElementById('edit-cadence').value = ruleData.cadence || '';
                document.getElementById('edit-priority').value = ruleData.priority || '';
                editRuleModal.classList.remove('hidden');
            };
            button.addEventListener('click', editHandler);
            button._hasEditRuleListener = editHandler;
        });

        document.querySelectorAll('.delete-individual-rule-btn').forEach(button => {
            if (button._hasDeleteIndividualRuleListener) {
                button.removeEventListener('click', button._hasDeleteIndividualRuleListener);
            }
            const deleteHandler = async (e) => {
                state.ruleToDelete = e.currentTarget.dataset.ruleid;
                const confirmDelete = confirm('Are you sure you want to delete this rule?');
                if (confirmDelete) {
                    e.currentTarget.disabled = true;
                    e.currentTarget.innerHTML = '<div class="spinner h-4 w-4"></div>';
                    const { error } = await _supabase.from('rules').delete().eq('id', state.ruleToDelete);
                    if (error) showAlert('Error', 'Failed to delete rule: ' + error.message);
                    else {
                        showAlert('Success', 'Rule deleted successfully.');
                        showRuleSetDetailsModal(state.currentRuleSetId); // Re-render the ruleset details
                    }
                }
            };
            button.addEventListener('click', deleteHandler);
            button._hasDeleteIndividualRuleListener = deleteHandler;
        });
    }

    viewRuleSetDetailsModal.classList.remove('hidden');
    lucide.createIcons(); // Ensure icons are created after rendering
}
