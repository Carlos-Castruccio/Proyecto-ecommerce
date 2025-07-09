import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js"

import { auth } from './firebase.js'

import { mostrarMensaje} from './mostrarMensaje.js'

const signupForm=document.querySelector('#signup-form')

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email=signupForm['signup-email'].value;
    const password=signupForm['signup-password'].value;

    console.log(email, password)
    
    try{    
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password)
        console.log(userCredentials)
        //cerrar el modal de registro
        const signupModal=document.querySelector('#signupModal')
        const modal=bootstrap.Modal.getInstance(signupModal)
        modal.hide();
        //limpiar el formulario
        signupForm.reset();

        mostrarMensaje("Bienvenido " + userCredentials.user.email + ", cuenta creada exitosamente")

    } catch(error){
        console.log(error.message)
        console.log(error.code)
        if(error.code === 'auth/email-already-in-use'){
            mostrarMensaje('El correo electrónico ya está en uso', "error")
        }else if(error.code==='auth/invalid-email'){
            mostrarMensaje('Correo electrónico inválido', "error")
        }else if(error.code==='auth/weak-password'){
            mostrarMensaje('La contraseña debe tener al menos 6 caracteres', "error")
        } else if(error.code){
            mostrarMensaje(error.message, "error")
        }
    }
}
)




