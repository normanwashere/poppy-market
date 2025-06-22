// src/supabaseClient.js

// 1. IMPORT the createClient function from the library
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = 'https://lmzxjxumfqjrvcnsrfbr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtenhqeHVtZnFqcnZjbnNyZmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MDUzNDIsImV4cCI6MjA2NjA4MTM0Mn0.7vd1mZzXKYjf64b_lRmPUR0KM_4VdgJMxsDVrCEYbTw';

// 2. USE the imported function to create your client
export const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. The rest of your file is correct
export const state = {
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
