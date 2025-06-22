// src/dashboard.js
import { _supabase, state } from './supabaseClient.js';
import { showAlert, parseDateAsUTC, getWeekRange, getMonthRange, setLoading } from './helpers.js';
import { showRuleSetDetailsModal } from './rules.js';

let dashboardFilteredData = [];
let dashboardSortConfig = { key: 'session_start_time', direction: 'desc' };
let dashboardCurrentPage = 1;
const dashboardEntriesPerPage = 5;

function createSortableHeader(label, key, currentSortConfig) {
    const th = document.createElement('th');
    th.className = "p-4 text-left font-semibold uppercase tracking-wider text-xs cursor-pointer";
    th.dataset.key = key;
    const iconContainer = currentSortConfig.key === key ? `<i data-lucide="${currentSortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}" class="h-4 w-4 ml-1"></i>` : '<div class="h-4 w-4 ml-1 opacity-20"><i data-lucide="chevron-down"></i></div>';
    th.innerHTML = `<div class="flex items-center">${label}${iconContainer}</div>`;
    th.addEventListener('click', () => {
        dashboardSortConfig.direction = (currentSortConfig.key === key && currentSortConfig.direction === 'asc') ? 'desc' : 'asc';
        dashboardSortConfig.key = key;
        dashboardCurrentPage = 1;
        updateDashboardView();
    });
    return th;
}

