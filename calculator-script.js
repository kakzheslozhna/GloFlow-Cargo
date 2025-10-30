document.addEventListener('DOMContentLoaded', () => {

    // --- БАЗЫ ДАННЫХ С ЦЕНАМИ ---
    // Обновлены цены для Краснодара
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
        'Коледино, Подольск, Подольск 3, Подольск 4': { 'Короб': 300, 'Паллета': 2000, 'м³': 3000 },
        'Электросталь': { 'Короб': 350, 'Паллета': 2500, 'м³': 3500 },
    };
    // Цены указаны за 1 единицу (за 1 паллету, за 1 короб)
    const extraServicePrices = {
        palletizing: 790,    // за 1 паллету
        palletPickup: 1000,  // за 1 паллету
        boxPickupSmall: 390, // за 1 короб, если их <= 5
        boxPickupLarge: 300, // за 1 короб, если их > 5
    };

    // --- СОСТОЯНИЕ КАЛЬКУЛЯТОРА ---
    let currentStep = 1;
    const totalSteps = 3;
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

    // --- ЭЛЕМЕНТЫ DOM ---
    const steps = document.querySelectorAll('.calculator-step');
    const nextBtn = document.getElementById('btn-next');
    const prevBtn = document.getElementById('btn-prev');
    const progressBarFill = document.querySelector('.progress-bar-fill');
    const progressLabel = document.querySelector('.progress-bar-label strong');
    const stepIndicator = document.getElementById('calculator-step-indicator');
    const mainTitle = document.getElementById('calculator-main-title');

    // --- ЛОГИКА КАЛЬКУЛЯТОРА ---
    function updateUI() {
        steps.forEach(step => step.classList.remove('active'));
        document.getElementById(`step-${currentStep}`).classList.add('active');

        const progress = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
        progressBarFill.style.width = `${progress}%`;
        progressLabel.textContent = `${progress}%`;
        
        stepIndicator.textContent = `Шаг ${currentStep} из ${totalSteps}`;
        prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
        nextBtn.textContent = currentStep === totalSteps ? 'Рассчитать' : 'Далее →';
        
        const titles = {
            1: 'Куда доставить ваш груз Wildberries?',
            2: 'Выберите вариант поставки',
            3: 'Укажите количество и доп. услуги'
        };
        
        if (mainTitle.textContent !== titles[currentStep]) {
            mainTitle.style.opacity = '0';
            setTimeout(() => {
                mainTitle.textContent = titles[currentStep];
                mainTitle.style.opacity = '1';
            }, 150);
        }

        if (currentStep === 3) {
            document.querySelectorAll('.delivery-option-card').forEach(card => {
                card.style.display = card.dataset.type === selection.deliveryType ? 'block' : 'none';
            });
            document.getElementById('summary-destination').textContent = selection.destination;
            document.getElementById('summary-type').innerHTML = selection.deliveryType === 'м³' ? 'м<sup>3</sup>' : selection.deliveryType;
        }
        
        validateStep();
    }

    function calculateTotal() {
        const { destination, deliveryType, quantity, extras } = selection;
        let baseCost = 0;
        let extrasCost = 0;

        if (destination && deliveryType && quantity > 0 && prices[destination]?.[deliveryType]) {
            baseCost = prices[destination][deliveryType] * quantity;
        }

        // --- ИСПРАВЛЕННАЯ ЛОГИКА РАСЧЕТА ДОП. УСЛУГ ---
        if (quantity > 0) { // Считаем доп. услуги только если есть количество
            if (deliveryType === 'Паллета') {
                if (extras.palletizing) {
                    extrasCost += extraServicePrices.palletizing * quantity; // Умножаем на кол-во паллет
                }
                if (extras.pickup) {
                    extrasCost += extraServicePrices.palletPickup * quantity; // Умножаем на кол-во паллет
                }
            } 
            else if (deliveryType === 'Короб') {
                if (extras.pickup) {
                    // Выбираем цену за короб в зависимости от общего кол-ва
                    const pricePerBox = quantity <= 5 ? extraServicePrices.boxPickupSmall : extraServicePrices.boxPickupLarge;
                    extrasCost += pricePerBox * quantity; // Умножаем на кол-во коробов
                }
            }
        }

        selection.totalCost = baseCost + extrasCost;

        const summaryExtrasRow = document.querySelector('.summary-extras');
        const summaryExtrasPrice = document.getElementById('summary-extras-price');

        const unit = deliveryType === 'м³' ? 'м<sup>3</sup>' : 'шт.';
        document.getElementById('summary-quantity').innerHTML = quantity > 0 ? `${quantity} ${unit}` : '--';
        
        if (extrasCost > 0) {
            summaryExtrasPrice.textContent = `${extrasCost.toLocaleString('ru-RU')} ₽`;
            summaryExtrasRow.style.display = 'flex';
        } else {
            summaryExtrasRow.style.display = 'none';
        }
        
        document.getElementById('summary-total-price').textContent = `${selection.totalCost.toLocaleString('ru-RU')} ₽`;
        validateStep();
    }

    function validateStep() {
        let isValid = false;
        if (currentStep === 1) isValid = !!selection.destination;
        if (currentStep === 2) isValid = !!selection.deliveryType;
        if (currentStep === 3) isValid = selection.quantity > 0;
        nextBtn.disabled = !isValid;
    }
    
    function resetStep3() {
        document.querySelectorAll('#step-3 input[type="checkbox"]').forEach(c => c.checked = false);
        document.querySelectorAll('#step-3 input[type="number"]').forEach(i => i.value = '');
        selection.extras.palletizing = false;
        selection.extras.pickup = false;
        selection.quantity = 0;
        calculateTotal(); // Обновить сводку сразу
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            if (currentStep === 3) {
                resetStep3(); 
            }
            updateUI();
        } else {
            alert(`Заявка на ${selection.totalCost.toLocaleString('ru-RU')} ₽ сформирована!`);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    });

    document.querySelector('#step-1').addEventListener('change', (e) => {
        if (e.target.name === 'destination') {
            selection.destination = e.target.value;
            validateStep();
        }
    });

    document.querySelector('#step-2').addEventListener('change', (e) => {
        if (e.target.name === 'deliveryType') {
            selection.deliveryType = e.target.value;
            validateStep();
        }
    });

    document.querySelector('#step-3').addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            selection.quantity = parseFloat(e.target.value) || 0;
            calculateTotal();
        }
    });

    document.querySelector('#step-3').addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const service = e.target.id;
            if (service === 'palletizing-service') selection.extras.palletizing = e.target.checked;
            if (service === 'pallet-pickup-service' || service === 'box-pickup-service') selection.extras.pickup = e.target.checked;
            calculateTotal();
        }
    });

    // --- ИНИЦИАЛИЗАЦИЯ ---
    updateUI();
});
