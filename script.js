/************************************************************************
 * БАЗОВЫЕ ПАРАМЕТРЫ
 ************************************************************************/
let rust = 0;               // Текущее количество ржавчины
let baseRustPerClick = 1;   // Базовая ржавчина за клик
let baseRustPerSecond = 0;  // Базовая ржавчина в секунду
let ships = 0;              // Количество кораблей Железной Орды

// Флаг, чтобы финальное сообщение появилось один раз
let endGameReached = false;

// Массив апгрейдов
const upgrades = [
  {
    name: "Усиленная пушка",
    level: 0,
    rustPerClickBonus: 1,
    rustPerSecondBonus: 0,
    baseCost: 50
  },
  {
    name: "Авто-турель",
    level: 0,
    rustPerClickBonus: 0,
    rustPerSecondBonus: 0.5,
    baseCost: 200
  },
  {
    name: "Тяжёлое орудие",
    level: 0,
    rustPerClickBonus: 2,
    rustPerSecondBonus: 0,
    baseCost: 1000
  },
  {
    name: "Фрегатная поддержка",
    level: 0,
    rustPerClickBonus: 0,
    rustPerSecondBonus: 3,
    baseCost: 2500
  },
  {
    name: "Усиленное прицеливание",
    level: 0,
    rustPerClickBonus: 5,
    rustPerSecondBonus: 0,
    baseCost: 12000
  },
  {
    name: "Крейсерский флот",
    level: 0,
    rustPerClickBonus: 0,
    rustPerSecondBonus: 10,
    baseCost: 50000
  }
];

/************************************************************************
 * ЭЛЕМЕНТЫ СТРАНИЦЫ
 ************************************************************************/
const rustCountElem         = document.getElementById("rustCount");
const shipCountElem         = document.getElementById("shipCount");
const rustPerClickDisplay   = document.getElementById("rustPerClickDisplay");
const rustPerSecondDisplay  = document.getElementById("rustPerSecondDisplay");
const fireBtn               = document.getElementById("fireBtn");
const buildShipBtn          = document.getElementById("buildShipBtn");
const gameContainer         = document.getElementById("gameContainer");
const upgradeList           = document.getElementById("upgradeList");

/************************************************************************
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 ************************************************************************/
// Генерация случайного бонус-кода (8 символов)
function generateBonusCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Подсчёт общей ржавчины за клик и в секунду
function calculateTotals() {
  let totalRustPerClick = baseRustPerClick;
  let totalRustPerSecond = baseRustPerSecond;

  upgrades.forEach(u => {
    totalRustPerClick   += u.rustPerClickBonus * u.level;
    totalRustPerSecond  += u.rustPerSecondBonus * u.level;
  });

  return { totalRustPerClick, totalRustPerSecond };
}

// Обновление отображения
function updateDisplay() {
  const totals = calculateTotals();
  rustCountElem.textContent        = Math.floor(rust);
  shipCountElem.textContent        = ships;
  rustPerClickDisplay.textContent  = totals.totalRustPerClick.toFixed(1);
  rustPerSecondDisplay.textContent = totals.totalRustPerSecond.toFixed(1);
}

function fireProjectiles() {
  const totals = calculateTotals();
  const projectileCount = 1 + ships;

  // получаем высоту и ширину контейнера игры
  const containerHeight = gameContainer.clientHeight;
  const containerWidth = gameContainer.clientWidth;

  // получаем текущие координаты корабля относительно контейнера
  const shipElem = document.getElementById('ship');
  const shipRect = shipElem.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  const targetX = shipRect.left - containerRect.left;
  const targetY = shipRect.top + shipRect.height / 2 - containerRect.top;

  for (let i = 0; i < projectileCount; i++) {
    const projectile = document.createElement("div");
    projectile.classList.add("projectile");

    // стартовая позиция снарядов пропорционально высоте контейнера
    projectile.style.top = (containerHeight * 0.7 + i * 5) + "px";
    projectile.style.left = "0px";

    // вычисляем траекторию полёта до корабля
    const endX = targetX;
    const endY = targetY;

    // динамическая анимация через JS вместо CSS (для адаптивности)
    projectile.animate([
      { transform: `translate(0, 0)` },
      { transform: `translate(${endX}px, ${endY - parseFloat(projectile.style.top)}px)` }
    ], {
      duration: 700,
      easing: 'linear'
    }).onfinish = () => {
      // Добавляем взрыв
      const explosion = document.createElement("div");
      explosion.classList.add("explosion");
      explosion.style.position = "absolute";
      explosion.style.left = endX + "px";
      explosion.style.top = endY - 15 + "px";
      explosion.style.width = "80px";
      explosion.style.height = "80px";
      explosion.style.backgroundImage = "url('images/explosion1.png')";
      explosion.style.backgroundSize = "cover";
      explosion.style.backgroundRepeat = "no-repeat";

      gameContainer.appendChild(explosion);
      gameContainer.removeChild(projectile);

      setTimeout(() => {
        explosion.style.width = "120px";
        explosion.style.height = "120px";
        explosion.style.backgroundImage = "url('images/explosion2.png')";
        explosion.style.marginLeft = "-20px"; 
        explosion.style.marginTop  = "-20px";
      }, 200);

      setTimeout(() => {
        if (gameContainer.contains(explosion)) {
          gameContainer.removeChild(explosion);
        }
      }, 300);

      rust += totals.totalRustPerClick;
      updateDisplay();
    };

    gameContainer.appendChild(projectile);
  }
}



