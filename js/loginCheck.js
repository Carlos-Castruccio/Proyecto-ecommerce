const loggedOutLinks = document.querySelectorAll('.logged-out')
const loggedInLinks = document.querySelectorAll('.logged-in')

console.log(loggedOutLinks);
console.log(loggedInLinks);


export const loginCheck = user => {
    if (user) {
        loggedOutLinks.forEach(link => link.style.display = 'none');
        loggedInLinks.forEach(link => link.style.display = 'block');
            
    }else {
        loggedInLinks.forEach(link => link.style.display = 'none');   
        loggedOutLinks.forEach(link => link.style.display = 'block');
    }
}