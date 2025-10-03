// Global state
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
});

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
            loadDashboardData();
        } else {
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

// Show/hide pages
function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('dashboard-page').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('user-info').textContent = `${currentUser.username} (${currentUser.role})`;
    
    // Hide users tab if not admin
    if (currentUser.role !== 'admin') {
        document.getElementById('usuarios-tab').style.display = 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // New sale button
    document.getElementById('new-sale-btn').addEventListener('click', () => openSaleModal());
    
    // Sale form
    document.getElementById('sale-form').addEventListener('submit', handleSaleSubmit);
    document.getElementById('cancel-sale-btn').addEventListener('click', closeSaleModal);
    
    // New claim button
    document.getElementById('new-claim-btn').addEventListener('click', openClaimModal);
    
    // Claim form
    document.getElementById('claim-form').addEventListener('submit', handleClaimSubmit);
    document.getElementById('cancel-claim-btn').addEventListener('click', closeClaimModal);
    
    // New user button
    document.getElementById('new-user-btn').addEventListener('click', () => openUserModal());
    
    // User form
    document.getElementById('user-form').addEventListener('submit', handleUserSubmit);
    document.getElementById('cancel-user-btn').addEventListener('click', closeUserModal);
    
    // Show archived checkbox
    document.getElementById('show-archived').addEventListener('change', loadSales);
    
    // Close modals when clicking X or outside
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showDashboard();
            loadDashboardData();
        } else {
            document.getElementById('login-error').textContent = data.error;
        }
    } catch (error) {
        document.getElementById('login-error').textContent = 'Error de conexión';
    }
}

// Logout handler
async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    showLogin();
    document.getElementById('login-form').reset();
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    const tabContent = document.getElementById(`${tabName}-tab`) || document.getElementById(`${tabName}-tab-content`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Load data for the selected tab
    if (tabName === 'ventas') loadSales();
    if (tabName === 'reclamos') loadClaims();
    if (tabName === 'usuarios') loadUsers();
}

// Load dashboard data
function loadDashboardData() {
    loadSales();
}

// Load sales
async function loadSales() {
    const showArchived = document.getElementById('show-archived').checked;
    const url = `/api/sales?includeArchived=${showArchived}`;
    
    try {
        const response = await fetch(url);
        const sales = await response.json();
        
        const tbody = document.getElementById('sales-tbody');
        tbody.innerHTML = '';
        
        sales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.id}</td>
                <td>${sale.cliente_nombre}</td>
                <td>${sale.cliente_telefono}</td>
                <td>${sale.marca}</td>
                <td>${sale.modelo}</td>
                <td>${sale.ano}</td>
                <td>${sale.parte}</td>
                <td>$${parseFloat(sale.precio).toFixed(2)}</td>
                <td>${formatDate(sale.fecha)}</td>
                <td><span class="status-badge status-${sale.estatus}">${sale.estatus}</span></td>
                <td>${sale.vendedor_username}</td>
                <td class="actions">
                    ${canUpdateStatus() ? `
                        <select onchange="updateSaleStatus(${sale.id}, this.value)" class="btn-small">
                            <option value="">Cambiar estatus...</option>
                            <option value="buscando" ${sale.estatus === 'buscando' ? 'disabled' : ''}>Buscando</option>
                            <option value="listo" ${sale.estatus === 'listo' ? 'disabled' : ''}>Listo</option>
                            <option value="entregado" ${sale.estatus === 'entregado' ? 'disabled' : ''}>Entregado</option>
                            <option value="reembolsado" ${sale.estatus === 'reembolsado' ? 'disabled' : ''}>Reembolsado</option>
                        </select>
                    ` : ''}
                    ${currentUser.role === 'admin' ? `
                        <button onclick="editSale(${sale.id})" class="btn btn-primary btn-small">Editar</button>
                        <button onclick="deleteSale(${sale.id})" class="btn btn-danger btn-small">Eliminar</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading sales:', error);
    }
}

// Load claims
async function loadClaims() {
    try {
        const response = await fetch('/api/claims');
        const claims = await response.json();
        
        const tbody = document.getElementById('claims-tbody');
        tbody.innerHTML = '';
        
        claims.forEach(claim => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${claim.id}</td>
                <td>${claim.venta_id}</td>
                <td>${claim.cliente_nombre}</td>
                <td>${claim.parte}</td>
                <td>${claim.tipo}</td>
                <td>${claim.descripcion}</td>
                <td><span class="status-badge status-${claim.estatus}">${claim.estatus}</span></td>
                <td>${formatDate(claim.created_at)}</td>
                <td class="actions">
                    ${canUpdateStatus() ? `
                        <select onchange="updateClaimStatus(${claim.id}, this.value)" class="btn-small">
                            <option value="">Cambiar estatus...</option>
                            <option value="abierto" ${claim.estatus === 'abierto' ? 'disabled' : ''}>Abierto</option>
                            <option value="procesando" ${claim.estatus === 'procesando' ? 'disabled' : ''}>Procesando</option>
                            <option value="resuelto" ${claim.estatus === 'resuelto' ? 'disabled' : ''}>Resuelto</option>
                            <option value="rechazado" ${claim.estatus === 'rechazado' ? 'disabled' : ''}>Rechazado</option>
                        </select>
                    ` : ''}
                    ${currentUser.role === 'admin' ? `
                        <button onclick="deleteClaim(${claim.id})" class="btn btn-danger btn-small">Eliminar</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading claims:', error);
    }
}

