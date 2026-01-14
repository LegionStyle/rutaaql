// ============================================
// MÓDULO DE TRAZADO DE RUTAS CON GOOGLE MAPS
// ============================================

// Variables globales
let mapa = null;
let drawingMode = 'add'; // 'add', 'move', 'delete'
let routePoints = [];
let routeMarkers = [];
let routePolyline = null;
let directionsService = null;
let directionsRenderer = null;
let selectedMarker = null;

// Configuración
const CONFIG = {
    centroMapa: { lat: -12.046374, lng: -77.042793 },
    zoomInicial: 12,
    defaultColor: '#3498db',
    markerIcon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3498db',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
    },
    selectedMarkerIcon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#e74c3c',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
    }
};

// Inicializar módulo
function inicializarMapaRutas() {
    console.log('🚀 Inicializando trazador de rutas...');
    
    // Verificar autenticación
    if (!localStorage.getItem('empresa_logueada')) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar datos del usuario
    cargarDatosUsuario();
    
    // Inicializar Google Maps
    inicializarGoogleMap();
    
    // Configurar eventos
    configurarEventos();
    
    // Inicializar servicios
    inicializarServicios();
    
    console.log('✅ Trazador de rutas inicializado');
    
    // Mostrar datos iniciales en consola
    mostrarDatosConsola();
}

// Cargar datos del usuario
function cargarDatosUsuario() {
    const nombreEmpresa = localStorage.getItem('empresa_nombre') || "Transporte Rápido S.A.";
    const nombreUsuario = localStorage.getItem('empresa_nombre') || "Administrador";
    const emailUsuario = localStorage.getItem('empresa_email') || "admin@transporte.com";
    
    document.getElementById('companyName').textContent = nombreEmpresa;
    document.getElementById('userName').textContent = nombreUsuario;
    document.getElementById('userEmail').textContent = emailUsuario;
}

// Inicializar Google Maps
function inicializarGoogleMap() {
    console.log('🗺️ Creando mapa de trazado...');
    
    mapa = new google.maps.Map(document.getElementById('map'), {
        center: CONFIG.centroMapa,
        zoom: CONFIG.zoomInicial,
        mapTypeId: 'roadmap',
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
    });
    
    // Agregar evento de clic en el mapa
    mapa.addListener('click', (event) => {
        if (drawingMode === 'add') {
            agregarPuntoRuta(event.latLng);
        }
    });
    
    console.log('✅ Mapa de trazado creado');
}

// Inicializar servicios
function inicializarServicios() {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
            strokeColor: document.getElementById('routeColor').value,
            strokeWeight: 5,
            strokeOpacity: 0.8
        }
    });
    directionsRenderer.setMap(mapa);
}

// Configurar eventos
function configurarEventos() {
    console.log('⚙️ Configurando eventos...');
    
    // Botones de modo
    document.querySelectorAll('.btn-mode').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos
            document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            // Cambiar modo
            drawingMode = this.getAttribute('data-mode');
            console.log(`Modo cambiado a: ${drawingMode}`);
            
            // Actualizar cursores de los marcadores
            actualizarCursoresMarcadores();
        });
    });
    
    // Botón guardar ruta
    document.getElementById('saveRouteBtn').addEventListener('click', () => {
        if (routePoints.length < 2) {
            mostrarMensaje('⚠️ Agrega al menos 2 puntos para guardar una ruta', 'warning');
            return;
        }
        mostrarModalGuardado();
    });
    
    // Botón limpiar ruta
    document.getElementById('clearRouteBtn').addEventListener('click', () => {
        if (confirm('¿Está seguro de eliminar todos los puntos de la ruta?')) {
            limpiarRuta();
            mostrarMensaje('🗑️ Ruta eliminada', 'info');
        }
    });
    
    // Cambio de color
    document.getElementById('routeColor').addEventListener('change', function() {
        if (routePolyline) {
            routePolyline.setOptions({
                strokeColor: this.value
            });
        }
        // Actualizar iconos de marcadores
        actualizarIconosMarcadores();
    });
    
    // Cambio de nombre
    document.getElementById('routeName').addEventListener('input', function() {
        actualizarDatosRuta();
    });
    
    // Botón logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Modal de guardado
    document.getElementById('confirmSaveBtn').addEventListener('click', guardarRutaEnBD);
    document.getElementById('cancelSaveBtn').addEventListener('click', () => {
        document.getElementById('saveModal').style.display = 'none';
    });
    
    // Cerrar modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('saveModal').style.display = 'none';
        });
    });
    
    console.log('✅ Eventos configurados');
}

