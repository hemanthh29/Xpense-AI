import { signInWithEmailPassword, signUpWithGoogle } from "./Authentication.js";

// Ensure DOM elements exist before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.getElementById("SignInForm");
    const googleSignInButton = document.getElementById("Google-SignIn");
    const emailInput = document.getElementById("LoginEmail");
    const passwordInput = document.getElementById("LoginPassword");
    const signInButton = document.getElementById("Login-Button");

    // Handle Email/Password Sign-In
    signInForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent default form submission
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        signInWithEmailPassword(email, password, signInButton);
    });

    // Handle Google Sign-In
    googleSignInButton.addEventListener("click", (e) => {
        signUpWithGoogle(e.target);
    });
});
