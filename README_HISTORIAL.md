# 📊 Sistema de Historial de Ventas - MotoStore

## 🎯 **Descripción General**

Este sistema implementa una política de gestión de pedidos profesional que incluye:

- **Período de reclamo de 30 días** después de la entrega
- **Movimiento automático** de pedidos al historial después del período de reclamo
- **Gestión de estados** con indicadores visuales claros
- **Historial permanente** de todas las ventas finalizadas

## 🏗️ **Arquitectura del Sistema**

### **Colecciones de Firebase:**
1. **`pedidos`** - Pedidos activos y en proceso
2. **`historialVentas`** - Pedidos finalizados sin posibilidad de reclamo

### **Estados de Pedidos:**
- `pendiente` - Pedido recibido, en espera de procesamiento
- `procesando` - Pedido siendo preparado
- `enviado` - Pedido enviado al cliente
- `completado` - Pedido entregado (período de reclamo activo)
- `cancelado` - Pedido cancelado

### **Estados de Reclamo:**
- `puede_reclamar` - Dentro de los 30 días de entrega
- `sin_reclamo` - Pasados los 30 días de entrega
- `no_aplica` - Pedido no entregado

## 🚀 **Funcionalidades Implementadas**

### **1. Gestión de Pedidos Activos (`adminPedidos.js`)**
- ✅ Cambio de estados en tiempo real
- ✅ Fecha de entrega automática al marcar como "completado"
- ✅ Indicador visual del estado de reclamo
- ✅ Cálculo automático de días restantes para reclamo

### **2. Historial de Ventas (`historialVentas.js`)**
- ✅ Vista completa de pedidos finalizados
- ✅ Información detallada de cada venta
- ✅ Filtros por fecha y estado
- ✅ Acciones de gestión (ver detalles, limpiar)

### **3. Automatización (`automatizacionHistorial.js`)**
- ✅ Movimiento automático de pedidos vencidos
- ✅ Configuración personalizable de días límite
- ✅ Estadísticas del historial
- ✅ Limpieza automática de registros antiguos

## 📱 **Interfaces de Usuario**

### **Página Principal de Admin Pedidos**
- Tabla de pedidos activos
- Selector de estados con fecha de entrega
- Indicadores de estado de reclamo
- Enlace directo al historial

### **Página de Historial de Ventas**
- Tabla completa de ventas finalizadas
- Botones de acción para gestión
- Información de política de pedidos
- Estadísticas visuales

## 🔧 **Configuración y Uso**

### **Configuración de Días de Reclamo**
```javascript
// En automatizacionHistorial.js
const CONFIG = {
  DIAS_LIMITE_RECLAMO: 30,  // Cambiar aquí si es necesario
  // ... otras configuraciones
};
```

### **Ejecución Manual de Automatización**
```javascript
// En la consola del navegador
await window.automatizacionHistorial.moverPedidos();

// O importar y usar
import { moverPedidosVencidosAlHistorial } from './automatizacionHistorial.js';
const resultado = await moverPedidosVencidosAlHistorial();
```

### **Programación Automática**
```javascript
// Verificar cada hora
setInterval(async () => {
  await moverPedidosVencidosAlHistorial();
}, 60 * 60 * 1000);

// Verificar diariamente a las 2 AM
setInterval(async () => {
  const ahora = new Date();
  if (ahora.getHours() === 2 && ahora.getMinutes() === 0) {
    await moverPedidosVencidosAlHistorial();
  }
}, 60 * 1000);
```

## 📊 **Estructura de Datos**

### **Documento de Pedido Activo:**
```javascript
{
  id: "pedido_123",
  estado: "completado",
  fechaEntrega: Timestamp,
  items: [...],
  total: 15000,
  cliente: {...},
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

### **Documento de Historial:**
```javascript
{
  id: "historial_456",
  // Todos los campos del pedido original
  movidoAlHistorialEn: Timestamp,
  estadoFinal: "finalizado_sin_reclamo",
  motivo: "Período de reclamo vencido (30 días)",
  procesoAutomatico: true,
  fechaProcesamiento: Timestamp
}
```

## 🎨 **Personalización de la UI**

### **Colores de Estados:**
- 🟡 **Amarillo**: Puede reclamar (≤ 30 días)
- 🟢 **Verde**: Sin reclamo (> 30 días)
- 🔴 **Rojo**: Cancelado
- 🔵 **Azul**: En proceso

### **Estilos CSS Personalizados:**
```css
.btn-mover-historial {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  border: none;
  color: white;
}

.estado-badge {
  font-size: 0.8em;
  padding: 0.25em 0.5em;
}
```

## 🔒 **Seguridad y Permisos**

### **Control de Acceso:**
- Solo usuarios con rol `admin: true` pueden acceder
- Verificación automática en cada página
- Redirección automática si no hay permisos

### **Validaciones:**
- Verificación de datos antes de mover al historial
- Backup automático antes de eliminaciones
- Logs de todas las operaciones críticas

## 📈 **Monitoreo y Estadísticas**

### **Métricas Disponibles:**
- Total de pedidos en historial
- Distribución por estados
- Ventas por mes
- Total de ventas históricas

### **Logs del Sistema:**
```javascript
// Ejemplo de log de automatización
console.log("🔄 Iniciando proceso de movimiento automático...");
console.log("📊 Pedidos revisados: 45");
console.log("📦 Pedidos a mover: 12");
console.log("✅ Proceso completado exitosamente");
```

## 🚨 **Solución de Problemas**

### **Error: "No se pudieron cargar los pedidos"**
- Verificar conexión a Firebase
- Revisar permisos de la colección
- Verificar estructura de datos

### **Error: "No se pudo actualizar estado"**
- Verificar permisos de escritura
- Revisar formato de datos
- Verificar conexión a internet

### **Pedidos no se mueven automáticamente**
- Verificar configuración de días límite
- Revisar estados de pedidos
- Verificar ejecución del script de automatización

## 🔄 **Mantenimiento**

### **Limpieza Regular:**
```javascript
// Limpiar historial de más de 1 año
await limpiarHistorialAntiguo(365);

// Limpiar historial de más de 6 meses
await limpiarHistorialAntiguo(180);
```

### **Backup de Datos:**
- Exportar historial antes de limpiezas masivas
- Mantener copias de seguridad de configuraciones
- Documentar cambios en la estructura de datos

## 📞 **Soporte y Contacto**

Para dudas o problemas con el sistema:
1. Revisar logs de la consola del navegador
2. Verificar configuración de Firebase
3. Consultar documentación de la API
4. Contactar al equipo de desarrollo

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025  
**Desarrollado para:** MotoStore - División Accesorios
