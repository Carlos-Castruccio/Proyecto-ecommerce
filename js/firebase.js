// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js"
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries


  // Your web app's Firebase configuration
    const firebaseConfig = {
    apiKey: "AIzaSyBhJND_YI-FeI9HSu24RJHoK1SJFg6Tdsw",
    authDomain: "motostore-divicion-accesorios.firebaseapp.com",
    projectId: "motostore-divicion-accesorios",
    storageBucket: "motostore-divicion-accesorios.firebasestorage.app",
    messagingSenderId: "348001896071",
    appId: "1:348001896071:web:2b9b45517f686364b49a22"
    };

  // Initialize Firebase
    export const app = initializeApp(firebaseConfig);
    export const auth= getAuth(app );