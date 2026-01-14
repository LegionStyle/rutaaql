// ============================================
// MÓDULO SIMPLIFICADO DEL MAPA CON GOOGLE MAPS
// ============================================

// Variables globales
let mapa = null;
let marcadoresVehiculos = {};
let rutasPolylines = {};
let paraderosMarkers = {};

// Configuración inicial
const CONFIG = {
    centroMapa: { lat: -16.409047, lng: -71.537451 }, // Arequipa, Perú
    zoomInicial: 12
};

// Función principal de inicialización
function inicializarMapa() {
    console.log('🚀 Inicializando Google Maps...');
    
    // Verificar que Google Maps esté cargado
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error('❌ Google Maps no está cargado');
        return;
    }
    
    try {
        // 1. Crear el mapa
        crearMapa();
        
        // 2. Cargar datos de ejemplo (vehículos) y rutas guardadas
        cargarDatosEjemplo();
        poblarFiltroRutas();
        cargarRutasEnMapa();
        
        // 3. Configurar eventos
        configurarEventosBasicos();
        
        // 4. Actualizar UI
        actualizarUI();
        
        console.log('✅ Google Maps inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar mapa:', error);
    }
}

// Crear el mapa de Google
function crearMapa() {
    console.log('🗺️ Creando mapa...');
    
    mapa = new google.maps.Map(document.getElementById('map'), {
        center: CONFIG.centroMapa,
        zoom: CONFIG.zoomInicial,
        mapTypeId: 'roadmap',
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false
    });
    
    // Agregar capa de tráfico
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(mapa);
    
    console.log('✅ Mapa creado');
}

// Cargar datos de ejemplo
function cargarDatosEjemplo() {
    console.log('📊 Cargando datos de ejemplo...');
    
    // Datos de vehículos de ejemplo
    const vehiculos = [
        {
            id: 1,
            placa: "ABC-123",
            chofer: "Juan Pérez",
            estado: "moving",
            velocidad: "45 km/h",
            ubicacion: { lat: -16.409047, lng: -71.537451 },
            color: "#27ae60"
        },
        {
            id: 2,
            placa: "DEF-456",
            chofer: "María López",
            estado: "stopped",
            velocidad: "0 km/h",
            ubicacion: { lat: -16.399047, lng: -71.527451 },
            color: "#f39c12"
        },
        {
            id: 3,
            placa: "GHI-789",
            chofer: "Carlos Ruiz",
            estado: "moving",
            velocidad: "60 km/h",
            ubicacion: { lat: -16.419047, lng: -71.547451 },
            color: "#27ae60"
        }
    ];
    
    // Crear marcadores para cada vehículo
    vehiculos.forEach(vehiculo => {
        crearMarcadorVehiculo(vehiculo);
    });
    
    // Actualizar contadores
    document.getElementById('totalVehicles').textContent = vehiculos.length;
    document.getElementById('movingVehicles').textContent = vehiculos.filter(v => v.estado === 'moving').length;
    document.getElementById('countMoving').textContent = vehiculos.filter(v => v.estado === 'moving').length;
    document.getElementById('countStopped').textContent = vehiculos.filter(v => v.estado === 'stopped').length;
    
    console.log('✅ Datos cargados');
}

// Rutas guardadas
function obtenerRutasGuardadas() {
    const data = JSON.parse(localStorage.getItem('rutasDB')) || [];
    return Array.isArray(data) ? data : [];
}

function poblarFiltroRutas() {
    const select = document.getElementById('routeFilterSelect');
    if (!select) return;
    
    const rutas = obtenerRutasGuardadas();
    select.innerHTML = '<option value="all">Todas</option>';
    
    rutas.forEach(ruta => {
        const opt = document.createElement('option');
        opt.value = ruta.id;
        opt.textContent = ruta.nombre || `Ruta ${ruta.id}`;
        select.appendChild(opt);
    });
}

function limpiarRutasMapa() {
    Object.values(rutasPolylines).forEach(poly => poly && poly.setMap(null));
    rutasPolylines = {};
    Object.values(paraderosMarkers).forEach(marker => marker && marker.setMap && marker.setMap(null));
    paraderosMarkers = {};
}

function cargarRutasEnMapa(rutaId = 'all') {
    limpiarRutasMapa();
    
    const rutas = obtenerRutasGuardadas();
    const rutaIdNum = rutaId === 'all' ? 'all' : parseInt(rutaId);
    const filtradas = rutaIdNum === 'all' ? rutas : rutas.filter(r => r.id === rutaIdNum);
    
    const bounds = new google.maps.LatLngBounds();
    let hayRutas = false;
    
    filtradas.forEach(ruta => {
        const paraderosConCoords = (ruta.paraderos || []).filter(p => p.lat && p.lng);
        
        if (paraderosConCoords.length > 1) {
            const path = paraderosConCoords.map(p => ({ lat: p.lat, lng: p.lng }));
            const polyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: ruta.color || '#3498db',
                strokeOpacity: 0.8,
                strokeWeight: 5,
                map: mapa
            });
            rutasPolylines[ruta.id] = polyline;
            path.forEach(pt => bounds.extend(pt));
            hayRutas = true;
        }
        
        paraderosConCoords.forEach((paradero, index) => {
            const marker = new google.maps.Marker({
                position: { lat: paradero.lat, lng: paradero.lng },
                map: mapa,
                title: `${paradero.nombre || 'Paradero'} • ${ruta.nombre || ''}`,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: ruta.color || '#3498db',
                    fillOpacity: 0.8,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2
                }
            });
            paraderosMarkers[`${ruta.id}-${index}`] = marker;
        });
    });
    
    if (hayRutas) {
        mapa.fitBounds(bounds);
    } else {
        mapa.setCenter(CONFIG.centroMapa);
        mapa.setZoom(CONFIG.zoomInicial);
    }
}

