// ============================================
// MÓDULO DE GESTIÓN DE RUTAS
// ============================================

// Base de datos de ejemplo
let rutasDB = JSON.parse(localStorage.getItem('rutasDB')) || [
    {
        id: 1,
        nombre: "Ruta Centro",
        codigo: "RT-001",
        color: "#3498db",
        estado: "active",
        duracion: 45,
        distancia: 12.5,
        descripcion: "Ruta principal que atraviesa el centro de la ciudad",
        paraderos: [
            { id: 1, nombre: "Estación Central", direccion: "Av. Principal 123", tiempoEspera: 5, lat: -12.046374, lng: -77.042793 },
            { id: 2, nombre: "Plaza Mayor", direccion: "Jr. Lima 456", tiempoEspera: 3, lat: -12.056374, lng: -77.032793 },
            { id: 3, nombre: "Mercado Central", direccion: "Calle Comercio 789", tiempoEspera: 2, lat: -12.036374, lng: -77.052793 }
        ],
        vehiculosAsignados: 3,
        createdAt: "2024-01-01",
        frecuencia: "15 min"
    },
    {
        id: 2,
        nombre: "Ruta Norte",
        codigo: "RT-002",
        color: "#27ae60",
        estado: "active",
        duracion: 60,
        distancia: 18.2,
        descripcion: "Ruta que conecta el norte de la ciudad con el centro",
        paraderos: [
            { id: 4, nombre: "Terminal Norte", direccion: "Av. Norte 100", tiempoEspera: 10 },
            { id: 5, nombre: "Universidad", direccion: "Campus Universitario", tiempoEspera: 5 },
            { id: 6, nombre: "Hospital Regional", direccion: "Av. Salud 500", tiempoEspera: 3 }
        ],
        vehiculosAsignados: 2,
        createdAt: "2024-01-05",
        frecuencia: "20 min"
    },
    {
        id: 3,
        nombre: "Ruta Sur",
        codigo: "RT-003",
        color: "#e74c3c",
        estado: "maintenance",
        duracion: 55,
        distancia: 15.8,
        descripcion: "Ruta hacia los distritos del sur",
        paraderos: [
            { id: 7, nombre: "Terminal Sur", direccion: "Av. Sur 200", tiempoEspera: 8 },
            { id: 8, nombre: "Centro Comercial", direccion: "Mall del Sur", tiempoEspera: 4 }
        ],
        vehiculosAsignados: 2,
        createdAt: "2024-01-10",
        frecuencia: "25 min"
    },
    {
        id: 4,
        nombre: "Ruta Este",
        codigo: "RT-004",
        color: "#f39c12",
        estado: "active",
        duracion: 40,
        distancia: 10.5,
        descripcion: "Ruta corta hacia el este de la ciudad",
        paraderos: [
            { id: 9, nombre: "Estación Este", direccion: "Av. Este 300", tiempoEspera: 6 },
            { id: 10, nombre: "Parque Industrial", direccion: "Zona Industrial", tiempoEspera: 4 }
        ],
        vehiculosAsignados: 1,
        createdAt: "2024-01-12",
        frecuencia: "30 min"
    },
    {
        id: 5,
        nombre: "Ruta Oeste",
        codigo: "RT-005",
        color: "#9b59b6",
        estado: "inactive",
        duracion: 70,
        distancia: 22.3,
        descripcion: "Ruta hacia las playas del oeste",
        paraderos: [
            { id: 11, nombre: "Terminal Oeste", direccion: "Av. Oeste 400", tiempoEspera: 12 },
            { id: 12, nombre: "Playa Costa Verde", direccion: "Km 15 Carretera", tiempoEspera: 5 }
        ],
        vehiculosAsignados: 0,
        createdAt: "2024-01-15",
        frecuencia: "45 min"
    }
];

// Variables globales
let mapa = null;
let polilinea = null;
let marcadores = [];
let rutaSeleccionada = null;
let paraderosTemporales = [];
let currentView = 'grid';
let mapaDibujo = null;
let capaDibujo = null;
let controlDibujo = null;
let polylineDibujo = null;
let rutaSnapeada = null;

const AREQUIPA_CENTER = [-16.409047, -71.537451];

// Inicializar módulo
function inicializarRutas() {
    verificarAutenticacion();
    cargarDatosUsuario();
    cargarEstadisticas();
    cargarRutasGrid();
    cargarRutasTable();
    inicializarMapa();
    configurarEventos();
    
    console.log("✅ Módulo de rutas inicializado");
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
    const emailUsuario = localStorage.getItem('empresa_email') || "admin@transporte.com";
    
    document.getElementById('companyName').textContent = nombreEmpresa;
    document.getElementById('userName').textContent = nombreUsuario;
    document.getElementById('userEmail').textContent = emailUsuario;
    document.getElementById('rutasCount').textContent = rutasDB.length;
}

