/************************************************************************
 * БАЗОВЫЕ ПАРАМЕТРЫ
 ************************************************************************/
let rust = 0;               // Текущее количество ржавчины
let baseRustPerClick = 1;   // Базовая ржавчина за клик
let baseRustPerSecond = 0;  // Базовая ржавчина в секунду
let ships = 0;              // Количество кораблей Железной Орды

// Флаг, чтобы финальное сообщение появилось один раз
let endGameReached = false;

let userId = 'anonymous'; // дефолтное значение

if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe.user) {
    userId = window.Telegram.WebApp.initDataUnsafe.user.id;
}

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
// Сохранение игры с учетом ID пользователя
function saveGame() {
  const gameData = {
    rust: rust,
    ships: ships,
    upgrades: upgrades,
    lastSaveTime: Date.now()  // сохраняем время сохранения
  };
  localStorage.setItem(`ironHordeSave_${userId}`, JSON.stringify(gameData));
}

// Загрузка игры с учетом ID пользователя
function loadGame() {
  const savedData = localStorage.getItem(`ironHordeSave_${userId}`);
  if (savedData) {
    const gameData = JSON.parse(savedData);

    // Определяем время, прошедшее с последнего сохранения (в секундах)
    const lastSaveTime = gameData.lastSaveTime;
    const now = Date.now();
    const offlineSeconds = Math.floor((now - lastSaveTime) / 1000);

    // Загружаем базовые данные
    rust = gameData.rust;
    ships = gameData.ships;
    gameData.upgrades.forEach((savedUpgrade, index) => {
      upgrades[index].level = savedUpgrade.level;
    });

    // Рассчитываем текущую скорость генерации ржавчины (учитываются апгрейды)
    const totals = calculateTotals();
    
    // Вычисляем оффлайн-ржавчину: сколько ржавчины накопилось за время отсутствия
    const offlineRust = offlineSeconds * totals.totalRustPerSecond;
    rust += offlineRust; // прибавляем к текущей ржавчине

    updateDisplay();
    refreshUpgradeDisplay();

    // Если игрок отсутствовал, уведомляем его о накопленной ржавчине
    if (offlineSeconds > 0) {
      alert(`Ты отсутствовал ${offlineSeconds} секунд и заработал ${Math.floor(offlineRust)} ржавчины оффлайн!`);
    }
  }
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

// Запуск снарядов
function fireProjectiles() {
  const totals = calculateTotals();
  const projectileCount = 1 + ships; // количество снарядов = 1 + число кораблей

  for (let i = 0; i < projectileCount; i++) {
    const projectile = document.createElement("div");
    projectile.classList.add("projectile");
    // Смещение по вертикали для каждого снаряда
    projectile.style.top = (220 + i * 5) + "px"; // подбирайте значение под свою композицию

    gameContainer.appendChild(projectile);

    projectile.addEventListener("animationend", () => {
      // Получаем реальные координаты снаряда
      const projectileRect = projectile.getBoundingClientRect();
      const containerRect = gameContainer.getBoundingClientRect();

      // Вычисляем позицию снаряда относительно контейнера
      const finalLeft = projectileRect.left - containerRect.left;
      const finalTop  = projectileRect.top  - containerRect.top;

      // Создаем элемент для взрыва
      const explosion = document.createElement("div");
      explosion.classList.add("explosion");
      explosion.style.position = "absolute";
      explosion.style.left = finalLeft + "px";
      explosion.style.top  = (finalTop - 15) + "px";
      
      // Устанавливаем начальное изображение взрыва (80×80)
      explosion.style.width = "80px";
      explosion.style.height = "80px";
      explosion.style.backgroundImage = "url('images/explosion1.png')";
      explosion.style.backgroundSize = "cover";
      explosion.style.backgroundRepeat = "no-repeat";

      // Добавляем взрыв в контейнер
      gameContainer.appendChild(explosion);
      // Удаляем снаряд
      gameContainer.removeChild(projectile);

      // Меняем изображение и размеры взрыва через 200 мс
      setTimeout(() => {
        explosion.style.width = "120px";
        explosion.style.height = "120px";
        explosion.style.backgroundImage = "url('images/explosion2.png')";
        // Центрируем взрыв относительно первоначальной точки
        explosion.style.marginLeft = "-20px"; 
        explosion.style.marginTop  = "-20px";
      }, 200);

      // Удаляем элемент взрыва через 300 мс
      setTimeout(() => {
        if (gameContainer.contains(explosion)) {
          gameContainer.removeChild(explosion);
        }
      }, 300);

      // При попадании добавляем ржавчину
      rust += totals.totalRustPerClick;
      updateDisplay();
    });
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

// Перезагрузка отображения улучшений после загрузки сохранений
function refreshUpgradeDisplay() {
  upgradeList.innerHTML = '';  // очищаем текущий список улучшений
  initUpgrades();              // перезаполняем заново
}

/************************************************************************
 * СТАРТ ИГРЫ
 ************************************************************************/
initUpgrades();
loadGame(); // загружаем после инициализации улучшений
updateDisplay();

// Автоматическое сохранение каждые 15-30 секунд
setInterval(saveGame, 5000);


// Автоматическая генерация ржавчины
setInterval(() => {
  const totals = calculateTotals();
  rust += totals.totalRustPerSecond;
  updateDisplay();
}, 1000);
