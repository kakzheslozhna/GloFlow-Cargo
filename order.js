document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('multi-step-form');
    const formContainer = document.querySelector('.form-container');
    const formStepsContainer = document.querySelector('.form-steps-container');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const successScreen = document.querySelector('.form-success');
    let currentStep = 1;

    // --- Обновление прогресс-бара и индикаторов ---
    const updateProgressIndicators = () => {
        const progressBarFill = document.querySelector('.progress-bar-fill');
        const progressSteps = document.querySelectorAll('.progress-step');
        const mobileStepIndicator = document.getElementById('mobile-current-step');
        
        const percent = ((currentStep - 1) / (steps.length - 1)) * 100;
        if (progressBarFill) progressBarFill.style.width = `${percent}%`;
        
        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index < currentStep);
        });

        if (mobileStepIndicator) mobileStepIndicator.textContent = currentStep;
    };

    // --- Логика перехода между шагами ---
    const goToStep = (stepNumber) => {
        currentStep = stepNumber;
        steps.forEach((step, index) => {
            step.classList.toggle('active', (index + 1) === currentStep);
        });
        formContainer.classList.add('is-transitioning');
        // This calculation is for a 4-step form
        const offset = -(currentStep - 1) * 25; 
        formStepsContainer.style.transform = `translateX(${offset}%)`;
        updateProgressIndicators();
        
        const transitionDuration = parseFloat(getComputedStyle(formStepsContainer).transitionDuration) * 1000;
        if (transitionDuration > 0) {
            formStepsContainer.addEventListener('transitionend', () => {
                formContainer.classList.remove('is-transitioning');
            }, { once: true });
        } else {
            formContainer.classList.remove('is-transitioning');
        }
    };

    // --- Валидация текущего шага ---
    const validateStep = (stepNumber) => {
        let isValid = true;
        const currentStepElement = steps[stepNumber - 1];
        const inputs = currentStepElement.querySelectorAll('input:not([type="hidden"]), select');
        
        inputs.forEach(input => {
            if (!input.required) return;
            
            const parentGroup = input.closest('.form-group');
            let isInputValid = false;

            if (input.type === 'checkbox') {
                isInputValid = input.checked;
            } 
            else if (input.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isInputValid = emailRegex.test(input.value);
            } 
            else if (input.type === 'tel') {
                isInputValid = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(input.value);
            } else {
                isInputValid = input.value.trim() !== '';
            }
            
            if (isInputValid) {
                parentGroup.classList.remove('error');
            } else {
                parentGroup.classList.add('error');
                isValid = false;
            }
        });
        return isValid;
    };

    // --- Обработчики на кнопки навигации ---
    document.querySelectorAll('.next-step-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < steps.length) {
                    goToStep(currentStep + 1);
                }
            }
        });
    });

    document.querySelectorAll('.prev-step-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });
    });
    
    // --- Логика закрытия кастомных селектов и дропдаунов при клике вне ---
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-container')) {
            document.querySelectorAll('.custom-select-container.open').forEach(container => {
                container.classList.remove('open');
            });
        }
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    });

    // --- Кастомный select ТОЛЬКО для десктопа ---
    const isDesktop = window.matchMedia("(min-width: 769px)").matches;
    if (isDesktop) {
        document.querySelectorAll('select').forEach(setupCustomSelect);
    }
    
    function setupCustomSelect(selectElement) {
        if (selectElement.customSelectInitialized) return;
        selectElement.customSelectInitialized = true;
        
        const customSelectContainer = document.createElement('div');
        customSelectContainer.className = 'custom-select-container';
        selectElement.parentNode.insertBefore(customSelectContainer, selectElement.nextSibling);

        const customSelectTrigger = document.createElement('div');
        customSelectTrigger.className = 'custom-select-trigger';
        customSelectContainer.appendChild(customSelectTrigger);
        
        const customSelectOptions = document.createElement('div');
        customSelectOptions.className = 'custom-select-options';
        customSelectContainer.appendChild(customSelectOptions);

        selectElement.querySelectorAll('option').forEach(optionElement => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-select-option';
            optionDiv.textContent = optionElement.textContent;
            optionDiv.dataset.value = optionElement.value;

            if (optionElement.selected) {
                customSelectTrigger.textContent = optionElement.textContent;
                if(optionElement.disabled) customSelectTrigger.classList.add('placeholder');
                optionDiv.classList.add('selected');
            }

            if (optionElement.disabled) return;

            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                customSelectTrigger.textContent = optionDiv.textContent;
                customSelectTrigger.classList.remove('placeholder');
                selectElement.value = optionDiv.dataset.value;
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                customSelectOptions.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
                optionDiv.classList.add('selected');
                customSelectContainer.classList.remove('open');
                selectElement.closest('.form-group')?.classList.remove('error');
            });
            customSelectOptions.appendChild(optionDiv);
        });
        
        customSelectTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-container.open').forEach(container => {
                if (container !== customSelectContainer) container.classList.remove('open');
            });
            customSelectContainer.classList.toggle('open');
        });
    }
    
    // --- Дропдаун для доп. услуг ---
    const servicesDropdown = document.getElementById('additional-services-dropdown');
    if(servicesDropdown) {
        const trigger = servicesDropdown.querySelector('.custom-dropdown-trigger');
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            servicesDropdown.classList.toggle('open');
        });
    }

    // --- Инициализация кастомных календарей Flatpickr ---
    const datePickerOptions = {
        "locale": "ru",
        dateFormat: "d.m.Y",
        minDate: "today",
        onValueUpdate: function(selectedDates, dateStr, instance) {
            instance.element.closest('.form-group')?.classList.remove('error');
        }
    };
    flatpickr("#delivery-date", datePickerOptions);
    flatpickr("#self-delivery-date", datePickerOptions);

    // --- Логика для скрытых полей компании/ИП ---
    const orderTypeSelect = document.getElementById('order-type');
    const companyFieldsContainer = document.getElementById('company-fields');
    if(orderTypeSelect) {
        orderTypeSelect.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            const isCompanyOrIp = selectedType === 'ИП' || selectedType === 'Компания';
            companyFieldsContainer.style.display = isCompanyOrIp ? 'grid' : 'none';
            const companyNameInput = document.getElementById('company-name');
            const innInput = document.getElementById('inn');
            companyNameInput.required = isCompanyOrIp;
            innInput.required = isCompanyOrIp;
            if (!isCompanyOrIp) {
                companyNameInput.closest('.form-group')?.classList.remove('error');
                innInput.closest('.form-group')?.classList.remove('error');
            }
        });
    }
    
    // --- Логика для условного поля даты самопривоза ---
    const shipmentFormSelect = document.getElementById('shipment-form');
    const selfDeliveryDateGroup = document.getElementById('self-delivery-date-group');
    const selfDeliveryDateInput = document.getElementById('self-delivery-date');
    
    if (shipmentFormSelect) {
        shipmentFormSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            if (selectedValue === 'Привезу на ваш склад') {
                selfDeliveryDateGroup.classList.add('visible');
                selfDeliveryDateInput.required = true;
            } else {
                selfDeliveryDateGroup.classList.remove('visible');
                selfDeliveryDateInput.required = false;
                selfDeliveryDateGroup.classList.remove('error');
            }
        });
    }
    
    // --- Маска для телефона ---
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.startsWith('7') || value.startsWith('8')) { value = value.substring(1); }
            let formattedValue = '+7 (';
            if (value.length > 0) formattedValue += value.substring(0, 3);
            if (value.length >= 4) formattedValue += ') ' + value.substring(3, 6);
            if (value.length >= 7) formattedValue += '-' + value.substring(6, 8);
            if (value.length >= 9) formattedValue += '-' + value.substring(8, 10);
            e.target.value = formattedValue.substring(0, 18);
        });
        phoneInput.addEventListener('blur', (e) => { // Validate on blur
            if(e.target.value.length > 0 && e.target.value.length < 18) {
                e.target.closest('.form-group')?.classList.add('error');
            } else {
                e.target.closest('.form-group')?.classList.remove('error');
            }
        });
    }

    // --- Отправка формы ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;
        
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';
        
        // ВАЖНО: Этот URL должен указывать на ваш запущенный бэкенд-сервер.
        // Для локального теста он может быть таким. 
        // Для продакшена замените его на адрес вашего сервера, например: 'https://api.yourdomain.com/send-form'
        const serverUrl = 'http://127.0.0.1:5000/api/send-form';

        try {
            const response = await fetch(serverUrl, { method: 'POST', body: new FormData(form) });
            
            if (response.ok) {
                form.style.display = 'none';
                successScreen.style.display = 'block';
            } else {
                const errorResult = await response.json();
                alert('Ошибка отправки: ' + errorResult.error);
                submitButton.disabled = false;
                submitButton.textContent = 'Отправить заявку';
            }

        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            alert('Не удалось связаться с сервером. Убедитесь, что Python-скрипт запущен, и попробуйте снова.');
            submitButton.disabled = false;
            submitButton.textContent = 'Отправить заявку';
        }
    });
    
    // --- Инициализация при загрузке ---
    updateProgressIndicators();
});