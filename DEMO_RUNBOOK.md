# Lawyer Companion - Graph Demonstration Runbook

## Before presenting

1. Confirm the backend is running on port `5000` and `http://localhost:5000/api/health` returns `status: ok`. For Aura setup, see `AURA_DEPLOYMENT.md`.
2. Start the mobile app or web graph, then reload once after starting the backend.
3. Use **Focused** for a clean first explanation; switch to **Extended** only when demonstrating indirect links.

## Recommended live sequence

### 1. Wimal Weerawansa - flagship network

Search **Person**: `Wimal Weerawansa`, then select **Extended**.

Say: “The graph starts with a real, source-qualified public-record dossier. The central person connects to distinct legal branches: copyright, a Court of Appeal matter, CIABOC prosecution-status data, historical litigation, and an institutionally reported defamation matter.”

Point out:

- Blue nodes are people; purple nodes are organisations; teal nodes are cases/proceedings.
- Connection colour is risk/context scoring, not a statement that a person is guilty.
- Thin curved paths remain attached while the graph has subtle ambient motion.
- Tap/click any node to focus its direct legal neighbourhood.

### 2. Basil Rajapaksa - independent network

Search **Person**: `Basil Rajapaksa`, then select **Extended**.

Say: “This is an independent second corpus. Its core is the official Supreme Court economic-crisis proceeding, while other entries explicitly retain their reported or allegation-only status.”

Point out the cluster containing `SC/FR/195/2022`, `SC/FR/212/2022`, Transparency International Sri Lanka, and the connected public officials.

### 3. Focused versus extended search

Search **Person**: `Nethuni Perera`.

- In **Focused**, explain that the app shows the person, their case context, and the shared bank without expanding every bank employee.
- Switch to **Extended** and explain that the wider employee network is intentionally revealed only when the investigator asks for it.

## Graph interaction cues

- **Mobile:** tap a node for details; Direct, Focused, and Extended control the search depth.
- **Web:** hover to preview a direct neighbourhood; click to lock it; click blank canvas to clear; drag a node to keep a preferred local position.

## Safety language for the panel

Use these distinctions exactly:

- “reported allegation” is not a finding of guilt;
- “indicted/prosecution status” is not a conviction;
- “acquitted” remains visible as an outcome;
- each sourced dataset retains provenance and confidence context;
- unverified public case numbers are not invented.

## If the graph is empty

1. Confirm the backend responds at `http://localhost:5000`.
2. Restart `lawyer-backend` with `node server.js`.
3. Reload the app and search again.
4. Search an exact known name first: `Wimal Weerawansa`, `Basil Rajapaksa`, or `Nethuni Perera`.
