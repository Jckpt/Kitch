# Kitch Channel API - Cloudflare Worker

Endpoint `/api/channel/{streamer}` przeniesiony z backendu Python do Hono.js na Cloudflare Workers.

## Funkcjonalność

- **GET `/api/channel/:streamer`** - Pobiera informacje o kanale streamora z Kick.com API
- **GET `/api/v2/channels?streamers=a,b`** - Pobiera dane wielu kanałów Kick
- **GET `/api/v2/livestreams`** - Pobiera aktualne livestreamy Kick
- **GET `/api/v2/livestreams?category_id=123`** - Pobiera livestreamy dla kategorii
- **GET `/api/subcategories`** - Pobiera kategorie do popupu z publicznego Kick categories API
- **POST `/api/twitch/token`** - Wymienia kod OAuth Twitch na access i refresh token
- **POST `/api/twitch/refresh`** - Odświeża token użytkownika Twitch
- Automatyczne odświeżanie tokenów OAuth
- CORS support
- TypeScript support

## Konfiguracja

### 1. Instalacja zależności

```sh
pnpm install
```

### 2. Konfiguracja zmiennych środowiskowych

Ustaw zmienne środowiskowe w Cloudflare Dashboard lub używając Wrangler:

```sh
# Ustaw zmienne dla środowiska produkcyjnego
wrangler secret put KICK_CLIENT_ID
wrangler secret put KICK_CLIENT_SECRET
wrangler secret put TWITCH_CLIENT_ID
wrangler secret put TWITCH_CLIENT_SECRET
```

### 3. Lokalne zmienne (development)

Utwórz plik `.dev.vars` w katalogu głównym:

```
KICK_CLIENT_ID=your_kick_client_id_here
KICK_CLIENT_SECRET=your_kick_client_secret_here
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here
```

Worker pobiera access token z Kick OAuth client credentials i cache'uje go w KV
pod bindingiem `KICK_TOKEN_CACHE`.

### 4. KV dla cache tokena Kick

Lokalnie Wrangler użyje bindingu z `wrangler.jsonc`. Dla Cloudflare production
utwórz namespace:

```sh
pnpm wrangler kv namespace create KICK_TOKEN_CACHE
```

Następnie podmień `id` w `wrangler.jsonc` na ID zwrócone przez Wranglera.

Worker jest przypięty do `https://kitch.pl/api/*`, więc rekord DNS `kitch.pl`
musi być proxied przez Cloudflare. Redirect URI aplikacji Twitch pozostaje ustawione
na `https://kitch.pl/`, a typ aplikacji musi być ustawiony na Confidential.

## Development

```sh
pnpm run dev
```

Server będzie dostępny na: `http://localhost:8787`

## Deploy

```sh
pnpm run deploy
```

## Testowanie

Przykładowe zapytanie:

```
GET https://your-worker.your-subdomain.workers.dev/api/channel/xqc
```

Odpowiedź:

```json
{
  "user": {
    "username": "xQc"
  }
}
```

## Struktura API

### Endpoint: GET `/api/channel/:streamer`

**Parametry:**

- `streamer` - slug kanału na Kick.com

**Odpowiedź:**

- Status 200: `{ "user": { "username": "string" } }`
- Status 404: `{ "error": "Channel not found" }`
- Status 500: `{ "error": "Error message" }`

## Generowanie typów

```sh
pnpm run cf-typegen
```
