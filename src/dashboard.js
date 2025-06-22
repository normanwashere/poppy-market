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
    // MODIFIED: Access dashboardSortConfig from the outer scope where it's defined
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

    // Check role from global state for conditional columns
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

    // Fetch active rule sets of type 'Bonus' and their rules
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
        card.addEventListener('click', (e) => {
            showBonusDetailsModalForDashboard(e.currentTarget.dataset.rulesetid);
        });
    });
    lucide.createIcons();
}

// Main update logic for the dashboard, fetches data and re-renders
async function updateDashboardView() {
    const { profile } = state;
    const sellerFilter = document.getElementById('seller-filter');
    const dateFilter = document.getElementById('date-filter');
    const customDateFilters = document.getElementById('custom-date-filters');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    // These elements are available in this scope
    const finalPayLabel = document.getElementById('final-pay-label');
    const liveDurationLabel = document.getElementById('live-duration-label');
    const basePayLabel = document.getElementById('base-pay-label');
    const brandedSoldLabel = document.getElementById('branded-sold-label');
    const freeSizeSoldLabel = document.getElementById('free-size-sold-label');
    const finalPayEl = document.getElementById('final-pay');
    const liveDurationEl = document.getElementById('live-duration');
    const basePayEl = document.getElementById('base-pay');
    const brandedSoldEl = document.getElementById('branded-sold');
    const freeSizeSoldEl = document.getElementById('free-size-sold');
    const loggedEntriesTitle = document.getElementById('logged-entries-title');
    const bonusCardsContainer = document.getElementById('bonus-cards-container');

    const baseHourlyPay = state.globalSettings.base_hourly_pay_seller || 0;
    const defaultCurrencySymbol = state.globalSettings.default_currency_symbol || '₱';

    let query = _supabase.from('logged_sessions').select('*, profiles!seller_id(full_name)');

    if (state.profile.role === 'seller') { // Use state.profile.role directly
        query = query.eq('seller_id', state.profile.id);
    } else if (sellerFilter) { // Only for admin dashboard
        const selectedSellerId = sellerFilter.value;
        if (selectedSellerId !== 'all') {
            query = query.eq('seller_id', selectedSellerId);
        }
    }

    let range = { start: null, end: null };
    switch (dateFilter.value) {
        case 'This Week': range = getWeekRange('this'); break;
        case 'Last Week': range = getWeekRange('last'); break;
        case 'This Month': range = getMonthRange('this'); break;
        case 'Custom':
            if (startDateInput.value && endDateInput.value) {
                range.start = parseDateAsUTC(startDateInput.value);
                range.end = parseDateAsUTC(endDateInput.value);
                if (range.end) range.end.setUTCHours(23, 59, 59, 999);
            }
            break;
        default: break;
    }
    if (range.start) query = query.gte('session_start_time', range.start.toISOString());
    if (range.end) query = query.lte('session_start_time', range.end.toISOString());

    const { data, error } = await query;
    if (error) { showAlert('Error', 'Could not fetch session data: ' + error.message); return; }

    dashboardFilteredData = data;

    const metrics = dashboardFilteredData.reduce((acc, item) => {
        acc.duration += item.live_duration_hours || 0;
        acc.basePay += (item.live_duration_hours || 0) * baseHourlyPay;
        acc.branded_items += item.branded_items_sold || 0;
        acc.free_size_items += item.free_size_items_sold || 0;
        acc.total_revenue += item.total_revenue || 0;
        return acc;
    }, { duration: 0, basePay: 0, branded_items: 0, free_size_items: 0, total_revenue: 0 });

    let totalBonusAmount = 0;
    const { data: activeBonusRuleSets, error: ruleSetError } = await _supabase
        .from('rule_sets')
        .select(`
            rules (criteria_field, operator, target_value, payout_type, payout_value)
        `)
        .eq('is_active', true)
        .in('rule_type_id', (await _supabase.from('rule_types').select('id').eq('name', 'Bonus')).data.map(t => t.id))
        .filter('effective_start_date', 'lte', new Date().toISOString())
        .or('effective_end_date.is.null,effective_end_date.gte.' + new Date().toISOString());

    if (ruleSetError) {
        console.error('Error fetching active bonus rule sets for calculation:', ruleSetError.message);
    } else if (activeBonusRuleSets) {
        activeBonusRuleSets.forEach(ruleSet => {
            let allRulesInSetMet = true;
            let payoutForThisSet = 0;

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
                totalBonusAmount += payoutForThisSet;
            }
        });
    }

    await renderBonusCards(dashboardFilteredData, range);

    const finalPay = metrics.basePay + totalBonusAmount;
    const sellerName = (state.profile.role === 'admin' && sellerFilter && sellerFilter.value !== 'all') ? sellerFilter.options[sellerFilter.selectedIndex].text : state.profile.full_name;
    const isAllSellers = state.profile.role === 'admin' && sellerFilter && sellerFilter.value === 'all';

    finalPayLabel.textContent = "Final Pay";
    liveDurationLabel.textContent = "Live Duration";
    basePayLabel.textContent = "Base Pay";
    brandedSoldLabel.textContent = "Branded Sold";
    freeSizeSoldLabel.textContent = "Free Size Sold";
    loggedEntriesTitle.textContent = isAllSellers ? 'All Logged Entries' : `${sellerName}'s Logged Entries`;

    finalPayEl.textContent = `${defaultCurrencySymbol}${finalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    liveDurationEl.innerHTML = `${metrics.duration.toFixed(1)} <span class="text-xl align-baseline">hrs</span>`;
    basePayEl.textContent = `${defaultCurrencySymbol}${metrics.basePay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    brandedSoldEl.textContent = metrics.branded_items.toLocaleString();
    freeSizeSoldEl.textContent = metrics.free_size_items.toLocaleString();

    dashboardFilteredData.sort((a, b) => {
        const aValue = a[dashboardSortConfig.key];
        const bValue = b[dashboardSortConfig.key];
        if (aValue < bValue) return dashboardSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return dashboardSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    renderDashboardTable();
    renderDashboardPagination();
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

    // MODIFIED: Correctly reference LABEL elements (h3 tags)
    // These need to be declared here to be in scope for updateDashboardView
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
    // Use an IIFE or named function to ensure 'role' is captured for these listeners.
    const setupDashboardListeners = () => {
        if (dateFilter && !dateFilter._hasDashboardListeners) { // Use a flag on the element itself
            dateFilter.addEventListener('change', () => {
                const showCustom = dateFilter.value === 'Custom';
                customDateFilters.classList.toggle('hidden', !showCustom);
                if (role === 'seller') customDateFilters.classList.toggle('sm:flex', showCustom); // Adjust flex for mobile on seller dashboard
                if (!showCustom) { dashboardCurrentPage = 1; updateDashboardView(); } // Call the update function
            });
            if (startDateInput) startDateInput.addEventListener('change', () => { dashboardCurrentPage = 1; updateDashboardView(); });
            if (endDateInput) endDateInput.addEventListener('change', () => { dashboardCurrentPage = 1; updateDashboardView(); });
            if (document.getElementById('prev-page')) document.getElementById('prev-page').addEventListener('click', () => { if (dashboardCurrentPage > 1) { dashboardCurrentPage--; renderDashboardTable(); renderDashboardPagination(); } });
            if (document.getElementById('next-page')) document.getElementById('next-page').addEventListener('click', () => { const totalPages = Math.ceil(dashboardFilteredData.length / dashboardEntriesPerPage); if (dashboardCurrentPage < totalPages) { dashboardCurrentPage++; renderDashboardTable(); renderDashboardPagination(); } });
            dateFilter._hasDashboardListeners = true; // Set flag
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
                        updateDashboardView(); // Re-render dashboard after logging session
                        logSessionModal.classList.add('hidden');
                        showAlert('Success', 'Your session has been logged successfully!');
                    }
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Log';
                });
                logSessionButton._hasLogSessionListeners = true; // Set flag
            }
        }
    };
    setupDashboardListeners(); // Call to set up listeners

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