// Проверка достижения цели
function checkEndGame() {
  if (ships >= 20 && !endGameReached) {
    endGameReached = true;
    const bonusCode = generateBonusCode(8);
    alert(
      `ТЫ ПОМОГ ОРДЕ, ДО ВСТРЕЧИ В БОЮ, КОМАНДИР!\n` +
      `Вот тебе бонус-код, чтобы ты мучался подольше: ${bonusCode}`
    );
  }
}

/************************************************************************
 * СОБЫТИЯ
 ************************************************************************/
// Клик по кнопке "Запустить снаряд"
fireBtn.addEventListener("click", () => {
  fireProjectiles();
});

// Клик по кнопке "Построить корабль"
buildShipBtn.addEventListener("click", () => {
  if (rust >= 100000) {
    rust -= 100000;
    ships++;
    updateDisplay();
    checkEndGame();
  } else {
    alert("Недостаточно ржавчины для постройки корабля!");
  }
});

// Создание списка апгрейдов
function initUpgrades() {
  upgrades.forEach((upgrade) => {
    // Контейнер одного улучшения
    const upgradeDiv = document.createElement("div");
    upgradeDiv.classList.add("upgrade-item");

    // Название и уровень
    const upgradeInfo = document.createElement("span");
    upgradeInfo.textContent = `${upgrade.name} (Ур. ${upgrade.level})`;

    // Описание бонуса
    const bonusInfo = document.createElement("span");
    let bonusText = "";
    if (upgrade.rustPerClickBonus > 0) {
      bonusText += `+${upgrade.rustPerClickBonus} ржавчины/клик`;
    }
    if (upgrade.rustPerSecondBonus > 0) {
      if (bonusText) bonusText += " и ";
      bonusText += `+${upgrade.rustPerSecondBonus} ржавчины/сек`;
    }
    if (!bonusText) bonusText = "Без бонуса?";
    bonusInfo.textContent = `(${bonusText})`;

    // Кнопка покупки
    const buyBtn = document.createElement("button");
    const initialCost = Math.floor(upgrade.baseCost * Math.pow(2, upgrade.level));
    buyBtn.textContent = `Купить (Цена: ${initialCost})`;

    // При покупке
    buyBtn.addEventListener("click", () => {
      const cost = Math.floor(upgrade.baseCost * Math.pow(2, upgrade.level));
      if (rust >= cost) {
        rust -= cost;
        upgrade.level++;
        // Обновляем стоимость и уровень
        const newCost = Math.floor(upgrade.baseCost * Math.pow(2, upgrade.level));
        buyBtn.textContent = `Купить (Цена: ${newCost})`;
        upgradeInfo.textContent = `${upgrade.name} (Ур. ${upgrade.level})`;
        updateDisplay();
      } else {
        alert("Недостаточно ржавчины для покупки улучшения!");
      }
    });

    // Собираем всё в upgradeDiv
    upgradeDiv.appendChild(upgradeInfo);
    upgradeDiv.appendChild(bonusInfo);
    upgradeDiv.appendChild(buyBtn);

    // Добавляем в список
    upgradeList.appendChild(upgradeDiv);
  });
}

/************************************************************************
 * СТАРТ ИГРЫ
 ************************************************************************/
initUpgrades();
updateDisplay();

// Автоматическая генерация ржавчины
setInterval(() => {
  const totals = calculateTotals();
  rust += totals.totalRustPerSecond;
  updateDisplay();
}, 1000);
