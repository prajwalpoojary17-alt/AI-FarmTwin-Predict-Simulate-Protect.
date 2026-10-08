# AI FarmTwin

AI FarmTwin is a software digital twin platform for agronomic crop health calculation, precision plant addressing, event perimeter threat detection, and what-if simulation.

---

## 🔒 Security & Local Environment Setup

To keep all production secrets and credentials secure, **NO real API keys, secrets, or private credentials are tracked in the GitHub repository**.

All environment secrets are loaded via `.env.local`, which is excluded from version control by `.gitignore`.

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Configure Environment Variables
Copy the template `.env.example` file to create your personal `.env.local` file:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and provide your Firebase project web credentials (obtainable from the [Firebase Console](https://console.firebase.google.com/) under **Project Settings > General > Your Apps > Web App**):

```env
# Required for Firebase Authentication and Firestore
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_web_app_id
VITE_FIREBASE_DATABASE_ID=(default)
```

> **Note**:
> - **Zero Secrets Committed**: Never commit `.env.local` to git or GitHub. `.gitignore` strictly excludes all `.env*` files except `.env.example`.
> - **Ready Out-of-the-Box**: If someone clones or downloads the repository without setting up Firebase, AI FarmTwin runs automatically in secure local standalone mode (with local PBKDF2/Scrypt authentication and state persistence). No private keys or cloud accounts are required to run and test the app.


### 3. Install Dependencies
```bash
npm install
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Features
- **Crop Health Digital Twin**: Precision 2D agricultural field map with continuous crop sections, row/column alignment, and 10-plant groupings with status diagnostics.
- **Dynamic Plant Addressing**: Unique hierarchical group addressing (`Zone <ID> / <Section> / Group <Code>`) with plant ID range tracking.
- **Event Perimeter Intrusion Detection**: Spatial threat detection coordinates, interactive map quadrant surveillance, and intrusion history logging.
- **Multi-Factor Agronomic Health Engine**: Real-time evaluation of moisture, humidity, temperature, nitrogen, phosphorus, potassium, and pest stress.
- **What-If Scenario Simulator**: Instant simulation of heatwaves, pest outbreaks, drought, and torrential runoff scenarios.
- **Enterprise Reports**: Visual analytics, exportable data, and PDF field reports.
- **Firebase Authentication & Firestore Persistence**: UID-isolated user accounts, password reset, and cloud synchronization.