// Cargar estadísticas
function cargarEstadisticas() {
    const totalParaderos = rutasDB.reduce((total, ruta) => total + ruta.paraderos.length, 0);
    const totalVehiculos = rutasDB.reduce((total, ruta) => total + ruta.vehiculosAsignados, 0);
    const duracionPromedio = rutasDB.reduce((total, ruta) => total + ruta.duracion, 0) / rutasDB.length;
    
    document.getElementById('totalRoutes').textContent = rutasDB.length;
    document.getElementById('assignedVehicles').textContent = totalVehiculos;
    document.getElementById('totalStops').textContent = totalParaderos;
    document.getElementById('avgDuration').textContent = Math.round(duracionPromedio);
}

// Cargar rutas en grid
function cargarRutasGrid() {
    const container = document.getElementById('routesGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    rutasDB.forEach(ruta => {
        const routeCard = document.createElement('div');
        routeCard.className = 'route-card';
        routeCard.style.borderLeftColor = ruta.color;
        routeCard.setAttribute('data-id', ruta.id);
        
        // Determinar clase de estado
        let estadoClase = '';
        let estadoTexto = '';
        switch(ruta.estado) {
            case 'active':
                estadoClase = 'status-active';
                estadoTexto = 'Activa';
                break;
            case 'inactive':
                estadoClase = 'status-inactive';
                estadoTexto = 'Inactiva';
                break;
            case 'maintenance':
                estadoClase = 'status-maintenance';
                estadoTexto = 'Mantenimiento';
                break;
        }
        
        routeCard.innerHTML = `
            <div class="route-card-header">
                <div class="route-card-title">
                    <span class="route-color" style="background: ${ruta.color};"></span>
                    <div>
                        <div class="route-name">${ruta.nombre}</div>
                        <div class="route-code">${ruta.codigo}</div>
                    </div>
                </div>
                <span class="route-status ${estadoClase}">${estadoTexto}</span>
            </div>
            <div class="route-card-body">
                <div class="route-stats">
                    <div class="route-stat">
                        <span class="route-stat-number">${ruta.vehiculosAsignados}</span>
                        <span class="route-stat-label">Vehículos</span>
                    </div>
                    <div class="route-stat">
                        <span class="route-stat-number">${ruta.paraderos.length}</span>
                        <span class="route-stat-label">Paraderos</span>
                    </div>
                    <div class="route-stat">
                        <span class="route-stat-number">${ruta.distancia}</span>
                        <span class="route-stat-label">km</span>
                    </div>
                </div>
                <div class="route-duration">
                    <i class="fas fa-clock"></i>
                    <span>${ruta.duracion} min • Frecuencia: ${ruta.frecuencia}</span>
                </div>
                <p style="color: #7f8c8d; font-size: 14px; line-height: 1.4;">${ruta.descripcion.substring(0, 80)}${ruta.descripcion.length > 80 ? '...' : ''}</p>
            </div>
            <div class="route-card-footer">
                <button class="btn-action btn-view" onclick="verDetallesRuta(${ruta.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <div class="route-actions">
                    <button class="btn-action btn-edit" onclick="editarRuta(${ruta.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-track" onclick="seleccionarRuta(${ruta.id})">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="event.stopPropagation(); eliminarRuta(${ruta.id});" title="Eliminar ruta">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(routeCard);
    });
}

// Cargar rutas en tabla
function cargarRutasTable() {
    const tbody = document.getElementById('routesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    rutasDB.forEach(ruta => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', ruta.id);
        tr.addEventListener('click', () => seleccionarRuta(ruta.id));
        
        if (rutaSeleccionada && rutaSeleccionada.id === ruta.id) {
            tr.classList.add('selected');
        }
        
        // Determinar clase de estado
        let estadoClase = '';
        let estadoTexto = '';
        switch(ruta.estado) {
            case 'active':
                estadoClase = 'status-active';
                estadoTexto = 'Activa';
                break;
            case 'inactive':
                estadoClase = 'status-inactive';
                estadoTexto = 'Inactiva';
                break;
            case 'maintenance':
                estadoClase = 'status-maintenance';
                estadoTexto = 'Mantenimiento';
                break;
        }
        
        tr.innerHTML = `
            <td>
                <span class="route-color-small" style="background: ${ruta.color};"></span>
                ${ruta.nombre}
                <br><small class="route-code">${ruta.codigo}</small>
            </td>
            <td>${ruta.vehiculosAsignados}</td>
            <td>${ruta.paraderos.length}</td>
            <td><span class="status-badge ${estadoClase}">${estadoTexto}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="event.stopPropagation(); verDetallesRuta(${ruta.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="event.stopPropagation(); editarRuta(${ruta.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="event.stopPropagation(); eliminarRuta(${ruta.id});" title="Eliminar ruta">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Inicializar mapa Leaflet
function inicializarMapa() {
    const mapElement = document.getElementById('routeMap');
    if (!mapElement) return;
    
    // Centro por defecto (Arequipa, Perú)
    mapa = L.map('routeMap').setView(AREQUIPA_CENTER, 13);
    
    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapa);
    
    // Dibujar rutas en el mapa
    dibujarRutasEnMapa();
    
    // Configurar controles del mapa
    configurarControlesMapa();
}

// Dibujar todas las rutas en el mapa
function dibujarRutasEnMapa() {
    // Limpiar marcadores y polilíneas anteriores
    marcadores.forEach(marker => mapa.removeLayer(marker));
    marcadores = [];
    
    if (polilinea) {
        mapa.removeLayer(polilinea);
        polilinea = null;
    }
    
    // Dibujar cada ruta
    rutasDB.forEach(ruta => {
        // Filtrar paraderos con coordenadas
        const paraderosConCoords = ruta.paraderos.filter(p => p.lat && p.lng);
        
        if (paraderosConCoords.length > 1) {
            // Crear polilínea para la ruta
            const coordenadas = paraderosConCoords.map(p => [p.lat, p.lng]);
            const polyline = L.polyline(coordenadas, {
                color: ruta.color,
                weight: 4,
                opacity: 0.6
            }).addTo(mapa);
            
            // Guardar referencia si es la ruta seleccionada
            if (rutaSeleccionada && rutaSeleccionada.id === ruta.id) {
                polilinea = polyline;
                polyline.setStyle({ weight: 6, opacity: 1 });
                
                // Ajustar vista al recorrido
                mapa.fitBounds(polyline.getBounds());
            }
        }
        
        // Agregar marcadores para paraderos
        paraderosConCoords.forEach((paradero, index) => {
            const marker = L.marker([paradero.lat, paradero.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background: ${ruta.color}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${index + 1}</div>`,
                    iconSize: [30, 30]
                })
            }).addTo(mapa);
            
            // Tooltip
            marker.bindTooltip(`<strong>${paradero.nombre}</strong><br>${ruta.nombre}`);
            
            marcadores.push(marker);
        });
    });
}

// Inicializar mapa de dibujo en modal
function inicializarMapaDibujo() {
    const mapElement = document.getElementById('routeDrawMap');
    if (!mapElement) return;
    
    if (mapaDibujo) {
        // Si ya existe solo refrescar tamaño
        setTimeout(() => mapaDibujo.invalidateSize(), 200);
        return;
    }
    
    mapaDibujo = L.map('routeDrawMap').setView(AREQUIPA_CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapaDibujo);
    
    capaDibujo = new L.FeatureGroup();
    mapaDibujo.addLayer(capaDibujo);
    
    controlDibujo = new L.Control.Draw({
        draw: {
            polyline: {
                shapeOptions: {
                    color: '#3498db',
                    weight: 5
                }
            },
            polygon: false,
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false
        },
        edit: {
            featureGroup: capaDibujo,
            edit: true,
            remove: true
        }
    });
    mapaDibujo.addControl(controlDibujo);
    
    mapaDibujo.on(L.Draw.Event.CREATED, (e) => {
        if (e.layerType === 'polyline') {
            capaDibujo.clearLayers();
            polylineDibujo = e.layer;
            capaDibujo.addLayer(polylineDibujo);
            procesarPolylineDibujada(polylineDibujo.getLatLngs());
        }
    });
    
    mapaDibujo.on(L.Draw.Event.EDITED, (e) => {
        e.layers.eachLayer(layer => {
            polylineDibujo = layer;
            procesarPolylineDibujada(layer.getLatLngs());
        });
    });
    
    mapaDibujo.on(L.Draw.Event.DELETED, () => {
        polylineDibujo = null;
        paraderosTemporales = [];
        actualizarListaParaderosEditor();
    });
}

// Cargar ruta actual en mapa de dibujo
function cargarRutaEnMapaDibujo() {
    if (!mapaDibujo) return;
    capaDibujo.clearLayers();
    polylineDibujo = null;
    
    const paraderosConCoords = paraderosTemporales.filter(p => p.lat && p.lng);
    if (paraderosConCoords.length > 1) {
        const latlngs = paraderosConCoords.map(p => L.latLng(p.lat, p.lng));
        polylineDibujo = L.polyline(latlngs, { color: '#3498db', weight: 5 });
        capaDibujo.addLayer(polylineDibujo);
        mapaDibujo.fitBounds(polylineDibujo.getBounds());
    } else {
        mapaDibujo.setView(AREQUIPA_CENTER, 13);
    }
    
    setTimeout(() => mapaDibujo.invalidateSize(), 200);
}

// Procesar polyline dibujada: solicitar ruteo por calles
function procesarPolylineDibujada(latlngs) {
    if (!latlngs || latlngs.length < 2) {
        mostrarMensaje('⚠️ Dibuja al menos dos puntos para crear una ruta', 'warning');
        return;
    }
    
    mostrarMensaje('⏳ Ajustando ruta a las calles de Arequipa...', 'info');
    enrutarSobreCalles(latlngs)
        .then(geoCoords => {
            if (geoCoords && geoCoords.length > 1) {
                aplicarRutaSnapeada(geoCoords);
                mostrarMensaje('✅ Ruta ajustada a las calles', 'success');
            } else {
                aplicarRutaDesdeLatLng(latlngs);
                mostrarMensaje('⚠️ No se pudo ajustar, se usará el trazado libre', 'warning');
            }
        })
        .catch(() => {
            aplicarRutaDesdeLatLng(latlngs);
            mostrarMensaje('⚠️ No se pudo contactar al servicio de ruteo, se usará el trazado libre', 'warning');
        });
}

// Llamar a OSRM para ajustar a calles
function enrutarSobreCalles(latlngs) {
    const coords = latlngs.map(ll => `${ll.lng},${ll.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    return fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data && data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
                return data.routes[0].geometry.coordinates; // [lng, lat]
            }
            return null;
        });
}

// Aplicar ruta snapeada a mapa y paraderos
function aplicarRutaSnapeada(geoCoords) {
    const latlngs = geoCoords.map(([lng, lat]) => L.latLng(lat, lng));
    capaDibujo.clearLayers();
    polylineDibujo = L.polyline(latlngs, { color: '#3498db', weight: 5 });
    capaDibujo.addLayer(polylineDibujo);
    mapaDibujo.fitBounds(polylineDibujo.getBounds());
    sincronizarParaderosDesdeLatLngs(latlngs);
}

// Usar trazado libre cuando no hay ruteo
function aplicarRutaDesdeLatLng(latlngs) {
    capaDibujo.clearLayers();
    polylineDibujo = L.polyline(latlngs, { color: '#3498db', weight: 5 });
    capaDibujo.addLayer(polylineDibujo);
    mapaDibujo.fitBounds(polylineDibujo.getBounds());
    sincronizarParaderosDesdeLatLngs(latlngs);
}

// Actualizar paraderos temporales desde el polyline
function sincronizarParaderosDesdeLatLngs(latlngs) {
    paraderosTemporales = latlngs.map((ll, index) => {
        const previo = paraderosTemporales[index] || {};
        return {
            id: previo.id || `${Date.now()}-${index}`,
            nombre: previo.nombre || `Punto ${index + 1}`,
            direccion: previo.direccion || '',
            tiempoEspera: previo.tiempoEspera || 2,
            lat: ll.lat,
            lng: ll.lng,
            observaciones: previo.observaciones || ''
        };
    });
    actualizarListaParaderosEditor();
}

// Configurar controles del mapa
function configurarControlesMapa() {
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        mapa.zoomIn();
    });
    
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        mapa.zoomOut();
    });
    
    document.getElementById('resetViewBtn').addEventListener('click', () => {
        mapa.setView(AREQUIPA_CENTER, 13);
    });
    
    document.getElementById('refreshMapBtn').addEventListener('click', () => {
        dibujarRutasEnMapa();
        mostrarMensaje('🗺️ Mapa actualizado', 'success');
    });
}

// Seleccionar una ruta
function seleccionarRuta(id) {
    rutaSeleccionada = rutasDB.find(r => r.id === id);
    
    // Actualizar UI
    document.getElementById('selectedRouteName').textContent = rutaSeleccionada.nombre;
    document.getElementById('addStopBtn').disabled = false;
    document.getElementById('reorderStopsBtn').disabled = false;
    
    // Actualizar tabla para mostrar selección
    document.querySelectorAll('#routesTableBody tr').forEach(tr => {
        tr.classList.remove('selected');
        if (parseInt(tr.getAttribute('data-id')) === id) {
            tr.classList.add('selected');
        }
    });
    
    // Cargar paraderos de la ruta seleccionada
    cargarParaderosRuta();
    
    // Actualizar mapa
    dibujarRutasEnMapa();
}

// Cargar paraderos de la ruta seleccionada
function cargarParaderosRuta() {
    const container = document.getElementById('stopsList');
    if (!container || !rutaSeleccionada) return;
    
    container.innerHTML = '';
    
    if (rutaSeleccionada.paraderos.length === 0) {
        container.innerHTML = `
            <div class="empty-stops">
                <i class="fas fa-map-pin fa-2x"></i>
                <p>Esta ruta no tiene paraderos configurados</p>
                <button class="btn-primary" onclick="agregarParadero()" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Agregar Primer Paradero
                </button>
            </div>
        `;
        return;
    }
    
    rutaSeleccionada.paraderos.forEach((paradero, index) => {
        const stopItem = document.createElement('div');
        stopItem.className = 'stop-item';
        stopItem.setAttribute('data-index', index);
        
        stopItem.innerHTML = `
            <div class="stop-number">${index + 1}</div>
            <div class="stop-info">
                <div class="stop-name">${paradero.nombre}</div>
                <div class="stop-details">
                    <span><i class="fas fa-clock"></i> ${paradero.tiempoEspera || 0} min</span>
                    ${paradero.direccion ? `<span><i class="fas fa-map-pin"></i> ${paradero.direccion}</span>` : ''}
                </div>
            </div>
            <div class="stop-actions">
                <button class="stop-action-btn" onclick="editarParadero(${index})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="stop-action-btn" onclick="eliminarParadero(${index})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="stop-action-btn" onclick="moverParadero(${index}, 'up')" ${index === 0 ? 'disabled' : ''} title="Mover arriba">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="stop-action-btn" onclick="moverParadero(${index}, 'down')" ${index === rutaSeleccionada.paraderos.length - 1 ? 'disabled' : ''} title="Mover abajo">
                    <i class="fas fa-arrow-down"></i>
                </button>
            </div>
        `;
        
        container.appendChild(stopItem);
    });
}

// Configurar eventos
function configurarEventos() {
    // Botón de logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Botón de nueva ruta
    document.getElementById('addRouteBtn').addEventListener('click', () => abrirModalNuevaRuta());
    
    // Botón de vista de mapa
    document.getElementById('viewMapBtn').addEventListener('click', () => {
        window.location.href = 'mapa.html';
    });
    
    // Toggle de vista (grid/list)
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.getAttribute('data-view');
            
            // Aquí podrías cambiar entre vista grid y lista
            mostrarMensaje(`Vista cambiada a ${currentView === 'grid' ? 'cuadrícula' : 'lista'}`, 'info');
        });
    });
    
    // Búsqueda de rutas
    document.getElementById('searchRoutes').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#routesTableBody tr');
        
        rows.forEach(row => {
            const nombre = row.querySelector('td:first-child').textContent.toLowerCase();
            const codigo = row.querySelector('.route-code').textContent.toLowerCase();
            
            if (nombre.includes(searchTerm) || codigo.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    
    // Botón para agregar paradero
    document.getElementById('addStopBtn').addEventListener('click', agregarParadero);
    
    // Botón para reordenar paraderos
    document.getElementById('reorderStopsBtn').addEventListener('click', () => {
        mostrarMensaje('Funcionalidad de reordenar en desarrollo', 'info');
    });
    
    // Modales
    configurarEventosModales();
    
    // Color picker
    const colorInput = document.getElementById('modalColor');
    const colorValue = document.getElementById('colorValue');
    if (colorInput && colorValue) {
        colorInput.addEventListener('input', function() {
            colorValue.textContent = this.value;
        });
    }
    
    // Agregar paradero desde input
    const addStopInputBtn = document.getElementById('addStopInputBtn');
    const stopNameInput = document.getElementById('stopNameInput');
    
    if (addStopInputBtn && stopNameInput) {
        addStopInputBtn.addEventListener('click', agregarParaderoDesdeInput);
        stopNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                agregarParaderoDesdeInput();
            }
        });
    }
}

