// src/helpers.js
export const showAlert = (title, message, onOk) => {
    const modal = document.getElementById('alert-modal');
    if (!modal) return;
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    modal.classList.remove('hidden');
    const okBtn = document.getElementById('alert-ok-btn');
    okBtn.onclick = () => {
        modal.classList.add('hidden');
        if (onOk) onOk();
    };
};

export const setLoading = (isLoading) => {
    const loader = document.getElementById('loader');
    const appContainer = document.getElementById('app-container');
    if (!loader || !appContainer) return; // Ensure elements exist
    if (isLoading) {
        loader.classList.remove('hidden');
        appContainer.classList.add('hidden');
    } else {
        loader.classList.add('hidden');
        appContainer.classList.remove('hidden');
    }
};

export const parseDateAsUTC = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString.trim());
    if (isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

export const getWeekRange = (weekType) => {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    let endOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + daysUntilTuesday);
    if (weekType === 'last') endOfWeek.setUTCDate(endOfWeek.getUTCDate() - 7);
    let startOfWeek = new Date(endOfWeek);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 6);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    endOfWeek.setUTCHours(23, 59, 59, 999);
    return { start: startOfWeek, end: endOfWeek };
};

export const getMonthRange = (monthType) => {
    const today = new Date();
    let year = today.getUTCFullYear();
    let month = today.getUTCMonth();
    if (monthType === 'last') {
        month -= 1;
        if (month < 0) { month = 11; year -= 1; }
    }
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    end.setUTCHours(23,59,59,999);
    return { start, end };
};
