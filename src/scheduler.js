// src/scheduler.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

let calendarInstance = null;
let currentSelectionInfo = null;
let currentEventToActOn = null;

export async function initializeScheduler() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    if (calendarInstance) {
        calendarInstance.destroy();
        calendarInstance = null;
    }

    const bookingModal = document.getElementById('booking-modal');
    const bookingDateDisplay = document.getElementById('booking-date-display');
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
    const bookingDurationDisplay = document.getElementById('booking-duration-display');
    const finalizeSessionModal = document.getElementById('finalize-session-modal');
    const finalizeSessionForm = document.getElementById('finalize-session-form');
    const finalSessionDurationEl = document.getElementById('final-session-duration');
    const cancelFinalizeSessionBtn = document.getElementById('cancel-finalize-session-btn');

    const { profile } = state;
    if (!profile) {
        return;
    }

    const getEventClassName = (status) => {
        const classMap = { locked: 'event-locked', pending: 'event-pending', takeover: 'event-takeover', takeover_pending: 'event-takeover', live: 'bg-pink-400', ended: 'bg-gray-400' };
        return classMap[status] || 'event-pending';
    };

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

    const { data, error } = await _supabase.from('calendar_events').select('*');
    if (error) { showAlert('Error', 'Could not fetch calendar events: ' + error.message); return; }
    const initialEvents = data.map(formatEvent);

    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView: window.innerWidth < 768 ? 'dayGridWeek' : 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,timeGridDay'
        },
        firstDay: 3,
        dateClick: function (info) {
            // ... (dateClick logic is correct)
        },
        events: initialEvents,
        eventClick: async (info) => {
            const activeEvent = info.event;
            const props = activeEvent.extendedProps;
            const isMine = props.owner_id === state.profile.id;
            currentEventToActOn = activeEvent;

            eventDetailsTitle.textContent = activeEvent.title;
            eventDetailsTime.textContent = `From ${activeEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${activeEvent.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            eventDetailsStatus.textContent = `Status: ${props.status.charAt(0).toUpperCase() + props.status.slice(1).replace(/_/g, ' ')}`;
            eventDetailsActions.innerHTML = '';

            const handleEndSession = async () => {
                if (!props.current_live_session_id) {
                    showAlert('Error', "No active live session ID found for this event.");
                    return;
                }
                try {
                    const { data: result, error } = await _supabase.rpc('end_live_session', { p_live_session_id: props.current_live_session_id });
                    if (error) throw error;
                    
                    eventDetailsModal.classList.add('hidden');
                    
                    state.activeLiveSession = { id: props.current_live_session_id, calendar_event_id: activeEvent.id, duration: result.live_duration_hours };
                    
                    finalSessionDurationEl.textContent = `Total Live Duration: ${state.activeLiveSession.duration.toFixed(2)} hours`;
                    finalizeSessionForm.reset(); // Reset form for new entry
                    finalizeSessionModal.classList.remove('hidden');
                } catch (err) {
                    showAlert('Error', 'Failed to end session: ' + err.message);
                }
            };

            if (state.profile.role === 'admin') {
                if (props.status === 'pending') {
                    // ... (admin pending logic is correct)
                } else if (props.status === 'locked') {
                    // ... (admin locked logic is correct)
                } else if (props.status === 'live') {
                    eventDetailsActions.innerHTML = `<button id="admin-end-session-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Admin Force End Session</button>`;
                    document.getElementById('admin-end-session-btn').onclick = handleEndSession;
                }
            } else if (state.profile.role === 'seller') {
                 if (isMine && props.status === 'locked') {
                    const now = new Date();
                    const startTime = activeEvent.start;
                    const endTime = activeEvent.end;
                    const goLiveActivationTime = new Date(startTime.getTime() - 15 * 60 * 1000);

                    let buttonsHTML = `<button id="cancel-session-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Cancel My Session</button>`;
                    if (now >= goLiveActivationTime && now <= endTime) {
                        buttonsHTML += `<button id="go-live-btn" class="clay-button clay-button-primary w-full p-4 text-xl">Go Live</button>`;
                    } else {
                        buttonsHTML += `<p class="text-center text-sm text-gray-500 w-full p-4">"Go Live" will be available 15 mins before the session starts.</p>`;
                    }
                    eventDetailsActions.innerHTML = buttonsHTML;

                    const cancelBtn = document.getElementById('cancel-session-btn');
                    cancelBtn.onclick = (e) => {
                        const btn = e.currentTarget;
                        if (btn.dataset.confirming === 'true') {
                            _supabase.from('calendar_events').update({ status: 'takeover', title: 'NEEDS TAKEOVER', original_owner_name: props.owner_name }).eq('id', activeEvent.id)
                                .then(({ error }) => {
                                    if (error) showAlert('Error', 'Failed to cancel: ' + error.message);
                                    eventDetailsModal.classList.add('hidden');
                                });
                        } else {
                            btn.textContent = 'Confirm Cancellation?';
                            btn.dataset.confirming = 'true';
                            btn.classList.add('bg-red-500', 'text-white');
                            setTimeout(() => {
                                btn.textContent = 'Cancel My Session';
                                btn.dataset.confirming = 'false';
                                btn.classList.remove('bg-red-500', 'text-white');
                            }, 5000);
                        }
                    };
                    
                    const goLiveBtn = document.getElementById('go-live-btn');
                    if (goLiveBtn) { /* ... go live logic is correct ... */ }

                } else if (isMine && props.status === 'live') {
                    eventDetailsActions.innerHTML = `<button id="end-session-btn" class="clay-button clay-button-deny w-full p-4 text-xl">End My Session</button>`;
                    document.getElementById('end-session-btn').onclick = handleEndSession;

                } else if (!isMine && props.status === 'takeover') {
                    // ... (takeover logic is correct)
                } else {
                    eventDetailsActions.innerHTML = `<p class="text-center w-full text-gray-600">No actions available for you.</p>`;
                }
            }

            eventDetailsModal.classList.remove('hidden');
            lucide.createIcons();
        },
    });

    calendarInstance.render();
    
    // Listeners for Booking Modal
    if (bookingForm && !bookingForm._hasBookingFormListener) { /* ... no changes ... */ }
    if (cancelBookingBtn && !cancelBookingBtn._hasCancelBookingListener) { /* ... no changes ... */ }

    // Listener for Event Details Modal
    if (closeDetailsBtn && !closeDetailsBtn._hasCloseDetailsListener) {
        closeDetailsBtn.addEventListener('click', () => eventDetailsModal.classList.add('hidden'));
        closeDetailsBtn._hasCloseDetailsListener = true;
    }

    // Listeners for Finalize Session Modal
    if (finalizeSessionForm && !finalizeSessionForm._hasFinalizeListener) {
        const handleFinalizeSubmit = async (e) => {
            e.preventDefault();
            const btn = e.currentTarget.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div>';
            
            try {
                const { error } = await _supabase.rpc('finalize_logged_session', {
                    p_live_session_id: state.activeLiveSession.id,
                    p_seller_id: state.profile.id,
                    p_branded_items_sold: parseInt(document.getElementById('finalize-branded-items').value) || 0,
                    p_free_size_items_sold: parseInt(document.getElementById('finalize-free-size-items').value) || 0,
                    p_total_revenue: parseFloat(document.getElementById('finalize-total-revenue').value) || 0.00,
                    p_session_notes: document.getElementById('finalize-session-notes').value.trim() || null
                });
                if (error) throw error;
                showAlert('Success', 'Sales data submitted successfully!');
                finalizeSessionModal.classList.add('hidden');
                state.activeLiveSession = null;
            } catch (err) {
                showAlert('Error', 'Failed to submit sales data: ' + err.message);
            } finally {
                btn.disabled = false; btn.textContent = 'Submit Sales Data';
            }
        };
        finalizeSessionForm.addEventListener('submit', handleFinalizeSubmit);
        finalizeSessionForm._hasFinalizeListener = true;
    }
    if (cancelFinalizeSessionBtn && !cancelFinalizeSessionBtn._hasCancelListener) {
        cancelFinalizeSessionBtn.addEventListener('click', () => finalizeSessionModal.classList.add('hidden'));
        cancelFinalizeSessionBtn._hasCancelListener = true;
    }

    // Real-time channel setup
    const eventChannel = _supabase.channel('public:calendar_events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, payload => { /* ... no changes ... */ })
        .subscribe();
    channels.push(eventChannel);
}
