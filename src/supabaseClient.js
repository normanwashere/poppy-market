// src/supabaseClient.js
export const SUPABASE_URL = 'https://lmzxjxumfqjrvcnsrfbr.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtenhqeHVtZnFqcnZjbnNyZmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MDUzNDIsImV4cCI6MjA2NjA4MTM0Mn0.7vd1mZzXKYjf64b_lRmPUR0KM_4VdgJMxsDVrCEYbTw';

export const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const state = { // MODIFIED: Added 'export' keyword here
    isLoggedIn: false,
    currentUser: null,
    profile: null,
    currentPage: 'login',
    ruleToDelete: null,
    activeLiveSession: null,
    currentRuleSetId: null,
    globalSettings: {},
};

export let channels = [];