function renderDashboardTable() {
    const tableHead = document.querySelector('#table-container thead tr');
    const tableBody = document.getElementById('table-body');
    const noEntriesMessage = document.getElementById('no-entries');
    if (!tableHead || !tableBody || !noEntriesMessage) return;

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

    headers.forEach(h => tableHead.appendChild(createSortableHeader(h.label, h.key, dashboardSortConfig)));

    const startIndex = (dashboardCurrentPage - 1) * dashboardEntriesPerPage;
    const paginatedData = dashboardFilteredData.slice(startIndex, startIndex + dashboardEntriesPerPage);
    noEntriesMessage.style.display = paginatedData.length === 0 ? 'block' : 'none';

    paginatedData.forEach((item, index) => {
        const itemDate = new Date(item.session_start_time);
        const row = document.createElement('tr');
        row.className = 'transition-colors duration-200 hover:bg-primary-lavender/60 ' + (index % 2 !== 0 ? 'bg-[rgba(0,0,0,0.04)]' : '');
        row.innerHTML = `
            <td class="p-4 whitespace-nowrap">${itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            ${state.profile && state.profile.role === 'admin' ? `<td class="p-4 whitespace-nowrap">${item.profiles ? item.profiles.full_name : 'N/A'}</td>` : ''}
            <td class="p-4 whitespace-nowrap">${item.live_duration_hours !== null ? item.live_duration_hours.toFixed(2) : 'N/A'} hrs</td>
            <td class="p-4 whitespace-nowrap">${item.branded_items_sold !== null ? item.branded_items_sold : 'N/A'}</td>
            <td class="p-4 whitespace-nowrap">${item.free_size_items_sold !== null ? item.free_size_items_sold : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function renderDashboardPagination() {
    const paginationControls = document.getElementById('pagination-controls');
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    if (!paginationControls || !pageInfo || !prevPageBtn || !nextPageBtn) return;

    const totalPages = Math.ceil(dashboardFilteredData.length / dashboardEntriesPerPage);
    paginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
    pageInfo.innerHTML = `Page <strong>${dashboardCurrentPage}</strong> of <strong>${totalPages}</strong>`;
    prevPageBtn.disabled = dashboardCurrentPage === 1;
    nextPageBtn.disabled = dashboardCurrentPage === totalPages;
}

async function renderBonusCards() {
    // This function can remain largely the same, but ensure it correctly handles the data
    // ... (Your existing renderBonusCards logic)
}

// FIX: This is the main function that fetches and updates data.
export async function updateDashboardView() {
    setLoading(true);
    const { profile } = state;
    const sellerFilter = document.getElementById('seller-filter');
    const dateFilter = document.getElementById('date-filter');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const finalPayEl = document.getElementById('final-pay');
    // ... (get other DOM elements)

    const baseHourlyPay = state.globalSettings.base_hourly_pay_seller || 0;
    const defaultCurrencySymbol = state.globalSettings.default_currency_symbol || '₱';

    let query = _supabase.from('logged_sessions').select('*, profiles:seller_id(full_name)');

    if (profile.role === 'seller') {
        query = query.eq('seller_id', profile.id);
    } else if (sellerFilter && sellerFilter.value !== 'all') {
        query = query.eq('seller_id', sellerFilter.value);
    }

    let range = { start: null, end: null };
    if (dateFilter) {
        // ... (your existing date filter logic)
    }

    if (range.start) query = query.gte('session_start_time', range.start.toISOString());
    if (range.end) query = query.lte('session_start_time', range.end.toISOString());

    const { data, error } = await query.order(dashboardSortConfig.key, { ascending: dashboardSortConfig.direction === 'asc' });

    if (error) {
        showAlert('Error', 'Could not fetch session data: ' + error.message);
        setLoading(false);
        return;
    }

    dashboardFilteredData = data || [];
    
    // ... (Your existing logic for calculating metrics and final pay)

    renderDashboardTable();
    renderDashboardPagination();
    await renderBonusCards();
    window.lucide.createIcons();
    setLoading(false);
}

// FIX: A new function to set up listeners only ONCE.
function setupDashboardListeners() {
    const dateFilter = document.getElementById('date-filter');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');

    if (dateFilter && !dateFilter.dataset.listenerAttached) {
        dateFilter.addEventListener('change', () => {
            const customDateFilters = document.getElementById('custom-date-filters');
            const showCustom = dateFilter.value === 'Custom';
            if (customDateFilters) customDateFilters.classList.toggle('hidden', !showCustom);
            if (!showCustom) {
                dashboardCurrentPage = 1;
                updateDashboardView();
            }
        });
        startDateInput.addEventListener('change', () => { dashboardCurrentPage = 1; updateDashboardView(); });
        endDateInput.addEventListener('change', () => { dashboardCurrentPage = 1; updateDashboardView(); });
        prevPageBtn.addEventListener('click', () => { if (dashboardCurrentPage > 1) { dashboardCurrentPage--; renderDashboardTable(); renderDashboardPagination(); } });
        nextPageBtn.addEventListener('click', () => { const totalPages = Math.ceil(dashboardFilteredData.length / dashboardEntriesPerPage); if (dashboardCurrentPage < totalPages) { dashboardCurrentPage++; renderDashboardTable(); renderDashboardPagination(); } });
        dateFilter.dataset.listenerAttached = 'true';
    }

    if (state.profile.role === 'admin') {
        const sellerFilter = document.getElementById('seller-filter');
        if (sellerFilter && !sellerFilter.dataset.listenerAttached) {
             _supabase.from('profiles').select('id, full_name').eq('role', 'seller').order('full_name').then(({data: sellers}) => {
                if(sellers) {
                    sellerFilter.innerHTML = `<option value="all">All Sellers</option>` + sellers.map(s => `<option value="${s.id}">${s.full_name}</option>`).join('');
                }
             });
            sellerFilter.addEventListener('change', () => { dashboardCurrentPage = 1; updateDashboardView(); });
            sellerFilter.dataset.listenerAttached = 'true';
        }
    }
}

// FIX: Simplified admin dashboard initialization
function initializeAdminDashboard(container) {
    container.innerHTML = `<div class="clay-card p-4 mb-8"><div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"><div><label for="seller-filter" class="block text-sm font-medium mb-1">Filter by Seller</label><select id="seller-filter" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></select></div><div><label for="date-filter" class="block text-sm font-medium mb-1">Filter by Date Range</label><select id="date-filter" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"><option>All Time</option><option>This Week</option><option>Last Week</option><option>This Month</option><option>Custom</option></select></div></div><div id="custom-date-filters" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"><div><label for="start-date" class="block text-sm font-medium mb-1">Start Date</label><input type="date" id="start-date" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></div><div><label for="end-date" class="block text-sm font-medium mb-1">End Date</label><input type="date" id="end-date" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></div></div></div>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div class="md:col-span-2 clay-card p-6 flex flex-col justify-center"><div class="flex items-center justify-between text-gray-600 mb-2"><h3 id="final-pay-label" class="text-lg font-semibold uppercase tracking-wider"></h3><i data-lucide="wallet" class="text-gray-500"></i></div><p id="final-pay" class="font-playfair text-6xl font-bold" style="color: #831843;">₱0.00</p></div>
        <div class="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="clay-card p-4 flex flex-col justify-center text-center"><h3 id="live-duration-label" class="text-sm font-semibold uppercase tracking-wider text-gray-600"></h3><p id="live-duration" class="font-playfair text-3xl font-bold text-gray-800 mt-2">0.0 <span class="text-xl align-baseline">hrs</span></p></div>
            <div class="clay-card p-4 flex flex-col justify-center text-center"><h3 id="base-pay-label" class="text-sm font-semibold uppercase tracking-wider text-gray-600"></h3><p id="base-pay" class="font-playfair text-3xl font-bold text-gray-800 mt-2">₱0.00</p></div>
            <div class="clay-card p-4 flex flex-col justify-center text-center"><h3 id="branded-sold-label" class="text-sm font-semibold uppercase tracking-wider text-gray-600"></h3><p id="branded-sold" class="font-playfair text-3xl font-bold mt-2 text-gray-800">0</p></div>
            <div class="clay-card p-4 flex flex-col justify-center text-center"><h3 id="free-size-sold-label" class="text-sm font-semibold uppercase tracking-wider text-gray-600"></h3><p id="free-size-sold" class="font-playfair text-3xl font-bold mt-2 text-gray-800">0</p></div>
        </div>
    </div>
    <div class="clay-card p-6 mb-8"><h3 class="font-playfair text-2xl font-bold mb-4">Running Incentives</h3><div id="bonus-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div></div>
    <div class="clay-card overflow-hidden"><h2 id="logged-entries-title" class="text-xl p-6 font-bold font-playfair border-b-2 border-dashed border-lavender-300"></h2><div id="table-container" class="overflow-x-auto"><table class="w-full table-auto"><thead class="text-gray-600"><tr></tr></thead><tbody id="table-body"></tbody></table></div><div id="no-entries" class="text-center p-8 text-gray-500 hidden">No entries found.</div><div id="pagination-controls" class="p-4 flex items-center justify-between flex-wrap gap-2"><span id="page-info" class="text-sm"></span><div class="flex items-center gap-2"><button id="prev-page" class="clay-button p-2 disabled:opacity-50"><i data-lucide="chevron-left"></i></button><button id="next-page" class="clay-button p-2 disabled:opacity-50"><i data-lucide="chevron-right"></i></button></div></div></div>`;
    setupDashboardListeners();
    updateDashboardView();
}

// FIX: Simplified seller dashboard initialization
function initializeSellerDashboard(container) {
    container.innerHTML = `<div class="clay-card p-4 mb-8"><div class="flex flex-col sm:flex-row items-center justify-between gap-4"><div class="flex-grow flex flex-wrap items-end gap-4"><div><label for="date-filter" class="block text-sm font-medium mb-1">Date Range</label><select id="date-filter" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"><option>All Time</option><option>This Week</option><option>Last Week</option><option>This Month</option><option>Custom</option></select></div><div id="custom-date-filters" class="hidden flex-grow sm:flex items-end gap-4"><div><label for="start-date" class="block text-sm font-medium mb-1">Start</label><input type="date" id="start-date" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></div><div><label for="end-date" class="block text-sm font-medium mb-1">End</label><input type="date" id="end-date" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></div></div></div><div class="w-full sm:w-auto mt-4 sm:mt-0"><button id="open-log-session-modal" class="clay-button clay-button-primary w-full px-6 py-4 text-lg">Log New Session</button></div></div></div>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div class="md:col-span-2 clay-card p-6 flex flex-col justify-center"><div class="flex items-center justify-between text-gray-600 mb-2"><h3 id="final-pay-label" class="text-lg font-semibold uppercase tracking-wider"></h3><i data-lucide="wallet" class="text-gray-500"></i></div><p id="final-pay" class="font-playfair text-6xl font-bold" style="color: #831843;">₱0.00</p></div>
        <div class="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="clay-card p-4 flex flex-col justify-center text-center"><h3 id="live-duration-label" class="text-sm font-semibold uppercase tracking-wider text-gray-600"></h3><p id="live-duration" class="font-playfair text-3xl font-bold text-gray-800 mt-2">0.0 <span class="text-xl align-baseline">hrs</span></p></div>
            <div class="clay-card p-4 flex flex-col justify-center text-center"><h3 id="base-pay-label" class="text-sm font-semibold uppercase tracking-wider text-gray-600"></h3><p id="base-pay" class="font-playfair text-3xl font-bold text-gray-800 mt-2">₱0.00</p></div>
            <div class="clay-card p-4 flex flex-col justify-center text-center"><h3 id="branded-sold-label" class="text-sm font-semibold uppercase tracking-wider text-gray-600"></h3><p id="branded-sold" class="font-playfair text-3xl font-bold mt-2 text-gray-800">0</p></div>
            <div class="clay-card p-4 flex flex-col justify-center text-center"><h3 id="free-size-sold-label" class="text-sm font-semibold uppercase tracking-wider text-gray-600"></h3><p id="free-size-sold" class="font-playfair text-3xl font-bold mt-2 text-gray-800">0</p></div>
        </div>
    </div>
    <div class="clay-card p-6 mb-8"><h3 class="font-playfair text-2xl font-bold mb-4">Running Incentives</h3><div id="bonus-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div></div>
    <div class="clay-card overflow-hidden"><h2 id="logged-entries-title" class="text-xl p-6 font-bold font-playfair border-b-2 border-dashed border-lavender-300"></h2><div id="table-container" class="overflow-x-auto"><table class="w-full table-auto"><thead class="text-gray-600"><tr></tr></thead><tbody id="table-body"></tbody></table></div><div id="no-entries" class="text-center p-8 text-gray-500 hidden">No entries found for the selected filters.</div><div id="pagination-controls" class="p-4 flex items-center justify-between flex-wrap gap-2"><span id="page-info" class="text-sm"></span><div class="flex items-center gap-2"><button id="prev-page" class="clay-button p-2 disabled:opacity-50 disabled:cursor-not-allowed"><i data-lucide="chevron-left"></i></button><button id="next-page" class="clay-button p-2 disabled:opacity-50 disabled:cursor-not-allowed"><i data-lucide="chevron-right"></i></button></div></div></div>`;
    setupDashboardListeners();
    updateDashboardView();
}

// This is the main entry point for the dashboard page, exported for use in main.js
export function setupDashboardPage() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    if (state.profile.role === 'admin') {
        document.getElementById('dashboard-title').textContent = "Admin Dashboard";
        document.getElementById('dashboard-subtitle').textContent = "Platform-wide performance overview.";
        initializeAdminDashboard(container);
    } else {
        document.getElementById('dashboard-title').textContent = "Dashboard";
        document.getElementById('dashboard-subtitle').textContent = `Welcome back, ${state.profile.full_name}!`;
        initializeSellerDashboard(container);
    }
}
