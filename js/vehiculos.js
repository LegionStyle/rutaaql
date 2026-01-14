// ============================================
// MÓDULO DE GESTIÓN DE VEHÍCULOS
// ============================================

// Base de datos de ejemplo
let vehiculosDB = JSON.parse(localStorage.getItem('vehiculosDB')) || [
    {
        id: 1,
        placa: "ABC-123",
        codigo: "V001",
        chofer: { id: 1, nombre: "Juan Pérez" },
        ruta: { id: "centro", nombre: "Ruta Centro" },
        marca: "Mercedes Benz",
        modelo: "O500U",
        anio: 2020,
        capacidad: 50,
        estado: "active",
        observaciones: "Vehículo en buen estado",
        ultimaActividad: "2024-01-15 14:30",
        createdAt: "2024-01-01",
        ubicacion: { lat: -12.046374, lng: -77.042793 }
    },
    {
        id: 2,
        placa: "DEF-456",
        codigo: "V002",
        chofer: { id: 2, nombre: "María López" },
        ruta: { id: "norte", nombre: "Ruta Norte" },
        marca: "Volvo",
        modelo: "B340",
        anio: 2021,
        capacidad: 45,
        estado: "maintenance",
        observaciones: "En mantenimiento programado",
        ultimaActividad: "2024-01-14 10:15",
        createdAt: "2024-01-05",
        ubicacion: { lat: -12.056374, lng: -77.032793 }
    },
    {
        id: 3,
        placa: "GHI-789",
        codigo: "V003",
        chofer: { id: 3, nombre: "Carlos Ruiz" },
        ruta: { id: "sur", nombre: "Ruta Sur" },
        marca: "Scania",
        modelo: "K320",
        anio: 2019,
        capacidad: 55,
        estado: "active",
        observaciones: "",
        ultimaActividad: "2024-01-15 15:45",
        createdAt: "2024-01-10",
        ubicacion: { lat: -12.036374, lng: -77.052793 }
    },
    {
        id: 4,
        placa: "JKL-012",
        codigo: "V004",
        chofer: { id: 4, nombre: "Ana García" },
        ruta: null,
        marca: "Mercedes Benz",
        modelo: "OF-1621",
        anio: 2022,
        capacidad: 60,
        estado: "inactive",
        observaciones: "Vehículo de reserva",
        ultimaActividad: "2024-01-10 08:20",
        createdAt: "2024-01-12",
        ubicacion: null
    },
    {
        id: 5,
        placa: "MNO-345",
        codigo: "V005",
        chofer: { id: 5, nombre: "Roberto Sánchez" },
        ruta: { id: "este", nombre: "Ruta Este" },
        marca: "Volvo",
        modelo: "B290",
        anio: 2020,
        capacidad: 48,
        estado: "offline",
        observaciones: "Sin señal GPS",
        ultimaActividad: "2024-01-13 16:10",
        createdAt: "2024-01-15",
        ubicacion: null
    }
];

// Variables globales
let currentPage = 1;
const itemsPerPage = 10;
let selectedVehicles = new Set();
let currentFilters = {
    search: '',
    status: 'all',
    route: 'all'
};

// Inicializar módulo
function inicializarVehiculos() {
    verificarAutenticacion();
    cargarDatosUsuario();
    cargarEstadisticas();
    cargarTablaVehiculos();
    configurarEventos();
    actualizarContadores();
    
    console.log("✅ Módulo de vehículos inicializado");
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
}

// Cargar estadísticas
function cargarEstadisticas() {
    const stats = calcularEstadisticas();
    
    document.getElementById('vehiculosCount').textContent = vehiculosDB.length;
    document.getElementById('activeCount').textContent = stats.active;
    document.getElementById('maintenanceCount').textContent = stats.maintenance;
    document.getElementById('inactiveCount').textContent = stats.inactive;
    document.getElementById('offlineCount').textContent = stats.offline;
}

// Calcular estadísticas
function calcularEstadisticas() {
    return {
        active: vehiculosDB.filter(v => v.estado === 'active').length,
        maintenance: vehiculosDB.filter(v => v.estado === 'maintenance').length,
        inactive: vehiculosDB.filter(v => v.estado === 'inactive').length,
        offline: vehiculosDB.filter(v => v.estado === 'offline').length
    };
}

