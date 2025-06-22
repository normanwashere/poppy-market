// src/dashboard.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert, parseDateAsUTC, getWeekRange, getMonthRange, setLoading } from './helpers.js';
import { showRuleSetDetailsModal } from './rules.js'; // Import showRuleSetDetailsModal for use in showBonusDetailsModalForDashboard

// Module-scoped variables (accessible by all functions in this module)
let dashboardFilteredData = [];
let dashboardSortConfig = { key: 'session_start_time', direction: 'desc' };
let dashboardCurrentPage = 1;
const dashboardEntriesPerPage = 5;

// Helper function to create sortable table headers
function createSortableHeader(label, key, currentSortConfig) {
    const th = document.createElement('th');
    th.className = "p-4 text-left font-semibold uppercase tracking-wider text-xs cursor-pointer";
    th.dataset.key = key;
    const iconContainer = currentSortConfig.key === key ? `<i data-lucide="${currentSortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}" class="h-4 w-4 ml-1"></i>` : '<div class="h-4 w-4 ml-1 opacity-20"><i data-lucide="chevron-down"></i></div>';
    th.innerHTML = `<div class="flex items-center"><span class="math-inline">\{label\}</span>{iconContainer}</div>`;
    th.addEventListener('click', () => {
        dashboardSortConfig.direction = (currentSortConfig.key === key && currentSortConfig.direction === 'asc') ? 'desc' : 'asc';
        dashboardSortConfig.key = key;
        dashboardCurrentPage = 1;
        updateDashboardView(); // Call the update function to re-render
    });
    return th;
}

// Function to render the dashboard table content
function renderDashboardTable() {
    const tableHead = document.querySelector('#table-container thead tr');
    const tableBody = document.getElementById('table-body');
    const noEntriesMessage = document.getElementById('no-entries');

    if (!tableHead || !tableBody || !noEntriesMessage) {
        console.error("Dashboard table elements not found in renderDashboardTable.");
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
            ${state.profile && state.profile.role === 'admin' ? `<td class="p-4 whitespace-nowrap">${item.profiles.full_name}</td>` : ''}
            <td class="p-4 whitespace-nowrap"><span class="math-inline">\{item\.live\_duration\_hours \!\=\= null ? item\.live\_duration\_hours\.toFixed\(2\) \: 'N/A'\} hrs</td\>
