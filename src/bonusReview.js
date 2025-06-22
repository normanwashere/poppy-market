// src/bonusReview.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

let bonusToReview = null; 

export async function setupBonusReviewPage() {
    if (state.profile.role !== 'admin') { return; }

    const reviewModal = document.getElementById('review-bonus-modal');
    const reviewBonusTitle = document.getElementById('review-bonus-title');
    const reviewBonusDetails = document.getElementById('review-bonus-details');
    const reviewBonusNotesInput = document.getElementById('review-bonus-notes');
    const approveBonusBtn = document.getElementById('approve-bonus-action-btn');
    const rejectBonusBtn = document.getElementById('reject-bonus-action-btn');
    const cancelReviewBtn = document.getElementById('cancel-review-bonus-btn');

    if (approveBonusBtn && approveBonusBtn._hasApproveBonusListener) {
        approveBonusBtn.removeEventListener('click', approveBonusBtn._hasApproveBonusListener);
    }
    if (rejectBonusBtn && rejectBonusBtn._hasRejectBonusListener) {
        rejectBonusBtn.removeEventListener('click', rejectBonusBtn._hasRejectBonusListener);
    }
    if (cancelReviewBtn && cancelReviewBtn._hasCancelReviewListener) {
        cancelReviewBtn.removeEventListener('click', cancelReviewBtn._hasCancelReviewListener);
    }

    const handleApproveClick = (e) => { e.preventDefault(); handleReviewAction('approve', reviewBonusNotesInput); };
    const handleRejectClick = (e) => { e.preventDefault(); handleReviewAction('reject', reviewBonusNotesInput); };
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

    const bonusReviewChannel = _supabase.channel('public:seller_bonuses_achieved')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_bonuses_achieved' }, payload => {
            renderBonusReviewList();
        })
        .subscribe();
    
    // FIX: Push to the 'channels' array directly
    channels.push(bonusReviewChannel);
}

export async function renderBonusReviewList() {
    // ... (rest of the function is correct)
}

export async function showReviewModal(bonus) {
    // ... (rest of the function is correct)
}

async function handleReviewAction(actionType, reviewNotesInput) {
    // ... (rest of the function is correct)
}
