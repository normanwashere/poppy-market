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
    const bookingDurationDisplay = document.getElementById('booking-duration-display');
    
    // ... (other element variables)

    const { profile } = state;
    if (!profile) {
        console.error("DEBUG: No profile found in state. Cannot initialize scheduler correctly.");
        return;
    }

    const getEventClassName = (status) => { /* ... (function is correct) ... */ };
    const formatEvent = (dbEvent) => { /* ... (function is correct) ... */ };

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
            // ... (all the debugging and date checking logic is correct) ...

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
            // ... (your existing eventClick logic is correct) ...
        },
    });

    calendarInstance.render();
    
    // --- FIX: RESTORED EVENT LISTENER LOGIC ---
    // This block attaches functionality to the modal buttons.
    
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
    // ... (other listeners for other modals remain correct) ...

    // --- END OF RESTORED LOGIC ---


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