// Filtrar vehículos
function filtrarVehiculos() {
    let filtrados = vehiculosDB;
    
    // Aplicar filtro de búsqueda
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtrados = filtrados.filter(v => 
            v.placa.toLowerCase().includes(searchTerm) ||
            v.codigo.toLowerCase().includes(searchTerm) ||
            v.chofer.nombre.toLowerCase().includes(searchTerm)
        );
    }
    
    // Aplicar filtro de estado
    if (currentFilters.status !== 'all') {
        filtrados = filtrados.filter(v => v.estado === currentFilters.status);
    }
    
    // Aplicar filtro de ruta
    if (currentFilters.route !== 'all') {
        filtrados = filtrados.filter(v => 
            v.ruta && v.ruta.id === currentFilters.route
        );
    }
    
    return filtrados;
}

// Cargar tabla de vehículos
function cargarTablaVehiculos() {
    const tbody = document.getElementById('vehiclesTableBody');
    tbody.innerHTML = '';
    
    const vehiculosFiltrados = filtrarVehiculos();
    const totalVehiculos = vehiculosFiltrados.length;
    const totalPages = Math.ceil(totalVehiculos / itemsPerPage);
    
    // Calcular índices para paginación
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalVehiculos);
    const vehiculosPagina = vehiculosFiltrados.slice(startIndex, endIndex);
    
    // Generar filas de la tabla
    vehiculosPagina.forEach(vehiculo => {
        const tr = document.createElement('tr');
        const isSelected = selectedVehicles.has(vehiculo.id);
        
        // Determinar clase de estado
        let estadoClase = '';
        let estadoTexto = '';
        let estadoIcon = '';
        
        switch(vehiculo.estado) {
            case 'active':
                estadoClase = 'status-active';
                estadoTexto = 'Activo';
                estadoIcon = 'fa-check-circle';
                break;
            case 'inactive':
                estadoClase = 'status-inactive';
                estadoTexto = 'Inactivo';
                estadoIcon = 'fa-pause-circle';
                break;
            case 'maintenance':
                estadoClase = 'status-maintenance';
                estadoTexto = 'Mantenimiento';
                estadoIcon = 'fa-wrench';
                break;
            case 'offline':
                estadoClase = 'status-offline';
                estadoTexto = 'Sin señal';
                estadoIcon = 'fa-exclamation-triangle';
                break;
        }
        
        tr.innerHTML = `
            <td>
                <input type="checkbox" class="vehicle-checkbox" 
                       data-id="${vehiculo.id}" 
                       ${isSelected ? 'checked' : ''}>
            </td>
            <td>
                <strong class="placa">${vehiculo.placa}</strong>
                <br><small class="codigo">${vehiculo.codigo}</small>
            </td>
            <td>${vehiculo.codigo}</td>
            <td>
                <div class="chofer-info">
                    <i class="fas fa-user-tie"></i>
                    <span>${vehiculo.chofer.nombre}</span>
                </div>
            </td>
            <td>
                ${vehiculo.ruta ? 
                    `<span class="ruta-badge">${vehiculo.ruta.nombre}</span>` : 
                    '<span class="no-ruta">Sin ruta</span>'
                }
            </td>
            <td>
                <span class="status-badge ${estadoClase}">
                    <i class="fas ${estadoIcon}"></i>
                    ${estadoTexto}
                </span>
            </td>
            <td>
                <small>${formatFecha(vehiculo.ultimaActividad)}</small>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="verDetalles(${vehiculo.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="editarVehiculo(${vehiculo.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-track" onclick="rastrearVehiculo(${vehiculo.id})" title="Rastrear">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="eliminarVehiculo(${vehiculo.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Actualizar controles de paginación
    actualizarPaginacion(totalPages, totalVehiculos, endIndex - startIndex);
    
    // Actualizar checkboxes
    actualizarCheckboxes();
}

// Formatear fecha
function formatFecha(fechaString) {
    if (!fechaString) return 'Nunca';
    
    const fecha = new Date(fechaString);
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias === 0) {
        return 'Hoy ' + fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (dias === 1) {
        return 'Ayer ' + fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (dias < 7) {
        return `Hace ${dias} días`;
    } else {
        return fecha.toLocaleDateString('es-ES');
    }
}

// Actualizar paginación
function actualizarPaginacion(totalPages, totalVehiculos, showingCount) {
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalCount').textContent = totalVehiculos;
    document.getElementById('showingCount').textContent = showingCount;
    
    // Habilitar/deshabilitar botones
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Actualizar checkboxes
function actualizarCheckboxes() {
    const checkboxes = document.querySelectorAll('.vehicle-checkbox');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    // Event listeners para checkboxes individuales
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const vehicleId = parseInt(this.getAttribute('data-id'));
            
            if (this.checked) {
                selectedVehicles.add(vehicleId);
            } else {
                selectedVehicles.delete(vehicleId);
                selectAllCheckbox.checked = false;
            }
            
            actualizarAccionesMasivas();
        });
    });
    
    // Event listener para "Seleccionar todos"
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.vehicle-checkbox');
            
            if (this.checked) {
                checkboxes.forEach(cb => {
                    cb.checked = true;
                    const id = parseInt(cb.getAttribute('data-id'));
                    selectedVehicles.add(id);
                });
            } else {
                checkboxes.forEach(cb => {
                    cb.checked = false;
                    const id = parseInt(cb.getAttribute('data-id'));
                    selectedVehicles.delete(id);
                });
            }
            
            actualizarAccionesMasivas();
        });
    }
}

// Actualizar acciones masivas
function actualizarAccionesMasivas() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedVehicles.size > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = selectedVehicles.size;
    } else {
        bulkActions.style.display = 'none';
    }
}

// Configurar eventos
function configurarEventos() {
    // Botón de logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Botón de nuevo vehículo
    document.getElementById('addVehicleBtn').addEventListener('click', () => abrirModalNuevo());
    
    // Filtros
    document.getElementById('searchInput').addEventListener('input', function() {
        currentFilters.search = this.value;
        currentPage = 1;
        cargarTablaVehiculos();
    });
    
    document.getElementById('statusFilter').addEventListener('change', function() {
        currentFilters.status = this.value;
        currentPage = 1;
        cargarTablaVehiculos();
    });
    
    document.getElementById('routeFilter').addEventListener('change', function() {
        currentFilters.route = this.value;
        currentPage = 1;
        cargarTablaVehiculos();
    });
    
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        cargarTablaVehiculos();
    });
    
    document.getElementById('clearFiltersBtn').addEventListener('click', function() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('routeFilter').value = 'all';
        
        currentFilters = {
            search: '',
            status: 'all',
            route: 'all'
        };
        
        currentPage = 1;
        cargarTablaVehiculos();
    });
    
    // Paginación
    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            cargarTablaVehiculos();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
        const totalPages = parseInt(document.getElementById('totalPages').textContent);
        if (currentPage < totalPages) {
            currentPage++;
            cargarTablaVehiculos();
        }
    });
    
    // Actualizar tabla
    document.getElementById('refreshTableBtn').addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.className = 'fas fa-spinner fa-spin';
        
        setTimeout(() => {
            cargarTablaVehiculos();
            cargarEstadisticas();
            icon.className = 'fas fa-sync-alt';
            mostrarMensaje('✅ Tabla actualizada', 'success');
        }, 1000);
    });
    
    // Exportar
    document.getElementById('exportBtn').addEventListener('click', exportarDatos);
    
    // Acciones masivas
    document.getElementById('bulkActivate').addEventListener('click', () => accionMasiva('activate'));
    document.getElementById('bulkDeactivate').addEventListener('click', () => accionMasiva('deactivate'));
    document.getElementById('bulkMaintenance').addEventListener('click', () => accionMasiva('maintenance'));
    document.getElementById('bulkDelete').addEventListener('click', () => accionMasiva('delete'));
    document.getElementById('clearSelection').addEventListener('click', limpiarSeleccion);
    
    // Modales
    configurarEventosModales();
}

// Configurar eventos de modales
function configurarEventosModales() {
    // Cerrar modales
    document.querySelectorAll('.close-modal, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            cerrarTodosModales();
        });
    });
    
    // Guardar vehículo
    document.getElementById('saveVehicleBtn').addEventListener('click', guardarVehiculo);
    
    // Confirmar acciones
    document.getElementById('confirmActionBtn').addEventListener('click', ejecutarAccionConfirmada);
    
    // Editar desde detalles
    document.getElementById('editDetailsBtn').addEventListener('click', function() {
        const vehicleId = parseInt(this.getAttribute('data-vehicle-id'));
        if (vehicleId) {
            cerrarModal('detailsModal');
            editarVehiculo(vehicleId);
        }
    });
}

// Abrir modal para nuevo vehículo
function abrirModalNuevo() {
    document.getElementById('modalTitle').textContent = 'Nuevo Vehículo';
    document.getElementById('saveButtonText').textContent = 'Guardar Vehículo';
    document.getElementById('vehicleForm').reset();
    document.getElementById('modalVehicleId').value = '';
    
    // Establecer valores por defecto
    document.getElementById('modalEstado').value = 'active';
    
    abrirModal('vehicleModal');
}

// Abrir modal para editar vehículo
function editarVehiculo(id) {
    const vehiculo = vehiculosDB.find(v => v.id === id);
    if (!vehiculo) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Vehículo';
    document.getElementById('saveButtonText').textContent = 'Actualizar Vehículo';
    
    // Llenar formulario con datos del vehículo
    document.getElementById('modalPlaca').value = vehiculo.placa;
    document.getElementById('modalCodigo').value = vehiculo.codigo;
    document.getElementById('modalChofer').value = vehiculo.chofer.id;
    document.getElementById('modalRuta').value = vehiculo.ruta ? vehiculo.ruta.id : '';
    document.getElementById('modalMarca').value = vehiculo.marca || '';
    document.getElementById('modalModelo').value = vehiculo.modelo || '';
    document.getElementById('modalAnio').value = vehiculo.anio || '';
    document.getElementById('modalCapacidad').value = vehiculo.capacidad || '';
    document.getElementById('modalEstado').value = vehiculo.estado;
    document.getElementById('modalObservaciones').value = vehiculo.observaciones || '';
    document.getElementById('modalVehicleId').value = vehiculo.id;
    
    abrirModal('vehicleModal');
}

// Ver detalles del vehículo
function verDetalles(id) {
    const vehiculo = vehiculosDB.find(v => v.id === id);
    if (!vehiculo) return;
    
    // Formatear detalles
    const detallesHTML = `
        <div class="detail-section">
            <h4><i class="fas fa-id-card"></i> Información Básica</h4>
            <div class="detail-row">
                <div class="detail-label">Placa:</div>
                <div class="detail-value"><strong>${vehiculo.placa}</strong></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Código:</div>
                <div class="detail-value">${vehiculo.codigo}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Chofer:</div>
                <div class="detail-value">${vehiculo.chofer.nombre}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Ruta:</div>
                <div class="detail-value">${vehiculo.ruta ? vehiculo.ruta.nombre : 'Sin asignar'}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-car"></i> Especificaciones</h4>
            <div class="detail-row">
                <div class="detail-label">Marca:</div>
                <div class="detail-value">${vehiculo.marca || 'No especificada'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Modelo:</div>
                <div class="detail-value">${vehiculo.modelo || 'No especificado'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Año:</div>
                <div class="detail-value">${vehiculo.anio || 'No especificado'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Capacidad:</div>
                <div class="detail-value">${vehiculo.capacidad ? vehiculo.capacidad + ' pasajeros' : 'No especificada'}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-info-circle"></i> Estado y Registro</h4>
            <div class="detail-row">
                <div class="detail-label">Estado:</div>
                <div class="detail-value">
                    <span class="status-badge ${getEstadoClase(vehiculo.estado)}">
                        ${getEstadoTexto(vehiculo.estado)}
                    </span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Última actividad:</div>
                <div class="detail-value">${formatFecha(vehiculo.ultimaActividad)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Fecha de registro:</div>
                <div class="detail-value">${vehiculo.createdAt}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-sticky-note"></i> Observaciones</h4>
            <div class="detail-row">
                <div class="detail-value">${vehiculo.observaciones || 'Sin observaciones'}</div>
            </div>
        </div>
    `;
    
    document.getElementById('vehicleDetailsContent').innerHTML = detallesHTML;
    document.getElementById('editDetailsBtn').setAttribute('data-vehicle-id', id);
    
    abrirModal('detailsModal');
}

// Guardar vehículo (crear o actualizar)
function guardarVehiculo() {
    const form = document.getElementById('vehicleForm');
    if (!form.checkValidity()) {
        mostrarMensaje('⚠️ Por favor complete todos los campos requeridos', 'warning');
        return;
    }
    
    const id = document.getElementById('modalVehicleId').value;
    const datos = {
        placa: document.getElementById('modalPlaca').value.toUpperCase(),
        codigo: document.getElementById('modalCodigo').value.toUpperCase(),
        chofer: {
            id: parseInt(document.getElementById('modalChofer').value),
            nombre: document.getElementById('modalChofer').selectedOptions[0].text
        },
        ruta: document.getElementById('modalRuta').value ? {
            id: document.getElementById('modalRuta').value,
            nombre: document.getElementById('modalRuta').selectedOptions[0].text
        } : null,
        marca: document.getElementById('modalMarca').value,
        modelo: document.getElementById('modalModelo').value,
        anio: parseInt(document.getElementById('modalAnio').value) || null,
        capacidad: parseInt(document.getElementById('modalCapacidad').value) || null,
        estado: document.getElementById('modalEstado').value,
        observaciones: document.getElementById('modalObservaciones').value,
        ultimaActividad: new Date().toISOString(),
        createdAt: id ? vehiculosDB.find(v => v.id === parseInt(id)).createdAt : new Date().toISOString().split('T')[0]
    };
    
    if (id) {
        // Actualizar vehículo existente
        const index = vehiculosDB.findIndex(v => v.id === parseInt(id));
        vehiculosDB[index] = { ...vehiculosDB[index], ...datos, id: parseInt(id) };
        mostrarMensaje('✅ Vehículo actualizado correctamente', 'success');
    } else {
        // Crear nuevo vehículo
        const nuevoId = vehiculosDB.length > 0 ? Math.max(...vehiculosDB.map(v => v.id)) + 1 : 1;
        vehiculosDB.push({ ...datos, id: nuevoId });
        mostrarMensaje('✅ Vehículo creado correctamente', 'success');
    }
    
    // Guardar en localStorage
    localStorage.setItem('vehiculosDB', JSON.stringify(vehiculosDB));
    
    cerrarModal('vehicleModal');
    cargarTablaVehiculos();
    cargarEstadisticas();
}

// Eliminar vehículo
function eliminarVehiculo(id) {
    const vehiculo = vehiculosDB.find(v => v.id === id);
    if (!vehiculo) return;
    
    mostrarConfirmacion(
        `¿Está seguro de eliminar el vehículo ${vehiculo.placa}?`,
        () => {
            vehiculosDB = vehiculosDB.filter(v => v.id !== id);
            localStorage.setItem('vehiculosDB', JSON.stringify(vehiculosDB));
            
            selectedVehicles.delete(id);
            cargarTablaVehiculos();
            cargarEstadisticas();
            mostrarMensaje('✅ Vehículo eliminado correctamente', 'success');
        }
    );
}

// Rastrear vehículo
function rastrearVehiculo(id) {
    const vehiculo = vehiculosDB.find(v => v.id === id);
    if (vehiculo && vehiculo.ubicacion) {
        mostrarMensaje(`Redirigiendo al mapa para rastrear ${vehiculo.placa}`, 'info');
        setTimeout(() => {
            window.location.href = `mapa.html?vehiculo=${id}`;
        }, 1000);
    } else {
        mostrarMensaje('⚠️ Este vehículo no tiene ubicación disponible', 'warning');
    }
}

// Acción masiva
function accionMasiva(accion) {
    if (selectedVehicles.size === 0) {
        mostrarMensaje('⚠️ No hay vehículos seleccionados', 'warning');
        return;
    }
    
    let mensaje = '';
    let confirmCallback;
    
    switch(accion) {
        case 'activate':
            mensaje = `¿Activar ${selectedVehicles.size} vehículo(s) seleccionado(s)?`;
            confirmCallback = () => {
                selectedVehicles.forEach(id => {
                    const index = vehiculosDB.findIndex(v => v.id === id);
                    if (index !== -1) vehiculosDB[index].estado = 'active';
                });
                finalizarAccionMasiva('activados');
            };
            break;
            
        case 'deactivate':
            mensaje = `¿Desactivar ${selectedVehicles.size} vehículo(s) seleccionado(s)?`;
            confirmCallback = () => {
                selectedVehicles.forEach(id => {
                    const index = vehiculosDB.findIndex(v => v.id === id);
                    if (index !== -1) vehiculosDB[index].estado = 'inactive';
                });
                finalizarAccionMasiva('desactivados');
            };
            break;
            
        case 'maintenance':
            mensaje = `¿Marcar ${selectedVehicles.size} vehículo(s) como en mantenimiento?`;
            confirmCallback = () => {
                selectedVehicles.forEach(id => {
                    const index = vehiculosDB.findIndex(v => v.id === id);
                    if (index !== -1) vehiculosDB[index].estado = 'maintenance';
                });
                finalizarAccionMasiva('marcados como en mantenimiento');
            };
            break;
            
        case 'delete':
            mensaje = `¿Eliminar ${selectedVehicles.size} vehículo(s) seleccionado(s)? Esta acción no se puede deshacer.`;
            confirmCallback = () => {
                vehiculosDB = vehiculosDB.filter(v => !selectedVehicles.has(v.id));
                finalizarAccionMasiva('eliminados');
            };
            break;
    }
    
    if (mensaje && confirmCallback) {
        mostrarConfirmacion(mensaje, confirmCallback);
    }
}

// Finalizar acción masiva
function finalizarAccionMasiva(accion) {
    localStorage.setItem('vehiculosDB', JSON.stringify(vehiculosDB));
    selectedVehicles.clear();
    
    cargarTablaVehiculos();
    cargarEstadisticas();
    mostrarMensaje(`✅ Vehículos ${accion} correctamente`, 'success');
}

// Limpiar selección
function limpiarSeleccion() {
    selectedVehicles.clear();
    document.querySelectorAll('.vehicle-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('selectAll').checked = false;
    actualizarAccionesMasivas();
}

// Exportar datos
function exportarDatos() {
    const datosExportar = filtrarVehiculos();
    
    // Convertir a CSV
    const headers = ['Placa', 'Código', 'Chofer', 'Ruta', 'Estado', 'Última Actividad'];
    const rows = datosExportar.map(v => [
        v.placa,
        v.codigo,
        v.chofer.nombre,
        v.ruta ? v.ruta.nombre : 'Sin ruta',
        getEstadoTexto(v.estado),
        v.ultimaActividad
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `vehiculos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarMensaje('📊 Datos exportados correctamente', 'success');
}

// Funciones auxiliares para estados
function getEstadoClase(estado) {
    switch(estado) {
        case 'active': return 'status-active';
        case 'inactive': return 'status-inactive';
        case 'maintenance': return 'status-maintenance';
        case 'offline': return 'status-offline';
        default: return '';
    }
}

function getEstadoTexto(estado) {
    switch(estado) {
        case 'active': return 'Activo';
        case 'inactive': return 'Inactivo';
        case 'maintenance': return 'Mantenimiento';
        case 'offline': return 'Sin señal';
        default: return estado;
    }
}

// Funciones para modales
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

function mostrarConfirmacion(mensaje, callback) {
    document.getElementById('confirmMessage').textContent = mensaje;
    document.getElementById('confirmActionBtn').onclick = () => {
        callback();
        cerrarModal('confirmModal');
    };
    abrirModal('confirmModal');
}

function ejecutarAccionConfirmada() {
    // Esta función es manejada dinámicamente por mostrarConfirmacion
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

// Función para actualizar contadores
function actualizarContadores() {
    // Actualizar cada 30 segundos
    setInterval(() => {
        cargarEstadisticas();
    }, 30000);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarVehiculos);