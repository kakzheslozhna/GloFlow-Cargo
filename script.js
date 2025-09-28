document.addEventListener('DOMContentLoaded', () => {
    // --- ПЕРЕМЕННЫЕ И ОСНОВНЫЕ ФУНКЦИИ (без изменений) ---
    const form = document.getElementById('multi-step-form');
    const formStepsContainer = document.querySelector('.form-steps-container');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressBarFill = document.querySelector('.progress-bar-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    const mobileStepIndicator = document.getElementById('mobile-current-step');
    const successScreen = document.querySelector('.form-success');
    let currentStep = 1;

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

    const updateTotalProgress = () => {
        const percent = ((currentStep - 1) / (steps.length - 1)) * 100;
        progressBarFill.style.width = `${percent}%`;
        progressSteps.forEach((step, index) => {
            if (index < currentStep) step.classList.add('active'); else step.classList.remove('active');
        });
        if(mobileStepIndicator) mobileStepIndicator.textContent = currentStep;
    };
    const goToStep = (stepNumber) => {
        currentStep = stepNumber;
        const stepWidthPercentage = 100 / steps.length;
        const offset = -(currentStep - 1) * stepWidthPercentage;
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
            e.target.value = formattedValue;
        });
    }
    form.addEventListener('click', (e) => {
        if (e.target.matches('.next-step-btn')) { if (validateStep(currentStep)) goToStep(currentStep + 1); } 
        else if (e.target.matches('.prev-step-btn')) { goToStep(currentStep - 1); }
    });

    // --- ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ НА PYTHON-СЕРВЕР ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';

        // Адрес нашего локального Flask-сервера
        const backendUrl = 'http://127.0.0.1:5000/api/send-form';
        
        const formData = new FormData(form);

        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // Сервер вернул успешный ответ
                const result = await response.json();
                console.log('SUCCESS!', result.message);
                form.style.display = 'none';
                successScreen.style.display = 'block';
            } else {
                // Сервер вернул ошибку
                const errorResult = await response.json();
                console.error('FAILED...', errorResult.error);
                alert('Ошибка отправки: ' + errorResult.error);
                submitButton.disabled = false;
                submitButton.textContent = 'Отправить заявку';
            }
        } catch (error) {
            // Ошибка сети (например, сервер не запущен)
            console.error('NETWORK ERROR:', error);
            alert('Не удалось связаться с сервером. Убедитесь, что Python-скрипт запущен, и попробуйте снова.');
            submitButton.disabled = false;
            submitButton.textContent = 'Отправить заявку';
        }
    });

    updateTotalProgress();
});