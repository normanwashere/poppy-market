// src/dashboard.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert, parseDateAsUTC, getWeekRange, getMonthRange, setLoading } from './helpers.js';
import { showRuleSetDetailsModal } from './rules.js'; // Import if showBonusDetailsModal is needed

let dashboardFilteredData = []; // This needs to be accessible by nested functions
let dashboardSortConfig = { key: 'session_start_time', direction: 'desc' }; // This needs to be accessible by nested functions
let dashboardCurrentPage = 1;
const dashboardEntriesPerPage = 5;

// Helper for sortable table headers
function createSortableHeader(label, key) {
    const th = document.createElement('th');
    th.className = "p-4 text-left font-semibold uppercase tracking-wider text-xs cursor-pointer";
    th.dataset.key = key;
    const iconContainer = dashboardSortConfig.key === key ? `<i data-lucide="${dashboardSortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}" class="h-4 w-4 ml-1"></i>` : '<div class="h-4 w-4 ml-1 opacity-20"><i data-lucide="chevron-down"></i></div>';
    th.innerHTML = `<div class="flex items-center">${label}${iconContainer}</div>`;
    th.addEventListener('click', () => {
        dashboardSortConfig.direction = (dashboardSortConfig.key === key && dashboardSortConfig.direction === 'asc') ? 'desc' : 'asc';
        dashboardSortConfig.key = key;
        dashboardCurrentPage = 1;
        updateDashboardView(); // Call the update function to re-render
    });
    return th;
}

