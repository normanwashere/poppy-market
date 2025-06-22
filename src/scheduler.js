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
    const eventDetailsModal = document.getElementById('event-details-modal');
    // ... (the rest of your variable declarations)
    const finalizeSessionModal = document.getElementById('finalize-session-modal');
    const finalizeSessionForm = document.getElementById('finalize-session-form');
    const finalSessionDurationEl = document.getElementById('final-session-duration');
    const cancelFinalizeSessionBtn = document.getElementById('cancel-finalize-session-btn');
    
    const { profile } = state;

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
            // ... (your existing dateClick logic)
        },
        events: initialEvents,
        eventClick: async (info) => {
            // ... (your existing eventClick logic)
        },
    });

    calendarInstance.render();
    
    // ... (Your existing event listener setup for booking modals, etc.)

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
