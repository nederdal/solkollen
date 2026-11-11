# Solkollen ☀️

En glad väderapp på svenska. Sök efter en ort och se vädret just nu och en prognos för de kommande fem dagarna. Spara favoritorter och byt snabbt mellan dem. Favoriterna sparas i webbläsaren (localStorage).

Väderdata hämtas från [OpenWeatherMap](https://openweathermap.org/) via deras gratis-API:er för aktuellt väder, femdygnsprognos och ortsökning (Geocoding).

Byggd med React och Vite.

## Kom igång

1. Skaffa en gratis API-nyckel på [openweathermap.org](https://openweathermap.org/api).
2. Kopiera `.env.example` till `.env.local` och fyll i nyckeln:
   ```
   VITE_OPENWEATHER_API_KEY=din-nyckel
   ```
3. Installera och starta:
   ```bash
   npm install
   npm run dev
   ```

`npm run build` bygger en statisk version i `dist/`. Vite är inställt med `base: './'` så att appen fungerar på GitHub Pages.

> Obs! Nyckeln byggs in i JavaScript-koden som skickas till webbläsaren, så den syns för den som besöker en publicerad version. Använd en gratisnyckel utan betalkort kopplat.
