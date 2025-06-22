// src/bonusReview.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

let bonusToReview = null; // Module-scoped variable

export async function setupBonusReviewPage() {
    if (state.profile.role !== 'admin') { /* main.js handles redirect */ return; }

    const reviewModal = document.getElementById('review-bonus-modal');
    const reviewBonusTitle = document.getElementById('review-bonus-title');
    const reviewBonusDetails = document.getElementById('review-bonus-details');
    const reviewBonusNotesInput = document.getElementById('review-bonus-notes');
    const approveBonusBtn = document.getElementById('approve-bonus-action-btn');
    const rejectBonusBtn = document.getElementById('reject-bonus-action-btn');
    const cancelReviewBtn = document.getElementById('cancel-review-bonus-btn');

    // Remove old listeners to prevent duplicates if function is called multiple times
    if (approveBonusBtn && approveBonusBtn._hasApproveBonusListener) {
        approveBonusBtn.removeEventListener('click', approveBonusBtn._hasApproveBonusListener);
    }
    if (rejectBonusBtn && rejectBonusBtn._hasRejectBonusListener) {
        rejectBonusBtn.removeEventListener('click', rejectBonusBtn._hasRejectBonusListener);
    }
    if (cancelReviewBtn && cancelReviewBtn._hasCancelReviewListener) {
        cancelReviewBtn.removeEventListener('click', cancelReviewBtn._hasCancelReviewListener);
    }

    const handleApproveClick = (e) => { e.preventDefault(); handleReviewAction('approve', reviewNotesInput); }; // Pass reviewNotesInput
    const handleRejectClick = (e) => { e.preventDefault(); handleReviewAction('reject', reviewNotesInput); }; // Pass reviewNotesInput
    const handleCancelClick = () => { reviewModal.classList.add('hidden'); };

    if (approveBonusBtn) {
        approveBonusBtn.addEventListener('click', handleApproveClick);
        approveBonusBtn._hasApproveBonusListener = handleApproveClick;
    }
    if (rejectBonusBtn) {
        rejectBonusBtn.addEventListener('click', handleRejectClick);
        rejectBonusBtn._hasRejectBonusListener = handleRejectClick;
    }
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', handleCancelClick);
        cancelReviewBtn._hasCancelReviewListener = handleCancelClick;
    }

    await renderBonusReviewList();

    // Real-time listener for seller_bonuses_achieved
    const bonusReviewChannel = _supabase.channel('public:seller_bonuses_achieved')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_bonuses_achieved' }, payload => {
            renderBonusReviewList(); // Re-render the list on changes
        })
        .subscribe();
    state.channels.push(bonusReviewChannel); // Store channel to unsubscribe later
}

