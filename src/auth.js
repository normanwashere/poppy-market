// src/auth.js
import { _supabase, state } from './supabaseClient.js';
import { showAlert } from './helpers.js';
import { showPage } from './main.js'; // Import showPage for navigation

export function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    // Remove existing listener to prevent duplicates if function is called multiple times
    if (loginForm._hasLoginListener) {
        loginForm.removeEventListener('submit', loginForm._hasLoginListener);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const loginButton = e.target.querySelector('button[type="submit"]');

        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';

        const { error } = await _supabase.auth.signInWithPassword({ email, password });

        if (error) {
            showAlert('Login Failed', error.message);
        }
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
        // checkUserSession (in main.js) will be triggered by onAuthStateChange
        // and handle the final page redirection or further error messages.
    };
    loginForm.addEventListener('submit', handleSubmit);
    loginForm._hasLoginListener = handleSubmit; // Store reference to the handler
}

export function setupSignupPage() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    // Remove existing listener to prevent duplicates
    if (signupForm._hasSignupListener) {
        signupForm.removeEventListener('submit', signupForm._hasSignupListener);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const full_name = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const signupButton = e.target.querySelector('button[type="submit"]');

        signupButton.disabled = true;
        signupButton.textContent = 'Creating Account...';

        const { data, error } = await _supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name } }
        });

        if (error) {
            showAlert('Signup Failed', error.message);
        } else if (data.user) {
            showAlert('Account Created', 'Thank you for signing up! Your account is now pending admin approval. You can login once approved.', () => {
                showPage('login');
            });
        }
        signupButton.disabled = false;
        signupButton.textContent = 'Create Account';
    };
    signupForm.addEventListener('submit', handleSubmit);
    signupForm._hasSignupListener = handleSubmit; // Store reference
}
