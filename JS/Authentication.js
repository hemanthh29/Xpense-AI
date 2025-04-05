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

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

import { showAlert } from './Script.js'; // ✅ Import alert function

const db = getFirestore(app);

// ✅ Create user in Firestore
const createUserInFirestore = async (user, name = "") => {
  const userRef = doc(db, "users", user.uid);

  await setDoc(userRef, {
    uid: user.uid,
    name: name || user.displayName || "",
    email: user.email,
    provider: user.providerData[0].providerId,
    profilePic: user.photoURL || "",
    createdAt: serverTimestamp()
  });

  console.log("✅ User added to Firestore");
};

// ✅ Protected route auth check
const protectedPages = ["Dashboard.html"];
const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
  onAuthStateChanged(auth, (user) => {
    if (!user || !user.emailVerified) {
      localStorage.setItem("alertType", "error");
      localStorage.setItem("alertMessage", "🔒 Please sign in to access this page.");
      window.location.href = "Sign-In.html";
    }
  });
}

// ✅ Show loading spinner
function showLoading(button) {
  if (!button) return;
  button.dataset.originalText = button.innerHTML;
  button.innerHTML = `<span class="spinner-grow spinner-grow-sm"></span> Processing...`;
  button.disabled = true;
}

// ✅ Restore button
function hideLoading(button) {
  if (!button) return;
  button.innerHTML = button.dataset.originalText || "Submit";
  button.disabled = false;
}

// ✅ Sign up with email/password
export const signUpWithEmailPassword = (email, password, name, button) => {
  const auth = getAuth(app);
  showLoading(button);

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await sendEmailVerification(user);
      await createUserInFirestore(user, name); // ✅ Save user to Firestore
      await signOut(auth);

      showAlert("success", "✅ Account created! Verification email sent.");
      document.getElementById("SignUpForm").reset();
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

// ✅ Google Sign-In
export const signUpWithGoogle = async (button) => {
  const provider = new GoogleAuthProvider();
  showLoading(button);

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await createUserInFirestore(user); // ✅ Save user to Firestore

    if (!user.emailVerified) {
      await sendEmailVerification(user);
      showAlert("success", "✅ Google sign-in successful! Please verify your email.");
    } else {
      showAlert("success", "✅ Google sign-in successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "Dashboard.html";
      }, 2000);
    }
  } catch (error) {
    showAlert("error", error.message);
  } finally {
    hideLoading(button);
  }
};

// ✅ Email sign-in
export const signInWithEmailPassword = (email, password, button) => {
  const auth = getAuth(app);
  showLoading(button);

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      if (!user.emailVerified) {
        showAlert("error", "❌ Your email is not verified.");
        signOut(auth);
        return;
      }

      showAlert("success", "✅ Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "Dashboard.html";
      }, 2000);
    })
    .catch((error) => {
      showAlert("error", error.message);
    })
    .finally(() => hideLoading(button));
};

// ✅ Logout
export const logoutUser = () => {
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

// ✅ Delete unverified users after 24h
function checkAndDeleteUnverifiedUser(user) {
  setTimeout(async () => {
    await user.reload();
    if (!user.emailVerified) {
      await user.delete();
      console.log(`🔥 Unverified user ${user.email} deleted from Firebase.`);
    }
  }, 86400000); // 24h
}
