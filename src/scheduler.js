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
        console.error("DEBUG: No profile found in state. Cannot initialize scheduler correctly.");
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
            if (state.profile.role !== 'seller') {
                showAlert('Permission Denied', 'Only sellers can book sessions.');
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (info.date < today) {
                showAlert('Invalid Date', 'You cannot book a session in the past.');
                return;
            }

            const selectedDate = info.date;
            const formattedDate = selectedDate.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            bookingDateDisplay.textContent = `Booking for: ${formattedDate}`;
            
            bookingForm.reset();
            currentSelectionInfo = info;
            eventTitleInput.value = profile.full_name;
            bookingDurationDisplay.textContent = state.globalSettings.session_duration_hours || 3;
            bookingModal.classList.remove('hidden');
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

            if (state.profile.role === 'admin') {
                if (props.status === 'pending') {
                    eventDetailsActions.innerHTML = `<button id="approve-btn" class="clay-button clay-button-approve w-full p-4 text-xl">Approve</button><button id="deny-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Deny</button>`;
                    document.getElementById('approve-btn').onclick = async (e) => {
                        const { error } = await _supabase.from('calendar_events').update({ status: 'locked', title: props.owner_name }).eq('id', activeEvent.id);
                        if (error) showAlert('Error', 'Failed to approve: ' + error.message);
                        eventDetailsModal.classList.add('hidden');
                    };
                    document.getElementById('deny-btn').onclick = async (e) => {
                        const { error } = await _supabase.from('calendar_events').delete().eq('id', activeEvent.id);
                        if (error) showAlert('Error', 'Failed to deny: ' + error.message);
                        eventDetailsModal.classList.add('hidden');
                    };
                } else if (props.status === 'locked') {
                    // This logic is correct as-is from your file
                } else if (props.status === 'live') {
                    // This logic is correct as-is from your file
                } else if (props.status === 'takeover' || props.status === 'takeover_pending') {
                    // FIX #1: Add admin action for 'takeover' status
                    eventDetailsActions.innerHTML = `<button id="delete-takeover-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Permanently Delete</button>`;
                    document.getElementById('delete-takeover-btn').onclick = async () => {
                        if (confirm('Are you sure you want to permanently delete this session? This action cannot be undone.')) {
                            const { error } = await _supabase.from('calendar_events').delete().eq('id', activeEvent.id);
                            if (error) {
                                showAlert('Error', 'Failed to delete session: ' + error.message);
                            } else {
                                showAlert('Success', 'Session has been deleted.');
                                eventDetailsModal.classList.add('hidden');
                            }
                        }
                    };
                }
            } else if (state.profile.role === 'seller') {
                if (isMine && props.status === 'locked') {
                    // This logic is correct as-is from your file
                } else if (!isMine && props.status === 'takeover') {
                    // This logic is correct as-is from your file
                } else {
                    eventDetailsActions.innerHTML = `<p class="text-center w-full text-gray-600">No actions available for you.</p>`;
                }
            }

            eventDetailsModal.classList.remove('hidden');
            lucide.createIcons();
        },
    });

    calendarInstance.render();
    
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

                // FIX #2: Proper time overlap check
                const existingEvents = calendarInstance.getEvents();
                const isOverlapping = existingEvents.some(existingEvent => {
                    // Only check against other confirmed or pending events, not takeovers
                    if (existingEvent.extendedProps.status === 'takeover' || existingEvent.extendedProps.status === 'ended') return false;
                    
                    const existingStart = existingEvent.start.getTime();
                    const existingEnd = existingEvent.end.getTime();
                    // Check if new event starts during an existing event OR ends during an existing event OR envelops an existing event
                    return (startDateTime.getTime() < existingEnd && endDateTime.getTime() > existingStart);
                });

                if (isOverlapping) {
                    showAlert('Booking Conflict', 'This time slot overlaps with an existing session. Please choose a different time.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Request Booking';
                    return;
                }
                // --- END FIX #2 ---

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
        bookingForm._hasBookingFormListener = handleBookingSubmit;
    }

    if (cancelBookingBtn && !cancelBookingBtn._hasCancelBookingListener) {
        cancelBookingBtn.addEventListener('click', () => bookingModal.classList.add('hidden'));
        cancelBookingBtn._hasCancelBookingListener = true;
    }

    if (closeDetailsBtn && !closeDetailsBtn._hasCloseDetailsListener) {
        closeDetailsBtn.addEventListener('click', () => eventDetailsModal.classList.add('hidden'));
        closeDetailsBtn._hasCloseDetailsListener = true;
    }

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
