// script.js

// Глобальные переменные
let currentLat = 55.7558;
let currentLon = 37.6173;

// Массив с моковыми новостями
const newsData = [
    {
        title: "Глобальное потепление",
        summary: "Как изменение климата влияет на ежедневную погоду в вашем регионе.",
        fullText: "Ученые отмечают, что средняя температура на планете продолжает расти. В нашем регионе это приведет к более частым температурным аномалиям, мягким зимам и очень жаркому лету. Рекомендуется следить за изменениями климата и адаптировать свой образ жизни.",
        img: "https://images.unsplash.com/photo-1561484930-998b6a7b22e8?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Сезон дождей",
        summary: "Ожидаются сильные осадки в центральной части страны на следующей неделе.",
        fullText: "Синоптики предупреждают о надвигающемся циклоне, который принесет с собой затяжные дожди. Ожидается выпадение более 30% месячной нормы осадков за несколько дней. Водителям рекомендуется быть осторожнее на дорогах из-за ухудшения видимости и риска аквапланирования.",
        img: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Магнитные бури",
        summary: "Вспышки на солнце приведут к сильным геомагнитным бурям в эти выходные.",
        fullText: "Обсерватории зафиксировали серию сильных вспышек на Солнце класса M и X. Облако плазмы достигнет Земли в субботу вечером, что вызовет магнитную бурю класса G3. Метеозависимым людям следует контролировать давление, больше отдыхать и избегать стрессов.",
        img: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=80"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    initLocation(); 
    setupNavigation();
    renderNews();
    
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('city-search');
    
    searchBtn.addEventListener('click', () => {
        const city = searchInput.value.trim();
        if(city) getWeather(city);
    });

    searchInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            const city = searchInput.value.trim();
            if(city) getWeather(city);
        }
    });

    // Модальное окно новостей
    document.querySelector('.close-modal').onclick = () => {
        document.getElementById('news-modal').style.display = "none";
    }
    window.onclick = (e) => {
        const modal = document.getElementById('news-modal');
        if (e.target === modal) {
            modal.style.display = "none";
        }
    }
});

function renderNews() {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    newsData.forEach((news, idx) => {
        const article = `
            <article class="news-card" onclick="openNews(${idx})">
                <img src="${news.img}" alt="Погода">
                <div class="news-content">
                    <h3>${news.title}</h3>
                    <p>${news.summary}</p>
                </div>
            </article>
        `;
        container.insertAdjacentHTML('beforeend', article);
    });
}

window.openNews = function(idx) {
    const modal = document.getElementById('news-modal');
    document.getElementById('modal-title').textContent = newsData[idx].title;
    document.getElementById('modal-image').src = newsData[idx].img;
    document.getElementById('modal-body').textContent = newsData[idx].fullText;
    modal.style.display = "block";
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

function initLocation() {
    document.getElementById('city-name').textContent = "Определение локации...";
    document.getElementById('weather-desc').textContent = "Запрашиваем данные...";

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Более надежное API для определения города
                const cityName = await getCityNameByCoords(lat, lon);
                document.getElementById('city-search').value = cityName;
                fetchWeather(lat, lon, cityName);
            },
            (error) => {
                console.warn("Геолокация недоступна.", error);
                getWeather('Москва'); 
            },
            { timeout: 10000 }
        );
    } else {
        getWeather('Москва');
    }
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
        
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            alert('Город не найден.');
            document.getElementById('city-name').textContent = "Ошибка";
            return;
        }
        
        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;
        const actualCityName = geoData.results[0].name;
        
        fetchWeather(lat, lon, actualCityName);
        
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
    mainIcon.className = `fas ${weatherInfo.icon} weather-icon-large`;
    
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
                    <i class="fas ${info.icon}"></i>
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
                        <i class="fas ${info.icon}" style="color: #f59e0b; font-size: 1.2rem;"></i>
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
                    <div class="day">${i === 0 ? 'Сегодня' : dayName}</div>
                    <div class="date">${dateStr}</div>
                    <i class="fas ${info.icon}"></i>
                    <div style="color: var(--text-muted); font-size: 0.85em; height: 2.5em; display: flex; align-items: center; text-align: center;">${info.desc}</div>
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
    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=5&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
    
    setTimeout(() => {
        iframe.src = url;
    }, 200); 
}

function getWeatherDescription(code) {
    const codes = {
        0: { desc: 'Ясно', icon: 'fa-sun' },
        1: { desc: 'Преимущественно ясно', icon: 'fa-cloud-sun' },
        2: { desc: 'Переменная облачность', icon: 'fa-cloud-sun' },
        3: { desc: 'Пасмурно', icon: 'fa-cloud' },
        45: { desc: 'Туман', icon: 'fa-smog' },
        48: { desc: 'Оседающий туман', icon: 'fa-smog' },
        51: { desc: 'Легкая морось', icon: 'fa-cloud-rain' },
        53: { desc: 'Умеренная морось', icon: 'fa-cloud-rain' },
        55: { desc: 'Плотная морось', icon: 'fa-cloud-rain' },
        61: { desc: 'Небольшой дождь', icon: 'fa-cloud-rain' },
        63: { desc: 'Умеренный дождь', icon: 'fa-cloud-showers-heavy' },
        65: { desc: 'Сильный дождь', icon: 'fa-cloud-showers-heavy' },
        71: { desc: 'Небольшой снег', icon: 'fa-snowflake' },
        73: { desc: 'Умеренный снег', icon: 'fa-snowflake' },
        75: { desc: 'Сильный снег', icon: 'fa-snowflake' },
        80: { desc: 'Слабые ливни', icon: 'fa-cloud-showers-water' },
        81: { desc: 'Умеренные ливни', icon: 'fa-cloud-showers-water' },
        82: { desc: 'Сильные ливни', icon: 'fa-cloud-showers-water' },
        95: { desc: 'Гроза', icon: 'fa-bolt' },
        96: { desc: 'Гроза с градом', icon: 'fa-cloud-bolt' },
        99: { desc: 'Сильная гроза с градом', icon: 'fa-cloud-bolt' }
    };
    return codes[code] || { desc: 'Неизвестно', icon: 'fa-cloud' };
}
