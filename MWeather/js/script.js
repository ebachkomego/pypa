// script.js

let currentLat = 55.7558;
let currentLon = 37.6173;
let favorites = loadFavorites();

document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    setupNavigation();
    setupThemeSwitcher();
    setupFavoriteButton();
    setupFavoritesClick();
    setupSearchSuggestions();
    setupSearchEvents();
    renderFavorites();
    setupLocateButton();
    initLocation();
});

function setupLocateButton() {
    const locateBtn = document.getElementById('locate-btn');
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            initLocation(true); // true means forced by user
        });
    }
}

function setupSearchEvents() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('city-search');

    searchBtn.addEventListener('click', () => {
        const city = searchInput.value.trim();
        if (city) getWeather(city);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = searchInput.value.trim();
            if (city) getWeather(city);
        }
    });
}

function setupSearchSuggestions() {
    const searchInput = document.getElementById('city-search');
    const suggestionsList = document.getElementById('suggestions-list');

    searchInput.addEventListener('input', debounce(async (e) => {
        const value = e.target.value.trim();
        if (!value) {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
            return;
        }

        const suggestions = await fetchCitySuggestions(value);
        if (!suggestions.length) {
            suggestionsList.innerHTML = '<li class="suggestion-item">Ничего не найдено</li>';
            suggestionsList.style.display = 'block';
            return;
        }

        suggestionsList.innerHTML = suggestions
            .map(item => `<li class="suggestion-item" data-name="${item.name}">${item.name}, ${item.country}</li>`)
            .join('');
        suggestionsList.style.display = 'block';
    }, 250));

    suggestionsList.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (!item || !item.dataset.name) return;
        const city = item.dataset.name;
        document.getElementById('city-search').value = city;
        suggestionsList.innerHTML = '';
        suggestionsList.style.display = 'none';
        getWeather(city);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
        }
    });
}

async function fetchCitySuggestions(query) {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ru&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.results) return [];
        return data.results.map(item => ({ name: item.name, country: item.country }));
    } catch (error) {
        console.error('Ошибка поиска подсказок:', error);
        return [];
    }
}

function setupThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('siteTheme', isDark ? 'dark' : 'light');
        updateThemeButton();
    });
    loadTheme();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('siteTheme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    updateThemeButton();
}

function updateThemeButton() {
    const button = document.getElementById('theme-toggle');
    if (document.body.classList.contains('dark-theme')) {
        button.innerHTML = '<i class="fas fa-sun"></i><span>Светлая тема</span>';
    } else {
        button.innerHTML = '<i class="fas fa-moon"></i><span>Тёмная тема</span>';
    }
}

function loadFavorites() {
    try {
        const stored = localStorage.getItem('favoriteCities');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveFavorites() {
    localStorage.setItem('favoriteCities', JSON.stringify(favorites));
}

function renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!favorites.length) {
        container.innerHTML = '<p class="empty-favorites">Список избранных пуст. Добавьте текущий город нажатием на сердечко.</p>';
        return;
    }
    container.innerHTML = favorites
        .map(city => `
            <div class="favorite-item" data-city="${city}">
                <span>${city}</span>
                <button class="remove-fav" aria-label="Удалить из избранного"><i class="fas fa-times"></i></button>
            </div>
        `)
        .join('');
}

function setupFavoritesClick() {
    const container = document.getElementById('favorites-list');
    container.addEventListener('click', (e) => {
        const item = e.target.closest('.favorite-item');
        if (!item) return;
        const city = item.dataset.city;
        if (e.target.matches('.remove-fav')) {
            e.stopPropagation();
            removeFavorite(city);
            return;
        }
        if (city) getWeather(city);
    });
}

function setupFavoriteButton() {
    const button = document.querySelector('.favorite-btn');
    button.addEventListener('click', () => {
        const city = document.getElementById('city-name').textContent.trim();
        if (!city) return;
        toggleFavorite(city);
    });
}

function toggleFavorite(city) {
    const existingIndex = favorites.findIndex(item => item.toLowerCase() === city.toLowerCase());
    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.unshift(city);
    }
    saveFavorites();
    renderFavorites();
    updateFavoriteButton(city);
}