// Agregar punto a la ruta
function agregarPuntoRuta(latLng) {
    const pointNumber = routePoints.length + 1;
    
    // Crear datos del punto
    const pointData = {
        id: Date.now() + Math.random(),
        number: pointNumber,
        lat: latLng.lat(),
        lng: latLng.lng(),
        name: `Paradero ${pointNumber}`,
        address: 'Dirección no especificada',
        waitingTime: 2 // minutos
    };
    
    // Agregar a la lista
    routePoints.push(pointData);
    
    // Crear marcador
    const marker = crearMarcadorPunto(pointData, latLng);
    routeMarkers.push(marker);
    
    // Actualizar ruta
    actualizarRuta();
    
    // Actualizar UI
    actualizarUI();
    
    // Mostrar en consola
    console.log(`📍 Punto agregado: ${pointData.lat.toFixed(6)}, ${pointData.lng.toFixed(6)}`);
    mostrarDatosConsola();
    
    mostrarMensaje(`✅ Punto ${pointNumber} agregado`, 'success');
}

// Crear marcador para un punto
function crearMarcadorPunto(pointData, position) {
    const marker = new google.maps.Marker({
        position: position,
        map: mapa,
        title: `Punto ${pointData.number}: ${pointData.name}`,
        icon: CONFIG.markerIcon,
        draggable: true,
        zIndex: 1000
    });
    
    // Actualizar color del icono
    marker.setIcon({
        ...CONFIG.markerIcon,
        fillColor: document.getElementById('routeColor').value
    });
    
    // Evento al hacer clic
    marker.addListener('click', () => {
        if (drawingMode === 'delete') {
            eliminarPunto(pointData.id);
        } else {
            seleccionarMarcador(marker, pointData);
        }
    });
    
    // Evento al arrastrar
    marker.addListener('dragend', (event) => {
        if (drawingMode === 'move') {
            // Actualizar posición del punto
            const pointIndex = routePoints.findIndex(p => p.id === pointData.id);
            if (pointIndex !== -1) {
                routePoints[pointIndex].lat = event.latLng.lat();
                routePoints[pointIndex].lng = event.latLng.lng();
                actualizarRuta();
                actualizarUI();
                mostrarDatosConsola();
            }
        }
    });
    
    return marker;
}

// Actualizar cursores de los marcadores
function actualizarCursoresMarcadores() {
    routeMarkers.forEach(marker => {
        switch(drawingMode) {
            case 'move':
                marker.setDraggable(true);
                marker.setCursor('move');
                break;
            case 'delete':
                marker.setDraggable(false);
                marker.setCursor('pointer');
                break;
            default:
                marker.setDraggable(false);
                marker.setCursor('default');
        }
    });
}

// Actualizar iconos de los marcadores
function actualizarIconosMarcadores() {
    const color = document.getElementById('routeColor').value;
    routeMarkers.forEach(marker => {
        marker.setIcon({
            ...CONFIG.markerIcon,
            fillColor: color
        });
    });
}

