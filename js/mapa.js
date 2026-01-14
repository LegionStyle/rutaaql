// ============================================
// MÓDULO DEL MAPA EN TIEMPO REAL CON GOOGLE MAPS
// ============================================

// Variables globales
let mapa = null;
let marcadoresVehiculos = {};
let rutasPolylines = {};
let paraderosMarkers = {};
let trafficLayer = null;
let directionsService = null;
let directionsRenderer = null;
let vehiculosDB = [];
let rutasDB = [];
let actualizacionInterval = null;
let contadorActualizacion = 3;
let filtrosActivos = {
    estado: ['moving', 'stopped', 'offline'],
    rutas: 'all',
    mostrarRutas: false,
    mostrarParaderos: false,
    mostrarTrafico: true
};

// Configuración inicial
const CONFIG = {
    centroMapa: { lat: -16.409047, lng: -71.537451 }, // Arequipa, Perú
    zoomInicial: 12,
    intervaloActualizacion: 3000, // 3 segundos
    estilosMapa: [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        }
    ]
};

// Inicializar módulo (llamado por Google Maps API)
function inicializarMapa() {
    verificarAutenticacion();
    cargarDatosUsuario();
    cargarDatosIniciales();
    inicializarGoogleMap();
    cargarVehiculos();
    cargarRutas();
    configurarEventos();
    iniciarActualizacionAutomatica();
    
    console.log("✅ Google Maps en tiempo real inicializado");
}

// Verificar autenticación
function verificarAutenticacion() {
    if (!localStorage.getItem('empresa_logueada')) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Cargar datos del usuario
function cargarDatosUsuario() {
    const nombreEmpresa = localStorage.getItem('empresa_nombre') || "Transporte Rápido S.A.";
    const nombreUsuario = localStorage.getItem('empresa_nombre') || "Administrador";
    
    document.getElementById('companyName').textContent = nombreEmpresa;
    document.getElementById('userName').textContent = nombreUsuario;
}

// Cargar datos iniciales desde localStorage
function cargarDatosIniciales() {
    // Cargar vehículos desde localStorage o usar datos de ejemplo
    vehiculosDB = JSON.parse(localStorage.getItem('vehiculosDB')) || [
        {
            id: 1,
            placa: "ABC-123",
            codigo: "V001",
            chofer: { id: 1, nombre: "Juan Pérez" },
            ruta: { id: 1, nombre: "Ruta Centro", color: "#3498db" },
            estado: "moving",
            velocidad: "45 km/h",
            ubicacion: { lat: -12.046374, lng: -77.042793 },
            direccion: "Av. Principal km 5",
            ultimaActualizacion: new Date().toISOString(),
            historial: []
        },
        {
            id: 2,
            placa: "DEF-456",
            codigo: "V002",
            chofer: { id: 2, nombre: "María López" },
            ruta: { id: 2, nombre: "Ruta Norte", color: "#27ae60" },
            estado: "stopped",
            velocidad: "0 km/h",
            ubicacion: { lat: -12.056374, lng: -77.032793 },
            direccion: "Estación Central",
            ultimaActualizacion: new Date().toISOString(),
            historial: []
        },
        {
            id: 3,
            placa: "GHI-789",
            codigo: "V003",
            chofer: { id: 3, nombre: "Carlos Ruiz" },
            ruta: { id: 3, nombre: "Ruta Sur", color: "#e74c3c" },
            estado: "moving",
            velocidad: "60 km/h",
            ubicacion: { lat: -12.036374, lng: -77.052793 },
            direccion: "Calle Comercio 123",
            ultimaActualizacion: new Date().toISOString(),
            historial: []
        },
        {
            id: 4,
            placa: "JKL-012",
            codigo: "V004",
            chofer: { id: 4, nombre: "Ana García" },
            ruta: null,
            estado: "offline",
            velocidad: "--",
            ubicacion: null,
            direccion: "Sin señal",
            ultimaActualizacion: new Date(Date.now() - 900000).toISOString(),
            historial: []
        },
        {
            id: 5,
            placa: "MNO-345",
            codigo: "V005",
            chofer: { id: 5, nombre: "Roberto Sánchez" },
            ruta: { id: 4, nombre: "Ruta Este", color: "#f39c12" },
            estado: "moving",
            velocidad: "30 km/h",
            ubicacion: { lat: -12.026374, lng: -77.022793 },
            direccion: "Av. Libertad 456",
            ultimaActualizacion: new Date().toISOString(),
            historial: []
        }
    ];
    
    // Cargar rutas desde localStorage (sin rutas por defecto)
    rutasDB = JSON.parse(localStorage.getItem('rutasDB')) || [];
    
    // Actualizar contadores
    actualizarContadoresVehiculos();
}

// Inicializar Google Maps
function inicializarGoogleMap() {
    // Crear mapa
    mapa = new google.maps.Map(document.getElementById('map'), {
        center: CONFIG.centroMapa,
        zoom: CONFIG.zoomInicial,
        mapTypeId: 'roadmap',
        styles: CONFIG.estilosMapa,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false
    });
    
    // Inicializar servicio de direcciones
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: mapa,
        suppressMarkers: true,
        preserveViewport: true
    });
    
    // Crear capa de tráfico
    trafficLayer = new google.maps.TrafficLayer();
    if (filtrosActivos.mostrarTrafico) {
        trafficLayer.setMap(mapa);
    }
    
    // Escuchar cambios en el mapa
    mapa.addListener('center_changed', actualizarCoordenadas);
    mapa.addListener('zoom_changed', actualizarZoom);
    mapa.addListener('bounds_changed', actualizarCoordenadas);
    
    // Inicializar coordenadas y zoom
    actualizarCoordenadas();
    actualizarZoom();
}