function removeFavorite(city) {
    favorites = favorites.filter(item => item.toLowerCase() !== city.toLowerCase());
    saveFavorites();
    renderFavorites();
    updateFavoriteButton(document.getElementById('city-name').textContent.trim());
}

function isFavorite(city) {
    return favorites.some(item => item.toLowerCase() === city.toLowerCase());
}

function updateFavoriteButton(city) {
    const icon = document.querySelector('.favorite-btn i');
    if (isFavorite(city)) {
        icon.className = 'fas fa-heart';
    } else {
        icon.className = 'far fa-heart';
    }
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function setupNavigation() {
    const links = document.querySelectorAll('.nav-links a');
    const views = document.querySelectorAll('.view-section');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');

            views.forEach(v => v.style.display = 'none');
            const targetId = e.currentTarget.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';

            if(targetId === 'map-view') {
                updateMap(currentLat, currentLon);
            }
        });
    });
}

function updateDate() {
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('ru-RU', options);
}

function initLocation(isForced = false) {
    const cityNameEl = document.getElementById('city-name');
    const weatherDescEl = document.getElementById('weather-desc');
    
    cityNameEl.textContent = "Определение локации...";
    weatherDescEl.textContent = "Запрашиваем данные...";

    const options = { 
        enableHighAccuracy: true, 
        timeout: 10000, // Увеличили до 10 сек для мобильных устройств
        maximumAge: 60000 
    };

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const cityName = await getCityNameByCoords(lat, lon);
                document.getElementById('city-search').value = cityName;
                fetchWeather(lat, lon, cityName);
            },
            async (error) => {
                console.warn("Браузерная геолокация недоступна или отклонена.", error);
                
                // Если не получилось по GPS, пробуем по IP (особенно важно для мобильных)
                const ipLocation = await getLocationByIP();
                if (ipLocation) {
                    document.getElementById('city-search').value = ipLocation.city;
                    fetchWeather(ipLocation.lat, ipLocation.lon, ipLocation.city);
                } else {
                    // Крайний случай - Москва
                    getWeather('Москва'); 
                }
            },
            options
        );
    } else {
        getLocationByIP().then(ipLocation => {
            if (ipLocation) {
                document.getElementById('city-search').value = ipLocation.city;
                fetchWeather(ipLocation.lat, ipLocation.lon, ipLocation.city);
            } else {
                getWeather('Москва');
            }
        });
    }
}

async function getLocationByIP() {
    try {
        // Используем ip-api.com или ipapi.co (бесплатные лимиты)
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
            return {
                lat: data.latitude,
                lon: data.longitude,
                city: data.city || "Ваш город"
            };
        }
    } catch (e) {
        console.error("Ошибка при получении локации по IP:", e);
    }
    return null;
}

async function getCityNameByCoords(lat, lon) {
    try {
        // Использование Nominatim (OpenStreetMap) для более точного определения города
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
        const response = await fetch(url, { headers: { 'Accept-Language': 'ru-RU' } });
        const data = await response.json();
        
        if (data && data.address) {
            // Ищем наиболее точное название города или населенного пункта
            const city = data.address.city || data.address.town || data.address.village || data.address.state || "Ваш город";
            return city;
        }
        return "Ваш город";
    } catch (e) {
        console.error("Ошибка при определении названия города:", e);
        return "Ваш город";
    }
}

