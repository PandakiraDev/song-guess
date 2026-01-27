# SongGuess Server

Lokalny serwer do streamowania audio dla aplikacji SongGuess.

## Wymagania

- Node.js 18+
- yt-dlp (`pip install yt-dlp`)

## Uruchomienie

### Na komputerze:
```bash
npm install
npm start
```

### W Termux (Android):
```bash
pkg install python nodejs
pip install yt-dlp
npm install
npm start
```

Serwer uruchomi się na `http://localhost:3001`

## API

### GET /
Health check.

### GET /audio/:videoId
Zwraca URL do audio dla danego YouTube video ID.

```
GET /audio/dQw4w9WgXcQ
→ {"success": true, "url": "https://...", "videoId": "dQw4w9WgXcQ"}
```