// Actualizar coordenadas en el footer
function actualizarCoordenadas() {
    const center = mapa.getCenter();
    if (center) {
        document.getElementById('currentLat').textContent = center.lat().toFixed(4);
        document.getElementById('currentLng').textContent = center.lng().toFixed(4);
    }
}

// Actualizar nivel de zoom en el footer
function actualizarZoom() {
    document.getElementById('zoomLevel').textContent = mapa.getZoom();
}

// Crear marcador personalizado para vehículos
function crearMarcadorVehiculo(vehiculo) {
    const div = document.createElement('div');
    
    let claseEstado = '';
    let icono = '';
    
    switch(vehiculo.estado) {
        case 'moving':
            claseEstado = 'moving';
            icono = 'fa-play';
            break;
        case 'stopped':
            claseEstado = 'stopped';
            icono = 'fa-pause';
            break;
        case 'offline':
            claseEstado = 'offline';
            icono = 'fa-exclamation-triangle';
            break;
    }
    
    div.className = `vehicle-marker ${claseEstado}`;
    div.innerHTML = `<i class="fas ${icono}"></i>`;
    div.title = `${vehiculo.placa} - ${vehiculo.chofer.nombre}`;
    
    return {
        position: new google.maps.LatLng(vehiculo.ubicacion.lat, vehiculo.ubicacion.lng),
        map: mapa,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                    <circle cx="20" cy="20" r="18" fill="white" stroke="${claseEstado === 'moving' ? '#27ae60' : claseEstado === 'stopped' ? '#f39c12' : '#e74c3c'}" stroke-width="3"/>
                    <text x="20" y="25" text-anchor="middle" font-family="Arial" font-size="14" fill="${claseEstado === 'moving' ? '#27ae60' : claseEstado === 'stopped' ? '#f39c12' : '#e74c3c'}">${vehiculo.placa.substring(0, 3)}</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        },
        title: `${vehiculo.placa} - ${vehiculo.chofer.nombre}`
    };
}

// Crear contenido del info window
function crearInfoWindowVehiculo(vehiculo) {
    const estadoTexto = {
        'moving': 'En movimiento',
        'stopped': 'Detenido',
        'offline': 'Sin señal'
    }[vehiculo.estado] || vehiculo.estado;
    
    const estadoClase = {
        'moving': 'status-moving',
        'stopped': 'status-stopped',
        'offline': 'status-offline'
    }[vehiculo.estado] || '';
    
    return `
        <div class="info-window">
            <h3>${vehiculo.placa}</h3>
            <div class="info-row">
                <div class="info-label">Chofer:</div>
                <div class="info-value">${vehiculo.chofer.nombre}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Ruta:</div>
                <div class="info-value">${vehiculo.ruta ? vehiculo.ruta.nombre : 'Sin ruta'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Estado:</div>
                <div class="info-value">
                    <span class="status-badge-map ${estadoClase}">${estadoTexto}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Velocidad:</div>
                <div class="info-value">${vehiculo.velocidad}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dirección:</div>
                <div class="info-value">${vehiculo.direccion}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Última actualización:</div>
                <div class="info-value">${formatTiempoRelativo(vehiculo.ultimaActualizacion)}</div>
            </div>
            <div class="info-actions">
                <button onclick="centrarEnVehiculo(${vehiculo.id})" class="btn-info-window">
                    <i class="fas fa-crosshairs"></i> Centrar en Mapa
                </button>
            </div>
        </div>
    `;
}

