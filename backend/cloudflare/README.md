# Kitch Channel API - Cloudflare Worker

Endpoint `/api/channel/{streamer}` przeniesiony z backendu Python do Hono.js na Cloudflare Workers.

## Funkcjonalność

- **GET `/api/channel/:streamer`** - Pobiera informacje o kanale streamora z Kick.com API
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
wrangler secret put KICK_API_KEY
wrangler secret put KICK_CLIENT_ID  
wrangler secret put KICK_CLIENT_SECRET
```

### 3. Lokalne zmienne (development)

Utwórz plik `.dev.vars` w katalogu głównym:

```
KICK_API_KEY=your_kick_api_key_here
KICK_CLIENT_ID=your_kick_client_id_here
KICK_CLIENT_SECRET=your_kick_client_secret_here
```

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
