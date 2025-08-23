// public/js/automatizacionHistorial.js
// Script para automatizar el movimiento de pedidos al historial
// Se puede ejecutar manualmente o programar con un cron job

import { db } from "./firebase.js";
import {
  collection, getDocs, doc, addDoc, deleteDoc, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

/* -------------------- Configuración -------------------- */
const CONFIG = {
  DIAS_LIMITE_RECLAMO: 30,
  COLECCION_PEDIDOS: "pedidos",
  COLECCION_HISTORIAL: "historialVentas",
  ESTADOS_ENTREGADOS: ["completado", "entregado"]
};

/* -------------------- Helpers -------------------- */
function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts?.toDate === "function") return ts.toDate();
  if (typeof ts === "number") {
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return new Date(ms);
  }
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(+d) ? null : d;
  }
  return null;
}

function calcularDiasDesdeEntrega(fechaEntrega) {
  if (!fechaEntrega) return null;
  
  const fecha = tsToDate(fechaEntrega);
  if (!fecha) return null;
  
  const ahora = new Date();
  const diferenciaMs = ahora - fecha;
  const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
  
  return dias;
}

/* -------------------- Lógica Principal -------------------- */
async function moverPedidosVencidosAlHistorial() {
  console.log("🔄 Iniciando proceso de movimiento automático de pedidos...");
  
  try {
    const ahora = new Date();
    const limiteDias = new Date(ahora.getTime() - (CONFIG.DIAS_LIMITE_RECLAMO * 24 * 60 * 60 * 1000));
    
    console.log(`📅 Fecha límite para reclamos: ${limiteDias.toLocaleDateString('es-AR')}`);
    
    // Obtener pedidos entregados
    const pedidosRef = collection(db, CONFIG.COLECCION_PEDIDOS);
    const q = query(
      pedidosRef,
      where("estado", "in", CONFIG.ESTADOS_ENTREGADOS),
      orderBy("fechaEntrega", "desc")
    );
    
    const snap = await getDocs(q);
    const pedidosAMover = [];
    const pedidosRevisados = [];
    
    snap.forEach((doc) => {
      const pedido = { id: doc.id, ...doc.data() };
      pedidosRevisados.push(pedido);
      
      const fechaEntrega = tsToDate(pedido.fechaEntrega);
      if (fechaEntrega && fechaEntrega < limiteDias) {
        pedidosAMover.push(pedido);
      }
    });
    
    console.log(`📊 Pedidos revisados: ${pedidosRevisados.length}`);
    console.log(`📦 Pedidos a mover: ${pedidosAMover.length}`);
    
    if (pedidosAMover.length === 0) {
      console.log("✅ No hay pedidos para mover al historial.");
      return {
        success: true,
        mensaje: "No hay pedidos para mover al historial.",
        pedidosRevisados: pedidosRevisados.length,
        pedidosMovidos: 0
      };
    }
    
    // Mover cada pedido al historial
    const resultados = [];
    for (const pedido of pedidosAMover) {
      try {
        // Agregar al historial
        const docRef = await addDoc(collection(db, CONFIG.COLECCION_HISTORIAL), {
          ...pedido,
          movidoAlHistorialEn: serverTimestamp(),
          estadoFinal: "finalizado_sin_reclamo",
          motivo: `Período de reclamo vencido (${CONFIG.DIAS_LIMITE_RECLAMO} días)`,
          procesoAutomatico: true,
          fechaProcesamiento: serverTimestamp()
        });
        
        // Eliminar de pedidos activos
        await deleteDoc(doc(db, CONFIG.COLECCION_PEDIDOS, pedido.id));
        
        resultados.push({
          id: pedido.id,
          success: true,
          historialId: docRef.id
        });
        
        console.log(`✅ Pedido ${pedido.id} movido exitosamente al historial`);
        
      } catch (error) {
        console.error(`❌ Error al mover pedido ${pedido.id}:`, error);
        resultados.push({
          id: pedido.id,
          success: false,
          error: error.message
        });
      }
    }
    
    const exitosos = resultados.filter(r => r.success).length;
    const fallidos = resultados.filter(r => !r.success).length;
    
    console.log(`🎯 Proceso completado:`);
    console.log(`   ✅ Exitosos: ${exitosos}`);
    console.log(`   ❌ Fallidos: ${fallidos}`);
    
    return {
      success: true,
      mensaje: `Se movieron ${exitosos} pedidos al historial exitosamente.`,
      pedidosRevisados: pedidosRevisados.length,
      pedidosMovidos: exitosos,
      errores: fallidos,
      resultados: resultados
    };
    
  } catch (error) {
    console.error("❌ Error en el proceso automático:", error);
    return {
      success: false,
      mensaje: "Error en el proceso automático",
      error: error.message
    };
  }
}

