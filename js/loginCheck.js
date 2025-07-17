const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');

export const loginCheck = user => {
  const userNameDisplay = document.querySelector('#user-name');

  if (user) {
    loggedOutLinks.forEach(link => link.style.display = 'none');
    loggedInLinks.forEach(link => link.style.display = 'block');

    if (userNameDisplay) {
      userNameDisplay.textContent = `${user.email}`;
    }
  } else {
    loggedInLinks.forEach(link => link.style.display = 'none');
    loggedOutLinks.forEach(link => link.style.display = 'block');

    if (userNameDisplay) {
      userNameDisplay.textContent = '';
    }
  }
};
