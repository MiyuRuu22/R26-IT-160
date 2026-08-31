# Lawyer Companion - Complete System Overview

## Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LAWYER COMPANION SYSTEM                 │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  AI ENGINE   │  │   BACKEND    │  │   FRONTEND   │
        │  (Python)    │  │  (Node.js)   │  │ (React/Expo) │
        └──────────────┘  └──────────────┘  └──────────────┘
                │             │                      │
                │             │                      │
        ┌─────────────────────────────────────────────────┐
        │          NEO4J GRAPH DATABASE                  │
        └─────────────────────────────────────────────────┘
```

## System Components

### 1. AI Engine (Python Backend)

**Location**: `ai-engine/`

**Purpose**: Extract and process legal documents

**Key Components**:

- `pdf_reader.py` - Extracts text from PDFs using PyMuPDF
- `entity_extractor.py` - Identifies entities with validation
- `relationship_builder.py` - Creates entity relationships
- `neo4j_loader.py` - Loads data into Neo4j
- `conflict_detector.py` - Detects patterns and risks

**Data Flow**:

```
PDFs → Extract Text → Extract Entities → Build Relationships → Load to Neo4j
```

### 2. Lawyer Backend (Node.js + Express)

**Location**: `lawyer-backend/`

**Purpose**: REST API for case analysis and conflict detection

**Key Features**:

- Conflict detection queries
- Client connection analysis
- Risk analysis and scoring
- Graph data retrieval
- Alert management
- Shortest path algorithms
- Risk propagation analysis

**Endpoints**:

```
GET    /api/conflicts
GET    /api/client-connections/:clientId
GET    /api/risk-analysis/:clientId
GET    /api/graph/:entityType/:searchValue
GET    /api/alerts
GET    /api/shortest-path
GET    /api/risk-propagation/:name
```

### 3. Graph Frontend (React + Vite)

**Location**: `graph-frontend/`

**Purpose**: Web dashboard for visualization and analysis

**Components**:

- GraphView - Interactive graph visualization
- ConflictsPanel - Conflict management
- AlertsPanel - Alert notifications
- RiskPropagationPanel - Risk analysis
- StatisticsPanel - System metrics
- NodeInspector - Entity details

### 4. Mobile App (React Native + Expo)

**Location**: `expo-mobile/`

**Purpose**: Cross-platform iOS/Android mobile application

**Features**:

- Full feature parity with web app
- Native mobile UI
- Offline-capable (future)
- Push notifications (future)

**Screens**:

- Graph Screen - Search and visualize entities
- Conflicts Screen - View detected conflicts
- Alerts Screen - Manage notifications
- Analytics Screen - View statistics
- Settings Screen - Configure app

### 5. Neo4j Database

**Purpose**: Graph database for storing entities and relationships

**Node Types**:

- `Person` - Individual entities
- `Organization` - Company/organization entities
- `Case` - Legal case entities

**Relationship Types**:

- `WORKS_FOR` - Person works for organization
- `MENTIONED_IN` - Person mentioned in case
- `RESPONDENT_IN` - Person is respondent in case
- `PETITIONER_IN` - Person is petitioner in case

### 6. Synthetic Data Generator

**Location**: `synthetic-data/`

**Purpose**: Generate test data using Faker library

**Generated Entities**:

- Clients
- Lawyers
- Organizations
- Cases

## Technology Stack

### Backend

- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Database Driver**: neo4j-driver
- **Utilities**: axios, dotenv, cors

### AI Processing

- **Language**: Python (3.8+)
- **PDF Processing**: PyMuPDF (fitz)
- **Database**: neo4j-python-driver
- **NLP**: Pattern matching (future: spaCy, transformer models)

### Frontend (Web)

- **Framework**: React 19+
- **Build Tool**: Vite
- **Graph Visualization**: ReactFlow
- **Graph Layout**: Dagre
- **HTTP Client**: axios
- **State**: Component state + Zustand

### Mobile App

- **Framework**: React Native
- **Platform**: Expo
- **Navigation**: React Navigation
- **State**: Zustand
- **HTTP**: axios
- **Icons**: Expo Vector Icons

### Database

- **Type**: Graph Database
- **Product**: Neo4j
- **Driver**: neo4j-driver (Node.js & Python)

## Data Flow Diagrams

### Document Processing Pipeline

```
PDF Files
   ↓
[PDF Reader] → Extract raw text
   ↓
[Entity Extractor] → Identify entities (clean & validate)
   ↓
[Relationship Builder] → Create connections
   ↓
[Neo4j Loader] → Store in database
   ↓
[Conflict Detector] → Analyze patterns
   ↓
Output (cases.json)
```

### User Interaction Flow (Frontend)

```
User Search
   ↓
[GraphScreen] → Search input
   ↓
[relationshipService.getGraphData()]
   ↓
[Lawyer Backend API] /api/graph/:type/:value
   ↓
[Neo4j Query]
   ↓
Return nodes + edges
   ↓
[Display Results] → Cards/Lists
   ↓
User clicks node
   ↓
[NodeDetailScreen] → Show details
   ↓
[getRiskPropagation()] → Fetch risk data
   ↓
Display detailed analysis
```

## Configuration

### Environment Variables

**.env** (Backend)

```
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j123
PORT=5000
NODE_ENV=development
```

**.env** (Mobile)

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=30000
```

### Database Connection

**Neo4j**

```javascript
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
);
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│              PRODUCTION ENVIRONMENT              │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Web App     │  │ Mobile App   │             │
│  │ (React/Vite)│  │ (Expo/EAS)   │             │
│  └──────────────┘  └──────────────┘             │
│         │                 │                     │
│         └─────────┬───────┘                     │
│                   ↓                             │
│         ┌──────────────────┐                    │
│         │  Backend API     │                    │
│         │  (Node.js/Docker)│                    │
│         └──────────────────┘                    │
│                   │                             │
│                   ↓                             │
│         ┌──────────────────┐                    │
│         │   Neo4j Database │                    │
│         │   (Hosted/Cloud) │                    │
│         └──────────────────┘                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js v16+
- Python 3.8+
- Neo4j instance running
- Docker (optional, for containerization)

### Installation

1. **Backend Setup**

   ```bash
   cd lawyer-backend
   npm install
   npm start
   ```

2. **Web Frontend Setup**

   ```bash
   cd graph-frontend
   npm install
   npm run dev
   ```

3. **Mobile App Setup**

   ```bash
   cd expo-mobile
   npm install
   npm start
   ```

4. **AI Engine Setup**
   ```bash
   cd ai-engine
   pip install -r requirements.txt
   python main.py
   ```

## Key Features

✅ **Conflict Detection** - Automatic identification of conflicting interests
✅ **Risk Analysis** - Scoring and risk propagation
✅ **Entity Visualization** - Graph-based relationship visualization
✅ **Cross-Platform** - Web and mobile support
✅ **Real-time Alerts** - Immediate notification of issues
✅ **Analytics Dashboard** - System statistics and metrics

## Future Enhancements

- [ ] Machine learning for entity recognition
- [ ] Offline data sync for mobile
- [ ] Push notifications
- [ ] Advanced graph visualization
- [ ] User authentication & roles
- [ ] Audit logging
- [ ] Export to PDF/Excel
- [ ] Integration with legal databases

## Team & Support

For questions or issues, contact the development team.

---

**Last Updated**: August 30, 2026
**Version**: 1.0.0
