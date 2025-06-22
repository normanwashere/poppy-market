// src/templates.js
export const pageTemplates = {
    login: `<div class="w-full max-w-md mx-auto"><header class="text-center mb-8"><div class="inline-block bg-white p-4 rounded-full shadow-md mb-4 clay-card"><img src="https://dgtalbay.static.domains/icon2.png" alt="Poppy Platform Icon" class="w-10 h-10"></div><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Welcome Back</h1><p class="text-gray-500 mt-2">Log in to access your dashboard.</p></header><form id="login-form" class="clay-card p-6 sm:p-8 space-y-6"><div><label for="login-email" class="block text-sm font-medium mb-2">Email Address</label><input type="email" id="login-email" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div><div><label for="login-password" class="block text-sm font-medium mb-2">Password</label><input type="password" id="login-password" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div><div class="pt-2"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Login</button></div></form><div class="text-center mt-6"><p class="text-sm">Don't have an account? <a href="#" data-page="signup" class="font-semibold hover:underline" style="color: #831843;">Sign Up</a></p></div></div>`,
    signup: `<div class="w-full max-w-md mx-auto"><header class="text-center mb-8"><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Create Your Account</h1><p class="text-gray-500 mt-2">Join the Poppy Platform.</p></header><form id="signup-form" class="clay-card p-6 sm:p-8 space-y-6"><div><label for="fullname" class="block text-sm font-medium mb-2">Full Name</label><input type="text" id="fullname" name="fullname" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div><div><label for="email" class="block text-sm font-medium mb-2">Email Address</label><input type="email" id="email" name="email" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div><div><label for="password" class="block text-sm font-medium mb-2">Password</label><input type="password" id="password" name="password" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div><div class="pt-2"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Create Account</button></div></form><div class="text-center mt-6"><p class="text-sm">Already have an account? <a href="#" data-page="login" class="font-semibold hover:underline" style="color: #831843;">Login</a></p></div></div>`,
    dashboard: `<div class="w-full max-w-7xl mx-auto"><header class="text-center mb-8"><h1 id="dashboard-title" class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700"></h1><p id="dashboard-subtitle" class="text-gray-500 mt-2"></p></header><div id="dashboard-container"></div></div>`,
    scheduler: `<div class="w-full max-w-7xl mx-auto">
                    <header class="text-center mb-8">
                        <h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Live Session Scheduler</h1>
                        <p class="text-gray-500 mt-2">Book your upcoming live sessions.</p>
                    </header>
                    <div id="calendar-legend" class="flex flex-wrap justify-center items-center gap-4 mb-6 text-sm font-semibold">
                        <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full" style="background-color: var(--primary-mint);"></div><span>Approved</span></div>
                        <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full" style="background-color: var(--action-yellow);"></div><span>Pending</span></div>
                        <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full" style="background-color: var(--action-red);"></div><span>Takeover</span></div>
                        <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full" style="background-color: var(--action-pink);"></div><span>Live</span></div>
                    </div>
                    <div class="clay-card p-2 sm:p-6 mb-8"><div id='calendar'></div></div>
                </div>`,    
    scheduler: `<div class="w-full max-w-7xl mx-auto"><header class="text-center mb-8"><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Live Session Scheduler</h1><p class="text-gray-500 mt-2">Book your upcoming live sessions.</p></header><div class="clay-card p-2 sm:p-6 mb-8"><div id='calendar'></div></div></div>`,
    userManagement: `<div class="w-full max-w-4xl mx-auto"><header class="text-center mb-8"><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">User Management</h1><p class="text-gray-500 mt-2">Approve new seller accounts and manage existing users.</p></header><div id="user-list-container" class="clay-card overflow-hidden"></div></div>`,
    bonusRules: `<div class="w-full max-w-5xl mx-auto"><header class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"><div class="text-center sm:text-left"><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Bonus Rules</h1><p class="text-gray-500 mt-2">Create and manage performance-based bonus schemes.</p></div><button id="create-new-rule-btn" class="clay-button clay-button-primary w-full sm:w-auto px-6 py-4 text-lg">Create New Rule</button></header><div id="bonus-rules-list" class="space-y-4"></div></div>`,
    bonusReview: `<div class="w-full max-w-5xl mx-auto"><header class="text-center mb-8"><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Bonus Review</h1><p class="text-gray-500 mt-2">Review and manage achieved bonuses.</p></header><div id="bonus-review-list" class="space-y-4"></div></div>`,
    globalSettings: `<div class="w-full max-w-4xl mx-auto"><header class="text-center mb-8"><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Global Settings</h1><p class="text-gray-500 mt-2">Configure platform-wide operational parameters.</p></header><div id="settings-list" class="space-y-4"></div></div>`,
    ruleSetManagement: `<div class="w-full max-w-6xl mx-auto"><header class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"><div class="text-center sm:text-left"><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Rule Set Management</h1><p class="text-gray-500 mt-2">Define and manage compensation rule sets.</p></div><button id="create-new-ruleset-btn" class="clay-button clay-button-primary w-full sm:w-auto px-6 py-4 text-lg">Create New Rule Set</button></header><div id="rulesets-list" class="space-y-4"></div></div>`,
    userProfile: `<div class="w-full max-w-2xl mx-auto"><header class="text-center mb-8"><h1 class="font-playfair text-4xl sm:text-5xl font-bold text-gray-700">Profile</h1><p class="text-gray-500 mt-2">Update your personal information and password.</p></header><form id="profile-info-form" class="clay-card p-6 sm:p-8 space-y-8 mb-8"><fieldset><legend class="font-playfair text-2xl font-bold mb-4">Contact Information</legend><div class="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label for="profile-gcash" class="block text-sm font-medium mb-2">GCash Number</label><input type="text" id="profile-gcash" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div><div><label for="profile-contact" class="block text-sm font-medium mb-2">Contact Number</label><input type="text" id="profile-contact" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div><div class="sm:col-span-2"><label for="profile-emergency" class="block text-sm font-medium mb-2">Emergency Contact</label><input type="text" id="profile-emergency" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div></div></fieldset><div class="pt-2"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Save Information</button></div></form><form id="password-change-form" class="clay-card p-6 sm:p-8 space-y-8"><fieldset><legend class="font-playfair text-2xl font-bold mb-4">Change Password</legend><div class="space-y-6"><div><label for="profile-new-password" class="block text-sm font-medium mb-2">New Password</label><input type="password" id="profile-new-password" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div><div><label for="profile-confirm-password" class="block text-sm font-medium mb-2">Confirm New Password</label><input type="password" id="profile-confirm-password" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div></div></fieldset><div class="pt-2"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Change Password</button></div></div></form>`
};
export const modalTemplates = {
    alert: `<div id="alert-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-sm p-6 sm:p-8 text-center"><h2 id="alert-title" class="font-playfair text-2xl font-bold text-gray-700 mb-4"></h2><p id="alert-message" class="text-gray-600 mb-6"></p><button type="button" id="alert-ok-btn" class="clay-button clay-button-primary w-full p-3 text-lg text-gray-800">OK</button></div></div>`,
    logSession: `<div id="log-session-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-2xl p-6 sm:p-8"><h2 class="font-playfair text-3xl font-bold text-gray-700 mb-6">Log New Session</h2><form id="session-log-form" class="space-y-8"><fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-6"><legend class="sr-only">Session Start and End Time</legend><div><label for="session-start" class="block text-sm font-medium mb-2">Session Start</label><input type="datetime-local" id="session-start" name="session-start" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div><div><label for="session-end" class="block text-sm font-medium mb-2">Session End</label><input type="datetime-local" id="session-end" name="session-end" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div></fieldset><fieldset><legend class="font-playfair text-2xl font-bold mb-4">Items Sold</legend><div class="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label for="branded-items" class="block text-sm font-medium mb-2">Branded Items</label><input type="number" id="branded-items" name="branded-items" value="0" min="0" placeholder="0" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div><div><label for="free-size-items" class="block text-sm font-medium mb-2">Free Size Items</label><input type="number" id="free-size-items" name="free-size-items" value="0" min="0" placeholder="0" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div></div></fieldset><div class="pt-4 flex flex-col sm:flex-row gap-4"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Submit Log</button><button type="button" id="cancel-log-session-btn" class="clay-button w-full p-4 text-xl text-gray-700">Cancel</button></div></form></div></div>`,
     booking: `
        <div id="booking-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div class="clay-card w-full max-w-lg p-6 sm:p-8">
                <h2 class="font-playfair text-3xl font-bold text-gray-700 mb-2">Book Session</h2>
                
                <p id="booking-date-display" class="text-center text-lg font-semibold text-gray-600 mb-6"></p>
                
                <form id="booking-form" class="space-y-6">
                    <div><label for="event-title" class="block text-sm font-medium mb-2">Your Name</label><input type="text" id="event-title" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required readonly></div>
                    <div><label for="start-time" class="block text-sm font-medium mb-2">Session Start Time</label><input type="time" id="start-time" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div>
                    <p class="text-center text-sm font-semibold h-4 text-gray-600">Session will be booked for <span id="booking-duration-display">3</span> hours.</p>
                    <div class="pt-4 flex flex-col sm:flex-row gap-4">
                        <button type="submit" id="book-session-btn" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Request Booking</button>
                        <button type="button" id="cancel-booking-btn" class="clay-button w-full p-4 text-xl text-gray-700">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `, eventDetails: `<div id="event-details-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-lg p-6 sm:p-8"><h2 id="event-details-title" class="font-playfair text-3xl font-bold text-gray-700 mb-2"></h2><p id="event-details-time" class="text-gray-600 mb-1"></p><p id="event-details-status" class="text-sm font-semibold mb-6"></p><div id="event-details-actions" class="pt-4 flex flex-col sm:flex-row gap-4"></div><button type="button" id="close-details-btn" class="clay-button w-full p-4 text-xl text-gray-700 mt-4">Close</button></div></div>`,
    userDetails: `<div id="user-details-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-lg p-6 sm:p-8"><h2 id="user-details-name" class="font-playfair text-3xl font-bold text-gray-700 mb-6"></h2><div class="space-y-4"><div><label class="block text-sm font-medium text-gray-500">GCash Number</label><p id="user-details-gcash" class="clay-inset w-full p-4 text-lg"></p></div><div><label class="block text-sm font-medium text-gray-500">Contact Number</label><p id="user-details-contact" class="clay-inset w-full p-4 text-lg"></p></div><div><label class="block text-sm font-medium text-gray-500">Emergency Contact</label><p id="user-details-emergency" class="clay-inset w-full p-4 text-lg"></p></div></div><button type="button" id="close-user-details-btn" class="clay-button w-full p-4 text-xl text-gray-700 mt-8">Close</button></div></div>`,
    createBonusRule: `<div id="create-bonus-rule-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-3xl p-6 sm:p-8 flex flex-col max-h-[95vh]"><h2 class="font-playfair text-3xl font-bold text-gray-700 mb-6 flex-shrink-0">Create New Bonus Rule</h2><form id="bonus-rule-form" class="space-y-6 overflow-y-auto pr-2"><div class="clay-card p-6"><h3 class="font-playfair text-xl font-bold mb-4">Basic Information</h3><div class="space-y-4"><div><label for="rule-name" class="block text-sm font-medium mb-1">Rule Name</label><input type="text" id="rule-name" placeholder="e.g., Monthly Excellence Bonus" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="rule-description" class="block text-sm font-medium mb-1">Description</textarea><textarea id="rule-description" placeholder="Brief description of the bonus requirements" rows="3" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></textarea></div></div></div><div class="clay-card p-6"><h3 class="font-playfair text-xl font-bold mb-4">Active Period</h3><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label for="effective-start-date" class="block text-sm font-medium mb-1">Effective Start Date</label><input type="date" id="effective-start-date" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="effective-end-date" class="block text-sm font-medium mb-1">Effective End Date</label><input type="date" id="effective-end-date" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></div></div></div><div class="clay-card p-6"><h3 class="font-playfair text-xl font-bold mb-4">Target Requirements (All must be met)</h3><div class="grid grid-cols-1 sm:grid-cols-3 gap-4"><div><label for="rule-live-hours" class="block text-sm font-medium mb-1">Live Hours Target</label><input type="number" id="rule-live-hours" placeholder="e.g., 40" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="rule-branded-items" class="block text-sm font-medium mb-1">Branded Items Target</label><input type="number" id="rule-branded-items" placeholder="e.g., 60" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="rule-free-size" class="block text-sm font-medium mb-1">Free Size Target</label><input type="number" id="rule-free-size" placeholder="e.g., 100" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div></div></div><div class="clay-card p-6"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label for="rule-time-frame" class="block text-sm font-medium mb-1">Time Frame</label><select id="rule-time-frame" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="one-time">One-Time</option></select></div><div><label for="rule-bonus-amount" class="block text-sm font-medium mb-1">Bonus Amount (₱)</label><input type="number" step="0.01" id="rule-bonus-amount" placeholder="0.00" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="rule-reset-day" class="block text-sm font-medium mb-1">Reset Day (for weekly/monthly)</label><input type="text" id="rule-reset-day" placeholder="e.g., Monday or 1st_of_month" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></div></div></div><div class="pt-4 flex flex-col sm:flex-row gap-4"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Create Rule</button><button type="button" id="cancel-bonus-rule-btn" class="clay-button w-full p-4 text-xl text-gray-700">Cancel</button></div></form></div></div>`,
    deleteConfirmation: `<div id="delete-confirmation-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-md p-6 sm:p-8 text-center"><h2 class="font-playfair text-2xl font-bold text-gray-700 mb-4">Confirm Deletion</h2><p id="delete-confirm-message" class="text-gray-600 mb-6"></p><form id="delete-confirm-form"><div class="pt-6 flex flex-col sm:flex-row gap-4"><button type="submit" id="confirm-delete-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Delete</button><button type="button" id="cancel-delete-btn" class="clay-button w-full p-4 text-xl">Cancel</button></div></form></div></div>`,
    passwordConfirm: `<div id="password-confirm-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-md p-6 sm:p-8 text-center"><h2 class="font-playfair text-2xl font-bold text-gray-700 mb-4">Confirm Deletion with Password</h2><p class="text-gray-600 mb-6">Please enter your password to confirm this action. This cannot be undone.</p><form id="password-confirm-form" class="space-y-4"><div><label for="delete-password-input" class="block text-sm font-medium mb-2">Password</label><input type="password" id="delete-password-input" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" required></div><div class="pt-4 flex flex-col sm:flex-row gap-4"><button type="submit" class="clay-button clay-button-deny w-full p-4 text-xl">Confirm Delete</button><button type="button" id="cancel-password-confirm-btn" class="clay-button w-full p-4 text-xl">Cancel</button></div></form></div></div>`,
    bonusRuleDetails: `<div id="bonus-rule-details-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-2xl p-6 sm:p-8"><h2 id="bonus-details-name" class="font-playfair text-3xl font-bold text-gray-700 mb-2"></h2><p id="bonus-details-description" class="text-gray-600 mb-6"></p><div class="space-y-4"><div class="clay-card p-4"><h3 class="font-playfair text-xl font-bold mb-2">Targets</h3><ul id="bonus-details-targets" class="list-disc list-inside space-y-1"></ul></div><div class="clay-card p-4"><h3 class="font-playfair text-xl font-bold mb-2">Details</h3><div class="grid grid-cols-2 gap-4"><p><strong>Bonus:</strong> <span id="bonus-details-amount"></span></p><p><strong>Time Frame:</strong> <span id="bonus-details-timeframe"></span></p><p><strong>Starts:</strong> <span id="bonus-details-start"></span></p><p><strong>Ends:</strong> <span id="bonus-details-end"></span></p></div></div></div><button type="button" id="close-bonus-details-btn" class="clay-button w-full p-4 text-xl text-gray-700 mt-8">Close</button></div></div>`,
    reviewBonusModal: `<div id="review-bonus-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-lg p-6 sm:p-8"><h2 id="review-bonus-title" class="font-playfair text-3xl font-bold text-gray-700 mb-2">Review Bonus</h2><p id="review-bonus-details" class="text-gray-600 mb-4"></p><form id="review-bonus-form" class="space-y-4"><div class="mb-4"><label for="review-bonus-notes" class="block text-sm font-medium mb-2">Admin Notes (required for rejection)</label><textarea id="review-bonus-notes" rows="4" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></textarea></div><div class="pt-4 flex flex-col sm:flex-row gap-4"><button type="submit" id="approve-bonus-action-btn" class="clay-button clay-button-approve w-full p-4 text-xl">Approve Bonus</button><button type="submit" id="reject-bonus-action-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Reject Bonus</button><button type="button" id="cancel-review-bonus-btn" class="clay-button w-full p-4 text-xl text-gray-700">Cancel</button></div></form></div></div>`,
    finalizeSession: `<div id="finalize-session-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-2xl p-6 sm:p-8"><h2 class="font-playfair text-3xl font-bold text-gray-700 mb-6">Finalize Session</h2><p class="text-gray-600 mb-4">Session ended. Please log your sales data below.</p><p id="final-session-duration" class="text-lg font-semibold text-gray-700 mb-6 text-center"></p><form id="finalize-session-form" class="space-y-8"><fieldset><legend class="font-playfair text-2xl font-bold mb-4">Items Sold</legend><div class="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label for="finalize-branded-items" class="block text-sm font-medium mb-2">Branded Items</label><input type="number" id="finalize-branded-items" name="branded-items" value="0" min="0" placeholder="0" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div><div><label for="finalize-free-size-items" class="block text-sm font-medium mb-2">Free Size Items</label><input type="number" id="finalize-free-size-items" name="free-size-items" value="0" min="0" placeholder="0" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div></div></fieldset><fieldset><legend class="font-playfair text-2xl font-bold mb-4">Additional Details</legend><div><label for="finalize-total-revenue" class="block text-sm font-medium mb-2">Total Revenue (₱)</label><input type="number" step="0.01" id="finalize-total-revenue" name="total-revenue" value="0.00" min="0" placeholder="0.00" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none"></div><div><label for="finalize-session-notes" class="block text-sm font-medium mb-2">Session Notes</label><textarea id="finalize-session-notes" name="session-notes" rows="3" class="clay-inset w-full p-4 text-lg appearance-none focus:outline-none" placeholder="Any important notes about the session..."></textarea></div></fieldset><div class="pt-4 flex flex-col sm:flex-row gap-4"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Submit Sales Data</button><button type="button" id="cancel-finalize-session-btn" class="clay-button w-full p-4 text-xl text-gray-700">Cancel</button></div></form></div></div>`,
    createRuleSet: `<div id="create-ruleset-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-lg p-6 sm:p-8"><h2 class="font-playfair text-3xl font-bold text-gray-700 mb-6">Create New Rule Set</h2><form id="ruleset-form" class="space-y-6"><div><label for="ruleset-name" class="block text-sm font-medium mb-2">Rule Set Name</label><input type="text" id="ruleset-name" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="ruleset-description" class="block text-sm font-medium mb-2">Description</label><textarea id="ruleset-description" rows="3" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></textarea></div><div><label for="ruleset-type" class="block text-sm font-medium mb-2">Rule Type</label><select id="ruleset-type" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></select></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label for="ruleset-start-date" class="block text-sm font-medium mb-2">Effective Start Date</label><input type="date" id="ruleset-start-date" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="ruleset-end-date" class="block text-sm font-medium mb-2">Effective End Date</label><input type="date" id="ruleset-end-date" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></div></div><div class="pt-4 flex flex-col sm:flex-row gap-4"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Create Rule Set</button><button type="button" id="cancel-ruleset-btn" class="clay-button w-full p-4 text-xl text-gray-700">Cancel</button></div></form></div></div>`,
    editRule: `<div id="edit-rule-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-lg p-6 sm:p-8"><h2 class="font-playfair text-3xl font-bold text-gray-700 mb-6">Edit Rule</h2><form id="edit-rule-form" class="space-y-6"><div><label for="edit-rule-name" class="block text-sm font-medium mb-2">Rule Name</label><input type="text" id="edit-rule-name" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="edit-criteria-field" class="block text-sm font-medium mb-2">Criteria Field</label><select id="edit-criteria-field" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required><option value="live_hours">Live Hours</option><option value="branded_items">Branded Items</option><option value="free_size_items">Free Size Items</option><option value="total_revenue">Total Revenue</option></select></div><div><label for="edit-operator" class="block text-sm font-medium mb-2">Operator</label><select id="edit-operator" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required><option value=">=">>=</option><option value=">">></option><option value="=">=</option><option value="<"><</option><option value="<="><=</option></select></div><div><label for="edit-target-value" class="block text-sm font-medium mb-2">Target Value</label><input type="number" step="0.01" id="edit-target-value" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="edit-payout-type" class="block text-sm font-medium mb-2">Payout Type</label><select id="edit-payout-type" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required><option value="fixed_amount">Fixed Amount</option><option value="percentage">Percentage</option><option value="per_unit">Per Unit</option></select></div><div><label for="edit-payout-value" class="block text-sm font-medium mb-2">Payout Value</label><input type="number" step="0.01" id="edit-payout-value" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none" required></div><div><label for="edit-cadence" class="block text-sm font-medium mb-2">Cadence (Optional)</label><select id="edit-cadence" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"><option value="">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="one-time">One-Time</option></select></div><div><label for="edit-priority" class="block text-sm font-medium mb-2">Priority (Lower is higher priority)</label><input type="number" id="edit-priority" class="clay-inset w-full p-3 text-lg appearance-none focus:outline-none"></div><div class="pt-4 flex flex-col sm:flex-row gap-4"><button type="submit" class="clay-button clay-button-primary w-full p-4 text-xl text-gray-800">Save Rule</button><button type="button" id="cancel-edit-rule-btn" class="clay-button w-full p-4 text-xl text-gray-700">Cancel</button></div></form></div></div>`,
    viewRuleSetDetails: `<div id="view-ruleset-details-modal" class="hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="clay-card w-full max-w-4xl p-6 sm:p-8 flex flex-col max-h-[95vh]"><h2 id="view-ruleset-name" class="font-playfair text-3xl font-bold text-gray-700 mb-2"></h2><p id="view-ruleset-description" class="text-gray-600 mb-4"></p><div class="mb-4 text-sm text-gray-500"><span id="view-ruleset-status"></span> | <span id="view-ruleset-dates"></span></div><div class="pt-4 flex flex-col sm:flex-row gap-4 flex-shrink-0 mb-6"><button id="add-rule-to-ruleset-btn" class="clay-button clay-button-primary w-full sm:w-auto px-6 py-4 text-lg">Add Rule</button><button id="toggle-ruleset-active-btn" class="clay-button clay-button-approve w-full sm:w-auto px-6 py-4 text-lg">Toggle Active</button><button id="delete-ruleset-btn" class="clay-button clay-button-deny w-full sm:w-auto px-6 py-4 text-lg">Delete Rule Set</button></div><div class="overflow-y-auto pr-2 flex-grow"><h3 class="font-playfair text-2xl font-bold text-gray-700 mb-4">Rules in this Set</h3><div id="rules-in-set-list" class="space-y-3"></div></div><button type="button" id="close-ruleset-details-btn" class="clay-button w-full p-4 text-xl text-gray-700 mt-8 flex-shrink-0">Close</button></div></div>`,
};

