document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('multi-step-form');
    const formStepsContainer = document.querySelector('.form-steps-container');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressBarFill = document.querySelector('.progress-bar-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    const mobileStepIndicator = document.getElementById('mobile-current-step');
    const successScreen = document.querySelector('.form-success');
    let currentStep = 1;

    // --- ЛОГИКА КАСТОМНОГО SELECT ДЛЯ ДЕСКТОПА ---
    const isDesktop = window.matchMedia("(min-width: 769px)").matches;

    if (isDesktop) {
        document.querySelectorAll('select').forEach(setupCustomSelect);

        function setupCustomSelect(selectElement) {
            const customSelectContainer = document.createElement('div');
            customSelectContainer.className = 'custom-select-container';
            const customSelectTrigger = document.createElement('div');
            customSelectTrigger.className = 'custom-select-trigger';
            const customSelectOptions = document.createElement('div');
            customSelectOptions.className = 'custom-select-options';

            selectElement.querySelectorAll('option').forEach(optionElement => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'custom-select-option';
                optionDiv.textContent = optionElement.textContent;
                optionDiv.dataset.value = optionElement.value;
                if (optionElement.selected) {
                    customSelectTrigger.textContent = optionElement.textContent;
                    if (optionElement.disabled) customSelectTrigger.classList.add('placeholder');
                    optionDiv.classList.add('selected');
                }
                if (optionElement.disabled) return;
                optionDiv.addEventListener('click', () => {
                    customSelectTrigger.textContent = optionDiv.textContent;
                    customSelectTrigger.classList.remove('placeholder');
                    selectElement.value = optionDiv.dataset.value;
                    customSelectOptions.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
                    optionDiv.classList.add('selected');
                    customSelectContainer.classList.remove('open');
                    selectElement.dispatchEvent(new Event('change'));
                });
                customSelectOptions.appendChild(optionDiv);
            });

            customSelectTrigger.addEventListener('click', () => {
                // Закрываем все другие открытые селекты перед открытием нового
                document.querySelectorAll('.custom-select-container.open').forEach(container => {
                    if (container !== customSelectContainer) {
                        container.classList.remove('open');
                    }
                });
                customSelectContainer.classList.toggle('open');
            });

            customSelectContainer.appendChild(customSelectTrigger);
            customSelectContainer.appendChild(customSelectOptions);
            selectElement.parentNode.appendChild(customSelectContainer);
        }

        // ИЗМЕНЕНО: Этот обработчик теперь работает ТОЛЬКО на десктопе, решая проблему на мобильных
        window.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select-container')) {
                document.querySelectorAll('.custom-select-container.open').forEach(container => {
                    container.classList.remove('open');
                });
            }
        });
    }
    
    // --- НОВОЕ: ЛОГИКА ДЛЯ СТИЛИЗАЦИИ ПОЛЯ ДАТЫ ---
    const dateInput = document.getElementById('delivery-date');
    if (dateInput) {
        dateInput.addEventListener('change', () => {
            if (dateInput.value) {
                dateInput.classList.add('has-value');
            } else {
                dateInput.classList.remove('has-value');
            }
        });
        // Устанавливаем минимальную дату на сегодня
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
    
    // --- ЛОГИКА ДЛЯ СКРЫТЫХ ПОЛЕЙ "КОМПАНИЯ/ИНН" ---
    const orderTypeSelect = document.getElementById('order-type');
    const companyFieldsContainer = document.getElementById('company-fields');
    const companyNameInput = document.getElementById('company-name');
    const innInput = document.getElementById('inn');

    orderTypeSelect.addEventListener('change', () => {
        const selectedType = orderTypeSelect.value;
        if (selectedType === 'ИП' || selectedType === 'Компания') {
            companyFieldsContainer.style.display = 'grid';
            companyNameInput.required = true;
            innInput.required = true;
        } else {
            companyFieldsContainer.style.display = 'none';
            companyNameInput.required = false;
            innInput.required = false;
        }
    });
    
    // --- ЛОГИКА НАВИГАЦИИ ПО ШАГАМ ---
    const updateTotalProgress = () => {
        const percent = ((currentStep - 1) / (steps.length - 1)) * 100;
        progressBarFill.style.width = `${percent}%`;
        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index < currentStep);
        });
        if(mobileStepIndicator) mobileStepIndicator.textContent = currentStep;
    };
    
    const goToStep = (stepNumber) => {
        currentStep = stepNumber;
        // ИЗМЕНЕНО: Управляем активным классом для CSS анимации видимости
        steps.forEach((step, index) => {
            step.classList.toggle('active', (index + 1) === currentStep);
        });
        const offset = -(currentStep - 1) * 25; // Ширина шага 25% (100% / 4 шага)
        formStepsContainer.style.transform = `translateX(${offset}%)`;
        updateTotalProgress();
    };

    const validateStep = (stepNumber) => {
        let isValid = true;
        const currentStepElement = steps[stepNumber - 1];
        const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            const parentGroup = input.closest('.form-group');
            let isInputValid = false;
            if (input.type === 'checkbox') isInputValid = input.checked;
            else if (input.type === 'tel') isInputValid = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(input.value);
            else isInputValid = input.value.trim() !== '';
            
            if (isInputValid) parentGroup.classList.remove('error');
            else { parentGroup.classList.add('error'); isValid = false; }
        });
        return isValid;
    };

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            let formattedValue = '+7 (';
            if (!value.startsWith('7')) { if(value.length > 0) value = '7' + value; else value = '7'; }
            value = value.substring(1);
            if (value.length > 0) formattedValue += value.substring(0, 3);
            if (value.length >= 4) formattedValue += ') ' + value.substring(3, 6);
            if (value.length >= 7) formattedValue += '-' + value.substring(6, 8);
            if (value.length >= 9) formattedValue += '-' + value.substring(8, 10);
            e.target.value = formattedValue.substring(0, 18); // Ограничиваем длину
        });
    }

    form.addEventListener('click', (e) => {
        if (e.target.matches('.next-step-btn')) { if (validateStep(currentStep)) goToStep(currentStep + 1); } 
        else if (e.target.matches('.prev-step-btn')) { goToStep(currentStep - 1); }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';
        try {
            const response = await fetch('http://127.0.0.1:5000/api/send-form', { method: 'POST', body: new FormData(form) });
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
            alert('Не удалось связаться с сервером. Убедитесь, что Python-скрипт запущен, и попробуйте снова.');
            submitButton.disabled = false;
            submitButton.textContent = 'Отправить заявку';
        }
    });
    
    // Инициализация при загрузке
    goToStep(1);
});