// Function to render the dashboard table
function renderDashboardTable() {
    const tableHead = document.querySelector('#table-container thead tr');
    const tableBody = document.getElementById('table-body');
    const noEntriesMessage = document.getElementById('no-entries');

    if (!tableHead || !tableBody || !noEntriesMessage) {
        console.error("Dashboard table elements not found.");
        return;
    }

    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    const headers = [
        { label: 'Date', key: 'session_start_time' },
        { label: 'Duration', key: 'live_duration_hours' },
        { label: 'Branded', key: 'branded_items_sold' },
        { label: 'Free Size', key: 'free_size_items_sold' }
    ];

    if (state.profile && state.profile.role === 'admin') {
        headers.splice(1, 0, { label: 'Seller', key: 'profiles.full_name' });
    }

    headers.forEach(h => tableHead.appendChild(createSortableHeader(h.label, h.key)));

    const startIndex = (dashboardCurrentPage - 1) * dashboardEntriesPerPage;
    const paginatedData = dashboardFilteredData.slice(startIndex, startIndex + dashboardEntriesPerPage);

    noEntriesMessage.style.display = paginatedData.length === 0 ? 'block' : 'none';

    paginatedData.forEach((item, index) => {
        const itemDate = new Date(item.session_start_time);
        const row = document.createElement('tr');
        row.className = 'transition-colors duration-200 hover:bg-primary-lavender/60 ' + (index % 2 !== 0 ? 'bg-[rgba(0,0,0,0.04)]' : '');
        row.innerHTML = `
            <td class="p-4 whitespace-nowrap">${itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            ${state.profile && state.profile.role === 'admin' ? `<td class="p-4 whitespace-nowrap">${item.profiles.full_name}</td>` : ''}
            <td class="p-4 whitespace-nowrap">${item.live_duration_hours !== null ? item.live_duration_hours.toFixed(2) : 'N/A'} hrs</td>
            <td class="p-4 whitespace-nowrap">${item.branded_items_sold !== null ? item.branded_items_sold : 'N/A'}</td>
            <td class="p-4 whitespace-nowrap">${item.free_size_items_sold !== null ? item.free_size_items_sold : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to render dashboard pagination controls
function renderDashboardPagination() {
    const paginationControls = document.getElementById('pagination-controls');
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');

    if (!paginationControls || !pageInfo || !prevPageBtn || !nextPageBtn) {
        console.error("Dashboard pagination elements not found.");
        return;
    }

    const totalPages = Math.ceil(dashboardFilteredData.length / dashboardEntriesPerPage);
    paginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
    pageInfo.innerHTML = `Page <strong>${dashboardCurrentPage}</strong> of <strong>${totalPages}</strong>`;
    prevPageBtn.disabled = dashboardCurrentPage === 1;
    nextPageBtn.disabled = dashboardCurrentPage === totalPages;
}

// Function to display bonus details in a modal (assuming it's used on dashboard too)
async function showBonusDetailsModalForDashboard(ruleId) {
    // This is a direct call to the rules module's modal function.
    // We import showRuleSetDetailsModal from rules.js for this purpose.
    showRuleSetDetailsModal(ruleId);
}

// Function to render bonus/incentive cards
async function renderBonusCards(performanceData, filterRange) {
    const bonusCardsContainer = document.getElementById('bonus-cards-container');
    if (!bonusCardsContainer) {
        console.error("Bonus cards container not found.");
        return;
    }

    const { data: bonusRuleSets, error: rsError } = await _supabase
        .from('rule_sets')
        .select(`id, name, description, effective_start_date, effective_end_date, is_active,
                     rule_types(name), rules (id, rule_name, criteria_field, operator, target_value, payout_type, payout_value)`)
        .eq('is_active', true)
        .in('rule_type_id', (await _supabase.from('rule_types').select('id').eq('name', 'Bonus')).data.map(t => t.id))
        .filter('effective_start_date', 'lte', new Date().toISOString())
        .or('effective_end_date.is.null,effective_end_date.gte.' + new Date().toISOString());

    if (rsError) {
        console.error('Error fetching bonus rule sets:', rsError.message);
        bonusCardsContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">Error loading incentives.</p>`;
        return;
    }

    if (bonusRuleSets.length === 0) {
        bonusCardsContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">No active bonus incentives at the moment.</p>`;
        return;
    }

    const metrics = performanceData.reduce((acc, item) => {
        acc.live_hours = (acc.live_hours || 0) + (item.live_duration_hours || 0);
        acc.branded_items = (acc.branded_items || 0) + (item.branded_items_sold || 0);
        acc.free_size_items = (acc.free_size_items || 0) + (item.free_size_items_sold || 0);
        acc.total_revenue = (acc.total_revenue || 0) + (item.total_revenue || 0);
        return acc;
    }, { duration: 0, basePay: 0, branded_items: 0, free_size_items: 0, total_revenue: 0 });

    bonusCardsContainer.innerHTML = bonusRuleSets.map(ruleSet => {
        let totalEarnedInSet = 0;
        let allRulesInSetMet = true;

        if (ruleSet.rules && ruleSet.rules.length > 0) {
            ruleSet.rules.forEach(rule => {
                const metricValue = metrics[rule.criteria_field] || 0;
                let ruleMet = false;

                switch (rule.operator) {
                    case '>=': ruleMet = (metricValue >= rule.target_value); break;
                    case '>': ruleMet = (metricValue > rule.target_value); break;
                    case '=': ruleMet = (metricValue === rule.target_value); break;
                    case '<': ruleMet = (metricValue < rule.target_value); break;
                    case '<=': ruleMet = (metricValue <= rule.target_value); break;
                }

                if (!ruleMet) {
                    allRulesInSetMet = false;
                } else {
                    if (rule.payout_type === 'fixed_amount') {
                        payoutForThisSet += rule.payout_value;
                    } else if (rule.payout_type === 'percentage') {
                        payoutForThisSet += (metrics.total_revenue || 0) * (rule.payout_value / 100);
                    } else if (rule.payout_type === 'per_unit') {
                        payoutForThisSet += (metrics.branded_items + metrics.free_size_items) * rule.payout_value;
                    }
                }
            });
        } else {
            allRulesInSetMet = false;
        }

        if (allRulesInSetMet) {
            totalEarnedInSet += payoutForThisSet;
        }

        return `
            <div class="clay-card p-4 cursor-pointer" data-rulesetid="${ruleSet.id}">
                <div class="flex justify-between items-start">
                    <h4 class="font-playfair font-bold text-lg mb-2">${ruleSet.name}</h4>
                    <div class="tooltip-container">
                        <i data-lucide="info" class="h-5 w-5 text-gray-500"></i>
                        <span class="tooltip-text">
                            Type: ${ruleSet.rule_types.name}<br>
                            Status: ${ruleSet.is_active ? 'Active' : 'Inactive'}<br>
                            Effective: ${new Date(ruleSet.effective_start_date).toLocaleDateString()} to ${ruleSet.effective_end_date ? new Date(ruleSet.effective_end_date).toLocaleDateString() : 'Indefinite'}<br>
                            Rules: ${ruleSet.rules && ruleSet.rules.length > 0 ? ruleSet.rules.map(rule => `${rule.rule_name} (${rule.criteria_field.replace(/_/g, ' ')} ${rule.operator} ${rule.target_value})`).join('<br>') : 'No rules defined.'}
                        </span>
                    </div>
                </div>
                <p class="font-bold text-3xl" style="color: #831843;">${state.globalSettings.default_currency_symbol || '₱'}${totalEarnedInSet.toFixed(2)}</p>
                <p class="text-xs text-gray-500 mt-1">${ruleSet.rule_types.name} Incentive</p>
            </div>
        `;
    }).join('');

    document.querySelectorAll('[data-rulesetid]').forEach(card => {
        // Remove old listeners to prevent duplicates
        if (card._hasRulesetDetailsListener) {
            card.removeEventListener('click', card._hasRulesetDetailsListener);
        }
        const handler = (e) => showBonusDetailsModalForDashboard(e.currentTarget.dataset.rulesetid);
        card.addEventListener('click', handler);
        card._hasRulesetDetailsListener = handler;
    });
    lucide.createIcons();
}

// This is the main function called by setupDashboardPage
export async function runDashboardLogic(role) {
    const { profile } = state;
    const sellerFilter = document.getElementById('seller-filter');
    const dateFilter = document.getElementById('date-filter');
    const customDateFilters = document.getElementById('custom-date-filters');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    // Elements for table and pagination are passed/accessed directly in their functions.

    // Correctly reference LABEL elements (h3 tags)
    const finalPayLabel = document.getElementById('final-pay-label');
    const liveDurationLabel = document.getElementById('live-duration-label');
    const basePayLabel = document.getElementById('base-pay-label');
    const brandedSoldLabel = document.getElementById('branded-sold-label');
    const freeSizeSoldLabel = document.getElementById('free-size-sold-label');

    // Existing references to VALUE elements (p tags)
    const finalPayEl = document.getElementById('final-pay');
    const liveDurationEl = document.getElementById('live-duration');
    const basePayEl = document.getElementById('base-pay');
    const brandedSoldEl = document.getElementById('branded-sold');
    const freeSizeSoldEl = document.getElementById('free-size-sold');
    const loggedEntriesTitle = document.getElementById('logged-entries-title');
    const bonusCardsContainer = document.getElementById('bonus-cards-container');

    // Attach event listeners for dashboard filters and pagination
    const setupDashboardListeners = () => {
        if (dateFilter && !dateFilter._hasDashboardListeners) {
            dateFilter.addEventListener('change', () => {
                const showCustom = dateFilter.value === 'Custom';
                customDateFilters.classList.toggle('hidden', !showCustom);
                if (role === 'seller') customDateFilters.classList.toggle('sm:flex', showCustom);
                if (!showCustom) { dashboardCurrentPage = 1; updateDashboardView(); }
            });
            if (startDateInput) startDateInput.addEventListener('change', () => { dashboardCurrentPage = 1; updateDashboardView(); });
            if (endDateInput) endDateInput.addEventListener('change', () => { dashboardCurrentPage = 1; updateDashboardView(); });
            if (document.getElementById('prev-page')) document.getElementById('prev-page').addEventListener('click', () => { if (dashboardCurrentPage > 1) { dashboardCurrentPage--; renderDashboardTable(); renderDashboardPagination(); } });
            if (document.getElementById('next-page')) document.getElementById('next-page').addEventListener('click', () => { const totalPages = Math.ceil(dashboardFilteredData.length / dashboardEntriesPerPage); if (dashboardCurrentPage < totalPages) { dashboardCurrentPage++; renderDashboardTable(); renderDashboardPagination(); } });
            dateFilter._hasDashboardListeners = true;
        }

        // Seller-specific 'Log New Session' button setup
        if (role === 'seller') {
            const logSessionButton = document.getElementById('open-log-session-modal');
            if (logSessionButton && !logSessionButton._hasLogSessionListeners) {
                const logSessionModal = document.getElementById('log-session-modal');
                const sessionLogForm = document.getElementById('session-log-form');

                logSessionButton.addEventListener('click', () => {
                    sessionLogForm.reset();
                    logSessionModal.classList.remove('hidden');
                });
                document.getElementById('cancel-log-session-btn').addEventListener('click', () => {
                    logSessionModal.classList.add('hidden');
                });

                sessionLogForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const submitBtn = e.target.querySelector('button[type="submit"]');
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting Log...';

                    const startStr = document.getElementById('session-start').value;
                    const endStr = document.getElementById('session-end').value;
                    const branded = parseInt(document.getElementById('branded-items').value) || 0;
                    const freeSize = parseInt(document.getElementById('free-size-items').value) || 0;

                    if (!startStr || !endStr) {
                        showAlert('Error', 'Please select both a start and end time.');
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Log';
                        return;
                    }
                    const startDate = new Date(startStr);
                    const endDate = new Date(endStr);
                    if (endDate <= startDate) {
                        showAlert('Error', 'End time must be after the start time.');
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Log';
                        return;
                    }
                    const duration = (endDate - startDate) / (1000 * 60 * 60);

                    const newEntry = {
                        session_start_time: startDate.toISOString(),
                        session_end_time: endDate.toISOString(),
                        live_duration_hours: duration,
                        branded_items_sold: branded,
                        free_size_items_sold: freeSize,
                        seller_id: profile.id
                    };
                    const { error } = await _supabase.from('logged_sessions').insert(newEntry);
                    if (error) {
                        showAlert('Error', 'Could not log session: ' + error.message);
                    } else {
                        updateDashboardView();
                        logSessionModal.classList.add('hidden');
                        showAlert('Success', 'Your session has been logged successfully!');
                    }
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Log';
                });
                logSessionButton._hasLogSessionListeners = true;
            }
        }
    };
    setupDashboardListeners();

    // Admin-specific seller filter setup
    if (role === 'admin' && sellerFilter && !sellerFilter._hasAdminSellerFilterListener) {
        const { data: sellers, error } = await _supabase.from('profiles').select('id, full_name').eq('role', 'seller').order('full_name');
        if (sellers) {
            sellerFilter.innerHTML = `<option value="all">All Sellers</option>` + sellers.map(s => `<option value="${s.id}">${s.full_name}</option>`).join('');
        }
        sellerFilter.addEventListener('change', () => { dashboardCurrentPage = 1; updateDashboardView(); });
        sellerFilter._hasAdminSellerFilterListener = true;
    }

    await updateDashboardView(); // Initial call to fetch data and render dashboard

    setLoading(false); // Hide the global loader only after the dashboard is fully rendered and ready
}