// Crear marcador para un vehículo
function crearMarcadorVehiculo(vehiculo) {
    console.log(`📍 Creando marcador para ${vehiculo.placa}`);
    
    // Determinar color según estado
    let color = vehiculo.color;
    let icono = '';
    
    switch(vehiculo.estado) {
        case 'moving':
            icono = '🚌';
            break;
        case 'stopped':
            icono = '⏸️';
            break;
        case 'offline':
            icono = '❌';
            color = '#e74c3c';
            break;
    }
    
    // Crear marcador
    const marker = new google.maps.Marker({
        position: vehiculo.ubicacion,
        map: mapa,
        title: `${vehiculo.placa} - ${vehiculo.chofer}`,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        },
        label: {
            text: icono,
            color: '#FFFFFF',
            fontSize: '12px'
        }
    });
    
    // Crear info window
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin-top: 0; color: #2c3e50;">${vehiculo.placa}</h3>
                <p><strong>Chofer:</strong> ${vehiculo.chofer}</p>
                <p><strong>Estado:</strong> ${vehiculo.estado === 'moving' ? 'En movimiento' : 'Detenido'}</p>
                <p><strong>Velocidad:</strong> ${vehiculo.velocidad}</p>
                <p><strong>Ubicación:</strong> ${vehiculo.ubicacion.lat.toFixed(4)}, ${vehiculo.ubicacion.lng.toFixed(4)}</p>
            </div>
        `
    });
    
    // Evento al hacer clic
    marker.addListener('click', () => {
        infoWindow.open(mapa, marker);
    });
    
    // Guardar referencia
    marcadoresVehiculos[vehiculo.id] = { marker, infoWindow };
    
    return marker;
}

// Configurar eventos básicos
function configurarEventosBasicos() {
    console.log('⚙️ Configurando eventos...');
    
    // Botón de centrar mapa
    document.getElementById('centerMapBtn').addEventListener('click', () => {
        mapa.setCenter(CONFIG.centroMapa);
        mapa.setZoom(CONFIG.zoomInicial);
        mostrarMensaje('📍 Mapa centrado', 'info');
    });
    
    // Botón de tráfico
    document.getElementById('toggleTrafficBtn').addEventListener('click', () => {
        const layers = mapa.getTrafficLayer();
        if (layers) {
            layers.setMap(layers.getMap() ? null : mapa);
            mostrarMensaje(layers.getMap() ? '🚦 Tráfico mostrado' : '🚦 Tráfico ocultado', 'info');
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
    
    // Botón de actualizar
    document.getElementById('refreshMapBtn').addEventListener('click', () => {
        simularMovimiento();
        poblarFiltroRutas();
        cargarRutasEnMapa(document.getElementById('routeFilterSelect') ? document.getElementById('routeFilterSelect').value : 'all');
        mostrarMensaje('🔄 Datos actualizados', 'success');
    });
    
    // Botón de logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Zoom controls
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        mapa.setZoom(mapa.getZoom() + 1);
    });
    
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        mapa.setZoom(mapa.getZoom() - 1);
    });

    // Filtro de rutas
    const routeFilterSelect = document.getElementById('routeFilterSelect');
    if (routeFilterSelect) {
        routeFilterSelect.addEventListener('change', () => {
            const val = routeFilterSelect.value;
            const rutaId = val === 'all' ? 'all' : parseInt(val);
            cargarRutasEnMapa(rutaId);
        });
    }
    
    console.log('✅ Eventos configurados');
}

// Simular movimiento de vehículos
function simularMovimiento() {
    Object.values(marcadoresVehiculos).forEach((item, index) => {
        if (item && item.marker) {
            const pos = item.marker.getPosition();
            if (pos) {
                // Mover ligeramente el marcador
                const newLat = pos.lat() + (Math.random() - 0.5) * 0.001;
                const newLng = pos.lng() + (Math.random() - 0.5) * 0.001;
                
                const newPosition = new google.maps.LatLng(newLat, newLng);
                item.marker.setPosition(newPosition);
            }
        }
    });
    
    // Actualizar tiempo
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const segundos = ahora.getSeconds().toString().padStart(2, '0');
    
    document.getElementById('lastUpdateTime').textContent = `${hora}:${minutos}:${segundos}`;
}

// Actualizar información en la UI
function actualizarUI() {
    // Actualizar coordenadas al mover el mapa
    mapa.addListener('center_changed', () => {
        const center = mapa.getCenter();
        if (center) {
            document.getElementById('currentLat').textContent = center.lat().toFixed(4);
            document.getElementById('currentLng').textContent = center.lng().toFixed(4);
        }
    });
    
    // Actualizar zoom
    mapa.addListener('zoom_changed', () => {
        document.getElementById('zoomLevel').textContent = mapa.getZoom();
    });
    
    // Inicializar valores
    const center = mapa.getCenter();
    if (center) {
        document.getElementById('currentLat').textContent = center.lat().toFixed(4);
        document.getElementById('currentLng').textContent = center.lng().toFixed(4);
    }
    document.getElementById('zoomLevel').textContent = mapa.getZoom();
    
    // Actualizar tiempo
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const segundos = ahora.getSeconds().toString().padStart(2, '0');
    
    document.getElementById('lastUpdateTime').textContent = `${hora}:${minutos}:${segundos}`;
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

// Asegurarse de que la función esté disponible globalmente
window.inicializarMapa = inicializarMapa;

console.log('✅ mapa-google.js cargado correctamente');