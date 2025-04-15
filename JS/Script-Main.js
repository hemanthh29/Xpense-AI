document.addEventListener('DOMContentLoaded', function () {
    // Ensure the DOM is fully loaded
    const masterCheckbox = document.getElementById('masterCheckbox');
  
    // Attach listener when master checkbox is available
    if (masterCheckbox) {
      masterCheckbox.addEventListener('change', function () {
        // Re-select checkboxes every time (supports dynamic tables)
        const rowCheckboxes = document.querySelectorAll('input.rowCheckbox');
  
        rowCheckboxes.forEach(cb => {
          cb.checked = masterCheckbox.checked;
        });
      });
    } else {
      console.warn("⚠️ masterCheckbox not found in DOM.");
    }
  });
//Function to toggle the password visibility for Sign-In form
function toggleLoginPassword() {
    let LoginPassword = document.getElementById('LoginPassword');

    if (LoginPassword.type === 'password') {
        LoginPassword.type = 'text';
    } else {
        LoginPassword.type = 'password';
    }
}

//Function to toggle password visibility for the Sign-Up form
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

//Function to update password strength meter
function updatePasswordStrength(password) {
    const strengthText = document.getElementById("passwordStrengthText");
    const strengthBar = document.getElementById("passwordStrengthBar");
    const strengthContainer = document.getElementById("passwordStrengthContainer");

    if (!strengthText || !strengthBar || !strengthContainer) return;

    //Hide bar when no input
    if (password.length === 0) {
        strengthText.classList.add("d-none");
        strengthContainer.classList.add("d-none");
        return;
    }

    //Use zxcvbn to check password strength
    const result = zxcvbn(password);

    //Strength levels (0 to 4)
    const strengthLevels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
    const strengthColors = ["bg-danger", "bg-warning", "bg-info", "bg-primary", "bg-success"];

    //Update text & progress bar
    strengthText.textContent = strengthLevels[result.score];
    strengthBar.style.width = `${(result.score + 1) * 20}%`;
    strengthBar.className = `progress-bar ${strengthColors[result.score]}`;

    //Show bar once typing starts
    strengthText.classList.remove("d-none");
    strengthContainer.classList.remove("d-none");
}

//Listen for password input changes
document.getElementById("SignUpPassword").addEventListener("input", function () {
    updatePasswordStrength(this.value);
});

  
  
  
  


