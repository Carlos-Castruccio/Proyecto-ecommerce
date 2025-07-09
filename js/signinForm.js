import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js"

import{mostrarMensaje} from './mostrarMensaje.js';
import { auth } from './firebase.js';


const signInForm=document.querySelector('#login-form');

signInForm.addEventListener('submit', async e => {
    e.preventDefault();

    const email=signInForm['login-email'].value;
    const password=signInForm['login-password'].value;

    console.log(email, password)
    
    try{    
        const credentials = await signInWithEmailAndPassword(auth, email, password)
        console.log(credentials)
        //cerrar el modal de registro
        const modal=bootstrap.Modal.getInstance(document.querySelector('#signinModal'));
        modal.hide();
        //limpiar el formulario
        signInForm.reset();

        mostrarMensaje("Bienvenido " + credentials.user.email + ", Ingreso exitoso")

        
    } catch(error){
        if(error.code === 'auth/invalid-credential')
            mostrarMensaje('Credenciales invalidas', "error")
        else{
            mostrarMensaje(error.message, "error")
        }
   
    }
} )

