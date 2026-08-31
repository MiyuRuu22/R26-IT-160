# Backend & Mobile App Setup Guide

## Prerequisites

You'll need:
- **Neo4j Database** (local or cloud instance)
- **Node.js** (v14+)
- **Expo CLI** (already installed via npm)

---

## 1. Backend Setup (lawyer-backend)

### Step 1: Navigate to backend directory
```powershell
cd "c:\Users\wpmsw\OneDrive\Desktop\SLIIT YAKO\Research Project\MyComponent\lawyer-backend"
```

### Step 2: Install dependencies
```powershell
npm install
```

### Step 3: Configure Neo4j connection

Edit `.env` file in the lawyer-backend root:

```env
PORT=5000

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687          # Change if using cloud Neo4j
NEO4J_USERNAME=neo4j                      # Your Neo4j username
NEO4J_PASSWORD=neo4j123                   # Your Neo4j password
```

**For Neo4j Cloud (Aura):**
```env
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
```

### Step 4: Ensure Neo4j is running

**Local Neo4j Desktop:**
1. Open Neo4j Desktop
2. Start your database instance
3. Verify it's running on `bolt://localhost:7687`

**Neo4j via Docker:**
```powershell
docker run -d --name neo4j -e NEO4J_AUTH=neo4j/neo4j123 -p 7687:7687 -p 7474:7474 neo4j:latest
```

### Step 5: Start the backend server

```powershell
npm start
```

You should see:
```
Server running on port 5000
```

---

## 2. Mobile App Setup (expo-mobile)

### Step 1: Navigate to mobile directory
```powershell
cd "c:\Users\wpmsw\OneDrive\Desktop\SLIIT YAKO\Research Project\MyComponent\expo-mobile"
```

### Step 2: Configure API connection

Edit `.env` file in expo-mobile root based on your testing scenario:

#### **For iOS Simulator (macOS only)**
```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_API_TIMEOUT=30000
```

#### **For Android Emulator (Windows/Linux)**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
EXPO_PUBLIC_API_TIMEOUT=30000
```

#### **For Physical Device or Cloud Backend**
Get your machine's IP:
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.x.x`)

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
EXPO_PUBLIC_API_TIMEOUT=30000
```

### Step 3: Install dependencies
```powershell
npm install
```

### Step 4: Start Expo
```powershell
npx expo start
```

You'll see a QR code and terminal with:
```
Metro waiting on exp://xxx.xxx.x.x:8084
```

### Step 5: Connect device/emulator

**Expo Go on Physical Device:**
- Download Expo Go (iOS or Android)
- Scan the QR code with your camera (iOS) or Expo Go (Android)

**Android Emulator:**
- Press `a` in the terminal
- Or manually scan QR code within the emulator

**iOS Simulator (macOS only):**
- Press `i` in the terminal

---

## 3. Verify Everything Works

Once the app loads, you should see:

✅ **Alerts tab** - Shows alerts from `/api/alerts`  
✅ **Conflicts tab** - Shows conflicts from `/api/conflicts`  
✅ **Graph tab** - Search and display graph data  
✅ **Analytics tab** - Dashboard information  
✅ **Settings tab** - User preferences  

### Check Console for Logs

In your Expo terminal, you should see:
```
LOG  [API] GET /alerts
LOG  [API] GET /conflicts
LOG  [API] Response OK: /api/alerts
LOG  [API] Response OK: /api/conflicts
```

If you see connection errors like `Could not connect to the server`, check:
1. Backend server is running on correct port
2. API URL in `.env` matches your machine setup
3. Firewall isn't blocking port 5000

---

## 4. Troubleshooting

### Backend Won't Connect

**Check if server is running:**
```powershell
netstat -ano | findstr :5000
```

**Test API manually:**
```powershell
curl http://localhost:5000/api/conflicts
```

### Neo4j Connection Error

**Verify connection:**
```powershell
# Use Neo4j Browser
# Visit http://localhost:7474 (default Neo4j UI)
# Test with: :play intro
```

**Check driver logs in backend console** - look for Neo4j connection errors

### App Shows "Network Error"

1. Verify `.env` API_URL is correct
2. Restart Expo: Press `r` in terminal
3. Check if backend responded to test request above
4. Ensure device/emulator can reach backend IP

### Blank Screens After Loading

1. Check console for errors (tap the app to see live logs)
2. Verify backend API endpoints return proper JSON
3. May need mock data if database is empty

---

## 5. Development Workflow

**Terminal 1 - Backend:**
```powershell
cd lawyer-backend
npm run dev   # Uses nodemon for auto-reload
```

**Terminal 2 - Mobile:**
```powershell
cd expo-mobile
npx expo start
```

**Terminal 3 (Optional) - Neo4j Monitoring:**
```powershell
# Monitor Neo4j in browser at http://localhost:7474
```

---

## 6. Sample Data

To test the app, you'll need data in Neo4j. Check:
- `/ai-engine/` for Python scripts that load data
- `/neo4j/` for database seed files
- Run `python ai-engine/main.py` to populate the database (if configured)

---

## Quick Start (Copy-Paste)

**Terminal 1: Start Backend**
```powershell
cd "c:\Users\wpmsw\OneDrive\Desktop\SLIIT YAKO\Research Project\MyComponent\lawyer-backend"
npm install
npm start
```

**Terminal 2: Start Mobile App**
```powershell
cd "c:\Users\wpmsw\OneDrive\Desktop\SLIIT YAKO\Research Project\MyComponent\expo-mobile"
npm install
npx expo start
```

Then open Expo Go and scan the QR code!