async function getWeather(cityName) {
    try {
        document.getElementById('city-name').textContent = "Поиск...";
        
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=ru&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            alert('Город не найден.');
            document.getElementById('city-name').textContent = "Ошибка";
            return;
        }
        
        
        let results = geoData.results || [];
        
        // Если результаты выглядят "мелкими" (нет крупных городов), пробуем поискать латиницей
        if (results.length === 0 || results[0].population < 5000 || !results[0].population) {
            try {
                // Улучшенная транслитерация (Бобруйск -> bobruysk)
                const translit = cityName.toLowerCase()
                    .replace(/б/g, 'b').replace(/о/g, 'o').replace(/р/g, 'r')
                    .replace(/у/g, 'u').replace(/й/g, 'y').replace(/с/g, 's').replace(/к/g, 'k')
                    .replace(/и/g, 'i');
                
                // Дополнительный вариант для Беларуси (о -> a)
                const translitBY = translit.replace(/o/g, 'a');
                
                const fallbackUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(translit)}&count=10&language=ru&format=json`;
                const fallbackUrlBY = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(translitBY)}&count=10&language=ru&format=json`;
                
                const [f1, f2] = await Promise.all([fetch(fallbackUrl), fetch(fallbackUrlBY)]);
                const [d1, d2] = await Promise.all([f1.json(), f2.json()]);
                
                if (d1.results) results = [...results, ...d1.results];
                if (d2.results) results = [...results, ...d2.results];
            } catch(e) { console.warn("Fallback search failed", e); }
        }

        // Функция для очистки имени от похожих латинских букв (для сравнения)
        const normalizeName = (name) => {
            return name.toLowerCase()
                .replace(/o/g, 'о').replace(/a/g, 'а').replace(/e/g, 'е').replace(/p/g, 'р').replace(/c/g, 'с').replace(/y/g, 'у');
        };

        const targetNormalized = normalizeName(cityName);

        // Сортируем результаты: сначала по "типу" (города выше деревень), затем по населению
        results.sort((a, b) => {
            const getRank = (res) => {
                let rank = 0;
                if (res.feature_code && res.feature_code.startsWith('PPLC')) rank += 100; // Столица
                if (res.feature_code && res.feature_code.startsWith('PPLA')) rank += 50;  // Областной центр
                if (res.population > 50000) rank += 20;
                
                // Бонус за точное совпадение (с учетом нормализации)
                if (normalizeName(res.name) === targetNormalized) rank += 30;
                
                return rank;
            };
            const rankDiff = getRank(b) - getRank(a);
            if (rankDiff !== 0) return rankDiff;
            return (b.population || 0) - (a.population || 0);
        });
        
        if (!results.length) {
            alert('Город не найден. Попробуйте другой запрос.');
            document.getElementById('city-name').textContent = 'Ошибка';
            return;
        }

        let bestResult = results[0];
        
        // Используем имя из поиска для отображения
        const displayName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
        
        console.log(`[v3.1] Selected city: ${bestResult.name} (${bestResult.country}), population: ${bestResult.population}, coords: ${bestResult.latitude}, ${bestResult.longitude}`);
        
        fetchWeather(bestResult.latitude, bestResult.longitude, displayName);
        
    } catch (error) {
        console.error(error);
    }
}

