// public/js/loginCheck.js
import { db } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

export async function loginCheck(user) {
  // Mantengo nombres simples y predecibles (como pediste)
  const loggedInLinks  = document.querySelectorAll('.logged-in');
  const loggedOutLinks = document.querySelectorAll('.logged-out');
  const adminOnly      = document.querySelectorAll('.admin-only');
  const userName       = document.getElementById('user-name');

  if (!user) {
    // Usuario NO logueado
    loggedInLinks.forEach(el => el.classList.add('d-none'));
    loggedOutLinks.forEach(el => el.classList.remove('d-none'));
    adminOnly.forEach(el => el.classList.add('d-none'));
    if (userName) userName.textContent = '';
    document.body.dataset.role = '';
    return;
  }

  // Usuario logueado (base)
  loggedInLinks.forEach(el => el.classList.remove('d-none'));
  loggedOutLinks.forEach(el => el.classList.add('d-none'));
  if (userName) userName.textContent = user.email || '';

  // Por defecto oculto admin hasta verificar rol
  adminOnly.forEach(el => el.classList.add('d-none'));

  try {
    // --- Logs de diagnóstico mínimos (te ayudan a ver el problema en consola) ---
    console.log('[loginCheck] uid:', user?.uid, 'email:', user?.email);

    const rolRef  = doc(db, 'roles', user.uid);
    const rolSnap = await getDoc(rolRef);

    console.log('[loginCheck] roles exists?', rolSnap.exists(), 
                'data:', rolSnap.exists() ? rolSnap.data() : null);

    const data = rolSnap.exists() ? rolSnap.data() : {};
    const isAdmin = data.admin === true; // booleano estricto

    console.log('[loginCheck] isAdmin:', isAdmin);
    // ---------------------------------------------------------------------------

    adminOnly.forEach(el => el.classList.toggle('d-none', !isAdmin));
    document.body.dataset.role = isAdmin ? 'admin' : 'user';
  } catch (err) {
    console.error('loginCheck(): no se pudo obtener el rol', err);
    adminOnly.forEach(el => el.classList.add('d-none'));
    document.body.dataset.role = 'user';
  }
}
