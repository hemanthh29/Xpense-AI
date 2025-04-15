import { signUpWithEmailPassword, signUpWithGoogle } from './Authentication.js';
import { showAlert } from './Script.js'; //Import alert function

//Event listener for standard email/password sign-up
document.getElementById('SignUpForm').addEventListener('submit', function (e) {
    e.preventDefault(); //Prevent form from submitting normally

    const name = document.getElementById('SignUpName').value;
    const email = document.getElementById('SignUpEmail').value;
    const password = document.getElementById('SignUpPassword').value;
    const confirmPassword = document.getElementById('SignUpConfirmPassword').value;
    const submitButton = e.target.querySelector("button[type='submit']"); // Get clicked button

    //Show Alert if Passwords Do Not Match
    if (password !== confirmPassword) {
        showAlert("error", "Passwords do not match!");
        return;
    }

    //Proceed with Sign-Up if passwords match
    signUpWithEmailPassword(email, password, name, submitButton);
});

//Event listener for Google Sign-In
document.getElementById('google-signup').addEventListener('click', function (e) {
    signUpWithGoogle(e.target); //Pass clicked button to show spinner inside it
});