async function fetchWeather(lat, lon, cityName) {
    try {
        currentLat = lat;
        currentLon = lon;

        document.getElementById('city-name').textContent = cityName;
        document.querySelectorAll('.forecast-city-name').forEach(el => el.textContent = `в г. ${cityName}`);
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,surface_pressure,visibility,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=10`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        updateUI(data);
        
        // Обновляем карту только если она активна
        if(document.getElementById('map-view').style.display === 'block') {
            updateMap(lat, lon);
        }
        
    } catch (error) {
        console.error(error);
        alert('Произошла ошибка при загрузке данных о погоде.');
    }
}

function updateUI(data) {
    const current = data.current_weather;
    
    document.getElementById('current-temp').textContent = `${Math.round(current.temperature)}°`;
    document.getElementById('wind-speed').textContent = `${current.windspeed} км/ч`; 
    
    let currentIndex = 0;
    if(data.hourly && data.hourly.time) {
        const currentHour = new Date(current.time).getTime();
        let minDiff = Infinity;
        
        data.hourly.time.forEach((timeStr, i) => {
            const diff = Math.abs(new Date(timeStr).getTime() - currentHour);
            if (diff < minDiff) {
                minDiff = diff;
                currentIndex = i;
            }
        });
        
        const humidity = data.hourly.relativehumidity_2m[currentIndex];
        document.getElementById('humidity').textContent = humidity !== undefined ? `${humidity}%` : '--%';
        
        const pressureGpa = data.hourly.surface_pressure[currentIndex];
        document.getElementById('pressure').textContent = pressureGpa ? `${Math.round(pressureGpa * 0.75006)} мм` : '-- мм';
        
        const visibility = data.hourly.visibility[currentIndex];
        document.getElementById('visibility').textContent = visibility ? `${(visibility / 1000).toFixed(1)} км` : '-- км';
    }
    
    const weatherInfo = getWeatherDescription(current.weathercode);
    document.getElementById('weather-desc').textContent = weatherInfo.desc;
    
    const mainIcon = document.getElementById('main-icon');
    if (mainIcon) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = weatherInfo.iconHTML.replace('weather-icon-wrapper', 'weather-icon-wrapper large');
        const newIcon = tempDiv.firstElementChild;
        newIcon.id = 'main-icon';
        mainIcon.replaceWith(newIcon);
    }
    
    const forecastMini = document.getElementById('forecast-list-mini');
    const forecast10 = document.getElementById('forecast-list-10');
    const forecastHourly = document.getElementById('forecast-list-hourly');
    
    forecastMini.innerHTML = ''; 
    forecast10.innerHTML = '';
    forecastHourly.innerHTML = '';
    
    // Почасовой прогноз
    if(data.hourly) {
        for(let i = currentIndex; i < currentIndex + 24; i++) {
            if(i >= data.hourly.time.length) break;
            
            const date = new Date(data.hourly.time[i]);
            const hours = date.getHours().toString().padStart(2, '0') + ':00';
            const temp = Math.round(data.hourly.temperature_2m[i]);
            const hum = data.hourly.relativehumidity_2m[i];
            const info = getWeatherDescription(data.hourly.weathercode[i]);
            
            const hourlyHtml = `
                <div class="hourly-card">
                    <div class="time">${i === currentIndex ? 'Сейчас' : hours}</div>
                    ${info.iconHTML}
                    <div class="temp">${temp}°</div>
                    <div class="humidity"><i class="fas fa-tint"></i> ${hum}%</div>
                </div>
            `;
            forecastHourly.insertAdjacentHTML('beforeend', hourlyHtml);
        }
    }
    
    // Прогноз на 3 дня
    if(data.daily) {
        for(let i = 0; i < 3; i++) {
            const date = new Date(data.daily.time[i]);
            const dayName = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : date.toLocaleDateString('ru-RU', {weekday: 'long'});
            const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
            const minTemp = Math.round(data.daily.temperature_2m_min[i]);
            const info = getWeatherDescription(data.daily.weathercode[i]);
            
            const itemHTML = `
                <div class="forecast-item">
                    <div style="display:flex; align-items:center; gap: 10px; width: 45%;">
                        <div class="mini-icon-container">
                            ${info.iconHTML}
                        </div>
                        <span style="text-transform: capitalize; font-weight: 500;">${dayName}</span>
                    </div>
                    <div style="width: 25%; text-align: left; color: var(--text-muted); font-size: 0.85em;">
                        ${info.desc}
                    </div>
                    <div style="width: 30%; text-align: right; font-weight: bold;">
                        ${maxTemp}° <span style="color: var(--text-muted); font-weight: normal; margin-left: 10px;">${minTemp}°</span>
                    </div>
                </div>
            `;
            forecastMini.insertAdjacentHTML('beforeend', itemHTML);
        }

        // Прогноз на 10 дней
        for(let i = 0; i < Math.min(10, data.daily.time.length); i++) {
            const date = new Date(data.daily.time[i]);
            const dayName = date.toLocaleDateString('ru-RU', {weekday: 'long'});
            const dateStr = date.toLocaleDateString('ru-RU', {month: 'short', day: 'numeric'});
            
            const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
            const minTemp = Math.round(data.daily.temperature_2m_min[i]);
            const info = getWeatherDescription(data.daily.weathercode[i]);
            
            const item10 = `
                <div class="long-forecast-card">
                    <div class="top-info">
                        <div class="day">${i === 0 ? 'Сегодня' : dayName}</div>
                        <div class="date">${dateStr}</div>
                    </div>
                    ${info.iconHTML}
                    <div class="long-forecast-desc">${info.desc}</div>
                    <div class="temps">${maxTemp}° <span>${minTemp}°</span></div>
                </div>
            `;
            forecast10.insertAdjacentHTML('beforeend', item10);
        }
    }
}

function updateMap(lat, lon) {
    const iframe = document.getElementById('weather-map-iframe');
    // Используем обновленный URL для Windy (версия 2)
    // Добавляем параметры для отображения ветра и интерактивности
    // Добавляем timestamp для сброса кэша iframe и принудительного обновления
    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=7&level=surface&overlay=temperature&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1&t=${Date.now()}`;
    
    console.log(`Updating map to: ${lat}, ${lon}`);
    
    setTimeout(() => {
        iframe.src = url;
    }, 300); 
}

function getWeatherDescription(code) {
    const codes = {
        0: { desc: 'Ясно', icon: 'fa-sun', type: 'sun' },
        1: { desc: 'Преимущественно ясно', icon: 'fa-cloud-sun', type: 'cloud-sun' },
        2: { desc: 'Переменная облачность', icon: 'fa-cloud-sun', type: 'cloud-sun' },
        3: { desc: 'Пасмурно', icon: 'fa-cloud', type: 'cloud' },
        45: { desc: 'Туман', icon: 'fa-smog', type: 'cloud' },
        48: { desc: 'Оседающий туман', icon: 'fa-smog', type: 'cloud' },
        51: { desc: 'Легкая морось', icon: 'fa-cloud-rain', type: 'cloud-rain' },
        53: { desc: 'Умеренная морось', icon: 'fa-cloud-rain', type: 'cloud-rain' },
        55: { desc: 'Плотная морось', icon: 'fa-cloud-rain', type: 'cloud-rain' },
        61: { desc: 'Небольшой дождь', icon: 'fa-cloud-rain', type: 'cloud-rain' },
        63: { desc: 'Умеренный дождь', icon: 'fa-cloud-showers-heavy', type: 'cloud-rain' },
        65: { desc: 'Сильный дождь', icon: 'fa-cloud-showers-heavy', type: 'cloud-rain' },
        71: { desc: 'Небольшой снег', icon: 'fa-snowflake', type: 'snow' },
        73: { desc: 'Умеренный снег', icon: 'fa-snowflake', type: 'snow' },
        75: { desc: 'Сильный снег', icon: 'fa-snowflake', type: 'snow' },
        80: { desc: 'Слабые ливни', icon: 'fa-cloud-showers-water', type: 'cloud-rain' },
        81: { desc: 'Умеренные ливни', icon: 'fa-cloud-showers-water', type: 'cloud-rain' },
        82: { desc: 'Сильные ливни', icon: 'fa-cloud-showers-water', type: 'cloud-rain' },
        95: { desc: 'Гроза', icon: 'fa-bolt', type: 'bolt' },
        96: { desc: 'Гроза с градом', icon: 'fa-cloud-bolt', type: 'cloud-bolt' },
        99: { desc: 'Сильная гроза с градом', icon: 'fa-cloud-bolt', type: 'cloud-bolt' }
    };
    
    const info = codes[code] || { desc: 'Неизвестно', icon: 'fa-cloud', type: 'cloud' };
    
    // Генерация HTML для иконки (слоистая для красоты)
    let iconHTML = '';
    if (info.type === 'cloud-sun') {
        iconHTML = `<div class="weather-icon-wrapper"><i class="fas fa-sun icon-layer-sun"></i><i class="fas fa-cloud icon-layer-cloud"></i></div>`;
    } else if (info.type === 'cloud-rain') {
        iconHTML = `<div class="weather-icon-wrapper"><i class="fas fa-cloud icon-layer-cloud"></i><i class="fas fa-tint icon-layer-rain"></i></div>`;
    } else if (info.type === 'cloud-bolt') {
        iconHTML = `<div class="weather-icon-wrapper"><i class="fas fa-cloud icon-layer-cloud"></i><i class="fas fa-bolt icon-layer-bolt"></i></div>`;
    } else {
        iconHTML = `<div class="weather-icon-wrapper"><i class="fas ${info.icon}"></i></div>`;
    }
    
    return { ...info, iconHTML };
}
