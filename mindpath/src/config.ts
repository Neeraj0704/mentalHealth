// ─── Backend URL ──────────────────────────────────────────────────────────────
// Simulator  → use 'http://localhost:8000'
// iPhone     → use 'http://<your-mac-lan-ip>:8000'
//              Find IP: System Settings → WiFi → Details → IP Address
//              Then uncomment the DEVICE line and comment out SIMULATOR

const SIMULATOR = 'http://localhost:8000';
const DEVICE    = 'http://10.0.0.108:8000'; // ← update this to your Mac's LAN IP

export const BASE_URL = SIMULATOR;
// export const BASE_URL = DEVICE;  // ← uncomment when running on physical device