/* -------------------- Funciones de Utilidad -------------------- */
async function obtenerEstadisticasHistorial() {
  try {
    const historialRef = collection(db, CONFIG.COLECCION_HISTORIAL);
    const snap = await getDocs(historialRef);
    
    const estadisticas = {
      total: snap.size,
      porEstado: {},
      porMes: {},
      totalVentas: 0
    };
    
    snap.forEach((doc) => {
      const pedido = doc.data();
      
      // Contar por estado
      const estado = pedido.estadoFinal || "sin_estado";
      estadisticas.porEstado[estado] = (estadisticas.porEstado[estado] || 0) + 1;
      
      // Contar por mes
      const fecha = tsToDate(pedido.movidoAlHistorialEn);
      if (fecha) {
        const mes = fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
        estadisticas.porMes[mes] = (estadisticas.porMes[mes] || 0) + 1;
      }
      
      // Sumar totales
      const total = Number(pedido.total) || 0;
      estadisticas.totalVentas += total;
    });
    
    return estadisticas;
    
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return null;
  }
}

async function limpiarHistorialAntiguo(diasAntiguedad = 365) {
  try {
    const ahora = new Date();
    const limiteAntiguedad = new Date(ahora.getTime() - (diasAntiguedad * 24 * 60 * 60 * 1000));
    
    const historialRef = collection(db, CONFIG.COLECCION_HISTORIAL);
    const q = query(
      historialRef,
      where("movidoAlHistorialEn", "<", limiteAntiguedad)
    );
    
    const snap = await getDocs(q);
    const pedidosALimpiar = [];
    
    snap.forEach((doc) => {
      pedidosALimpiar.push(doc.ref);
    });
    
    if (pedidosALimpiar.length === 0) {
      return {
        success: true,
        mensaje: "No hay pedidos antiguos para limpiar.",
        pedidosLimpiados: 0
      };
    }
    
    // Eliminar en lote
    const batch = [];
    pedidosALimpiar.forEach(ref => batch.push(deleteDoc(ref)));
    await Promise.all(batch);
    
    return {
      success: true,
      mensaje: `Se limpiaron ${pedidosALimpiar.length} pedidos antiguos del historial.`,
      pedidosLimpiados: pedidosALimpiar.length
    };
    
  } catch (error) {
    console.error("Error al limpiar historial:", error);
    return {
      success: false,
      mensaje: "Error al limpiar historial",
      error: error.message
    };
  }
}

/* -------------------- Exportaciones -------------------- */
export {
  moverPedidosVencidosAlHistorial,
  obtenerEstadisticasHistorial,
  limpiarHistorialAntiguo,
  CONFIG
};

/* -------------------- Ejecución Directa (si se importa como script principal) -------------------- */
if (typeof window === 'undefined') {
  // Si se ejecuta en Node.js o como script independiente
  console.log("🚀 Script de automatización ejecutándose...");
  
  // Aquí podrías agregar lógica para ejecución programada
  // Por ejemplo, verificar cada hora si hay pedidos para mover
  
  setInterval(async () => {
    console.log("⏰ Verificación programada iniciada...");
    const resultado = await moverPedidosVencidosAlHistorial();
    console.log("📊 Resultado de la verificación:", resultado);
  }, 60 * 60 * 1000); // Cada hora
  
} else {
  // Si se ejecuta en el navegador
  console.log("🌐 Script de automatización cargado en el navegador");
  
  // Agregar a la ventana global para uso manual
  window.automatizacionHistorial = {
    moverPedidos: moverPedidosVencidosAlHistorial,
    obtenerEstadisticas: obtenerEstadisticasHistorial,
    limpiarHistorial: limpiarHistorialAntiguo
  };
}
