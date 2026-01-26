# SongGuess

Imprezowa gra muzyczna, w której gracze dodają piosenki, a następnie zgadują, kto dodał każdą odtwarzaną piosenkę.

## Funkcje

- Tworzenie i dołączanie do pokojów przez kod lub QR
- Wyszukiwarka YouTube do dodawania piosenek
- Inteligentny start od najpopularniejszego fragmentu piosenki
- System punktacji z bonusami za szybkość i serię trafień
- Animowane ujawnienia i podium z wynikami
- Tryb gościa lub konto z zapisem statystyk

## Wymagania

- Node.js 18+
- npm lub yarn
- Expo CLI
- Konto Firebase
- YouTube Data API key

## Instalacja

1. **Zainstaluj zależności:**
```bash
cd SongGuess
npm install
```

2. **Skonfiguruj Firebase:**
   - Utwórz projekt w [Firebase Console](https://console.firebase.google.com/)
   - Włącz Authentication (Email/Password, Google)
   - Włącz Firestore Database
   - Skopiuj konfigurację do `src/services/firebase.ts`

3. **Skonfiguruj YouTube API:**
   - Utwórz projekt w [Google Cloud Console](https://console.cloud.google.com/)
   - Włącz YouTube Data API v3
   - Utwórz klucz API
   - Wklej klucz do `src/services/youtubeService.ts`

4. **Uruchom aplikację:**
```bash
npm start
```

## Struktura projektu

```
src/
├── components/           # Komponenty UI
│   ├── common/          # Button, Input, Card, Avatar, Timer
│   ├── game/            # YouTubePlayer, VotingCard, Scoreboard
│   └── room/            # QRCode, PlayerList, RoomSettings
├── screens/             # Ekrany aplikacji
│   ├── HomeScreen.tsx
│   ├── AuthScreen.tsx
│   ├── CreateRoomScreen.tsx
│   ├── JoinRoomScreen.tsx
│   ├── LobbyScreen.tsx
│   ├── AddSongsScreen.tsx
│   ├── GameScreen.tsx
│   ├── ResultsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── QRScannerScreen.tsx
├── services/            # Logika biznesowa
│   ├── firebase.ts
│   ├── roomService.ts
│   ├── gameService.ts
│   ├── youtubeService.ts
│   └── authService.ts
├── hooks/               # Custom hooks
│   ├── useRoom.ts
│   ├── useGame.ts
│   └── useAuth.ts
├── store/               # Zustand stores
│   ├── gameStore.ts
│   └── userStore.ts
├── types/               # TypeScript typy
├── utils/               # Helpery (scoring, animations)
└── theme/               # Style (colors)
```

## Konfiguracja Firebase

Edytuj `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "songguess-4dd30",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "907750033094",
  appId: "1:907750033094:android:ff0a23058ce15f6c27f9c7"
};
```

## Konfiguracja YouTube API

Edytuj `src/services/youtubeService.ts`:

```typescript
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY';
```

## Reguły Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Rooms
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;

      // Players subcollection
      match /players/{playerId} {
        allow read, write: if true;
      }

      // Songs subcollection
      match /songs/{songId} {
        allow read, write: if true;
      }

      // Votes subcollection
      match /votes/{voteId} {
        allow read, write: if true;
      }
    }
  }
}
```

## System punktacji

- **Trafienie:** 1 punkt bazowy
- **Bonus za szybkość:**
  - Pierwsze 25% czasu: +3 punkty
  - 25-50% czasu: +2 punkty
  - 50-75% czasu: +1 punkt
- **Bonus za serię:** +1 punkt za każde kolejne trafienie z rzędu

## Budowanie produkcyjne

```bash
# Android
npx eas build --platform android

# iOS
npx eas build --platform ios
```

## Licencja

MIT
