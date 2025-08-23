// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDUktPcM4hRkZdAkwwyUBWKzzCruCXYqYw",
  authDomain: "motostore-accesorios-de-motos.firebaseapp.com",
  projectId: "motostore-accesorios-de-motos",
  storageBucket: "motostore-accesorios-de-motos.firebasestorage.app",
  messagingSenderId: "24197467469",
  appId: "1:24197467469:web:6ef3ebe07d5a991695fb04"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
