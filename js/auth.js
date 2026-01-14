// ============================================
// MÓDULO DE AUTENTICACIÓN
// ============================================

// Verificar si el usuario ya está logueado
function verificarSesion() {
    const paginasProtegidas = ['dashboard.html', 'vehiculos.html', 'rutas.html', 'mapa.html'];
    const paginaActual = window.location.pathname.split('/').pop();
    
    if (paginasProtegidas.includes(paginaActual)) {
        if (!localStorage.getItem('empresa_logueada')) {
            window.location.href = 'index.html';
            return false;
        }
    }
    return true;
}

// Alternar visibilidad de contraseña
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('#togglePassword i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

// Validar formato de email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = mensaje;
    errorElement.style.opacity = '1';
    
    setTimeout(() => {
        errorElement.style.opacity = '0';
    }, 5000);
}

// Simular login (luego se conectará al servidor real)
async function simularLogin(email, password) {
    // Simulación de delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Credenciales de prueba (en producción esto vendría del servidor)
    const usuariosDemo = [
        { email: 'admin@transporte.com', password: 'admin123', nombre: 'Transporte Rápido S.A.' },
        { email: 'empresa@ejemplo.com', password: 'demo123', nombre: 'Empresa Demo' }
    ];
    
    const usuario = usuariosDemo.find(u => u.email === email && u.password === password);
    
    if (usuario) {
        return {
            success: true,
            data: {
                token: 'simulated_token_' + Date.now(),
                empresa: usuario.nombre,
                email: usuario.email
            }
        };
    } else {
        return {
            success: false,
            error: 'Credenciales incorrectas. Use admin@transporte.com / admin123 para demo.'
        };
    }
}

// Manejar el envío del formulario de login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Validaciones
    if (!email || !password) {
        mostrarError('Por favor complete todos los campos');
        return;
    }
    
    if (!validarEmail(email)) {
        mostrarError('Por favor ingrese un correo electrónico válido');
        return;
    }
    
    // Mostrar estado de carga
    const loginBtn = document.querySelector('.btn-login');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    loginBtn.disabled = true;
    
    try {
        // Simular llamada al servidor
        const resultado = await simularLogin(email, password);
        
        if (resultado.success) {
            // Guardar datos en localStorage
            localStorage.setItem('empresa_logueada', 'true');
            localStorage.setItem('empresa_token', resultado.data.token);
            localStorage.setItem('empresa_nombre', resultado.data.empresa);
            localStorage.setItem('empresa_email', resultado.data.email);
            
            // Guardar sesión si se seleccionó "Recordar"
            if (remember) {
                localStorage.setItem('remember_session', 'true');
            }
            
            // Redirigir al dashboard
            mostrarError('¡Login exitoso! Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } else {
            mostrarError(resultado.error);
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
        
    } catch (error) {
        mostrarError('Error de conexión. Intente nuevamente.');
        console.error('Error en login:', error);
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// Manejar logout
function handleLogout() {
    // Limpiar localStorage
    localStorage.removeItem('empresa_logueada');
    localStorage.removeItem('empresa_token');
    localStorage.removeItem('empresa_nombre');
    localStorage.removeItem('empresa_email');
    
    // Redirigir al login
    window.location.href = 'index.html';
}

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesión al cargar
    verificarSesion();
    
    // Configurar botón de mostrar/ocultar contraseña
    const toggleBtn = document.getElementById('togglePassword');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // Configurar formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Configurar botón de registro (demo)
    const registerBtn = document.querySelector('.btn-register');
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            mostrarError('Funcionalidad de registro en desarrollo. Use las credenciales demo.');
        });
    }
    
    // Configurar link de olvidó contraseña
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarError('Funcionalidad de recuperación en desarrollo. Contacte al administrador.');
        });
    }
    
    // Rellenar con datos demo para facilitar pruebas
    if (window.location.pathname.includes('index.html')) {
        document.getElementById('email').value = 'admin@transporte.com';
        document.getElementById('password').value = 'admin123';
    }
});