// Load users
async function loadUsers() {
    if (currentUser.role !== 'admin') return;
    
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>${formatDate(user.created_at)}</td>
                <td class="actions">
                    <button onclick="editUser(${user.id})" class="btn btn-primary btn-small">Editar</button>
                    <button onclick="deleteUser(${user.id})" class="btn btn-danger btn-small">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Sale modal functions
function openSaleModal(saleId = null) {
    if (!canCreateSale()) {
        alert('No tienes permisos para crear ventas');
        return;
    }
    
    const modal = document.getElementById('sale-modal');
    const form = document.getElementById('sale-form');
    form.reset();
    document.getElementById('sale-error').textContent = '';
    
    if (saleId) {
        document.getElementById('sale-modal-title').textContent = 'Editar Venta';
        document.getElementById('estatus-group').style.display = 'block';
        loadSaleData(saleId);
    } else {
        document.getElementById('sale-modal-title').textContent = 'Nueva Venta';
        document.getElementById('estatus-group').style.display = 'none';
        document.getElementById('sale-id').value = '';
        // Set today's date as default
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    }
    
    modal.classList.add('show');
}

function closeSaleModal() {
    document.getElementById('sale-modal').classList.remove('show');
}

async function loadSaleData(id) {
    try {
        const response = await fetch(`/api/sales/${id}`);
        const sale = await response.json();
        
        document.getElementById('sale-id').value = sale.id;
        document.getElementById('cliente_nombre').value = sale.cliente_nombre;
        document.getElementById('cliente_telefono').value = sale.cliente_telefono;
        document.getElementById('marca').value = sale.marca;
        document.getElementById('modelo').value = sale.modelo;
        document.getElementById('ano').value = sale.ano;
        document.getElementById('parte').value = sale.parte;
        document.getElementById('precio').value = sale.precio;
        document.getElementById('fecha').value = sale.fecha;
        document.getElementById('estatus').value = sale.estatus;
    } catch (error) {
        console.error('Error loading sale:', error);
    }
}

async function handleSaleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('sale-id').value;
    const data = {
        cliente_nombre: document.getElementById('cliente_nombre').value,
        cliente_telefono: document.getElementById('cliente_telefono').value,
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        ano: parseInt(document.getElementById('ano').value),
        parte: document.getElementById('parte').value,
        precio: parseFloat(document.getElementById('precio').value),
        fecha: document.getElementById('fecha').value
    };
    
    if (id) {
        data.estatus = document.getElementById('estatus').value;
    }
    
    try {
        const url = id ? `/api/sales/${id}` : '/api/sales';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeSaleModal();
            loadSales();
        } else {
            document.getElementById('sale-error').textContent = result.error;
        }
    } catch (error) {
        document.getElementById('sale-error').textContent = 'Error de conexión';
    }
}

