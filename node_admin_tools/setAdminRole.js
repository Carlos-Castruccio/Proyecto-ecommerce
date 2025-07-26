const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializar app admin con tu clave de servicio
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//  Pegá el UID del usuario que querés convertir en admin
const uid = 'fXzeIfAPoAfSyQXXSrXedvyRJOd2';

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ El usuario con UID ${uid} ahora es administrador`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error al asignar el rol:', error);
    process.exit(1);
  });