// Eliminar ruta
function eliminarRuta(id) {
    const ruta = rutasDB.find(r => r.id === id);
    if (!ruta) return;
    
    const confirmar = confirm(`¿Eliminar la ruta "${ruta.nombre}" y todos sus paraderos?`);
    if (!confirmar) return;
    
    rutasDB = rutasDB.filter(r => r.id !== id);
    localStorage.setItem('rutasDB', JSON.stringify(rutasDB));
    
    // Limpiar selección si era la ruta seleccionada
    if (rutaSeleccionada && rutaSeleccionada.id === id) {
        rutaSeleccionada = null;
        document.getElementById('selectedRouteName').textContent = 'Seleccione una ruta';
        document.getElementById('addStopBtn').disabled = true;
        document.getElementById('reorderStopsBtn').disabled = true;
        document.getElementById('stopsList').innerHTML = `
            <div class="empty-stops">
                <i class="fas fa-map-pin fa-2x"></i>
                <p>Seleccione una ruta para ver sus paraderos</p>
            </div>
        `;
    }
    
    // Refrescar UI
    cargarRutasGrid();
    cargarRutasTable();
    cargarEstadisticas();
    dibujarRutasEnMapa();
    
    mostrarMensaje('✅ Ruta eliminada', 'success');
}

// Configurar eventos de modales
function configurarEventosModales() {
    // Cerrar modales
    document.querySelectorAll('.close-modal, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            cerrarTodosModales();
        });
    });
    
    // Guardar ruta
    document.getElementById('saveRouteBtn').addEventListener('click', guardarRuta);
    
    // Guardar paradero
    document.getElementById('saveStopBtn').addEventListener('click', guardarParadero);
    
    // Editar desde detalles
    document.getElementById('editRouteDetailsBtn').addEventListener('click', function() {
        const routeId = parseInt(this.getAttribute('data-route-id'));
        if (routeId) {
            cerrarModal('routeDetailsModal');
            editarRuta(routeId);
        }
    });
}

