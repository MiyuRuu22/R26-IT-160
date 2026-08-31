# Neo4j Aura deployment

This component is designed so Neo4j remains behind the backend. The mobile app
only calls the backend API; integrators never install Neo4j on a phone or on
their own machine.

## 1. Create the cloud database

1. Create an AuraDB instance in the [Neo4j Aura console](https://console.neo4j.io/).
2. Open the instance **Connect** panel and download/copy its dotenv connection
   details.
3. Put those values in `lawyer-backend/.env`. Use
   `lawyer-backend/.env.example` as the shape:

```dotenv
NEO4J_URI=neo4j+s://YOUR_INSTANCE_ID.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-aura-password
NEO4J_DATABASE=neo4j
PORT=5000
```

Do not put these values in `expo-mobile/.env`, source control, or the mobile
application. Aura's `neo4j+s://` URI encrypts the driver connection.

## 2. Move this project's graph data to Aura

From the workspace root, run the loaders once after updating the backend env:

```powershell
node ai-engine/load_demo_judgements.js
node ai-engine/load_wimal_dossier.js
node ai-engine/load_basil_dossier.js
```

They use `MERGE`, so rerunning them is safe and does not clear the database.
All loaders and the Python PDF pipeline read the same Neo4j variables from
`lawyer-backend/.env`.

## 3. Start and verify the API

```powershell
cd lawyer-backend
npm start
```

Then open `http://localhost:5000/api/health`. A successful response is:

```json
{ "status": "ok", "database": "neo4j" }
```

The mobile app retains only `EXPO_PUBLIC_API_URL`, pointing to the deployed
backend or the laptop's LAN address for a live demo. For team integration,
deploy this Express backend to a service such as Render, Railway, or Azure and
set the four `NEO4J_*` variables in that service's secret/environment settings.

## Handoff contract

- **Mobile/frontend:** calls `BACKEND_URL/api/*` only.
- **Backend:** owns all Aura credentials and Cypher access.
- **AI engine/loaders:** use the backend environment and write directly to
  Aura during an authorised ingestion run.
- **No local Neo4j installation is required** for anyone consuming the
  component once Aura is configured.
