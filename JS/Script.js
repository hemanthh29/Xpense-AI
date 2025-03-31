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

// ✅ Show alert immediately if redirected
document.addEventListener("DOMContentLoaded", () => {
    const alertType = localStorage.getItem("alertType");
    const alertMessage = localStorage.getItem("alertMessage");

    if (alertType && alertMessage) {
        showAlert(alertType, alertMessage); // ✅ Directly call showAlert()

        // Remove stored alert so it doesn't appear again
        localStorage.removeItem("alertType");
        localStorage.removeItem("alertMessage");
    }
});
  


