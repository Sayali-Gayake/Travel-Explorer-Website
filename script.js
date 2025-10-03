// Travel Explorer - main JS
// Replace these keys with your own
const UNSPLASH_ACCESS_KEY = "sEVWGKG6_j5wNvI7ktdOMx1Jw3_Wo6YAA4FHadtI7xk"; // Get from https://unsplash.com/developers
const OPENWEATHER_KEY = "cd9db3321f1971b8f6ffd346d6401ce4"; // Get from https://openweathermap.org/api

// DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsEl = document.getElementById('results');
const messageEl = document.getElementById('message');
const onlyPhotosCheckbox = document.getElementById('onlyPhotos');
const randomBtn = document.getElementById('randomBtn');

// Modal
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModal');
const modalImages = document.getElementById('modalImages');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalWeather = document.getElementById('modalWeather');

const SAMPLE_PLACES = ["Paris","Tokyo","Goa","New York","Bali","London","Sydney","Rome","Istanbul","Barcelona"];

function showMessage(text, hide=false) {
  if (hide) {
    messageEl.hidden = true;
    return;
  }
  messageEl.hidden = false;
  messageEl.textContent = text;
}

function clearResults() {
  resultsEl.innerHTML = '';
}

function createCard(place, images=[], weather=null) {
  const card = document.createElement('article');
  card.className = 'card';

  const img = document.createElement('img');
  img.className = 'card-img';
  img.alt = place;
  img.src = images[0] || placeholderImage(place);
  card.appendChild(img);

  const body = document.createElement('div');
  body.className = 'card-body';

  const titleRow = document.createElement('div');
  titleRow.className = 'card-title';
  const title = document.createElement('div');
  title.textContent = place;
  titleRow.appendChild(title);

  const detailBtn = document.createElement('button');
  detailBtn.className = 'btn';
  detailBtn.textContent = 'Details';
  detailBtn.onclick = () => openModal(place, images, weather);
  titleRow.appendChild(detailBtn);

  body.appendChild(titleRow);

  const sub = document.createElement('div');
  sub.className = 'card-sub';
  sub.textContent = `Photos: ${images.length} • Weather: ${weather ? weather.temp + "°C, " + weather.desc : "N/A"}`;
  body.appendChild(sub);

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  if (weather) {
    const pill = document.createElement('div');
    pill.className = 'weather-pill';
    pill.innerHTML = `
      <div>
        <div class="temp">${Math.round(weather.temp)}°C</div>
        <div class="muted" style="font-size:0.85rem;color:var(--muted)">${weather.desc}</div>
      </div>
      <img class="icon-small" src="${weather.icon}" alt="icon" />
    `;
    actions.appendChild(pill);
  } else {
    const spacer = document.createElement('div');
    spacer.innerHTML = `<small style="color:var(--muted)">Weather not available</small>`;
    actions.appendChild(spacer);
  }

  body.appendChild(actions);
  card.appendChild(body);
  return card;
}

function placeholderImage(query){
  // fallback to source.unsplash for a quick demo (no keys)
  return `https://source.unsplash.com/featured/?${encodeURIComponent(query)}`;
}

async function fetchUnsplashImages(query, count=6){
  if(!UNSPLASH_ACCESS_KEY){
    // fallback to single URL
    return [placeholderImage(query)];
  }
  try{
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&client_id=${UNSPLASH_ACCESS_KEY}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Unsplash API error');
    const json = await res.json();
    return json.results.map(r => r.urls.regular);
  }catch(err){
    console.warn("Unsplash fetch failed:", err);
    return [placeholderImage(query)];
  }
}

async function fetchWeatherForCity(city){
  if(!OPENWEATHER_KEY) return null;
  try{
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_KEY}`;
    const res = await fetch(url);
    if(!res.ok) {
      // could be 404 city not found
      return null;
    }
    const data = await res.json();
    const weather = {
      temp: data.main.temp,
      desc: data.weather[0].description,
      humidity: data.main.humidity,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      wind: data.wind.speed,
      country: data.sys.country
    };
    return weather;
  }catch(err){
    console.warn("Weather fetch failed:", err);
    return null;
  }
}

async function searchAndRender(queryList){
  clearResults();
  showMessage("Loading results...");

  const showOnlyPhotos = onlyPhotosCheckbox.checked;
  const promises = queryList.map(async q => {
    const images = await fetchUnsplashImages(q, 6);
    let weather = null;
    if(!showOnlyPhotos){
      weather = await fetchWeatherForCity(q);
    }
    return {place:q, images, weather};
  });

  try{
    const results = await Promise.all(promises);
    showMessage('', true);
    results.forEach(r => {
      const card = createCard(r.place, r.images, r.weather);
      resultsEl.appendChild(card);
    });

    if(results.length === 0) showMessage("No results found.");
  }catch(err){
    console.error(err);
    showMessage("Something went wrong while fetching data. Try again.");
  }
}

// Modal functions
function openModal(title, images, weather){
  modalImages.innerHTML = '';
  images.slice(0,4).forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = title;
    modalImages.appendChild(img);
  });

  modalTitle.textContent = title;
  modalDescription.textContent = `Explore photos from ${title}. Click anywhere outside the modal to close.`;

  if(weather){
    modalWeather.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${weather.icon}" alt="icon" width="64" height="64" />
        <div>
          <div style="font-weight:700">${Math.round(weather.temp)}°C • ${weather.desc}</div>
          <div style="color:var(--muted)">Humidity: ${weather.humidity}% • Wind: ${weather.wind} m/s • ${weather.country}</div>
        </div>
      </div>
    `;
  } else {
    modalWeather.innerHTML = `<div style="color:var(--muted)">Weather details not available. Add your OpenWeather API key in script.js for live weather.</div>`;
  }

  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}

function closeModal(){
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

closeModalBtn?.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if(e.target === modal) closeModal();
});

// Search button logic & 'Enter' key
const doSearch = async () => {
  const q = searchInput.value.trim();
  if(!q){
    showMessage("Please enter a destination to search.");
    return;
  }
  await searchAndRender([q]);
};

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') doSearch();
});

// Surprise me button
randomBtn.addEventListener('click', async () => {
  const samples = [];
  // pick 6 random popular places
  const shuffled = SAMPLE_PLACES.sort(() => 0.5 - Math.random());
  for(let i=0;i<6 && i<shuffled.length;i++) samples.push(shuffled[i]);
  await searchAndRender(samples);
});

// initial sample render
window.addEventListener('load', () => {
  // show a few sample destinations
  searchAndRender(["Paris","Bali","New York","Tokyo"]);
});