// Cargar vehículos en el mapa
function cargarVehiculos() {
    // Limpiar marcadores anteriores
    Object.values(marcadoresVehiculos).forEach(marker => {
        if (marker) marker.setMap(null);
    });
    marcadoresVehiculos = {};
    
    // Filtrar vehículos según estado
    const vehiculosFiltrados = vehiculosDB.filter(v => 
        filtrosActivos.estado.includes(v.estado) && v.ubicacion
    );
    
    // Agregar cada vehículo al mapa
    vehiculosFiltrados.forEach(vehiculo => {
        if (!vehiculo.ubicacion || !vehiculo.ubicacion.lat || !vehiculo.ubicacion.lng) {
            return;
        }
        
        // Crear marcador
        const markerOptions = crearMarcadorVehiculo(vehiculo);
        const marker = new google.maps.Marker(markerOptions);
        
        // Crear info window
        const infoWindow = new google.maps.InfoWindow({
            content: crearInfoWindowVehiculo(vehiculo)
        });
        
        // Evento al hacer clic
        marker.addListener('click', () => {
            infoWindow.open(mapa, marker);
            mostrarDetallesVehiculo(vehiculo.id);
        });
        
        // Guardar referencia
        marcadoresVehiculos[vehiculo.id] = { marker, infoWindow };
    });
    
    // Actualizar lista de vehículos en el sidebar
    actualizarListaVehiculos();
}