function renderDashboardTable() {
    const tableHead = document.querySelector('#table-container thead tr');
    const tableBody = document.getElementById('table-body');
    const noEntriesMessage = document.getElementById('no-entries');

    // These variables are now assumed to be accessible from the outer scope of runDashboardLogic
    // where renderDashboardTable is called
    // const dashboardSortConfig = ... (defined in runDashboardLogic)
    // const dashboardFilteredData = ... (defined in runDashboardLogic)
    // const dashboardCurrentPage = ... (defined in runDashboardLogic)
    // const dashboardEntriesPerPage = ... (defined in runDashboardLogic)

    if (!tableHead || !tableBody || !noEntriesMessage) {
        console.error("Dashboard table elements not found.");
        return;
    }

    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    const headers = [{ label: 'Date', key: 'session_start_time' }, { label: 'Duration', key: 'live_duration_hours' }, { label: 'Branded', key: 'branded_items_sold' }, { label: 'Free Size', key: 'free_size_items_sold' }];
    if (state.profile && state.profile.role === 'admin') {
        headers.splice(1, 0, { label: 'Seller', key: 'profiles.full_name' });
    }

    // MODIFIED: Pass dashboardSortConfig to createSortableHeader
    headers.forEach(h => tableHead.appendChild(createSortableHeader(h.label, h.key, dashboardSortConfig)));

    const startIndex = (dashboardCurrentPage - 1) * dashboardEntriesPerPage;
    const paginatedData = dashboardFilteredData.slice(startIndex, startIndex + dashboardEntriesPerPage);

    noEntriesMessage.style.display = paginatedData.length === 0 ? 'block' : 'none';

    paginatedData.forEach((item, index) => {
        const itemDate = new Date(item.session_start_time);
        const row = document.createElement('tr');
        row.className = 'transition-colors duration-200 hover:bg-primary-lavender/60 ' + (index % 2 !== 0 ? 'bg-[rgba(0,0,0,0.04)]' : '');
        row.innerHTML = `<td class="p-4 whitespace-nowrap">${itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td> ${state.profile && state.profile.role === 'admin' ? `<td class="p-4 whitespace-nowrap">${item.profiles.full_name}</td>` : ''} <td class="p-4 whitespace-nowrap">${item.live_duration_hours !== null ? item.live_duration_hours.toFixed(2) : 'N/A'} hrs</td> <td class="p-4 whitespace-nowrap">${item.branded_items_sold !== null ? item.branded_items_sold : 'N/A'}</td> <td class="p-4 whitespace-nowrap">${item.free_size_items_sold !== null ? item.free_size_items_sold : 'N/A'}</td>`;
        tableBody.appendChild(row);
    });
}