// Abrir modal para nueva ruta
function abrirModalNuevaRuta() {
    document.getElementById('modalTitle').textContent = 'Nueva Ruta';
    document.getElementById('saveRouteText').textContent = 'Guardar Ruta';
    document.getElementById('routeForm').reset();
    document.getElementById('modalRouteId').value = '';
    document.getElementById('modalColor').value = '#3498db';
    document.getElementById('colorValue').textContent = '#3498db';
    document.getElementById('modalEstado').value = 'active';
    
    // Limpiar paraderos temporales
    paraderosTemporales = [];
    actualizarListaParaderosEditor();
    
    inicializarMapaDibujo();
    cargarRutaEnMapaDibujo();
    
    abrirModal('routeModal');
}

// Abrir modal para editar ruta
function editarRuta(id) {
    const ruta = rutasDB.find(r => r.id === id);
    if (!ruta) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Ruta';
    document.getElementById('saveRouteText').textContent = 'Actualizar Ruta';
    
    // Llenar formulario con datos de la ruta
    document.getElementById('modalNombre').value = ruta.nombre;
    document.getElementById('modalCodigo').value = ruta.codigo;
    document.getElementById('modalColor').value = ruta.color;
    document.getElementById('colorValue').textContent = ruta.color;
    document.getElementById('modalEstado').value = ruta.estado;
    document.getElementById('modalDuracion').value = ruta.duracion;
    document.getElementById('modalDistancia').value = ruta.distancia;
    document.getElementById('modalDescripcion').value = ruta.descripcion || '';
    document.getElementById('modalRouteId').value = ruta.id;
    
    // Cargar paraderos temporales
    paraderosTemporales = [...ruta.paraderos];
    actualizarListaParaderosEditor();
    
    inicializarMapaDibujo();
    cargarRutaEnMapaDibujo();
    
    abrirModal('routeModal');
}

