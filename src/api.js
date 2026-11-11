const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim()
const BASE = 'https://api.openweathermap.org'

export class WeatherError extends Error {
  constructor(kind, message) {
    super(message)
    this.kind = kind
  }
}

export function hasApiKey() {
  return Boolean(API_KEY)
}

async function request(path, params) {
  if (!API_KEY) {
    throw new WeatherError('no-key', 'API-nyckel saknas.')
  }
  const url = new URL(path, BASE)
  Object.entries({ ...params, appid: API_KEY }).forEach(([k, v]) => url.searchParams.set(k, v))

  let res
  try {
    res = await fetch(url)
  } catch {
    throw new WeatherError('network', 'Kunde inte nå vädertjänsten. Kontrollera din internetanslutning och försök igen.')
  }

  if (res.status === 401) {
    throw new WeatherError(
      'bad-key',
      'OpenWeatherMap godtog inte nyckeln. Kontrollera att den är rätt inskriven i .env.local. En helt ny nyckel kan ta upp till ett par timmar innan den aktiveras hos OpenWeatherMap.'
    )
  }
  if (res.status === 429) {
    throw new WeatherError('rate', 'För många förfrågningar just nu. Vänta en stund och försök igen.')
  }
  if (res.status === 404) {
    throw new WeatherError('not-found', 'Hittade inget väder för den orten.')
  }
  if (!res.ok) {
    throw new WeatherError('server', `Vädertjänsten svarade med ett fel (${res.status}). Försök igen senare.`)
  }
  return res.json()
}

export async function searchPlaces(query) {
  const data = await request('/geo/1.0/direct', { q: query, limit: 5 })
  // Geocoding kan ge flera nästan identiska träffar; behåll en per namn, län och land.
  const seen = new Set()
  const unique = data.filter((p) => {
    const key = [p.local_names?.sv || p.name, p.state, p.country].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return unique.map((p) => ({
    id: `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`,
    name: p.local_names?.sv || p.name,
    state: p.state || '',
    country: p.country,
    lat: p.lat,
    lon: p.lon,
  }))
}

export async function getCurrent({ lat, lon }) {
  const d = await request('/data/2.5/weather', { lat, lon, units: 'metric', lang: 'sv' })
  return {
    temp: d.main.temp,
    feelsLike: d.main.feels_like,
    humidity: d.main.humidity,
    wind: d.wind.speed,
    description: d.weather[0]?.description ?? '',
    icon: d.weather[0]?.icon ?? '01d',
    timezone: d.timezone,
  }
}

// Prognosen kommer i steg om tre timmar; slå ihop till en rad per dag (ortens lokala datum).
export async function getForecast({ lat, lon }) {
  const d = await request('/data/2.5/forecast', { lat, lon, units: 'metric', lang: 'sv' })
  const offset = d.city.timezone
  const todayKey = localDateKey(Date.now() / 1000, offset)
  const days = new Map()

  for (const item of d.list) {
    const key = localDateKey(item.dt, offset)
    if (!days.has(key)) days.set(key, [])
    days.get(key).push(item)
  }

  const result = []
  for (const [key, items] of days) {
    if (key === todayKey && days.size > 5) continue
    const temps = items.map((i) => i.main.temp)
    // Välj gärna mitt-på-dagen-värdet för ikon och beskrivning.
    const noon =
      items.reduce((best, i) => {
        const h = new Date((i.dt + offset) * 1000).getUTCHours()
        const bh = new Date((best.dt + offset) * 1000).getUTCHours()
        return Math.abs(h - 13) < Math.abs(bh - 13) ? i : best
      }, items[0])
    result.push({
      key,
      date: new Date(`${key}T12:00:00Z`),
      min: Math.min(...temps),
      max: Math.max(...temps),
      icon: noon.weather[0]?.icon?.replace('n', 'd') ?? '01d',
      description: noon.weather[0]?.description ?? '',
      pop: Math.round(Math.max(...items.map((i) => i.pop ?? 0)) * 100),
    })
  }
  return result.slice(0, 5)
}

function localDateKey(unixSeconds, offset) {
  return new Date((unixSeconds + offset) * 1000).toISOString().slice(0, 10)
}

export function iconUrl(icon) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}
