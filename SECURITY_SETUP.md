# 🔒 Configuración de Seguridad - MotoStore

## 🚨 ALERTA DE SEGURIDAD

**GitHub detectó claves API expuestas en tu código. Esto es un problema de seguridad crítico.**

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Archivos Protegidos
- ✅ `firebase-config.js` - **NO se sube a GitHub** (contiene claves reales)
- ✅ `.env` - **NO se sube a GitHub** (variables de entorno)
- ✅ `firebase.js` - **SÍ se sube a GitHub** (sin claves expuestas)

### 2. Configuración Segura
```javascript
// firebase.js (SEGURIDAD ✅)
import { firebaseConfig } from "./firebase-config.js"; // Claves importadas

// firebase-config.js (PROTEGIDO 🔒)
export const firebaseConfig = {
  apiKey: "TU_CLAVE_REAL_AQUI",
  // ... resto de configuración
};
```

## 🛠️ PASOS PARA CONFIGURAR

### Paso 1: Crear archivo de configuración
```bash
# Copia el archivo de ejemplo
cp public/js/firebase-config.example.js public/js/firebase-config.js
```

### Paso 2: Editar con tus claves reales
Edita `public/js/firebase-config.js` y agrega tus claves reales de Firebase.

### Paso 3: Verificar .gitignore
Asegúrate de que `firebase-config.js` esté en `.gitignore`.

## 🔑 OBTENER NUEVAS CLAVES DE FIREBASE

### Si necesitas regenerar las claves:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. **Encuentra tu proyecto** → **Delete** la clave antigua
4. **Create Credentials** → **API Key**
5. **Restringe el dominio** solo a tu sitio web

## 📋 ARCHIVOS IMPORTANTES

- `firebase-config.js` → **NO SUBIR A GITHUB** (claves reales)
- `firebase-config.example.js` → **SÍ SUBIR A GITHUB** (plantilla)
- `firebase.js` → **SÍ SUBIR A GITHUB** (sin claves)
- `.gitignore` → **SÍ SUBIR A GITHUB** (protege claves)

## ⚠️ VERIFICACIÓN

Antes de hacer push:
```bash
git status
# NO debe mostrar firebase-config.js
# SÍ debe mostrar firebase-config.example.js
```

## 🆘 EN CASO DE EMERGENCIA

Si accidentalmente subiste claves:
1. **Inmediatamente** revoca las claves en Google Cloud Console
2. **Genera nuevas claves**
3. **Actualiza** firebase-config.js
4. **Contacta** a GitHub Support si es necesario
