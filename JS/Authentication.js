import { app, auth } from './FireBase-Config.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile, 
  sendEmailVerification, 
  signInWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { showAlert } from './Script.js'; // ✅ Import alert function

/** 🔹 Show Loading Spinner Inside Button **/
function showLoading(button) {
  if (!button) return;
  
  button.dataset.originalText = button.innerHTML; // Store original text
  button.innerHTML = `<span class="spinner-grow spinner-grow-sm"></span> Processing...`; // ✅ Growing spinner
  button.disabled = true; // Disable button to prevent multiple clicks
}

/** 🔹 Restore Button After Loading **/
function hideLoading(button) {
  if (!button) return;
  
  button.innerHTML = button.dataset.originalText || "Submit"; // Restore original text
  button.disabled = false;
}

/** 🔹 Sign-Up with Email & Password **/
export const signUpWithEmailPassword = (email, password, name, button) => {
  const auth = getAuth(app);
  showLoading(button);  

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return updateProfile(user, { displayName: name }).then(() => user);
    })
    .then((user) => sendEmailVerification(user))
    .then(() => {
      showAlert("success", "✅ Account created! Check your email for verification before signing in.");
    })
    .catch((error) => {
      let errorMessage = "Something went wrong. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "⚠️ This email is already registered. Try logging in.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "🔒 Password is too weak. Use at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "❌ Invalid email format.";
      }

      showAlert("error", errorMessage);
    })
    .finally(() => hideLoading(button));
};

/** 🔹 Google Sign-Up **/
export const signUpWithGoogle = (button) => {
  const provider = new GoogleAuthProvider();
  showLoading(button);

  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      if (!user.emailVerified) {
        return sendEmailVerification(user).then(() => {
          showAlert("success", "✅ Google sign-in successful! Please verify your email before signing in.");
        });
      } else {
        showAlert("success", "✅ Google sign-in successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "Home.html";
        }, 2000);
      }
    })
    .catch((error) => {
      showAlert("error", error.message);
    })
    .finally(() => hideLoading(button));
};

/** 🔹 Sign-In with Email & Password **/
export const signInWithEmailPassword = (email, password, button) => {
  const auth = getAuth(app);
  showLoading(button);

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (!user.emailVerified) {
        showAlert("error", "❌ Your email is not verified. Please check your inbox.");
        return;
      }

      showAlert("success", "✅ Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "Home.html";
      }, 2000);
    })
    .catch((error) => {
      showAlert("error", error.message);
    })
    .finally(() => hideLoading(button));
};
