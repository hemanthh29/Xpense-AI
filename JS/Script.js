// Function to toggle the password visibility
function togglePassword() {
    let passwordInput = document.getElementById('exampleInputPassword1');
    let toggleButton = document.getElementById('exampleCheck1');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
}