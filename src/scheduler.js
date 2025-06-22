// src/scheduler.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

// Declare at module scope. These should ONLY be declared ONCE with `let` at the top.
let calendarInstance = null;
let currentSelectionInfo = null;
let currentEventToActOn = null;

export async function initializeScheduler() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    // Check if an instance exists and destroy it if so, before creating a new one.
    if (calendarInstance) {
        calendarInstance.destroy();
        calendarInstance = null; // Ensure it's explicitly nullified
    }

    // Get references to DOM elements used within this function
    const bookingModal = document.getElementById('booking-modal');
    const eventDetailsModal = document.getElementById('event-details-modal');
    const bookingForm = document.getElementById('booking-form');
    const eventTitleInput = document.getElementById('event-title');
    const startTimeInput = document.getElementById('start-time');
    const cancelBookingBtn = document.getElementById('cancel-booking-btn');
    const eventDetailsTitle = document.getElementById('event-details-title');
    const eventDetailsTime = document.getElementById('event-details-time');
    const eventDetailsStatus = document.getElementById('event-details-status');
    const eventDetailsActions = document.getElementById('event-details-actions');
    const closeDetailsBtn = document.getElementById('close-details-btn');
    const bookingDurationDisplay = document.getElementById('booking-duration-display'); // For dynamic duration in booking modal

    const finalizeSessionModal = document.getElementById('finalize-session-modal');
    const finalizeSessionForm = document.getElementById('finalize-session-form');
    const finalSessionDurationEl = document.getElementById('final-session-duration');
    const cancelFinalizeSessionBtn = document.getElementById('cancel-finalize-session-btn');

    // Access profile from the imported state object
    const { profile } = state;

    // Helper to get event CSS class based on status
    const getEventClassName = (status) => {
        const classMap = { locked: 'event-locked', pending: 'event-pending', takeover: 'event-takeover', takeover_pending: 'event-takeover', live: 'bg-action-pink', ended: 'bg-gray-400' };
        return classMap[status] || 'event-pending';
    };

    // Helper to format events from database for FullCalendar
    const formatEvent = (dbEvent) => ({
        id: dbEvent.id,
        title: dbEvent.title,
        start: dbEvent.start_time,
        end: dbEvent.end_time,
        classNames: [getEventClassName(dbEvent.status)],
        extendedProps: {
            owner_id: dbEvent.owner_id,
            owner_name: dbEvent.owner_name,
            status: dbEvent.status,
            original_owner_name: dbEvent.original_owner_name,
            requested_by_id: dbEvent.requested_by_id,
            requested_by_name: dbEvent.requested_by_name,
            current_live_session_id: dbEvent.current_live_session_id
        }
    });

    // Fetch initial events
    const { data, error } = await _supabase.from('calendar_events').select('*');
    if (error) { showAlert('Error', 'Could not fetch calendar events: ' + error.message); return; }
    const initialEvents = data.map(formatEvent);

    // Initialize FullCalendar instance
    // THIS LINE MUST NOT HAVE 'let' or 'const'
    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView: window.innerWidth < 768 ? 'dayGridWeek' : 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,timeGridDay'
        },
        firstDay: 3, // Start week on Wednesday (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday)

        // Handler for clicking on a date
        dateClick: function (info) {
            if (state.profile.role !== 'seller') {
                showAlert('Permission Denied', 'Only sellers can book sessions.');
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today's date for comparison
            if (info.date < today) {
                showAlert('Invalid Date', 'You cannot book a session in the past.');
                return;
            }

            // Check for existing events by this seller on the clicked day
            const eventsOnDay = calendarInstance.getEvents().filter(event => {
                // Ensure event is owned by current profile and is not 'ended'
                return event.start.toDateString() === info.date.toDateString() &&
                       event.extendedProps.owner_id === state.profile.id &&
                       event.extendedProps.status !== 'ended';
            });
            if (eventsOnDay.length > 0) {
                showAlert('Already Booked', 'You already have a session on this day. Please choose another day or manage your existing booking.');
                return;
            }

            bookingForm.reset();
            currentSelectionInfo = info; // Store selected date info
            eventTitleInput.value = profile.full_name; // Pre-fill with seller's name
            bookingDurationDisplay.textContent = state.globalSettings.session_duration_hours || 3; // Display dynamic duration
            bookingModal.classList.remove('hidden'); // Show booking modal
        },
        events: initialEvents, // Initial events loaded from Supabase

        // Handler for clicking on an existing event
        eventClick: async (info) => {
            const activeEvent = info.event;
            const props = activeEvent.extendedProps;
            const isMine = props.owner_id === state.profile.id; // Check if the current user owns the event
            currentEventToActOn = activeEvent; // Store event for action handling

            eventDetailsTitle.textContent = activeEvent.title;
            eventDetailsTime.textContent = `From ${activeEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${activeEvent.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            eventDetailsStatus.textContent = `Status: ${props.status.charAt(0).toUpperCase() + props.status.slice(1).replace(/_/g, ' ')}`;
            eventDetailsActions.innerHTML = ''; // Clear previous actions

            // Admin Actions
            if (state.profile.role === 'admin') {
                if (props.status === 'pending') {
                    eventDetailsActions.innerHTML = `
                        <button id="approve-btn" class="clay-button clay-button-approve w-full p-4 text-xl">Approve</button>
                        <button id="deny-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Deny</button>
                    `;
                    document.getElementById('approve-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Approving...';
                        const { error: updateError } = await _supabase.from('calendar_events').update({ status: 'locked', title: props.owner_name }).eq('id', activeEvent.id);
                        if (updateError) showAlert('Error', 'Failed to approve booking: ' + updateError.message);
                        else showAlert('Success', 'Booking approved.');
                        eventDetailsModal.classList.add('hidden');
                        btn.disabled = false; btn.textContent = 'Approve'; // Restore state
                    };
                    document.getElementById('deny-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Denying...';
                        const { error: deleteError } = await _supabase.from('calendar_events').delete().eq('id', activeEvent.id);
                        if (deleteError) showAlert('Error', 'Failed to deny booking: ' + deleteError.message);
                        else showAlert('Success', 'Booking denied.');
                        eventDetailsModal.classList.add('hidden');
                        btn.disabled = false; btn.textContent = 'Deny'; // Restore state
                    };
                } else if (props.status === 'locked') {
                    eventDetailsActions.innerHTML = `
                        <button id="force-cancel-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Force Cancellation</button>
                        <button id="admin-go-live-btn" class="clay-button clay-button-primary w-full p-4 text-xl">Admin Force Go Live</button>
                    `;
                    document.getElementById('force-cancel-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Cancelling...';
                        const { error: updateError } = await _supabase.from('calendar_events').update({ status: 'takeover', title: 'NEEDS TAKEOVER', original_owner_name: props.owner_name }).eq('id', activeEvent.id);
                        if (updateError) showAlert('Error', 'Failed to force cancel session: ' + updateError.message);
                        else showAlert('Success', 'Session force-cancelled and marked for takeover.');
                        eventDetailsModal.classList.add('hidden');
                        btn.disabled = false; btn.textContent = 'Force Cancellation'; // Restore state
                    };
                    document.getElementById('admin-go-live-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Going Live...';
                        try {
                            const { data: liveSessionId, error } = await _supabase.rpc('start_live_session', { p_calendar_event_id: activeEvent.id });
                            if (error) throw error;
                            state.activeLiveSession = { id: liveSessionId, calendar_event_id: activeEvent.id };
                            showAlert('Success', `Session for ${props.owner_name} is now LIVE!`);
                            eventDetailsModal.classList.add('hidden');
                        } catch (err) {
                            showAlert('Error', 'Failed to go live: ' + err.message);
                        } finally {
                            btn.disabled = false; btn.textContent = 'Admin Force Go Live'; // Restore state
                        }
                    };
                } else if (props.status === 'live') {
                    eventDetailsActions.innerHTML = `<button id="admin-end-session-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Admin Force End Session</button>`;
                    document.getElementById('admin-end-session-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Ending Session...';
                        try {
                            if (!props.current_live_session_id) {
                                throw new Error("No active live session ID found for this event.");
                            }
                            const { data: result, error } = await _supabase.rpc('end_live_session', { p_live_session_id: props.current_live_session_id });
                            if (error) throw error;
                            showAlert('Success', `Live session for ${props.owner_name} force-ended.`);
                            eventDetailsModal.classList.add('hidden');
                        } catch (err) {
                            showAlert('Error', 'Failed to force end session: ' + err.message);
                        } finally {
                            btn.disabled = false; btn.textContent = 'Admin Force End Session'; // Restore state
                        }
                    };
                } else if (props.status === 'takeover_pending') {
                    eventDetailsActions.innerHTML = `<p class="text-center w-full text-gray-700 font-semibold">Takeover requested by: ${props.requested_by_name}</p><button id="approve-takeover-btn" class="clay-button clay-button-approve w-full p-4 text-xl">Approve Takeover</button>`;
                    document.getElementById('approve-takeover-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Approving Takeover...';
                        const { error: updateError } = await _supabase.from('calendar_events').update({ status: 'locked', owner_id: props.requested_by_id, owner_name: props.requested_by_name, title: props.requested_by_name, requested_by_id: null, requested_by_name: null }).eq('id', activeEvent.id);
                        if (updateError) showAlert('Error', 'Failed to approve takeover: ' + updateError.message);
                        else showAlert('Success', 'Takeover approved. Session assigned to new seller.');
                        eventDetailsModal.classList.add('hidden');
                        btn.disabled = false; btn.textContent = 'Approve Takeover'; // Restore state
                    };
                } else {
                    eventDetailsActions.innerHTML = `<p class="text-center w-full text-gray-600">No actions available for this state.</p>`;
                }
            } else if (state.profile.role === 'seller') {
                if (isMine && props.status === 'locked') {
                    eventDetailsActions.innerHTML = `
                        <button id="go-live-btn" class="clay-button clay-button-primary w-full p-4 text-xl">Go Live!</button>
                        <button id="cancel-session-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Cancel My Session</button>
                    `;
                    document.getElementById('go-live-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Going Live...';
                        try {
                            const { data: liveSessionId, error } = await _supabase.rpc('start_live_session', { p_calendar_event_id: activeEvent.id });
                            if (error) throw error;
                            state.activeLiveSession = { id: liveSessionId, calendar_event_id: activeEvent.id };
                            showAlert('Success', 'You are now LIVE!');
                            eventDetailsModal.classList.add('hidden');
                        } catch (err) {
                            showAlert('Error', 'Failed to go live: ' + err.message);
                        } finally {
                            btn.disabled = false; btn.textContent = 'Go Live!'; // Restore state
                        }
                    };

                    let cancelTimeout; // Declared here for the two-step cancellation logic
                    document.getElementById('cancel-session-btn').onclick = (e) => {
                        const btn = e.currentTarget;
                        if (btn.dataset.confirm === 'true') {
                            clearTimeout(cancelTimeout);
                            btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Cancelling...';
                            _supabase.from('calendar_events').update({ status: 'takeover', title: 'NEEDS TAKEOVER', original_owner_name: props.owner_name }).eq('id', activeEvent.id)
                                .then(({ error }) => {
                                    if (error) showAlert('Error', 'Failed to cancel session: ' + error.message);
                                    else {
                                        showAlert('Success', 'Session cancelled and marked for takeover.');
                                        eventDetailsModal.classList.add('hidden');
                                    }
                                })
                                .finally(() => {
                                    btn.disabled = false; btn.textContent = 'Cancel My Session';
                                    delete btn.dataset.confirm;
                                    btn.classList.remove('clay-button-deny');
                                });
                        } else {
                            btn.dataset.confirm = 'true';
                            btn.textContent = 'Confirm Cancel?';
                            btn.classList.add('clay-button-deny');
                            cancelTimeout = setTimeout(() => {
                                delete btn.dataset.confirm;
                                btn.textContent = 'Cancel My Session';
                                btn.classList.remove('clay-button-deny');
                            }, 5000);
                        }
                    };

                } else if (isMine && props.status === 'live') {
                    eventDetailsActions.innerHTML = `<button id="end-session-btn" class="clay-button clay-button-primary w-full p-4 text-xl">End Session</button>`;
                    document.getElementById('end-session-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Ending Session...';
                        try {
                            if (!props.current_live_session_id) {
                                throw new Error("No active live session ID found for this event.");
                            }
                            const { data: result, error } = await _supabase.rpc('end_live_session', { p_live_session_id: props.current_live_session_id });
                            if (error) throw error;

                            state.activeLiveSession = {
                                id: props.current_live_session_id,
                                calendar_event_id: activeEvent.id,
                                duration: result.live_duration_hours,
                                branded_items_sold: result.branded_items_sold,
                                free_size_items_sold: result.free_size_items_sold,
                                total_revenue: result.total_revenue
                            };

                            finalSessionDurationEl.textContent = `Total Live Duration: ${state.activeLiveSession.duration.toFixed(1)} hours`;
                            document.getElementById('finalize-branded-items').value = state.activeLiveSession.branded_items_sold || 0;
                            document.getElementById('finalize-free-size-items').value = state.activeLiveSession.free_size_items_sold || 0;
                            document.getElementById('finalize-total-revenue').value = state.activeLiveSession.total_revenue || 0;


                            finalizeSessionModal.classList.remove('hidden');
                            eventDetailsModal.classList.add('hidden');
                        } catch (err) {
                            showAlert('Error', 'Failed to end session: ' + err.message);
                        } finally {
                            btn.disabled = false; btn.textContent = 'End Session'; // Restore state
                        }
                    };
                } else if (!isMine && props.status === 'takeover') {
                    eventDetailsActions.innerHTML = `<button id="claim-takeover-btn" class="clay-button clay-button-primary w-full p-4 text-xl">Claim This Session</button>`;
                    document.getElementById('claim-takeover-btn').onclick = async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div> Claiming...';
                        const { error: updateError } = await _supabase.from('calendar_events').update({ status: 'takeover_pending', requested_by_id: profile.id, requested_by_name: profile.full_name, title: `Takeover Pending (${profile.full_name})` }).eq('id', activeEvent.id);
                        if (updateError) showAlert('Error', 'Failed to claim session: ' + updateError.message);
                        else showAlert('Success', 'Takeover request sent for approval.');
                        eventDetailsModal.classList.add('hidden');
                        btn.disabled = false; btn.textContent = 'Claim This Session'; // Restore state
                    };
                }
                else {
                    eventDetailsActions.innerHTML = `<p class="text-center w-full text-gray-600">No actions available for you.</p>`;
                }
            }

            eventDetailsModal.classList.remove('hidden');
            lucide.createIcons();
        }

        calendarInstance.render(); // This renders the calendar on the page

        // --- Event Listener Setup for Scheduler Modals and Actions (Inline) ---
        // These are now directly within initializeScheduler, not in a separate function declaration.

        if (bookingForm && !bookingForm._hasBookingFormListener) {
            const handleBookingSubmit = async (e) => {
                e.preventDefault();
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Requesting...';

                const startTimeValue = startTimeInput.value;
                const defaultSessionDurationHours = state.globalSettings.session_duration_hours || 3;

                if (startTimeValue && currentSelectionInfo) {
                    const [hours, minutes] = startTimeInput.value.split(':');
                    const startDateTime = new Date(currentSelectionInfo.date);
                    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    const endDateTime = new Date(startDateTime.getTime() + (defaultSessionDurationHours * 60 * 60 * 1000));

                    const overlappingEvents = calendarInstance.getEvents().filter(event => {
                        const eventStart = event.start.getTime();
                        const eventEnd = event.end.getTime();
                        return event.extendedProps.owner_id === state.profile.id && event.extendedProps.status !== 'ended' &&
                            ((startDateTime.getTime() < eventEnd && endDateTime.getTime() > eventStart));
                    });

                    if (overlappingEvents.length > 0) {
                        showAlert('Overlap Detected', 'This booking overlaps with an existing session. Please choose a different time.');
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Request Booking';
                        return;
                    }

                    const newEvent = {
                        title: `${state.profile.full_name} (Pending)`,
                        start_time: startDateTime.toISOString(),
                        end_time: endDateTime.toISOString(),
                        status: 'pending',
                        owner_id: state.profile.id,
                        owner_name: state.profile.full_name,
                    };

                    const { error } = await _supabase.from('calendar_events').insert(newEvent);
                    if (error) showAlert('Error', 'Could not book session: ' + error.message);
                    else {
                        bookingModal.classList.add('hidden');
                        showAlert('Success', 'Booking request sent for approval!');
                    }
                }
                submitBtn.disabled = false;
                submitBtn.textContent = 'Request Booking';
            };
            bookingForm.addEventListener('submit', handleBookingSubmit);
            bookingForm._hasBookingFormListener = handleBookingSubmit; // Set flag
        }

        if (cancelBookingBtn && !cancelBookingBtn._hasCancelBookingListener) {
            cancelBookingBtn.addEventListener('click', () => bookingModal.classList.add('hidden'));
            cancelBookingBtn._hasCancelBookingListener = true;
        }

        if (closeDetailsBtn && !closeDetailsBtn._hasCloseDetailsListener) {
            closeDetailsBtn.addEventListener('click', () => eventDetailsModal.classList.add('hidden'));
            closeDetailsBtn._hasCloseDetailsListener = true;
        }

        if (finalizeSessionForm && !finalizeSessionForm._hasFinalizeSessionListener) {
            const handleFinalizeSubmit = async (e) => {
                e.preventDefault();
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                const branded = parseInt(document.getElementById('finalize-branded-items').value) || 0;
                const freeSize = parseInt(document.getElementById('finalize-free-size-items').value) || 0;
                const totalRevenue = parseFloat(document.getElementById('finalize-total-revenue').value) || 0.00;
                const sessionNotes = document.getElementById('finalize-session-notes').value.trim();

                try {
                    const { error } = await _supabase.rpc('finalize_logged_session', {
                        p_live_session_id: state.activeLiveSession.id,
                        p_branded_items_sold: branded,
                        p_free_size_items_sold: freeSize,
                        p_total_revenue: totalRevenue,
                        p_session_notes: sessionNotes || null,
                        p_seller_id: state.profile.id
                    });
                    if (error) throw error;
                    showAlert('Success', 'Sales data submitted successfully!');
                    finalizeSessionModal.classList.add('hidden');
                    state.activeLiveSession = null;
                } catch (err) {
                    showAlert('Error', 'Failed to submit sales data: ' + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Sales Data';
                }
            };
            finalizeSessionForm.addEventListener('submit', handleFinalizeSubmit);
            finalizeSessionForm._hasFinalizeSessionListener = handleFinalizeSubmit;
        }

        if (cancelFinalizeSessionBtn && !cancelFinalizeSessionBtn._hasCancelFinalizeListener) {
            cancelFinalizeSessionBtn.addEventListener('click', () => {
                finalizeSessionModal.classList.add('hidden');
                state.activeLiveSession = null;
            });
            cancelFinalizeSessionBtn._hasCancelFinalizeListener = true;
        }

        // Real-time listener for calendar events
        const eventChannel = _supabase.channel('public:calendar_events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, payload => {
                if (payload.eventType === 'INSERT') {
                    calendarInstance.addEvent(formatEvent(payload.new));
                } else if (payload.eventType === 'UPDATE') {
                    let existingEvent = calendarInstance.getEventById(payload.new.id);
                    if (existingEvent) existingEvent.remove();
                    calendarInstance.addEvent(formatEvent(payload.new));
                } else if (payload.eventType === 'DELETE') {
                    let existingEvent = calendarInstance.getEventById(payload.old.id);
                    if (existingEvent) existingEvent.remove();
                }
            })
            .subscribe();
        channels.push(eventChannel);
}
