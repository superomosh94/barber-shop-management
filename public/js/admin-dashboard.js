// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initAdminDashboard();
    initRealTimeStats();
    initAdminInteractions();
});

function initAdminDashboard() {
    // Initialize admin-specific functionality
    initUserDropdown();
    initTableSorting();
    initQuickActions();
}

function initUserDropdown() {
    const adminUser = document.querySelector('.admin-user');
    
    if (adminUser) {
        adminUser.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.querySelector('.user-dropdown');
            dropdown.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        const dropdowns = document.querySelectorAll('.user-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });
}

function initTableSorting() {
    const tableHeaders = document.querySelectorAll('.table-header .table-cell');
    
    tableHeaders.forEach(header => {
        if (header.textContent.trim() !== 'Actions') {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                sortTable(this.cellIndex, this.getAttribute('data-sort'));
            });
        }
    });
}

function sortTable(columnIndex, sortType) {
    // Implement table sorting logic here
    console.log(`Sorting column ${columnIndex} by ${sortType}`);
    // This would typically involve sorting the table data and re-rendering
}

function initQuickActions() {
    const actionCards = document.querySelectorAll('.action-card');
    
    actionCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href) {
                window.location.href = href;
            }
        });
    });
}

function initRealTimeStats() {
    // Load real-time stats every 30 seconds
    loadDashboardStats();
    setInterval(loadDashboardStats, 30000);
}

async function loadDashboardStats() {
    try {
        const response = await fetch('/admin/api/dashboard-stats');
        const data = await response.json();
        
        if (data.success) {
            updateStatsDisplay(data.stats);
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

function updateStatsDisplay(stats) {
    // Update stats cards with new data
    const statCards = document.querySelectorAll('.stat-number');
    
    // This would update specific stat cards based on the data
    // For now, we'll just log the updated stats
    console.log('Updated stats:', stats);
}

function initAdminInteractions() {
    // Appointment actions
    const appointmentActions = document.querySelectorAll('.btn-action');
    
    appointmentActions.forEach(action => {
        action.addEventListener('click', function() {
            const appointmentId = this.closest('.table-row').getAttribute('data-id');
            const actionType = this.getAttribute('data-action');
            
            handleAppointmentAction(appointmentId, actionType);
        });
    });
}

async function handleAppointmentAction(appointmentId, actionType) {
    try {
        let endpoint = '';
        let method = 'POST';
        
        switch (actionType) {
            case 'view':
                // Navigate to appointment details
                window.location.href = `/admin/appointments/${appointmentId}`;
                return;
            case 'confirm':
                endpoint = `/admin/appointments/${appointmentId}/confirm`;
                break;
            case 'cancel':
                endpoint = `/admin/appointments/${appointmentId}/cancel`;
                break;
            case 'complete':
                endpoint = `/admin/appointments/${appointmentId}/complete`;
                break;
        }
        
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Action completed successfully', 'success');
            // Refresh the page or update the specific row
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification(data.error || 'Action failed', 'error');
        }
    } catch (error) {
        console.error('Action failed:', error);
        showNotification('Action failed. Please try again.', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    if (type === 'success') {
        notification.style.background = '#10b981';
    } else if (type === 'error') {
        notification.style.background = '#ef4444';
    } else {
        notification.style.background = '#3b82f6';
    }
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Export functions for global access
window.AdminDashboard = {
    showNotification,
    handleAppointmentAction
};