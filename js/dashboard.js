// ============================================
// MÓDULO DEL DASHBOARD
// ============================================

// Datos de ejemplo para simulación
const datosDemo = {
    empresa: {
        nombre: "Transporte Rápido S.A.",
        email: "admin@transporte.com"
    },
    estadisticas: {
        vehiculosTotales: 12,
        vehiculosActivos: 8,
        rutasActivas: 5,
        choferesActivos: 10,
        incidentes: 2
    },
    vehiculos: [
        { id: 1, placa: "ABC-123", chofer: "Juan Pérez", ruta: "Ruta Centro", estado: "moving", ubicacion: "Av. Principal km 5", velocidad: "45 km/h", ultimaActualizacion: "2 min" },
        { id: 2, placa: "DEF-456", chofer: "María López", ruta: "Ruta Norte", estado: "stopped", ubicacion: "Estación Central", velocidad: "0 km/h", ultimaActualizacion: "5 min" },
        { id: 3, placa: "GHI-789", chofer: "Carlos Ruiz", ruta: "Ruta Sur", estado: "moving", ubicacion: "Calle Comercio 123", velocidad: "60 km/h", ultimaActualizacion: "1 min" },
        { id: 4, placa: "JKL-012", chofer: "Ana García", ruta: "Ruta Este", estado: "offline", ubicacion: "Sin señal", velocidad: "--", ultimaActualizacion: "15 min" },
        { id: 5, placa: "MNO-345", chofer: "Roberto Sánchez", ruta: "Ruta Oeste", estado: "moving", ubicacion: "Av. Libertad 456", velocidad: "30 km/h", ultimaActualizacion: "3 min" }
    ],
    actividades: [
        { id: 1, tipo: "warning", icon: "exclamation-triangle", titulo: "Vehículo DEF-456 detenido más de 10 min", tiempo: "Hace 5 minutos" },
        { id: 2, tipo: "info", icon: "bus", titulo: "Vehículo ABC-123 inició ruta", tiempo: "Hace 15 minutos" },
        { id: 3, tipo: "success", icon: "check-circle", titulo: "Ruta Centro completada", tiempo: "Hace 30 minutos" },
        { id: 4, tipo: "danger", icon: "times-circle", titulo: "Vehículo JKL-012 sin señal", tiempo: "Hace 45 minutos" },
        { id: 5, tipo: "info", icon: "user", titulo: "Chofer María López inició turno", tiempo: "Hace 1 hora" }
    ],
    notificaciones: [
        { id: 1, tipo: "warning", mensaje: "Vehículo DEF-456 está detenido en Estación Central hace 12 minutos", tiempo: "Hace 2 min" },
        { id: 2, tipo: "danger", mensaje: "Vehículo JKL-012 sin señal GPS", tiempo: "Hace 15 min" },
        { id: 3, tipo: "info", mensaje: "Nueva actualización del sistema disponible", tiempo: "Hace 1 hora" }
    ]
};

// Inicializar dashboard
function inicializarDashboard() {
    cargarDatosUsuario();
    actualizarFechaHora();
    cargarEstadisticas();
    cargarVehiculos();
    cargarActividades();
    configurarEventos();
    iniciarActualizacionAutomatica();
    
    console.log("✅ Dashboard inicializado correctamente");
}

// Cargar datos del usuario desde localStorage
function cargarDatosUsuario() {
    const nombreEmpresa = localStorage.getItem('empresa_nombre') || datosDemo.empresa.nombre;
    const emailUsuario = localStorage.getItem('empresa_email') || datosDemo.empresa.email;
    const nombreUsuario = localStorage.getItem('empresa_nombre') || "Administrador";
    
    // Actualizar elementos del DOM
    document.getElementById('companyName').textContent = nombreEmpresa;
    document.getElementById('userName').textContent = nombreUsuario;
    document.getElementById('userEmail').textContent = emailUsuario;
}

// Actualizar fecha y hora
function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const fechaFormateada = ahora.toLocaleDateString('es-ES', opciones);
    document.getElementById('currentDate').textContent = fechaFormateada;
    
    // Actualizar última actualización
    const horaFormateada = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdateTime').textContent = horaFormateada;
    document.getElementById('lastPing').textContent = ahora.toLocaleTimeString('es-ES');
}

