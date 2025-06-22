// src/scheduler.js
import { _supabase, state, channels } from './supabaseClient.js';
import { showAlert } from './helpers.js';

let calendarInstance = null; // Declare at module scope

export async function initializeScheduler() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error("Calendar element (#calendar) not found.");
        return;
    }

    // Destroy existing instance if it exists
    if (calendarInstance) {
        calendarInstance.destroy();
        calendarInstance = null;
    }

    // Fetch initial events (bare minimum select)
    const { data: initialEventsData, error } = await _supabase.from('calendar_events').select('id, title, start_time, end_time, status, owner_name');
    if (error) {
        showAlert('Error', 'Could not fetch calendar events: ' + error.message);
        console.error('Supabase fetch error:', error);
        return;
    }

    // Format events for FullCalendar
    const eventsForCalendar = initialEventsData.map(dbEvent => ({
        id: dbEvent.id,
        title: dbEvent.title,
        start: dbEvent.start_time,
        end: dbEvent.end_time,
        // Minimal class mapping for now
        classNames: [
            dbEvent.status === 'locked' ? 'event-locked' :
            dbEvent.status === 'pending' ? 'event-pending' :
            dbEvent.status === 'takeover' || dbEvent.status === 'takeover_pending' ? 'event-takeover' :
            dbEvent.status === 'live' ? 'bg-action-pink' :
            dbEvent.status === 'ended' ? 'bg-gray-400' :
            'event-default' // Fallback
        ],
        extendedProps: {
            owner_id: dbEvent.owner_id,
            owner_name: dbEvent.owner_name,
            status: dbEvent.status
        }
    }));


    // Initialize FullCalendar instance
    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Start with month view
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,timeGridDay'
        },
        events: eventsForCalendar, // Use the fetched and formatted events
        // Disable interactions for now to isolate syntax errors
        dateClick: function() { console.log("Date clicked (disabled for now)"); },
        eventClick: function() { console.log("Event clicked (disabled for now)"); }
    });

    calendarInstance.render(); // Render the calendar
    console.log("Calendar rendered successfully."); // Log success
    window.lucide.createIcons(); // Re-create icons on render
}