// Seleccionar marcador
function seleccionarMarcador(marker, pointData) {
    // Deseleccionar marcador anterior
    if (selectedMarker) {
        selectedMarker.setIcon({
            ...CONFIG.markerIcon,
            fillColor: document.getElementById('routeColor').value
        });
    }
    
    // Seleccionar nuevo marcador
    selectedMarker = marker;
    marker.setIcon(CONFIG.selectedMarkerIcon);
    
    // Mostrar info window
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${pointData.name}</h4>
                <p style="margin: 5px 0;"><strong>Número:</strong> ${pointData.number}</p>
                <p style="margin: 5px 0;"><strong>Coordenadas:</strong><br>
                Lat: ${pointData.lat.toFixed(6)}<br>
                Lng: ${pointData.lng.toFixed(6)}</p>
                <p style="margin: 5px 0;"><strong>Tiempo de espera:</strong> ${pointData.waitingTime} min</p>
                <button onclick="editarPunto(${pointData.id})" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `
    });
    
    infoWindow.open(mapa, marker);
    
    // Cerrar info window después de 5 segundos
    setTimeout(() => {
        infoWindow.close();
    }, 5000);
}

// Editar punto
function editarPunto(pointId) {
    const pointIndex = routePoints.findIndex(p => p.id === pointId);
    if (pointIndex === -1) return;
    
    const point = routePoints[pointIndex];
    const newName = prompt('Nuevo nombre del punto:', point.name);
    
    if (newName && newName.trim() !== '') {
        point.name = newName.trim();
        actualizarUI();
        mostrarDatosConsola();
        mostrarMensaje('✅ Nombre del punto actualizado', 'success');
    }
}

// Eliminar punto
function eliminarPunto(pointId) {
    const pointIndex = routePoints.findIndex(p => p.id === pointId);
    if (pointIndex === -1) return;
    
    // Eliminar marcador del mapa
    const marker = routeMarkers[pointIndex];
    if (marker) {
        marker.setMap(null);
    }
    
    // Eliminar de arrays
    routePoints.splice(pointIndex, 1);
    routeMarkers.splice(pointIndex, 1);
    
    // Renumerar puntos restantes
    routePoints.forEach((point, index) => {
        point.number = index + 1;
        point.name = `Paradero ${index + 1}`;
    });
    
    // Actualizar ruta
    actualizarRuta();
    actualizarUI();
    
    console.log(`🗑️ Punto eliminado: ${pointId}`);
    mostrarDatosConsola();
    
    mostrarMensaje('✅ Punto eliminado', 'success');
}

// Actualizar ruta en el mapa
function actualizarRuta() {
    // Eliminar polyline anterior si existe
    if (routePolyline) {
        routePolyline.setMap(null);
    }
    
    if (routePoints.length < 2) {
        // Si hay menos de 2 puntos, no dibujar ruta
        if (directionsRenderer) {
            directionsRenderer.setDirections({ routes: [] });
        }
        return;
    }
    
    if (routePoints.length === 2) {
        // Para 2 puntos, usar polyline simple
        const path = routePoints.map(point => ({
            lat: point.lat,
            lng: point.lng
        }));
        
        routePolyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: document.getElementById('routeColor').value,
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: mapa
        });
        
        // Calcular distancia
        const distancia = google.maps.geometry.spherical.computeLength(
            routePolyline.getPath().getArray()
        );
        
        actualizarEstadisticas(distancia / 1000, 0);
        
    } else if (routePoints.length > 2) {
        // Para más de 2 puntos, usar Directions API para ruta real
        calcularRutaConDirections();
    }
}

// Calcular ruta usando Directions API
function calcularRutaConDirections() {
    if (!directionsService || routePoints.length < 2) return;
    
    const waypoints = routePoints.slice(1, -1).map(point => ({
        location: { lat: point.lat, lng: point.lng },
        stopover: true
    }));
    
    const request = {
        origin: { lat: routePoints[0].lat, lng: routePoints[0].lng },
        destination: { lat: routePoints[routePoints.length - 1].lat, lng: routePoints[routePoints.length - 1].lng },
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
    };
    
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Calcular distancia y duración total
            const route = result.routes[0];
            let totalDistance = 0;
            let totalDuration = 0;
            
            route.legs.forEach(leg => {
                totalDistance += leg.distance.value;
                totalDuration += leg.duration.value;
            });
            
            // Convertir a km y minutos
            const distanciaKm = totalDistance / 1000;
            const duracionMin = Math.round(totalDuration / 60);
            
            actualizarEstadisticas(distanciaKm, duracionMin);
            
        } else {
            console.error('Error al calcular ruta:', status);
            // Fallback a polyline simple
            dibujarPolylineSimple();
        }
    });
}

// Dibujar polyline simple (fallback)
function dibujarPolylineSimple() {
    const path = routePoints.map(point => ({
        lat: point.lat,
        lng: point.lng
    }));
    
    routePolyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: document.getElementById('routeColor').value,
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: mapa
    });
    
    // Calcular distancia aproximada
    const distancia = google.maps.geometry.spherical.computeLength(
        routePolyline.getPath().getArray()
    );
    
    // Estimación de duración (40 km/h promedio)
    const duracion = (distancia / 1000) / 40 * 60;
    
    actualizarEstadisticas(distancia / 1000, duracion);
}

// Actualizar estadísticas
function actualizarEstadisticas(distanciaKm, duracionMin) {
    document.getElementById('pointCount').textContent = routePoints.length;
    document.getElementById('totalDistance').textContent = `${distanciaKm.toFixed(2)} km`;
    document.getElementById('totalDuration').textContent = `${Math.round(duracionMin)} min`;
}

// Actualizar UI
function actualizarUI() {
    // Actualizar lista de puntos
    const stopsList = document.getElementById('stopsList');
    
    if (routePoints.length === 0) {
        stopsList.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-info-circle"></i>
                <p>No hay puntos en la ruta. Haz clic en el mapa para agregar puntos.</p>
            </div>
        `;
    } else {
        stopsList.innerHTML = routePoints.map(point => `
            <div class="stop-item" data-id="${point.id}">
                <div class="stop-number">${point.number}</div>
                <div class="stop-info">
                    <div class="stop-name">${point.name}</div>
                    <div class="stop-coords">
                        ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}
                    </div>
                </div>
                <div class="stop-actions">
                    <button class="btn-icon" onclick="editarPunto(${point.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="eliminarPunto(${point.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Actualizar JSON
    actualizarDatosRuta();
}

// Actualizar datos de la ruta
function actualizarDatosRuta() {
    const routeData = {
        nombre: document.getElementById('routeName').value,
        color: document.getElementById('routeColor').value,
        puntos: routePoints.map(point => ({
            numero: point.number,
            nombre: point.name,
            latitud: point.lat,
            longitud: point.lng,
            tiempoEspera: point.waitingTime
        })),
        distancia: document.getElementById('totalDistance').textContent,
        duracion: document.getElementById('totalDuration').textContent,
        fechaCreacion: new Date().toISOString()
    };
    
    // Mostrar JSON formateado
    document.getElementById('routeJson').textContent = JSON.stringify(routeData, null, 2);
}

// Mostrar datos en consola
function mostrarDatosConsola() {
    console.log('📊 DATOS DE LA RUTA ACTUAL:');
    console.log('============================');
    console.log(`Nombre: ${document.getElementById('routeName').value}`);
    console.log(`Color: ${document.getElementById('routeColor').value}`);
    console.log(`Puntos: ${routePoints.length}`);
    console.log('Lista de puntos:');
    
    routePoints.forEach(point => {
        console.log(`  ${point.number}. ${point.name} - ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`);
    });
    
    console.log(`Distancia: ${document.getElementById('totalDistance').textContent}`);
    console.log(`Duración: ${document.getElementById('totalDuration').textContent}`);
    console.log('============================\n');
    
    // También mostrar el objeto completo
    console.log('Objeto completo de la ruta:', {
        nombre: document.getElementById('routeName').value,
        color: document.getElementById('routeColor').value,
        puntos: routePoints,
        distancia: document.getElementById('totalDistance').textContent,
        duracion: document.getElementById('totalDuration').textContent
    });
}

// Mostrar modal de guardado
function mostrarModalGuardado() {
    // Llenar datos en el modal
    document.getElementById('modalRouteName').value = document.getElementById('routeName').value;
    
    // Generar código automático
    const codigo = `RT-${String(routePoints.length).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    document.getElementById('modalRouteCode').value = codigo;
    
    // Mostrar modal
    document.getElementById('saveModal').style.display = 'flex';
}

// Guardar ruta en "base de datos" (simulación)
function guardarRutaEnBD() {
    console.log('💾 INICIANDO GUARDADO DE RUTA...');
    
    // Obtener datos del formulario
    const routeData = {
        id: Date.now(),
        nombre: document.getElementById('modalRouteName').value,
        codigo: document.getElementById('modalRouteCode').value,
        descripcion: document.getElementById('modalRouteDescription').value,
        color: document.getElementById('routeColor').value,
        puntos: routePoints.map(point => ({
            id: point.id,
            numero: point.number,
            nombre: point.name,
            latitud: point.lat,
            longitud: point.lng,
            tiempoEspera: point.waitingTime,
            direccion: point.address
        })),
        distancia: document.getElementById('totalDistance').textContent,
        duracion: document.getElementById('totalDuration').textContent,
        estado: 'activa',
        fechaCreacion: new Date().toISOString(),
        vehiculosAsignados: Array.from(document.querySelectorAll('#saveModal input[type="checkbox"]:checked'))
            .map(cb => cb.value)
    };
    
    // SIMULACIÓN: Enviar a "servidor" (consola)
    console.log('📤 ENVIANDO DATOS AL SERVIDOR...');
    console.log('📄 Datos a enviar:', routeData);
    
    // Simular llamada API
    setTimeout(() => {
        console.log('✅ RUTA GUARDADA EXITOSAMENTE');
        console.log('📋 Resumen:');
        console.log(`   Nombre: ${routeData.nombre}`);
        console.log(`   Código: ${routeData.codigo}`);
        console.log(`   Puntos: ${routeData.puntos.length}`);
        console.log(`   Distancia: ${routeData.distancia}`);
        console.log(`   Duración: ${routeData.duracion}`);
        console.log(`   Vehículos asignados: ${routeData.vehiculosAsignados.join(', ') || 'Ninguno'}`);
        
        // Simular respuesta del servidor
        const respuestaServidor = {
            success: true,
            message: 'Ruta guardada exitosamente',
            data: {
                ...routeData,
                id: `RUTA_${Date.now()}`,
                createdAt: new Date().toISOString(),
                createdBy: localStorage.getItem('empresa_email') || 'admin@transporte.com'
            }
        };
        
        console.log('📨 Respuesta del servidor:', respuestaServidor);
        
        // Guardar en localStorage para persistencia
        guardarEnLocalStorage(routeData);
        
        // Cerrar modal
        document.getElementById('saveModal').style.display = 'none';
        
        // Mostrar mensaje de éxito
        mostrarMensaje('✅ Ruta guardada exitosamente. Ver consola para detalles.', 'success');
        
        // Limpiar ruta actual
        limpiarRuta();
        
    }, 1500); // Simular delay de red
}

// Guardar en localStorage (simulación de BD)
function guardarEnLocalStorage(routeData) {
    try {
        // Obtener rutas existentes
        let rutasGuardadas = JSON.parse(localStorage.getItem('rutasTrazadas')) || [];
        
        // Agregar nueva ruta
        rutasGuardadas.push(routeData);
        
        // Guardar en localStorage
        localStorage.setItem('rutasTrazadas', JSON.stringify(rutasGuardadas));
        
        console.log(`💾 Ruta guardada en localStorage. Total: ${rutasGuardadas.length} rutas`);
        console.log('📁 Rutas guardadas:', rutasGuardadas);
        
    } catch (error) {
        console.error('❌ Error al guardar en localStorage:', error);
    }
}

// Limpiar ruta
function limpiarRuta() {
    // Eliminar marcadores
    routeMarkers.forEach(marker => {
        marker.setMap(null);
    });
    
    // Eliminar polyline
    if (routePolyline) {
        routePolyline.setMap(null);
        routePolyline = null;
    }
    
    // Limpiar arrays
    routePoints = [];
    routeMarkers = [];
    
    // Limpiar directions
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }
    
    // Actualizar UI
    actualizarUI();
    actualizarEstadisticas(0, 0);
    
    // Mostrar en consola
    console.log('🧹 RUTA LIMPIADA - Listo para nueva ruta');
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = 'temp-message';
    mensajeDiv.textContent = mensaje;
    
    const color = tipo === 'success' ? '#27ae60' : 
                  tipo === 'warning' ? '#f39c12' : 
                  tipo === 'error' ? '#e74c3c' : '#3498db';
    
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 4000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(mensajeDiv);
    
    setTimeout(() => {
        mensajeDiv.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.parentNode.removeChild(mensajeDiv);
            }
        }, 300);
    }, 3000);
}

// Función de logout
function handleLogout() {
    localStorage.removeItem('empresa_logueada');
    localStorage.removeItem('empresa_token');
    localStorage.removeItem('empresa_nombre');
    localStorage.removeItem('empresa_email');
    window.location.href = 'index.html';
}

// Hacer funciones disponibles globalmente
window.inicializarMapaRutas = inicializarMapaRutas;
window.editarPunto = editarPunto;
window.eliminarPunto = eliminarPunto;

console.log('✅ mapa-rutas.js cargado correctamente');