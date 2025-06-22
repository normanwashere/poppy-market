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

    // Get references to all modal elements at the top
    const bookingModal = document.getElementById('booking-modal');
    const bookingDateDisplay = document.getElementById('booking-date-display'); // Get the new date display element
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
        const classMap = { locked: 'event-locked', pending: 'event-pending', takeover: 'event-takeover', takeover_pending: 'event-takeover', live: 'bg-action-pink', ended: 'bg-gray-400' };
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
            console.log("--- Calendar Click Log ---");
            console.log("1. dateClick event fired for date:", info.date);

            console.log("2. Checking user role. Role is:", state.profile.role);
            if (state.profile.role !== 'seller') {
                console.log("   -> FAILED: User is not a seller. Aborting.");
                showAlert('Permission Denied', 'Only sellers can book sessions.');
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            console.log("3. Checking if date is in the past. Clicked date:", info.date, "Today:", today);
            if (info.date < today) {
                console.log("   -> FAILED: Clicked date is in the past. Aborting.");
                showAlert('Invalid Date', 'You cannot book a session in the past.');
                return;
            }

            console.log("4. Checking for existing events on this day for user ID:", state.profile.id);
            const eventsOnDay = calendarInstance.getEvents().filter(event => {
                return event.start.toDateString() === info.date.toDateString() &&
                       event.extendedProps.owner_id === state.profile.id &&
                       event.extendedProps.status !== 'ended';
            });
            console.log("   -> Found", eventsOnDay.length, "existing event(s).");
            if (eventsOnDay.length > 0) {
                console.log("   -> FAILED: User already has a booking on this day. Aborting.");
                showAlert('Already Booked', 'You already have a session on this day. Please choose another day or manage your existing booking.');
                return;
            }

            console.log("5. SUCCESS: All checks passed. Showing booking modal.");
            
            // --- NEW LOGIC ADDED HERE ---
            const selectedDate = info.date;
            const formattedDate = selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            // This populates the new element we added to the HTML template
            bookingDateDisplay.textContent = `Booking for: ${formattedDate}`;
            
            bookingForm.reset();
            currentSelectionInfo = info;
            eventTitleInput.value = profile.full_name;
            bookingDurationDisplay.textContent = state.globalSettings.session_duration_hours || 3;
            bookingModal.classList.remove('hidden');
        },
        events: initialEvents,
        eventClick: async (info) => {
            // ... (your existing eventClick logic remains here)
        },
    });

    calendarInstance.render();
    
    // ... (Your existing event listener setup for booking modals, etc. remains here)

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
