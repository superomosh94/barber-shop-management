document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    const steps = document.querySelectorAll('.form-step');
    const serviceOptions = document.querySelectorAll('input[name="service_id"]');
    const barberOptions = document.querySelectorAll('input[name="barber_id"]');
    const dateInput = document.getElementById('appointment_date');
    const timeSlotsContainer = document.getElementById('timeSlots');
    const appointmentSummary = document.getElementById('appointmentSummary');
    
    let selectedService = null;
    let selectedBarber = null;
    let selectedDateTime = null;

    // Step navigation
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.form-step');
            const nextStepId = this.getAttribute('data-next');
            const nextStep = document.getElementById(nextStepId);
            
            if (validateStep(currentStep.id)) {
                currentStep.classList.remove('active');
                nextStep.classList.add('active');
                updateAppointmentSummary();
            }
        });
    });

    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.form-step');
            const prevStepId = this.getAttribute('data-prev');
            const prevStep = document.getElementById(prevStepId);
            
            currentStep.classList.remove('active');
            prevStep.classList.add('active');
        });
    });

    // Service selection
    serviceOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.checked) {
                selectedService = {
                    id: this.value,
                    name: this.closest('.service-option').querySelector('.option-title').textContent,
                    price: this.getAttribute('data-price'),
                    duration: this.getAttribute('data-duration')
                };
            }
        });
    });

    // Barber selection
    barberOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.checked) {
                selectedBarber = {
                    id: this.value,
                    name: this.closest('.barber-option').querySelector('.barber-name').textContent
                };
                
                // Reset date and time when barber changes
                if (dateInput.value) {
                    dateInput.value = '';
                    timeSlotsContainer.innerHTML = '<p class="help-text">Please select a date first to see available time slots</p>';
                }
            }
        });
    });

    // Date selection
    dateInput.addEventListener('change', function() {
        if (selectedBarber && this.value) {
            fetchAvailableTimeSlots(selectedBarber.id, this.value);
        }
    });

    // Form submission
    bookingForm.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            alert('Please complete all required fields before submitting.');
        }
    });

    function validateStep(stepId) {
        switch (stepId) {
            case 'step1':
                if (!selectedService) {
                    alert('Please select a service');
                    return false;
                }
                return true;
                
            case 'step2':
                if (!selectedBarber) {
                    alert('Please select a barber');
                    return false;
                }
                return true;
                
            case 'step3':
                if (!dateInput.value || !selectedDateTime) {
                    alert('Please select a date and time');
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    }

    function validateForm() {
        return selectedService && selectedBarber && dateInput.value && selectedDateTime;
    }

    async function fetchAvailableTimeSlots(barberId, date) {
        try {
            timeSlotsContainer.innerHTML = '<p class="help-text">Loading available time slots...</p>';
            
            const response = await fetch(`/appointments/api/available-slots?barber_id=${barberId}&date=${date}`);
            const data = await response.json();
            
            if (data.success) {
                displayTimeSlots(data.slots);
            } else {
                timeSlotsContainer.innerHTML = `<p class="help-text error">${data.error || 'Failed to load time slots'}</p>`;
            }
        } catch (error) {
            console.error('Error fetching time slots:', error);
            timeSlotsContainer.innerHTML = '<p class="help-text error">Failed to load available time slots. Please try again.</p>';
        }
    }

    function displayTimeSlots(slots) {
        if (slots.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="help-text">No available time slots for this date. Please select another date.</p>';
            return;
        }

        timeSlotsContainer.innerHTML = '';
        slots.forEach(slot => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = slot.display;
            timeSlot.setAttribute('data-time', slot.time);
            
            timeSlot.addEventListener('click', function() {
                // Remove selected class from all slots
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                
                // Add selected class to clicked slot
                this.classList.add('selected');
                
                // Set the selected date time
                selectedDateTime = this.getAttribute('data-time');
                
                // Update summary
                updateAppointmentSummary();
            });
            
            timeSlotsContainer.appendChild(timeSlot);
        });
    }

    function updateAppointmentSummary() {
        if (!appointmentSummary) return;

        const summaryService = document.getElementById('summaryService');
        const summaryBarber = document.getElementById('summaryBarber');
        const summaryDateTime = document.getElementById('summaryDateTime');
        const summaryDuration = document.getElementById('summaryDuration');
        const summaryTotal = document.getElementById('summaryTotal');

        if (summaryService) {
            summaryService.textContent = selectedService ? selectedService.name : '-';
        }
        
        if (summaryBarber) {
            summaryBarber.textContent = selectedBarber ? selectedBarber.name : '-';
        }
        
        if (summaryDateTime && selectedDateTime) {
            const dateTime = new Date(selectedDateTime);
            summaryDateTime.textContent = dateTime.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else if (summaryDateTime) {
            summaryDateTime.textContent = '-';
        }
        
        if (summaryDuration) {
            summaryDuration.textContent = selectedService ? `${selectedService.duration} minutes` : '-';
        }
        
        if (summaryTotal) {
            summaryTotal.textContent = selectedService ? `$${selectedService.price}` : '$0.00';
        }
    }
});