function renderDashboardPagination() {
    const paginationControls = document.getElementById('pagination-controls');
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');

    if (!paginationControls || !pageInfo || !prevPageBtn || !nextPageBtn) {
        console.error("Dashboard pagination elements not found.");
        return;
    }

    const totalPages = Math.ceil(dashboardFilteredData.length / dashboardEntriesPerPage);
    paginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
    pageInfo.innerHTML = `Page <strong>${dashboardCurrentPage}</strong> of <strong>${totalPages}</strong>`;
    prevPageBtn.disabled = dashboardCurrentPage === 1;
    nextPageBtn.disabled = dashboardCurrentPage === totalPages;
}

// MODIFIED: createSortableHeader now accepts currentSortConfig as an argument
function createSortableHeader(label, key, currentSortConfig) {
    const th = document.createElement('th');
    th.className = "p-4 text-left font-semibold uppercase tracking-wider text-xs cursor-pointer";
    th.dataset.key = key;
    const iconContainer = currentSortConfig.key === key ? `<i data-lucide="${currentSortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}" class="h-4 w-4 ml-1"></i>` : '<div class="h-4 w-4 ml-1 opacity-20"><i data-lucide="chevron-down"></i></div>';
    th.innerHTML = `<div class="flex items-center">${label}${iconContainer}</div>`;
    th.addEventListener('click', () => {
        // These global variables are now updated directly within runDashboardLogic's scope
        dashboardSortConfig.direction = (currentSortConfig.key === key && currentSortConfig.direction === 'asc') ? 'desc' : 'asc';
        dashboardSortConfig.key = key;
        dashboardCurrentPage = 1;
        updateDashboardView(); // Re-render the dashboard
    });
    return th;
}
