document.addEventListener('DOMContentLoaded', () => {

    // --- БАЗА ДАННЫХ С ЦЕНАМИ ---
    const prices = {
        'Краснодар': { 'Короб': 850, 'Паллета': 6800, 'м³': 8500 },
        'Санкт-Петербург': { 'Короб': 550, 'Паллета': 4400, 'м³': 5500 },
        'Казань': { 'Короб': 600, 'Паллета': 4800, 'м³': 6000 },
        'Екатеринбург': { 'Короб': 1100, 'Паллета': 9000, 'м³': 10000 },
        'Тула(Алексин)': { 'Короб': 400, 'Паллета': 3200, 'м³': 4000 },
        'Рязань': { 'Короб': 400, 'Паллета': 3200, 'м³': 4000 },
        'Котовск': { 'Короб': 500, 'Паллета': 4000, 'м³': 5000 },
        'Новосемейкино': { 'Короб': 900, 'Паллета': 7200, 'м³': 9000 },
        'Сарапул': { 'Короб': 1000, 'Паллета': 8000, 'м³': 10000 },
        'Коледино': { 'Короб': 300, 'Паллета': 2000, 'м³': 3000 },
        'Подольск': { 'Короб': 300, 'Паллета': 2000, 'м³': 3000 },
        'Подольск 3': { 'Короб': 300, 'Паллета': 2000, 'м³': 3000 },
        'Подольск 4': { 'Короб': 300, 'Паллета': 2000, 'м³': 3000 },
        'Электросталь': { 'Короб': 350, 'Паллета': 2500, 'м³': 3500 },
    };
    const extraServicePrices = {
        palletizing: 790,
        palletPickup: 1000,
        boxPickupSmall: 390,
        boxPickupLarge: 300,
    };

    // --- СОСТОЯНИЕ КАЛЬКУЛЯТОРА ---
    const selection = {
        destination: null,
        deliveryType: null,
        quantity: 0,
        extras: {
            palletizing: false,
            pickup: false,
        },
        totalCost: 0
    };
    let currentStep = 1;

    // --- ЭЛЕМЕНТЫ DOM ---
    const form = document.getElementById('multi-step-form');
    const formContainer = document.querySelector('.form-container');
    const formStepsContainer = document.querySelector('.form-steps-container');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const nextButtons = document.querySelectorAll('.next-step-btn');
    const prevButtons = document.querySelectorAll('.prev-step-btn');
    const calculatorOptions = document.getElementById('calculator-options');
    const allQuantityInputs = document.querySelectorAll('.quantity-input');
    
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
        
        const offset = -(currentStep - 1) * (100 / steps.length);
        formStepsContainer.style.transform = `translateX(${offset}%)`;
        updateProgressIndicators();
    };

    // --- Валидация текущего шага ---
    const validateStep = () => {
        let isValid = false;
        if (currentStep === 1) {
            isValid = selection.destination && selection.deliveryType;
        } else if (currentStep === 2) {
            isValid = selection.quantity > 0;
        }
        nextButtons.forEach(btn => {
            if (parseInt(btn.closest('.form-step').dataset.step) === currentStep) {
                btn.disabled = !isValid;
            }
        });
    };
    
    // --- Расчет и обновление итоговой сводки ---
    const calculateTotal = () => {
        const { destination, deliveryType, quantity, extras } = selection;
        let baseCost = 0;
        let extrasCost = 0;

        if (destination && deliveryType && quantity > 0 && prices[destination]?.[deliveryType]) {
            baseCost = prices[destination][deliveryType] * quantity;
        }

        if (quantity > 0) {
            if (deliveryType === 'Паллета') {
                if (extras.palletizing) extrasCost += extraServicePrices.palletizing * quantity;
                if (extras.pickup) extrasCost += extraServicePrices.palletPickup * quantity;
            } else if (deliveryType === 'Короб') {
                if (extras.pickup) {
                    const pricePerBox = quantity <= 5 ? extraServicePrices.boxPickupSmall : extraServicePrices.boxPickupLarge;
                    extrasCost += pricePerBox * quantity;
                }
            }
        }

        selection.totalCost = baseCost + extrasCost;

        // Обновление DOM на шаге 3
        document.getElementById('summary-destination').textContent = selection.destination || '--';
        document.getElementById('summary-type').innerHTML = selection.deliveryType === 'м³' ? 'м<sup>3</sup>' : (selection.deliveryType || '--');
        const unit = selection.deliveryType === 'м³' ? 'м<sup>3</sup>' : 'шт.';
        document.getElementById('summary-quantity').innerHTML = quantity > 0 ? `${quantity} ${unit}` : '--';
        
        const extrasRow = document.getElementById('summary-extras-row');
        if (extrasCost > 0) {
            document.getElementById('summary-extras-price').textContent = `${extrasCost.toLocaleString('ru-RU')} ₽`;
            extrasRow.style.display = 'flex';
        } else {
            extrasRow.style.display = 'none';
        }
        
        document.getElementById('summary-total-price').textContent = `${selection.totalCost.toLocaleString('ru-RU')} ₽`;
        validateStep();
    };
    
    // --- Динамическое отображение полей на шаге 2 ---
    const updateOptionsVisibility = () => {
        const { deliveryType } = selection;
        if (!deliveryType) return;
        
        calculatorOptions.querySelectorAll('.conditional-input-group').forEach(group => {
            group.classList.toggle('visible', group.dataset.type === deliveryType);
        });
    };

    // --- Сброс калькулятора ---
    const resetCalculator = () => {
        selection.destination = null;
        selection.deliveryType = null;
        selection.quantity = 0;
        selection.extras.palletizing = false;
        selection.extras.pickup = false;
        selection.totalCost = 0;
        
        form.reset();
        
        // Сброс кастомного селекта
        const customSelectTrigger = document.querySelector('.custom-select-trigger');
        const firstOption = document.querySelector('#destination option[disabled]');
        if (customSelectTrigger && firstOption) {
            customSelectTrigger.textContent = firstOption.textContent;
            customSelectTrigger.classList.add('placeholder');
        }

        // Сброс UI
        goToStep(1);
        calculateTotal();
        validateStep();
    };

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep < steps.length) {
                if (currentStep === 2) calculateTotal(); // Финальный расчет перед показом
                goToStep(currentStep + 1);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });
    });
    
    // Шаг 1: Выбор направления и типа
    form.querySelector('#destination').addEventListener('change', (e) => {
        selection.destination = e.target.value;
        validateStep();
    });
    
    form.querySelectorAll('input[name="deliveryType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selection.deliveryType = e.target.value;
            // Сброс количества и доп. услуг при смене типа
            allQuantityInputs.forEach(input => input.value = '');
            form.querySelectorAll('#calculator-options input[type="checkbox"]').forEach(cb => cb.checked = false);
            selection.quantity = 0;
            selection.extras.palletizing = false;
            selection.extras.pickup = false;
            
            updateOptionsVisibility();
            validateStep();
            calculateTotal();
        });
    });

    // Шаг 2: Ввод количества и выбор услуг
    allQuantityInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            selection.quantity = parseFloat(e.target.value) || 0;
            validateStep();
        });
    });

    form.querySelectorAll('#calculator-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const service = e.name;
            selection.extras[service] = e.target.checked;
        });
    });

    document.getElementById('reset-calc-btn').addEventListener('click', resetCalculator);

    // --- Логика кастомного Select'а (взята из order.js) ---
    const isDesktop = window.matchMedia("(min-width: 769px)").matches;
    if (isDesktop) {
        document.querySelectorAll('select').forEach(setupCustomSelect);
    }
    
    function setupCustomSelect(selectElement) {
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
            }
            if (optionElement.disabled) return;

            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                customSelectTrigger.textContent = optionDiv.textContent;
                customSelectTrigger.classList.remove('placeholder');
                selectElement.value = optionDiv.dataset.value;
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                customSelectContainer.classList.remove('open');
            });
            customSelectOptions.appendChild(optionDiv);
        });
        
        customSelectTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelectContainer.classList.toggle('open');
        });
        
        window.addEventListener('click', () => customSelectContainer.classList.remove('open'));
    }

    // --- Инициализация при загрузке ---
    updateProgressIndicators();
    validateStep();
});