// Cargar estadísticas
function cargarEstadisticas() {
    const stats = datosDemo.estadisticas;
    
    document.getElementById('vehiculosCount').textContent = stats.vehiculosTotales;
    document.getElementById('rutasCount').textContent = stats.rutasActivas;
    document.getElementById('activeVehicles').textContent = stats.vehiculosActivos;
    document.getElementById('activeRoutes').textContent = stats.rutasActivas;
    document.getElementById('activeDrivers').textContent = stats.choferesActivos;
    document.getElementById('incidents').textContent = stats.incidentes;
}

// Cargar tabla de vehículos
function cargarVehiculos(filtro = 'all') {
    const tbody = document.getElementById('vehicleTableBody');
    tbody.innerHTML = '';
    
    let vehiculosFiltrados = datosDemo.vehiculos;
    
    if (filtro !== 'all') {
        vehiculosFiltrados = datosDemo.vehiculos.filter(v => v.estado === filtro);
    }
    
    vehiculosFiltrados.forEach(vehiculo => {
        const tr = document.createElement('tr');
        
        // Determinar clase de estado
        let estadoClase = '';
        let estadoTexto = '';
        switch(vehiculo.estado) {
            case 'moving':
                estadoClase = 'status-moving';
                estadoTexto = 'En movimiento';
                break;
            case 'stopped':
                estadoClase = 'status-stopped';
                estadoTexto = 'Detenido';
                break;
            case 'offline':
                estadoClase = 'status-offline';
                estadoTexto = 'Sin señal';
                break;
        }
        
        tr.innerHTML = `
            <td><strong>${vehiculo.placa}</strong></td>
            <td>${vehiculo.chofer}</td>
            <td>${vehiculo.ruta}</td>
            <td><span class="status-badge ${estadoClase}">${estadoTexto}</span></td>
            <td>${vehiculo.ubicacion}</td>
            <td>${vehiculo.velocidad}</td>
            <td>
                <button class="btn-action btn-track" onclick="rastrearVehiculo(${vehiculo.id})">
                    <i class="fas fa-map-marker-alt"></i> Rastrear
                </button>
                <button class="btn-action btn-details" onclick="verDetallesVehiculo(${vehiculo.id})">
                    <i class="fas fa-info-circle"></i> Detalles
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Cargar actividades recientes
function cargarActividades() {
    const container = document.getElementById('activityList');
    container.innerHTML = '';
    
    datosDemo.actividades.forEach(actividad => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        
        // Determinar color según tipo
        let colorClase = '';
        switch(actividad.tipo) {
            case 'warning': colorClase = 'bg-warning'; break;
            case 'danger': colorClase = 'bg-danger'; break;
            case 'success': colorClase = 'bg-success'; break;
            default: colorClase = 'bg-info';
        }
        
        div.innerHTML = `
            <div class="activity-icon ${colorClase}">
                <i class="fas fa-${actividad.icon}"></i>
            </div>
            <div class="activity-info">
                <div class="activity-title">${actividad.titulo}</div>
                <div class="activity-time">${actividad.tiempo}</div>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// Cargar notificaciones en el modal
function cargarNotificaciones() {
    const container = document.getElementById('notificationsList');
    container.innerHTML = '';
    
    if (datosDemo.notificaciones.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No hay notificaciones nuevas</p>';
        return;
    }
    
    datosDemo.notificaciones.forEach(notificacion => {
        const div = document.createElement('div');
        div.className = 'notification-item';
        div.style.cssText = `
            padding: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            gap: 15px;
        `;
        
        let icono = '';
        let color = '';
        
        switch(notificacion.tipo) {
            case 'warning':
                icono = 'exclamation-triangle';
                color = '#f39c12';
                break;
            case 'danger':
                icono = 'times-circle';
                color = '#e74c3c';
                break;
            default:
                icono = 'info-circle';
                color = '#3498db';
        }
        
        div.innerHTML = `
            <div style="color: ${color}; font-size: 18px;">
                <i class="fas fa-${icono}"></i>
            </div>
            <div style="flex: 1;">
                <p style="margin: 0 0 5px 0; color: #2c3e50;">${notificacion.mensaje}</p>
                <small style="color: #95a5a6;">${notificacion.tiempo}</small>
            </div>
            <button class="btn-dismiss" data-id="${notificacion.id}" style="background: none; border: none; color: #95a5a6; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(div);
    });
    
    // Agregar event listeners a botones de descartar
    document.querySelectorAll('.btn-dismiss').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            descartarNotificacion(id);
        });
    });
}

// Configurar eventos
function configurarEventos() {
    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Botón de actualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            this.disabled = true;
            
            // Simular actualización
            setTimeout(() => {
                actualizarFechaHora();
                cargarEstadisticas();
                cargarVehiculos();
                cargarActividades();
                
                this.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
                this.disabled = false;
                
                mostrarMensajeTemporal('✅ Datos actualizados correctamente', 'success');
            }, 1000);
        });
    }
    
    // Botón de notificaciones
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', function() {
            cargarNotificaciones();
            document.getElementById('notificationsModal').style.display = 'flex';
        });
    }
    
    // Botón para abrir mapa completo
    const openMapBtn = document.getElementById('openMapBtn');
    if (openMapBtn) {
        openMapBtn.addEventListener('click', function() {
            window.location.href = 'mapa.html';
        });
    }
    
    // Filtros de vehículos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            // Aplicar filtro
            const filtro = this.getAttribute('data-filter');
            cargarVehiculos(filtro);
        });
    });
    
    // Cerrar modal
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            document.getElementById('notificationsModal').style.display = 'none';
        });
    }
    
    const closeModalX = document.querySelector('.close-modal');
    if (closeModalX) {
        closeModalX.addEventListener('click', function() {
            document.getElementById('notificationsModal').style.display = 'none';
        });
    }
    
    // Limpiar notificaciones
    const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', function() {
            datosDemo.notificaciones = [];
            document.querySelector('.notification-count').textContent = '0';
            cargarNotificaciones();
            mostrarMensajeTemporal('Notificaciones limpiadas', 'info');
        });
    }
    
    // Cerrar modal haciendo clic fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('notificationsModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Iniciar actualización automática
function iniciarActualizacionAutomatica() {
    // Actualizar cada 30 segundos
    setInterval(() => {
        actualizarFechaHora();
        
        // Simular cambios en los datos
        datosDemo.estadisticas.vehiculosActivos = Math.floor(Math.random() * 8) + 5;
        cargarEstadisticas();
        
        // Actualizar contador de notificaciones
        const countElement = document.querySelector('.notification-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent);
            if (Math.random() > 0.7 && currentCount < 10) {
                countElement.textContent = currentCount + 1;
            }
        }
    }, 30000);
    
    console.log("🔄 Actualización automática iniciada (cada 30 segundos)");
}

// Funciones auxiliares
function rastrearVehiculo(id) {
    mostrarMensajeTemporal(`Redirigiendo al mapa para rastrear vehículo #${id}`, 'info');
    setTimeout(() => {
        window.location.href = 'mapa.html?vehiculo=' + id;
    }, 1000);
}

function verDetallesVehiculo(id) {
    mostrarMensajeTemporal(`Mostrando detalles del vehículo #${id}`, 'info');
    // En una implementación real, esto abriría un modal o página de detalles
}

function descartarNotificacion(id) {
    datosDemo.notificaciones = datosDemo.notificaciones.filter(n => n.id !== id);
    cargarNotificaciones();
    
    // Actualizar contador
    const countElement = document.querySelector('.notification-count');
    if (countElement) {
        const currentCount = parseInt(countElement.textContent);
        countElement.textContent = Math.max(0, currentCount - 1);
    }
}

function mostrarMensajeTemporal(mensaje, tipo = 'info') {
    // Crear elemento de mensaje
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = 'temp-message';
    mensajeDiv.textContent = mensaje;
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#27ae60' : tipo === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(mensajeDiv);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        mensajeDiv.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.parentNode.removeChild(mensajeDiv);
            }
        }, 300);
    }, 3000);
}

// Agregar animaciones CSS dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .bg-warning { background: #fef9e7; color: #f39c12; }
    .bg-danger { background: #fdedec; color: #e74c3c; }
    .bg-success { background: #e8f8f5; color: #27ae60; }
    .bg-info { background: #e8f4fc; color: #3498db; }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación primero
    if (!localStorage.getItem('empresa_logueada')) {
        window.location.href = 'index.html';
        return;
    }
    
    inicializarDashboard();
});