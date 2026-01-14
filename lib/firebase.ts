import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC6pYbPSsDTK2362CAS9hNkyuw7aZj1a_g",
    authDomain: "ccee-ctf.firebaseapp.com",
    projectId: "ccee-ctf",
    storageBucket: "ccee-ctf.firebasestorage.app",
    messagingSenderId: "354477313009",
    appId: "1:354477313009:web:3650e922c36c54cde25250",
    measurementId: "G-1MQPSR8R9E"
};

// Initialize Firebase (check if already initialized for SSR safety)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
