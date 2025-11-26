// Calendar functionality for appointment booking

class BarberCalendar {
    constructor(options = {}) {
        this.container = options.container;
        this.onDateSelect = options.onDateSelect;
        this.availableDates = options.availableDates || [];
        this.selectedDate = null;
        
        this.init();
    }
    
    init() {
        this.render();
        this.bindEvents();
    }
    
    render() {
        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();
        
        this.container.innerHTML = this.generateCalendarHTML(month, year);
    }
    
    generateCalendarHTML(month, year) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const monthName = firstDay.toLocaleString('default', { month: 'long' });
        
        let html = `
            <div class="calendar-header">
                <button class="calendar-nav prev-month" data-action="prev">‹</button>
                <h3 class="calendar-title">${monthName} ${year}</h3>
                <button class="calendar-nav next-month" data-action="next">›</button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                        .map(day => `<div class="weekday">${day}</div>`)
                        .join('')}
                </div>
                <div class="calendar-days">
        `;
        
        // Previous month days
        for (let i = 0; i < startingDay; i++) {
            html += `<div class="calendar-day other-month"></div>`;
        }
        
        // Current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const isToday = this.isToday(date);
            const isAvailable = this.isDateAvailable(date);
            const isSelected = this.isDateSelected(date);
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (isAvailable) dayClass += ' available';
            if (isSelected) dayClass += ' selected';
            if (!isAvailable) dayClass += ' unavailable';
            
            html += `
                <div class="${dayClass}" data-date="${date.toISOString()}">
                    <span class="day-number">${day}</span>
                    ${isAvailable ? '<span class="availability-dot"></span>' : ''}
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const target = e.target;
            
            // Navigation
            if (target.classList.contains('calendar-nav')) {
                this.handleNavigation(target.getAttribute('data-action'));
                return;
            }
            
            // Date selection
            const dayElement = target.closest('.calendar-day.available');
            if (dayElement) {
                this.selectDate(dayElement.getAttribute('data-date'));
            }
        });
    }
    
    handleNavigation(direction) {
        // This would navigate to previous/next month
        console.log(`Navigate ${direction}`);
        // Implementation would update the calendar view
    }
    
    selectDate(dateString) {
        this.selectedDate = new Date(dateString);
        
        // Update UI
        this.container.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        const selectedDay = this.container.querySelector(`[data-date="${dateString}"]`);
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }
        
        // Call callback
        if (this.onDateSelect) {
            this.onDateSelect(this.selectedDate);
        }
    }
    
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
    
    isDateAvailable(date) {
        // Check if date is in availableDates array
        const dateString = date.toISOString().split('T')[0];
        return this.availableDates.some(availableDate => 
            availableDate.date === dateString && availableDate.available
        );
    }
    
    isDateSelected(date) {
        if (!this.selectedDate) return false;
        return date.toDateString() === this.selectedDate.toDateString();
    }
}

// Initialize calendar when needed
function initCalendar(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (container) {
        return new BarberCalendar({
            container,
            ...options
        });
    }
}

// Export for global use
window.BarberCalendar = BarberCalendar;
window.initCalendar = initCalendar;