import { auth } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';

const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
const adminLinks = document.querySelectorAll('.admin-only');

export const loginCheck = async (user) => {
  if (user) {
    const token = await user.getIdTokenResult();

    loggedOutLinks.forEach(link => link.style.display = 'none');
    loggedInLinks.forEach(link => link.style.display = 'block');

    if (token.claims.admin) {
      adminLinks.forEach(link => link.classList.remove('d-none'));
    } else {
      adminLinks.forEach(link => link.classList.add('d-none'));
    }

    const userNameDisplay = document.querySelector('#user-name');
    if (userNameDisplay) {
      userNameDisplay.textContent = `Sesión activa: ${user.email}`;
    }

  } else {
    loggedInLinks.forEach(link => link.style.display = 'none');
    loggedOutLinks.forEach(link => link.style.display = 'block');
    adminLinks.forEach(link => link.classList.add('d-none'));
  }
};