async function editSale(id) {
    openSaleModal(id);
}

async function deleteSale(id) {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
    
    try {
        const response = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadSales();
        }
    } catch (error) {
        console.error('Error deleting sale:', error);
    }
}

async function updateSaleStatus(id, estatus) {
    if (!estatus) return;
    
    try {
        const response = await fetch(`/api/sales/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estatus })
        });
        
        if (response.ok) {
            loadSales();
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Claim modal functions
function openClaimModal() {
    const modal = document.getElementById('claim-modal');
    document.getElementById('claim-form').reset();
    document.getElementById('claim-error').textContent = '';
    modal.classList.add('show');
}

function closeClaimModal() {
    document.getElementById('claim-modal').classList.remove('show');
}

async function handleClaimSubmit(e) {
    e.preventDefault();
    
    const data = {
        venta_id: parseInt(document.getElementById('venta_id').value),
        tipo: document.getElementById('tipo').value,
        descripcion: document.getElementById('descripcion').value
    };
    
    try {
        const response = await fetch('/api/claims', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeClaimModal();
            loadClaims();
        } else {
            document.getElementById('claim-error').textContent = result.error;
        }
    } catch (error) {
        document.getElementById('claim-error').textContent = 'Error de conexión';
    }
}

async function updateClaimStatus(id, estatus) {
    if (!estatus) return;
    
    try {
        const response = await fetch(`/api/claims/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estatus })
        });
        
        if (response.ok) {
            loadClaims();
        }
    } catch (error) {
        console.error('Error updating claim status:', error);
    }
}

async function deleteClaim(id) {
    if (!confirm('¿Estás seguro de eliminar este reclamo?')) return;
    
    try {
        const response = await fetch(`/api/claims/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadClaims();
        }
    } catch (error) {
        console.error('Error deleting claim:', error);
    }
}

// User modal functions
function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    form.reset();
    document.getElementById('user-error').textContent = '';
    
    if (userId) {
        document.getElementById('user-modal-title').textContent = 'Editar Usuario';
        document.getElementById('password-hint').style.display = 'block';
        document.getElementById('user-password').removeAttribute('required');
        loadUserData(userId);
    } else {
        document.getElementById('user-modal-title').textContent = 'Nuevo Usuario';
        document.getElementById('password-hint').style.display = 'none';
        document.getElementById('user-password').setAttribute('required', 'required');
        document.getElementById('user-id').value = '';
    }
    
    modal.classList.add('show');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('show');
}

async function loadUserData(id) {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        const user = users.find(u => u.id === id);
        
        if (user) {
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-role').value = user.role;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('user-id').value;
    const data = {
        username: document.getElementById('user-username').value,
        role: document.getElementById('user-role').value
    };
    
    const password = document.getElementById('user-password').value;
    if (password) {
        data.password = password;
    }
    
    try {
        const url = id ? `/api/users/${id}` : '/api/users';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeUserModal();
            loadUsers();
        } else {
            document.getElementById('user-error').textContent = result.error;
        }
    } catch (error) {
        document.getElementById('user-error').textContent = 'Error de conexión';
    }
}

async function editUser(id) {
    openUserModal(id);
}

async function deleteUser(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
        const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadUsers();
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function canCreateSale() {
    return ['vendedor', 'admin'].includes(currentUser.role);
}

function canUpdateStatus() {
    return ['dueno', 'admin'].includes(currentUser.role);
}