export async function setupBonusReviewPage() {
    if (state.profile.role !== 'admin') { return; }

    const reviewModal = document.getElementById('review-bonus-modal');
    const reviewBonusTitle = document.getElementById('review-bonus-title');
    const reviewBonusDetails = document.getElementById('review-bonus-details');
    const reviewBonusNotesInput = document.getElementById('review-bonus-notes');
    const approveBonusBtn = document.getElementById('approve-bonus-action-btn');
    const rejectBonusBtn = document.getElementById('reject-bonus-action-btn');
    const cancelReviewBtn = document.getElementById('cancel-review-bonus-btn');

    let bonusToReview = null;

    const showReviewModal = (bonus) => {
        bonusToReview = bonus;
        reviewBonusTitle.textContent = `Review Bonus for ${bonus.profiles.full_name}`;
        reviewBonusDetails.innerHTML = `
            <p><strong>Rule:</strong> ${bonus.rules ? bonus.rules.rule_name : (bonus.rule_sets ? bonus.rule_sets.name : 'N/A')}</p>
            <p><strong>Amount:</strong> ₱${bonus.bonus_amount_awarded.toFixed(2)}</p>
            <p><strong>Period:</strong> ${new Date(bonus.calculation_period_start).toLocaleDateString()} - ${new Date(bonus.calculation_period_end).toLocaleDateString()}</p>
            <p><strong>Achieved On:</strong> ${new Date(bonus.achieved_date).toLocaleDateString()} ${new Date(bonus.achieved_date).toLocaleTimeString()}</p>
        `;
        reviewBonusNotesInput.value = bonus.admin_notes || '';
        reviewModal.classList.remove('hidden');
    };

    const handleReviewAction = async (actionType) => {
        const notes = reviewBonusNotesInput.value.trim();
        if (actionType === 'reject' && !notes) {
            showAlert('Validation Error', 'Admin notes are required for rejecting a bonus.');
            return;
        }

        const button = actionType === 'approve' ? approveBonusBtn : rejectBonusBtn;
        button.disabled = true;
        button.textContent = 'Submitting...';

        try {
            const bonusToReview = setupBonusReviewPage._bonusToReview;
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
            renderBonusReviewList();
        } catch (error) {
            showAlert('Error', `Failed to ${actionType} bonus: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = actionType === 'approve' ? 'Approve Bonus' : 'Reject Bonus';
        }
    };

    approveBonusBtn.addEventListener('click', (e) => { e.preventDefault(); handleReviewAction('approve', reviewBonusNotesInput); });
    rejectBonusBtn.addEventListener('click', (e) => { e.preventDefault(); handleReviewAction('reject', reviewBonusNotesInput); });
    cancelReviewBtn.addEventListener('click', () => { reviewModal.classList.add('hidden'); });

    await renderBonusReviewList();

    const bonusReviewChannel = _supabase.channel('public:seller_bonuses_achieved')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_bonuses_achieved' }, payload => {
            renderBonusReviewList();
        })
        .subscribe();
    channels.push(bonusReviewChannel);
}

export async function renderBonusReviewList() {
    const container = document.getElementById('bonus-review-list');
    if (!container) return;

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

export function showReviewModal(bonus) { // Exported for renderBonusReviewList to call
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