// Actualizar lista de paraderos en el editor
function actualizarListaParaderosEditor() {
    const container = document.getElementById('stopsListEditor');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (paraderosTemporales.length === 0) {
        container.innerHTML = `
            <div class="empty-stops-editor">
                <i class="fas fa-info-circle"></i>
                <p>No hay paraderos agregados. Agregue paraderos usando el campo superior.</p>
            </div>
        `;
        return;
    }
    
    paraderosTemporales.forEach((paradero, index) => {
        const stopItem = document.createElement('div');
        stopItem.className = 'stop-editor-item';
        stopItem.setAttribute('data-index', index);
        
        stopItem.innerHTML = `
            <div class="stop-editor-number">${index + 1}</div>
            <div class="stop-editor-info">
                <div class="stop-editor-name">${paradero.nombre}</div>
                <div class="stop-editor-details">
                    ${paradero.direccion ? `<small>${paradero.direccion}</small>` : ''}
                </div>
            </div>
            <div class="stop-editor-actions">
                <button class="stop-action-btn" onclick="editarParaderoTemporal(${index})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="stop-action-btn" onclick="eliminarParaderoTemporal(${index})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(stopItem);
    });
}

// Agregar paradero desde input
function agregarParaderoDesdeInput() {
    const nombre = document.getElementById('stopNameInput').value.trim();
    if (!nombre) {
        mostrarMensaje('⚠️ Ingrese un nombre para el paradero', 'warning');
        return;
    }
    
    const nuevoParadero = {
        id: Date.now(),
        nombre: nombre,
        direccion: '',
        tiempoEspera: 2,
        lat: null,
        lng: null,
        observaciones: ''
    };
    
    paraderosTemporales.push(nuevoParadero);
    actualizarListaParaderosEditor();
    
    // Limpiar input
    document.getElementById('stopNameInput').value = '';
    document.getElementById('stopNameInput').focus();
    
    mostrarMensaje(`✅ Paradero "${nombre}" agregado`, 'success');
}

// Editar paradero temporal
function editarParaderoTemporal(index) {
    const paradero = paraderosTemporales[index];
    if (!paradero) return;
    
    document.getElementById('stopModalTitle').textContent = 'Editar Paradero';
    document.getElementById('saveStopText').textContent = 'Actualizar Paradero';
    
    // Llenar formulario
    document.getElementById('stopModalNombre').value = paradero.nombre;
    document.getElementById('stopModalDireccion').value = paradero.direccion || '';
    document.getElementById('stopModalTiempo').value = paradero.tiempoEspera || 2;
    document.getElementById('stopModalLat').value = paradero.lat || '';
    document.getElementById('stopModalLng').value = paradero.lng || '';
    document.getElementById('stopModalObservaciones').value = paradero.observaciones || '';
    document.getElementById('stopModalId').value = paradero.id;
    document.getElementById('stopModalIndex').value = index;
    document.getElementById('stopModalRouteId').value = 'temporal';
    
    abrirModal('stopModal');
}

// Eliminar paradero temporal
function eliminarParaderoTemporal(index) {
    if (confirm('¿Está seguro de eliminar este paradero?')) {
        paraderosTemporales.splice(index, 1);
        actualizarListaParaderosEditor();
        mostrarMensaje('✅ Paradero eliminado', 'success');
    }
}

// Guardar ruta
function guardarRuta() {
    const form = document.getElementById('routeForm');
    if (!form.checkValidity()) {
        mostrarMensaje('⚠️ Complete los campos requeridos', 'warning');
        return;
    }
    
    if (paraderosTemporales.length === 0) {
        const confirmar = confirm('Esta ruta no tiene paraderos. ¿Desea guardarla de todas formas?');
        if (!confirmar) return;
    }
    
    const id = document.getElementById('modalRouteId').value;
    const datos = {
        nombre: document.getElementById('modalNombre').value,
        codigo: document.getElementById('modalCodigo').value.toUpperCase(),
        color: document.getElementById('modalColor').value,
        estado: document.getElementById('modalEstado').value,
        duracion: parseInt(document.getElementById('modalDuracion').value) || 45,
        distancia: parseFloat(document.getElementById('modalDistancia').value) || 10.0,
        descripcion: document.getElementById('modalDescripcion').value,
        paraderos: paraderosTemporales,
        vehiculosAsignados: id ? rutasDB.find(r => r.id === parseInt(id)).vehiculosAsignados : 0,
        frecuencia: '20 min', // Esto podría ser otro campo en el formulario
        createdAt: id ? rutasDB.find(r => r.id === parseInt(id)).createdAt : new Date().toISOString().split('T')[0]
    };
    
    if (id) {
        // Actualizar ruta existente
        const index = rutasDB.findIndex(r => r.id === parseInt(id));
        rutasDB[index] = { ...rutasDB[index], ...datos, id: parseInt(id) };
        mostrarMensaje('✅ Ruta actualizada correctamente', 'success');
    } else {
        // Crear nueva ruta
        const nuevoId = rutasDB.length > 0 ? Math.max(...rutasDB.map(r => r.id)) + 1 : 1;
        rutasDB.push({ ...datos, id: nuevoId });
        mostrarMensaje('✅ Ruta creada correctamente', 'success');
    }
    
    // Guardar en localStorage
    localStorage.setItem('rutasDB', JSON.stringify(rutasDB));
    
    cerrarModal('routeModal');
    
    // Actualizar todas las vistas
    cargarRutasGrid();
    cargarRutasTable();
    cargarEstadisticas();
    
    // Si esta ruta está seleccionada, actualizar sus paraderos
    if (rutaSeleccionada && rutaSeleccionada.id === parseInt(id || nuevoId)) {
        rutaSeleccionada = rutasDB.find(r => r.id === parseInt(id || nuevoId));
        cargarParaderosRuta();
    }
    
    // Actualizar mapa
    dibujarRutasEnMapa();
}

// Agregar paradero a ruta seleccionada
function agregarParadero() {
    if (!rutaSeleccionada) {
        mostrarMensaje('⚠️ Seleccione una ruta primero', 'warning');
        return;
    }
    
    document.getElementById('stopModalTitle').textContent = 'Nuevo Paradero';
    document.getElementById('saveStopText').textContent = 'Guardar Paradero';
    document.getElementById('stopForm').reset();
    document.getElementById('stopModalId').value = '';
    document.getElementById('stopModalRouteId').value = rutaSeleccionada.id;
    document.getElementById('stopModalIndex').value = '';
    document.getElementById('stopModalTiempo').value = 2;
    
    abrirModal('stopModal');
}

// Editar paradero existente
function editarParadero(index) {
    if (!rutaSeleccionada) return;
    
    const paradero = rutaSeleccionada.paraderos[index];
    if (!paradero) return;
    
    document.getElementById('stopModalTitle').textContent = 'Editar Paradero';
    document.getElementById('saveStopText').textContent = 'Actualizar Paradero';
    
    // Llenar formulario
    document.getElementById('stopModalNombre').value = paradero.nombre;
    document.getElementById('stopModalDireccion').value = paradero.direccion || '';
    document.getElementById('stopModalTiempo').value = paradero.tiempoEspera || 2;
    document.getElementById('stopModalLat').value = paradero.lat || '';
    document.getElementById('stopModalLng').value = paradero.lng || '';
    document.getElementById('stopModalObservaciones').value = paradero.observaciones || '';
    document.getElementById('stopModalId').value = paradero.id;
    document.getElementById('stopModalIndex').value = index;
    document.getElementById('stopModalRouteId').value = rutaSeleccionada.id;
    
    abrirModal('stopModal');
}

// Guardar paradero
function guardarParadero() {
    const form = document.getElementById('stopForm');
    if (!form.checkValidity()) {
        mostrarMensaje('⚠️ Complete el nombre del paradero', 'warning');
        return;
    }
    
    const routeId = document.getElementById('stopModalRouteId').value;
    const index = document.getElementById('stopModalIndex').value;
    const datos = {
        id: document.getElementById('stopModalId').value || Date.now(),
        nombre: document.getElementById('stopModalNombre').value,
        direccion: document.getElementById('stopModalDireccion').value || '',
        tiempoEspera: parseInt(document.getElementById('stopModalTiempo').value) || 2,
        lat: document.getElementById('stopModalLat').value ? parseFloat(document.getElementById('stopModalLat').value) : null,
        lng: document.getElementById('stopModalLng').value ? parseFloat(document.getElementById('stopModalLng').value) : null,
        observaciones: document.getElementById('stopModalObservaciones').value || ''
    };
    
    if (routeId === 'temporal') {
        // Paradero temporal (en creación de ruta)
        const tempIndex = parseInt(index);
        paraderosTemporales[tempIndex] = datos;
        actualizarListaParaderosEditor();
        mostrarMensaje('✅ Paradero actualizado', 'success');
    } else {
        // Paradero de ruta existente
        const rutaIndex = rutasDB.findIndex(r => r.id === parseInt(routeId));
        if (rutaIndex === -1) return;
        
        if (index === '') {
            // Nuevo paradero
            rutasDB[rutaIndex].paraderos.push(datos);
        } else {
            // Actualizar paradero existente
            rutasDB[rutaIndex].paraderos[parseInt(index)] = datos;
        }
        
        // Guardar cambios
        localStorage.setItem('rutasDB', JSON.stringify(rutasDB));
        
        // Actualizar ruta seleccionada si es la misma
        if (rutaSeleccionada && rutaSeleccionada.id === parseInt(routeId)) {
            rutaSeleccionada = rutasDB[rutaIndex];
            cargarParaderosRuta();
        }
        
        mostrarMensaje('✅ Paradero guardado', 'success');
    }
    
    cerrarModal('stopModal');
}

// Eliminar paradero
function eliminarParadero(index) {
    if (!rutaSeleccionada) return;
    
    if (confirm('¿Está seguro de eliminar este paradero?')) {
        rutaSeleccionada.paraderos.splice(index, 1);
        
        // Guardar cambios
        const rutaIndex = rutasDB.findIndex(r => r.id === rutaSeleccionada.id);
        rutasDB[rutaIndex] = rutaSeleccionada;
        localStorage.setItem('rutasDB', JSON.stringify(rutasDB));
        
        cargarParaderosRuta();
        dibujarRutasEnMapa();
        mostrarMensaje('✅ Paradero eliminado', 'success');
    }
}

// Mover paradero
function moverParadero(index, direction) {
    if (!rutaSeleccionada) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < rutaSeleccionada.paraderos.length) {
        // Intercambiar posiciones
        [rutaSeleccionada.paraderos[index], rutaSeleccionada.paraderos[newIndex]] = 
        [rutaSeleccionada.paraderos[newIndex], rutaSeleccionada.paraderos[index]];
        
        // Guardar cambios
        const rutaIndex = rutasDB.findIndex(r => r.id === rutaSeleccionada.id);
        rutasDB[rutaIndex] = rutaSeleccionada;
        localStorage.setItem('rutasDB', JSON.stringify(rutasDB));
        
        cargarParaderosRuta();
        dibujarRutasEnMapa();
        mostrarMensaje('✅ Paradero movido', 'success');
    }
}

// Ver detalles de ruta
function verDetallesRuta(id) {
    const ruta = rutasDB.find(r => r.id === id);
    if (!ruta) return;
    
    // Determinar texto de estado
    let estadoTexto = '';
    switch(ruta.estado) {
        case 'active': estadoTexto = 'Activa'; break;
        case 'inactive': estadoTexto = 'Inactiva'; break;
        case 'maintenance': estadoTexto = 'En mantenimiento'; break;
    }
    
    // Formatear detalles
    const detallesHTML = `
        <div class="detail-section-route">
            <h4><i class="fas fa-info-circle"></i> Información General</h4>
            <div class="detail-row-route">
                <div class="detail-label-route">Nombre:</div>
                <div class="detail-value-route"><strong>${ruta.nombre}</strong></div>
            </div>
            <div class="detail-row-route">
                <div class="detail-label-route">Código:</div>
                <div class="detail-value-route">${ruta.codigo}</div>
            </div>
            <div class="detail-row-route">
                <div class="detail-label-route">Estado:</div>
                <div class="detail-value-route">
                    <span class="status-badge ${ruta.estado === 'active' ? 'status-active' : ruta.estado === 'inactive' ? 'status-inactive' : 'status-maintenance'}">
                        ${estadoTexto}
                    </span>
                </div>
            </div>
            <div class="detail-row-route">
                <div class="detail-label-route">Color:</div>
                <div class="detail-value-route">
                    <span style="display: inline-block; width: 20px; height: 20px; background: ${ruta.color}; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
                    ${ruta.color}
                </div>
            </div>
        </div>
        
        <div class="detail-section-route">
            <h4><i class="fas fa-route"></i> Especificaciones</h4>
            <div class="detail-row-route">
                <div class="detail-label-route">Duración:</div>
                <div class="detail-value-route">${ruta.duracion} minutos</div>
            </div>
            <div class="detail-row-route">
                <div class="detail-label-route">Distancia:</div>
                <div class="detail-value-route">${ruta.distancia} km</div>
            </div>
            <div class="detail-row-route">
                <div class="detail-label-route">Frecuencia:</div>
                <div class="detail-value-route">Cada ${ruta.frecuencia}</div>
            </div>
            <div class="detail-row-route">
                <div class="detail-label-route">Vehículos asignados:</div>
                <div class="detail-value-route">${ruta.vehiculosAsignados}</div>
            </div>
        </div>
        
        <div class="detail-section-route">
            <h4><i class="fas fa-align-left"></i> Descripción</h4>
            <div class="detail-row-route">
                <div class="detail-value-route">${ruta.descripcion || 'Sin descripción'}</div>
            </div>
        </div>
        
        <div class="detail-section-route">
            <h4><i class="fas fa-map-marker-alt"></i> Paraderos (${ruta.paraderos.length})</h4>
            <div class="stops-details-list">
                ${ruta.paraderos.map((paradero, index) => `
                    <div class="stop-detail-item">
                        <div style="width: 30px; font-weight: bold; color: #3498db;">${index + 1}.</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600;">${paradero.nombre}</div>
                            ${paradero.direccion ? `<div style="font-size: 12px; color: #7f8c8d;">${paradero.direccion}</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #f39c12;">
                            <i class="fas fa-clock"></i> ${paradero.tiempoEspera || 0} min
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('routeDetailsContent').innerHTML = detallesHTML;
    document.getElementById('editRouteDetailsBtn').setAttribute('data-route-id', id);
    
    abrirModal('routeDetailsModal');
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
        z-index: 3000;
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarRutas);