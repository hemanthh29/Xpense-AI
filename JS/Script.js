// Function to toggle the password visibility for Sign-In form
function toggleLoginPassword() {
    let LoginPassword = document.getElementById('LoginPassword');

    if (LoginPassword.type === 'password') {
        LoginPassword.type = 'text';
    } else {
        LoginPassword.type = 'password';
    }
}

// Function to toggle password visibility for the Sign-Up form
function toggleSignUpPassword() {
    let passwordField = document.getElementById('SignUpPassword');
    let confirmPasswordField = document.getElementById('SignUpConfirmPassword');

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        confirmPasswordField.type = 'text';
    } else {
        passwordField.type = 'password';
        confirmPasswordField.type = 'password';
    }
}

export function showAlert(type, message) {
    const alertContainer = document.getElementById("alertContainer");

    // Clear existing alerts
    alertContainer.innerHTML = '';

    // Create the alert div
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type === "success" ? "success" : "danger"} alert-dismissible fade show`;
    alertDiv.role = "alert";
    alertDiv.innerHTML = `${message}`;

    // Append alert to container
    alertContainer.appendChild(alertDiv);
    alertContainer.style.display = "block"; // Ensure it appears

    // Auto-hide the alert after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove("show"); // Remove 'show' class
        alertDiv.classList.add("fade"); // Add 'fade' class
        setTimeout(() => {
            alertDiv.remove();
        }, 500); // Wait for fade effect
    }, 5000);
}



