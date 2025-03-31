import { app, auth } from './FireBase-Config.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile, 
  sendEmailVerification, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { showAlert } from './Script.js'; // ✅ Import alert function
// Define an array of protected page names
const protectedPages = ["Home.html"];

// Get the current page name from the URL
const currentPage = window.location.pathname.split("/").pop();

// If the current page is protected, perform the auth check
if (protectedPages.includes(currentPage)) {
  onAuthStateChanged(auth, (user) => {
    console.log("User Status:", user);
    if (!user || !user.emailVerified) {
      console.log(`🚫 No verified user detected on ${currentPage}. Redirecting to login...`);

      // 🔹 Store the alert type and message before redirecting
      localStorage.setItem("alertType", "error");
      localStorage.setItem("alertMessage", "🔒 Please sign in to access this page.");

      window.location.href = "Sign-In.html";
    } else {
      console.log("✅ User is authenticated:", user.email);
    }
  });
}


/** 🔹 Show Loading Spinner Inside Button **/
function showLoading(button) {
  if (!button) return;
  
  button.dataset.originalText = button.innerHTML;
  button.innerHTML = `<span class="spinner-grow spinner-grow-sm"></span> Processing...`;
  button.disabled = true;
}

/** 🔹 Restore Button After Loading **/
function hideLoading(button) {
  if (!button) return;
  
  button.innerHTML = button.dataset.originalText || "Submit";
  button.disabled = false;
}

/** 🔹 Sign-Up with Email & Password **/
/** 🔹 Sign-Up with Email & Password (Only Add Verified Users) **/
export const signUpWithEmailPassword = (email, password, name, button) => {
  const auth = getAuth(app);
  showLoading(button);

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      // ✅ Send verification email
      await sendEmailVerification(user);

      // ✅ Immediately log out the user so they can't access without verification
      await signOut(auth);

      showAlert("success", "✅ Account created! A verification link has been sent to your email.");

      // 🔹 Clear form fields
      document.getElementById("SignUpForm").reset();

      // 🔥 Schedule deletion of unverified users (Optional)
      checkAndDeleteUnverifiedUser(user);
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
export const signUpWithGoogle = async (button) => {
  const provider = new GoogleAuthProvider();
  showLoading(button);

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user.emailVerified) {
      await sendEmailVerification(user);
      showAlert("success", "✅ Google sign-in successful! Please verify your email before signing in.");
    } else {
      showAlert("success", "✅ Google sign-in successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "Home.html";
      }, 2000);
    }
  } catch (error) {
    showAlert("error", error.message);
  } finally {
    hideLoading(button);
  }
};

export const signInWithEmailPassword = (email, password, button) => {
  const auth = getAuth(app);
  showLoading(button);

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      if (!user.emailVerified) {
        showAlert("error", "❌ Your email is not verified. Please check your inbox.");
        signOut(auth); // 🔹 Immediately log them out
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



/** 🔹 Logout Function **/
export const logoutUser = () => {
  const auth = getAuth(app);
  signOut(auth)
    .then(() => {
      showAlert("success", "✅ Successfully logged out!");
      setTimeout(() => {
        window.location.href = "Sign-In.html";
      }, 1500);
    })
    .catch((error) => {
      showAlert("error", error.message);
    });
};

/** 🔹 Delete Unverified Users After Some Time **/
function checkAndDeleteUnverifiedUser(user) {
  setTimeout(async () => {
    const auth = getAuth(app);
    await user.reload(); // Refresh user data

    if (!user.emailVerified) {
      await user.delete();
      console.log(`🔥 Unverified user ${user.email} deleted from Firebase.`);
    }
  }, 86400000); // 24 hours in milliseconds
}
