import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2Ti3E5io1Ri1VDovhfmM2jDIhLFNfDJY",
  authDomain: "xpense-ai-fef9b.firebaseapp.com",
  projectId: "xpense-ai-fef9b",
  storageBucket: "xpense-ai-fef9b.firebasestorage.app",
  messagingSenderId: "330348004570",
  appId: "1:330348004570:web:2731d4f96bb73f6e1591e3"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