export async function renderBonusReviewList() {
    const container = document.getElementById('bonus-review-list');
    if (!container) {
        console.error("Bonus review list container not found in renderBonusReviewList.");
        return;
    }

    const { data: bonuses, error } = await _supabase
        .from('seller_bonuses_achieved')
        .select(`
            id,
            achieved_date,
            bonus_amount_awarded,
            calculation_period_start,
            calculation_period_end,
            status,
            admin_notes,
            profiles:seller_id (full_name),
            rules (rule_name),
            rule_sets (name)
        `)
        .eq('status', 'pending_review')
        .order('achieved_date', { ascending: true });

    if (error) {
        showAlert('Error', 'Could not fetch pending bonuses: ' + error.message);
        return;
    }

    if (bonuses.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">No pending bonuses to review.</p>`;
        return;
    }

    container.innerHTML = `
        <div class="clay-card overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Rule</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Achieved On</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${bonuses.map((bonus, index) => `
                        <tr class="${index % 2 !== 0 ? 'bg-[rgba(0,0,0,0.04)]' : ''}">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${bonus.profiles.full_name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${bonus.rules ? bonus.rules.rule_name : (bonus.rule_sets ? bonus.rule_sets.name : 'N/A')}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱${bonus.bonus_amount_awarded.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(bonus.calculation_period_start).toLocaleDateString()} - ${new Date(bonus.calculation_period_end).toLocaleDateString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(bonus.achieved_date).toLocaleDateString()} ${new Date(bonus.achieved_date).toLocaleTimeString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button class="review-bonus-btn clay-button clay-button-primary px-3 py-1 text-sm" data-bonus='${JSON.stringify(bonus)}'>Review</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    document.querySelectorAll('.review-bonus-btn').forEach(button => {
        if (button._hasReviewBonusListener) {
            button.removeEventListener('click', button._hasReviewBonusListener);
        }
        const reviewHandler = (e) => {
            const bonusData = JSON.parse(e.currentTarget.dataset.bonus);
            showReviewModal(bonusData); // Calling the showReviewModal function from this module
        };
        button.addEventListener('click', reviewHandler);
        button._hasReviewBonusListener = reviewHandler;
    });
    lucide.createIcons();
}

export async function showReviewModal(bonus) { // Exported for renderBonusReviewList to call
    const reviewModal = document.getElementById('review-bonus-modal');
    const reviewBonusTitle = document.getElementById('review-bonus-title');
    const reviewBonusDetails = document.getElementById('review-bonus-details');
    const reviewBonusNotesInput = document.getElementById('review-bonus-notes');
    const approveBonusBtn = document.getElementById('approve-bonus-action-btn');
    const rejectBonusBtn = document.getElementById('reject-bonus-action-btn');
    const cancelReviewBtn = document.getElementById('cancel-review-bonus-btn');

    if (!reviewModal || !reviewBonusTitle || !reviewBonusDetails || !reviewBonusNotesInput || !approveBonusBtn || !rejectBonusBtn || !cancelReviewBtn) {
        console.error("Bonus review modal elements not found in showReviewModal.");
        return;
    }

    // Assign bonusToReview to module scope for handleReviewAction
    // Note: this relies on bonusToReview being module-scoped and updated by showReviewModal.
    // A clearer pattern might be to pass bonusToReview directly to handleReviewAction,
    // or wrap the whole review logic in a class/object. For now, this matches existing pattern.
    // Let's ensure bonusToReview is correctly accessible via module scope.
    if (!setupBonusReviewPage._bonusToReview) { // Create a property to hold it
        setupBonusReviewPage._bonusToReview = null;
    }
    setupBonusReviewPage._bonusToReview = bonus;


    reviewBonusTitle.textContent = `Review Bonus for ${bonus.profiles.full_name}`;
    reviewBonusDetails.innerHTML = `
        <p><strong>Rule:</strong> ${bonus.rules ? bonus.rules.rule_name : (bonus.rule_sets ? bonus.rule_sets.name : 'N/A')}</p>
        <p><strong>Amount:</strong> ₱${bonus.bonus_amount_awarded.toFixed(2)}</p>
        <p><strong>Period:</strong> ${new Date(bonus.calculation_period_start).toLocaleDateString()} - ${new Date(bonus.calculation_period_end).toLocaleDateString()}</p>
        <p><strong>Achieved On:</strong> ${new Date(bonus.achieved_date).toLocaleDateString()} ${new Date(bonus.achieved_date).toLocaleTimeString()}</p>
    `;
    reviewBonusNotesInput.value = bonus.admin_notes || '';
    reviewModal.classList.remove('hidden');
}

// Internal helper for review actions
async function handleReviewAction(actionType, reviewNotesInput) {
    const notes = reviewNotesInput.value.trim();
    const reviewModal = document.getElementById('review-bonus-modal');
    const approveBonusBtn = document.getElementById('approve-bonus-action-btn');
    const rejectBonusBtn = document.getElementById('reject-bonus-action-btn');

    if (actionType === 'reject' && !notes) {
        showAlert('Validation Error', 'Admin notes are required for rejecting a bonus.');
        return;
    }

    const button = actionType === 'approve' ? approveBonusBtn : rejectBonusBtn;
    button.disabled = true;
    button.textContent = 'Submitting...';

    try {
        const bonusToReview = setupBonusReviewPage._bonusToReview; // Retrieve from stored property
        if (!bonusToReview) {
            throw new Error("No bonus selected for review.");
        }

        if (actionType === 'approve') {
            const { error } = await _supabase.rpc('approve_seller_bonus', { p_bonus_id: bonusToReview.id, p_admin_notes: notes || null });
            if (error) throw error;
            showAlert('Success', 'Bonus approved successfully.');
        } else {
            const { error } = await _supabase.rpc('reject_seller_bonus', { p_bonus_id: bonusToReview.id, p_admin_notes: notes });
            if (error) throw error;
            showAlert('Success', 'Bonus rejected successfully.');
        }
        reviewModal.classList.add('hidden');
        renderBonusReviewList(); // Re-render the list after action
    } catch (error) {
        showAlert('Error', `Failed to ${actionType} bonus: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = actionType === 'approve' ? 'Approve Bonus' : 'Reject Bonus';
    }
}