// Cargar rutas en el mapa
function cargarRutas() {
    // Limpiar rutas anteriores
    Object.values(rutasPolylines).forEach(polyline => {
        if (polyline) polyline.setMap(null);
    });
    rutasPolylines = {};
    
    Object.values(paraderosMarkers).forEach(marker => {
        if (marker) marker.setMap(null);
    });
    paraderosMarkers = {};
    
    if (!filtrosActivos.mostrarRutas && !filtrosActivos.mostrarParaderos) {
        return;
    }
    
    // Agregar cada ruta al mapa
    rutasDB.forEach(ruta => {
        // Filtrar paraderos con coordenadas
        const paraderosConCoords = ruta.paraderos.filter(p => p.lat && p.lng);
        
        if (paraderosConCoords.length > 1 && filtrosActivos.mostrarRutas) {
            // Crear polilínea para la ruta
            const path = paraderosConCoords.map(p => ({
                lat: p.lat,
                lng: p.lng
            }));
            
            const polyline = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: ruta.color,
                strokeOpacity: 0.6,
                strokeWeight: 4,
                map: mapa
            });
            
            // Guardar referencia
            rutasPolylines[ruta.id] = polyline;
        }
        
        // Agregar marcadores para paraderos
        if (filtrosActivos.mostrarParaderos) {
            paraderosConCoords.forEach((paradero, index) => {
                const marker = new google.maps.Marker({
                    position: { lat: paradero.lat, lng: paradero.lng },
                    map: mapa,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: ruta.color,
                        fillOpacity: 0.7,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 2
                    },
                    title: `${paradero.nombre} - ${ruta.nombre}`
                });
                
                // Tooltip personalizado
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div style="padding: 10px;"><strong>${paradero.nombre}</strong><br>${ruta.nombre} - Paradero ${index + 1}</div>`
                });
                
                marker.addListener('click', () => {
                    infoWindow.open(mapa, marker);
                });
                
                // Guardar referencia
                paraderosMarkers[`${ruta.id}-${index}`] = { marker, infoWindow };
            });
        }
    });
}

// Actualizar lista de vehículos en el sidebar
function actualizarListaVehiculos() {
    const container = document.getElementById('vehicleList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const vehiculosFiltrados = vehiculosDB.filter(v => 
        filtrosActivos.estado.includes(v.estado)
    );
    
    if (vehiculosFiltrados.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #95a5a6;">
                <i class="fas fa-bus fa-2x" style="margin-bottom: 15px;"></i>
                <p>No hay vehículos que coincidan con los filtros</p>
            </div>
        `;
        return;
    }
    
    vehiculosFiltrados.forEach(vehiculo => {
        const item = document.createElement('div');
        item.className = 'vehicle-list-item';
        item.setAttribute('data-id', vehiculo.id);
        
        let estadoClase = '';
        let estadoTexto = '';
        let iconoClase = '';
        
        switch(vehiculo.estado) {
            case 'moving':
                estadoClase = 'status-moving';
                estadoTexto = 'En movimiento';
                iconoClase = 'moving';
                break;
            case 'stopped':
                estadoClase = 'status-stopped';
                estadoTexto = 'Detenido';
                iconoClase = 'stopped';
                break;
            case 'offline':
                estadoClase = 'status-offline';
                estadoTexto = 'Sin señal';
                iconoClase = 'offline';
                break;
        }
        
        item.innerHTML = `
            <div class="vehicle-icon ${iconoClase}">
                <i class="fas fa-bus"></i>
            </div>
            <div class="vehicle-info">
                <div class="vehicle-placa">${vehiculo.placa}</div>
                <div class="vehicle-details-small">
                    <span>${vehiculo.chofer.nombre}</span>
                    <span>${vehiculo.ruta ? vehiculo.ruta.nombre : 'Sin ruta'}</span>
                    <span class="vehicle-status ${estadoClase}">${estadoTexto} • ${vehiculo.velocidad}</span>
                </div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            mostrarDetallesVehiculo(vehiculo.id);
            // Centrar en el vehículo
            if (vehiculo.ubicacion) {
                centrarEnVehiculo(vehiculo.id);
            }
        });
        
        container.appendChild(item);
    });
}

// Actualizar contadores de vehículos
function actualizarContadoresVehiculos() {
    const total = vehiculosDB.length;
    const moving = vehiculosDB.filter(v => v.estado === 'moving').length;
    const stopped = vehiculosDB.filter(v => v.estado === 'stopped').length;
    const offline = vehiculosDB.filter(v => v.estado === 'offline').length;
    
    document.getElementById('totalVehicles').textContent = total;
    document.getElementById('movingVehicles').textContent = moving;
    document.getElementById('countMoving').textContent = moving;
    document.getElementById('countStopped').textContent = stopped;
    document.getElementById('countOffline').textContent = offline;
}

// Actualizar tiempo de última actualización
function actualizarTiempoActualizacion() {
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const segundos = ahora.getSeconds().toString().padStart(2, '0');
    
    document.getElementById('lastUpdateTime').textContent = `${hora}:${minutos}:${segundos}`;
}

// Formatear tiempo relativo
function formatTiempoRelativo(timestamp) {
    const ahora = new Date();
    const fecha = new Date(timestamp);
    const diferencia = ahora - fecha;
    const segundos = Math.floor(diferencia / 1000);
    
    if (segundos < 60) {
        return `Hace ${segundos} segundos`;
    } else if (segundos < 3600) {
        const minutos = Math.floor(segundos / 60);
        return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    } else if (segundos < 86400) {
        const horas = Math.floor(segundos / 3600);
        return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
    } else {
        return fecha.toLocaleDateString('es-ES');
    }
}

// Simular actualización de ubicaciones
function simularActualizacionUbicaciones() {
    vehiculosDB.forEach(vehiculo => {
        if (vehiculo.estado !== 'offline' && vehiculo.ubicacion) {
            // Agregar al historial
            vehiculo.historial.unshift({
                timestamp: new Date().toISOString(),
                ubicacion: { ...vehiculo.ubicacion },
                velocidad: vehiculo.velocidad
            });
            
            // Limitar historial a 10 entradas
            if (vehiculo.historial.length > 10) {
                vehiculo.historial = vehiculo.historial.slice(0, 10);
            }
            
            // Simular movimiento
            if (vehiculo.estado === 'moving') {
                const cambioLat = (Math.random() - 0.5) * 0.001;
                const cambioLng = (Math.random() - 0.5) * 0.001;
                
                vehiculo.ubicacion.lat += cambioLat;
                vehiculo.ubicacion.lng += cambioLng;
                
                // Actualizar velocidad aleatoria
                vehiculo.velocidad = `${Math.floor(Math.random() * 40) + 20} km/h`;
                
                // Actualizar dirección aproximada
                const direcciones = [
                    "Av. Principal km 5",
                    "Calle Comercio 123",
                    "Av. Libertad 456",
                    "Estación Central",
                    "Plaza Mayor",
                    "Mercado Central"
                ];
                vehiculo.direccion = direcciones[Math.floor(Math.random() * direcciones.length)];
            }
            
            // Actualizar timestamp
            vehiculo.ultimaActualizacion = new Date().toISOString();
            
            // Actualizar marcador en el mapa
            if (marcadoresVehiculos[vehiculo.id]) {
                const newPosition = new google.maps.LatLng(
                    vehiculo.ubicacion.lat,
                    vehiculo.ubicacion.lng
                );
                marcadoresVehiculos[vehiculo.id].marker.setPosition(newPosition);
                
                // Actualizar info window
                const newContent = crearInfoWindowVehiculo(vehiculo);
                marcadoresVehiculos[vehiculo.id].infoWindow.setContent(newContent);
            }
        }
    });
    
    // Actualizar contadores
    actualizarContadoresVehiculos();
    actualizarTiempoActualizacion();
}

// Iniciar actualización automática
function iniciarActualizacionAutomatica() {
    // Actualizar inmediatamente
    simularActualizacionUbicaciones();
    actualizarTiempoActualizacion();
    
    // Configurar intervalo
    actualizacionInterval = setInterval(() => {
        simularActualizacionUbicaciones();
        
        // Actualizar contador
        contadorActualizacion = 3;
        document.getElementById('countdown').textContent = contadorActualizacion;
    }, CONFIG.intervaloActualizacion);
    
    // Contador regresivo
    setInterval(() => {
        contadorActualizacion--;
        if (contadorActualizacion < 0) {
            contadorActualizacion = 3;
        }
        document.getElementById('countdown').textContent = contadorActualizacion;
    }, 1000);
    
    console.log("🔄 Actualización automática iniciada");
}

// Configurar eventos
function configurarEventos() {
    // Botón de logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Botón de centrar mapa
    document.getElementById('centerMapBtn').addEventListener('click', () => {
        mapa.setCenter(CONFIG.centroMapa);
        mapa.setZoom(CONFIG.zoomInicial);
        mostrarMensaje('📍 Mapa centrado', 'info');
    });
    
    // Botón de tráfico
    document.getElementById('toggleTrafficBtn').addEventListener('click', () => {
        if (trafficLayer.getMap()) {
            trafficLayer.setMap(null);
            mostrarMensaje('🚦 Tráfico ocultado', 'info');
        } else {
            trafficLayer.setMap(mapa);
            mostrarMensaje('🚦 Tráfico mostrado', 'info');
        }
    });
    
    // Botón de vista satélite
    document.getElementById('toggleSatelliteBtn').addEventListener('click', () => {
        const mapType = mapa.getMapTypeId();
        if (mapType === 'roadmap') {
            mapa.setMapTypeId('hybrid');
            mostrarMensaje('🛰️ Vista satélite activada', 'info');
        } else {
            mapa.setMapTypeId('roadmap');
            mostrarMensaje('🗺️ Vista mapa activada', 'info');
        }
    });
    
    // Botón de pantalla completa
    document.getElementById('fullscreenBtn').addEventListener('click', togglePantallaCompleta);
    
    // Botón de actualizar mapa
    document.getElementById('refreshMapBtn').addEventListener('click', () => {
        simularActualizacionUbicaciones();
        mostrarMensaje('🔄 Datos actualizados manualmente', 'success');
    });
    
    // Controles de zoom
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        mapa.setZoom(mapa.getZoom() + 1);
    });
    
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        mapa.setZoom(mapa.getZoom() - 1);
    });
    
    // Filtros
    configurarEventosFiltros();
    
    // Modales
    configurarEventosModales();
}

// Configurar eventos de filtros
function configurarEventosFiltros() {
    // Filtros de estado
    document.getElementById('filterMoving').addEventListener('change', actualizarFiltros);
    document.getElementById('filterStopped').addEventListener('change', actualizarFiltros);
    document.getElementById('filterOffline').addEventListener('change', actualizarFiltros);
    
    // Filtros de capas
    document.getElementById('showRoutes').addEventListener('change', actualizarFiltros);
    document.getElementById('showStops').addEventListener('change', actualizarFiltros);
    document.getElementById('showTraffic').addEventListener('change', actualizarFiltros);
    
    // Botón aplicar filtros
    document.getElementById('applyFiltersBtn').addEventListener('click', aplicarFiltros);
    
    // Botón restablecer filtros
    document.getElementById('resetFiltersBtn').addEventListener('click', restablecerFiltros);
    
    // Cargar lista de rutas para filtros
    cargarRutasFiltros();
}

// Cargar lista de rutas para filtros
function cargarRutasFiltros() {
    const container = document.getElementById('routesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    rutasDB.forEach(ruta => {
        const item = document.createElement('label');
        item.className = 'filter-checkbox';
        
        item.innerHTML = `
            <input type="checkbox" class="route-filter" data-route-id="${ruta.id}" checked>
            <span class="checkmark"></span>
            <span class="route-color-dot" style="background: ${ruta.color};"></span>
            <span>${ruta.nombre}</span>
            <span class="filter-count">${ruta.paraderos.length}</span>
        `;
        
        container.appendChild(item);
    });
    
    // Agregar event listeners a los checkboxes de rutas
    document.querySelectorAll('.route-filter').forEach(checkbox => {
        checkbox.addEventListener('change', actualizarFiltros);
    });
}

// Actualizar filtros desde los checkboxes
function actualizarFiltros() {
    // Estado de vehículos
    const estados = [];
    if (document.getElementById('filterMoving').checked) estados.push('moving');
    if (document.getElementById('filterStopped').checked) estados.push('stopped');
    if (document.getElementById('filterOffline').checked) estados.push('offline');
    
    // Rutas seleccionadas
    const rutasSeleccionadas = Array.from(document.querySelectorAll('.route-filter:checked'))
        .map(cb => parseInt(cb.getAttribute('data-route-id')));
    
    // Capas visibles
    const mostrarRutas = document.getElementById('showRoutes').checked;
    const mostrarParaderos = document.getElementById('showStops').checked;
    const mostrarTrafico = document.getElementById('showTraffic').checked;
    
    // Actualizar filtros activos
    filtrosActivos.estado = estados;
    filtrosActivos.rutas = rutasSeleccionadas.length > 0 ? rutasSeleccionadas : 'all';
    filtrosActivos.mostrarRutas = mostrarRutas;
    filtrosActivos.mostrarParaderos = mostrarParaderos;
    filtrosActivos.mostrarTrafico = mostrarTrafico;
}

// Aplicar filtros
function aplicarFiltros() {
    // Recargar vehículos con los filtros actuales
    cargarVehiculos();
    
    // Recargar rutas con los filtros actuales
    cargarRutas();
    
    // Actualizar capa de tráfico
    if (filtrosActivos.mostrarTrafico) {
        trafficLayer.setMap(mapa);
    } else {
        trafficLayer.setMap(null);
    }
    
    mostrarMensaje('✅ Filtros aplicados', 'success');
}

// Restablecer filtros
function restablecerFiltros() {
    // Restablecer checkboxes
    document.getElementById('filterMoving').checked = true;
    document.getElementById('filterStopped').checked = true;
    document.getElementById('filterOffline').checked = true;
    document.getElementById('showRoutes').checked = true;
    document.getElementById('showStops').checked = true;
    document.getElementById('showTraffic').checked = true;
    document.getElementById('filterAllRoutes').checked = true;
    
    // Desmarcar rutas específicas
    document.querySelectorAll('.route-filter').forEach(cb => {
        cb.checked = false;
    });
    
    // Actualizar y aplicar filtros
    actualizarFiltros();
    aplicarFiltros();
    
    mostrarMensaje('🔄 Filtros restablecidos', 'info');
}

// Configurar eventos de modales
function configurarEventosModales() {
    // Cerrar modales
    document.querySelectorAll('.close-modal, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            cerrarTodosModales();
        });
    });
    
    // Botón de centrar en vehículo desde modal
    document.getElementById('trackVehicleBtn').addEventListener('click', function() {
        const vehicleId = parseInt(this.getAttribute('data-vehicle-id'));
        if (vehicleId) {
            centrarEnVehiculo(vehicleId);
            cerrarModal('vehicleDetailsModal');
        }
    });
    
    // Opciones de vista del mapa
    document.querySelectorAll('.view-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos
            document.querySelectorAll('.view-option-btn').forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            // Cambiar vista del mapa
            cambiarVistaMapa(this.getAttribute('data-view'));
            cerrarModal('viewModal');
        });
    });
}

// Mostrar detalles del vehículo (igual que antes)
function mostrarDetallesVehiculo(id) {
    const vehiculo = vehiculosDB.find(v => v.id === id);
    if (!vehiculo) return;
    
    // Determinar texto y clase de estado
    let estadoTexto = '';
    let estadoClase = '';
    let iconoClase = '';
    
    switch(vehiculo.estado) {
        case 'moving':
            estadoTexto = 'En movimiento';
            estadoClase = 'status-moving';
            iconoClase = 'moving';
            break;
        case 'stopped':
            estadoTexto = 'Detenido';
            estadoClase = 'status-stopped';
            iconoClase = 'stopped';
            break;
        case 'offline':
            estadoTexto = 'Sin señal';
            estadoClase = 'status-offline';
            iconoClase = 'offline';
            break;
    }
    
    // Formatear historial
    let historialHTML = '';
    if (vehiculo.historial.length > 0) {
        historialHTML = vehiculo.historial.map((item, index) => `
            <div class="history-item">
                <div class="history-time">${formatTiempoRelativo(item.timestamp)}</div>
                <div class="history-location">
                    ${item.ubicacion.lat.toFixed(4)}, ${item.ubicacion.lng.toFixed(4)}
                </div>
                <div class="history-speed">${item.velocidad}</div>
            </div>
        `).join('');
    } else {
        historialHTML = '<p style="text-align: center; color: #95a5a6; padding: 20px;">No hay historial disponible</p>';
    }
    
    // Crear contenido del modal
    const contenido = `
        <div class="vehicle-header">
            <div class="vehicle-header-icon ${iconoClase}">
                <i class="fas fa-bus"></i>
            </div>
            <div class="vehicle-header-info">
                <h2>${vehiculo.placa}</h2>
                <span class="status-badge ${estadoClase}">${estadoTexto}</span>
            </div>
        </div>
        
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Código</span>
                <span class="detail-value">${vehiculo.codigo}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Chofer</span>
                <span class="detail-value">${vehiculo.chofer.nombre}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ruta</span>
                <span class="detail-value">${vehiculo.ruta ? vehiculo.ruta.nombre : 'Sin ruta'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Velocidad</span>
                <span class="detail-value">${vehiculo.velocidad}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Última actualización</span>
                <span class="detail-value">${formatTiempoRelativo(vehiculo.ultimaActualizacion)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Estado GPS</span>
                <span class="detail-value ${estadoClase}">${estadoTexto}</span>
            </div>
        </div>
        
        <div class="location-history">
            <h4><i class="fas fa-history"></i> Historial de Ubicaciones</h4>
            <div class="history-list">
                ${historialHTML}
            </div>
        </div>
    `;
    
    document.getElementById('vehicleDetailsContent').innerHTML = contenido;
    document.getElementById('trackVehicleBtn').setAttribute('data-vehicle-id', id);
    
    abrirModal('vehicleDetailsModal');
}

// Centrar en vehículo específico
function centrarEnVehiculo(id) {
    const vehiculo = vehiculosDB.find(v => v.id === id);
    if (!vehiculo || !vehiculo.ubicacion) {
        mostrarMensaje('⚠️ Vehículo no tiene ubicación disponible', 'warning');
        return;
    }
    
    const position = new google.maps.LatLng(vehiculo.ubicacion.lat, vehiculo.ubicacion.lng);
    mapa.setCenter(position);
    mapa.setZoom(15);
    
    // Abrir info window del marcador
    if (marcadoresVehiculos[id]) {
        marcadoresVehiculos[id].infoWindow.open(mapa, marcadoresVehiculos[id].marker);
    }
    
    mostrarMensaje(`📍 Centrado en ${vehiculo.placa}`, 'success');
}

// Cambiar vista del mapa
function cambiarVistaMapa(vista) {
    mapa.setMapTypeId(vista);
    mostrarMensaje(`🗺️ Vista cambiada a ${vista}`, 'info');
}

// Toggle pantalla completa
function togglePantallaCompleta() {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        mostrarMensaje('🖥️ Pantalla completa activada', 'info');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        mostrarMensaje('🖥️ Pantalla completa desactivada', 'info');
    }
}

// Funciones auxiliares para modales
function abrirModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function cerrarTodosModales() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
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
    // Detener actualización automática
    if (actualizacionInterval) {
        clearInterval(actualizacionInterval);
    }
    
    // Limpiar localStorage
    localStorage.removeItem('empresa_logueada');
    localStorage.removeItem('empresa_token');
    localStorage.removeItem('empresa_nombre');
    localStorage.removeItem('empresa_email');
    
    window.location.href = 'index.html';
}