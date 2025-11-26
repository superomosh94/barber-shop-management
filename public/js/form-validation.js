// Form validation for registration and other forms

document.addEventListener('DOMContentLoaded', function() {
    initPasswordValidation();
    initPhoneValidation();
    initRealTimeValidation();
});

// Password strength validation
function initPasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordStrength);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

function validatePasswordStrength() {
    const password = this.value;
    const requirements = {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };
    
    const strength = Object.values(requirements).filter(Boolean).length;
    updatePasswordStrengthIndicator(strength, requirements);
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    const match = password === confirmPassword;
    
    if (confirmPassword) {
        this.classList.toggle('error', !match);
        this.classList.toggle('success', match && password);
    }
}

function updatePasswordStrengthIndicator(strength, requirements) {
    // You can implement a visual strength indicator here
    console.log('Password strength:', strength, requirements);
}

// Phone number validation
function initPhoneValidation() {
    const phoneInput = document.getElementById('phone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
}

function formatPhoneNumber() {
    let value = this.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        value = '(' + value;
    }
    if (value.length > 4) {
        value = value.slice(0, 4) + ') ' + value.slice(4);
    }
    if (value.length > 9) {
        value = value.slice(0, 9) + '-' + value.slice(9, 13);
    }
    
    this.value = value;
}

// Real-time form validation
function initRealTimeValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    });
}

function validateField() {
    const field = this;
    const value = field.value.trim();
    const isValid = field.checkValidity();
    
    if (!isValid) {
        showFieldError(field, getValidationMessage(field));
    } else {
        clearFieldError.call(field);
    }
}

function clearFieldError() {
    this.classList.remove('error');
    
    const errorElement = this.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    `;
    
    field.parentNode.appendChild(errorElement);
}

function getValidationMessage(field) {
    if (field.validity.valueMissing) {
        return 'This field is required';
    }
    
    if (field.validity.typeMismatch) {
        if (field.type === 'email') {
            return 'Please enter a valid email address';
        }
    }
    
    if (field.validity.tooShort) {
        return `Please enter at least ${field.minLength} characters`;
    }
    
    if (field.validity.tooLong) {
        return `Please enter no more than ${field.maxLength} characters`;
    }
    
    if (field.validity.patternMismatch) {
        return 'Please match the requested format';
    }
    
    return 'Please correct this field';
}

// Add CSS for error states
const validationStyles = `
.input-error {
    border-color: #ef4444 !important;
    background-color: #fef2f2 !important;
}

.input-success {
    border-color: #10b981 !important;
    background-color: #f0fdf4 !important;
}

.field-error {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}
`;

const validationStyleSheet = document.createElement('style');
validationStyleSheet.textContent = validationStyles;
document.head.appendChild(validationStyleSheet);