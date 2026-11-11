const countryNames = new Intl.DisplayNames(['sv'], { type: 'region' })

export function countryName(code) {
  try {
    return countryNames.of(code) || code
  } catch {
    return code
  }
}

export function placeLabel(place, { withName = true } = {}) {
  const parts = [withName && place.name, place.state, countryName(place.country)]
  return parts.filter(Boolean).join(', ')
}

export const temp = (t) => `${Math.round(t)}°`

const weekday = new Intl.DateTimeFormat('sv-SE', { weekday: 'short', timeZone: 'UTC' })
const dayMonth = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export const formatWeekday = (date) => weekday.format(date).replace('.', '')
export const formatDayMonth = (date) => dayMonth.format(date)

export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)
