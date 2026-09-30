# AgroBridge - MERN Stack (JavaScript)

This project has been converted from TypeScript to JavaScript to make it easier for you to manage. It is now a **MERN Stack** ready project with Firebase integration.

## Project Structure

- **/ (Root)**: Frontend (Next.js in JavaScript)
- **/server**: Backend (Node.js & Express)
- **/components**: Clean and modular UI components
- **/lib/firebase.js**: Your Firebase configuration

## How to use

### 1. Frontend (Next.js)
The frontend is already set up in the root directory.
```bash
npm install
npm run dev
```

### 2. Backend (Express)
The backend is located in the `server` folder.
```bash
cd server
npm install
npm run dev
```

### 3. Firebase Connection
Open `lib/firebase.js` and paste your Firebase configuration there.

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  // ... rest of your config
};
```

## Changes Made
- **Converted all files**: Changed `.tsx` to `.jsx` and `.ts` to `.js`.
- **Removed TypeScript**: Stripped out type annotations and interfaces.
- **Added Server**: Created an Express server with MongoDB connection (MERN).
- **Cleaned Components**: Simplified the component logic for better readability.
- **Firebase Ready**: Added a dedicated file for Firebase setup.

Happy Coding!
