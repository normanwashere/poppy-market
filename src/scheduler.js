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
        start: new Date(dbEvent.start_time),
        end: new Date(dbEvent.end_time),
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
        
        eventMouseEnter: function(info) {
            let tooltip = document.createElement('div');
            tooltip.id = 'fc-tooltip';
            tooltip.innerHTML = `<strong>${info.event.title}</strong><br>Status: ${info.event.extendedProps.status.replace('_', ' ')}`;
            tooltip.style.position = 'absolute';
            tooltip.style.background = '#3D3D3D';
            tooltip.style.color = 'white';
            tooltip.style.padding = '8px 12px';
            tooltip.style.borderRadius = '6px';
            tooltip.style.zIndex = '10001';
            tooltip.style.pointerEvents = 'none'; 
            document.body.appendChild(tooltip);

            const eventRect = info.el.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            tooltip.style.left = `${window.scrollX + eventRect.left + (eventRect.width / 2) - (tooltipRect.width / 2)}px`;
            tooltip.style.top = `${window.scrollY + eventRect.top - tooltipRect.height - 5}px`;
        },

        eventMouseLeave: function(info) {
            let tooltip = document.getElementById('fc-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        },

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

            const eventDetailsActions = document.getElementById('event-details-actions');
            document.getElementById('event-details-title').textContent = activeEvent.title;
            document.getElementById('event-details-time').textContent = `From ${activeEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${activeEvent.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            document.getElementById('event-details-status').textContent = `Status: ${props.status.charAt(0).toUpperCase() + props.status.slice(1).replace(/_/g, ' ')}`;
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
                    
                    document.getElementById('final-session-duration').textContent = `Total Live Duration: ${state.activeLiveSession.duration.toFixed(2)} hours`;
                    finalizeSessionForm.reset();
                    finalizeSessionModal.classList.remove('hidden');
                } catch (err) {
                    showAlert('Error', 'Failed to end session: ' + err.message);
                }
            };

            if (state.profile.role === 'admin') {
                if (props.status === 'pending') {
                    eventDetailsActions.innerHTML = `<button id="approve-btn" class="clay-button clay-button-approve w-full p-4 text-xl">Approve</button><button id="deny-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Deny</button>`;
                    document.getElementById('approve-btn').onclick = async () => {
                        activeEvent.setProp('classNames', ['event-locked']);
                        activeEvent.setProp('title', props.owner_name);
                        activeEvent.setExtendedProp('status', 'locked');
                        eventDetailsModal.classList.add('hidden');
                        
                        const { error } = await _supabase.from('calendar_events').update({ status: 'locked', title: props.owner_name }).eq('id', activeEvent.id);
                        if (error) {
                            showAlert('Error', 'Failed to approve: ' + error.message);
                            activeEvent.setProp('classNames', ['event-pending']);
                            activeEvent.setProp('title', `${props.owner_name} (Pending)`);
                            activeEvent.setExtendedProp('status', 'pending');
                        }
                    };
                    document.getElementById('deny-btn').onclick = async () => {
                        const { error } = await _supabase.from('calendar_events').delete().eq('id', activeEvent.id);
                        if (error) showAlert('Error', 'Failed to deny: ' + error.message);
                        eventDetailsModal.classList.add('hidden');
                    };
                } else if (props.status === 'takeover' || props.status === 'takeover_pending') {
                    eventDetailsActions.innerHTML = `<button id="delete-takeover-btn" class="clay-button clay-button-deny w-full p-4 text-xl">Permanently Delete</button>`;
                    document.getElementById('delete-takeover-btn').onclick = async () => {
                        if (confirm('Are you sure you want to permanently delete this session? This action cannot be undone.')) {
                            const { error } = await _supabase.from('calendar_events').delete().eq('id', activeEvent.id);
                            if (error) showAlert('Error', 'Failed to delete session: ' + error.message);
                            else {
                                showAlert('Success', 'Session has been deleted.');
                                eventDetailsModal.classList.add('hidden');
                            }
                        }
                    };
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
                            clearTimeout(btn._timeoutId);
                            _supabase.from('calendar_events').update({ status: 'takeover', title: 'NEEDS TAKEOVER', original_owner_name: props.owner_name }).eq('id', activeEvent.id)
                                .then(({ error }) => {
                                    if (error) showAlert('Error', 'Failed to cancel: ' + error.message);
                                    eventDetailsModal.classList.add('hidden');
                                });
                        } else {
                            btn.textContent = 'Confirm Cancellation?';
                            btn.dataset.confirming = 'true';
                            btn.classList.add('bg-red-500', 'text-white');
                            btn._timeoutId = setTimeout(() => {
                                btn.textContent = 'Cancel My Session';
                                btn.dataset.confirming = 'false';
                                btn.classList.remove('bg-red-500', 'text-white');
                            }, 5000);
                        }
                    };
                    
                    const goLiveBtn = document.getElementById('go-live-btn');
                    if (goLiveBtn) {
                        goLiveBtn.onclick = async () => {
                            const btn = goLiveBtn;
                            btn.disabled = true; btn.innerHTML = '<div class="spinner h-4 w-4"></div>';
                            try {
                                const { data: liveSessionData, error } = await _supabase.rpc('start_live_session', {
                                    p_calendar_event_id: activeEvent.id,
                                    p_seller_id: state.profile.id
                                });
                                if (error) throw error;
                                state.activeLiveSession = { id: liveSessionData.id, calendar_event_id: activeEvent.id };
                                showAlert('Success', 'You are now LIVE!');
                                eventDetailsModal.classList.add('hidden');
                            } catch (err) { showAlert('Error', 'Failed to go live: ' + err.message); } 
                            finally { btn.disabled = false; btn.textContent = 'Go Live'; }
                        };
                    }
                } else if (isMine && props.status === 'live') {
                    eventDetailsActions.innerHTML = `<button id="end-session-btn" class="clay-button clay-button-deny w-full p-4 text-xl">End My Session</button>`;
                    document.getElementById('end-session-btn').onclick = handleEndSession;
                } else if (!isMine && props.status === 'takeover') {
                    eventDetailsActions.innerHTML = `<button id="claim-takeover-btn" class="clay-button clay-button-primary w-full p-4 text-xl">Claim This Session</button>`;
                     document.getElementById('claim-takeover-btn').onclick = async () => {
                        const { error } = await _supabase.from('calendar_events').update({ status: 'takeover_pending', requested_by_id: profile.id, requested_by_name: profile.full_name, title: `Takeover Pending (${profile.full_name})` }).eq('id', activeEvent.id);
                        if (error) showAlert('Error', 'Failed to claim: ' + error.message);
                        eventDetailsModal.classList.add('hidden');
                    };
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
            submitBtn.disabled = true; submitBtn.textContent = 'Requesting...';
            const startTimeValue = startTimeInput.value;
            const defaultSessionDurationHours = state.globalSettings.session_duration_hours || 3;

            if (startTimeValue && currentSelectionInfo) {
                const [hours, minutes] = startTimeInput.value.split(':');
                const startDateTime = new Date(currentSelectionInfo.date);
                startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                const endDateTime = new Date(startDateTime.getTime() + (defaultSessionDurationHours * 60 * 60 * 1000));

                if (endDateTime.getDate() !== startDateTime.getDate()) {
                    showAlert('Invalid Time', 'Booking cannot cross over to the next day. Please choose an earlier start time.');
                    submitBtn.disabled = false; submitBtn.textContent = 'Request Booking';
                    return; 
                }

                const existingEvents = calendarInstance.getEvents();
                const isOverlapping = existingEvents.some(existingEvent => {
                    if (existingEvent.id === 'new' || existingEvent.extendedProps.status === 'takeover' || existingEvent.extendedProps.status === 'ended') return false;
                    const existingStart = existingEvent.start.getTime();
                    const existingEnd = existingEvent.end.getTime();
                    return (startDateTime.getTime() < existingEnd && endDateTime.getTime() > existingStart);
                });
                if (isOverlapping) {
                    showAlert('Booking Conflict', 'This time slot overlaps with an existing session.');
                    submitBtn.disabled = false; submitBtn.textContent = 'Request Booking';
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
        bookingForm._hasBookingFormListener = true;
    }

    if (cancelBookingBtn && !cancelBookingBtn._hasCancelBookingListener) {
        cancelBookingBtn.addEventListener('click', () => bookingModal.classList.add('hidden'));
        cancelBookingBtn._hasCancelBookingListener = true;
    }

    if (closeDetailsBtn && !closeDetailsBtn._hasCloseDetailsListener) {
        closeDetailsBtn.addEventListener('click', () => eventDetailsModal.classList.add('hidden'));
        closeDetailsBtn._hasCloseDetailsListener = true;
    }

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

    const eventChannel = _supabase.channel('public:calendar_events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, payload => {
            if (payload.eventType === 'INSERT') { calendarInstance.addEvent(formatEvent(payload.new)); }
            else if (payload.eventType === 'UPDATE') {
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
