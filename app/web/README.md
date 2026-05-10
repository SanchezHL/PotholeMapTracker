# 🚲 MyRoute

> Real-time pothole detection and tracking across Barcelona using edge computing, computer vision, and a live web dashboard.

---

## 📖 What is MyRoute?

Barcelona manages thousands of kilometers of cycling infrastructure. With the rapid growth of e-bikes and electric scooters, which are heavier and faster than traditional bicycles, road surface deterioration has accelerated significantly. Yet the city's current approach to pothole detection remains reactive: slow manual inspections and citizen complaints that arrive too late.

**MyRoute transforms the existing public bicycle fleet into a distributed sensor network.**

Each bike carries an Arduino UNO Q board fusing two data streams:
- An **accelerometer** that detects vibration signatures consistent with potholes and road cracks in real time
- A **camera module** that captures images processed by a computer vision model trained to identify road damage

All processing happens on-device. Only anonymized coordinates and severity classifications are transmitted, never raw images or personal data. The data flows into a live web dashboard where the technical team can review, classify, and escalate detections directly to the city's maintenance authority.

---

## 🎯 Why This Matters

| Problem | Impact |
|---------|--------|
| Undetected potholes cause cycling accidents | Safety risk for thousands of daily cyclists |
| Poor road quality deters cyclists, leading to more cars | Increased CO2 emissions in an already congested city |
| Reactive maintenance is expensive | Fixing a crack today costs 10x less than rebuilding a lane next year |
| Cities build bike lanes based on assumptions | Data-driven routing improves investment efficiency |

---

## Features

- 🗺️ **Live map** - Real-time Leaflet map of Barcelona with color-coded pothole pins
- 🔴 **Severity classification** - Critical, Medium, and Low categories with automatic detection
- 📋 **Alert review system** - Tech team can classify, annotate, and mark detections as reviewed
- 📸 **Image evidence** - Camera captures detection image attached to each alert
- 🏙️ **City report** - Exportable PDF report with zone breakdowns, resolution rates, and activity timeline
- 🌙 **Dark / Light mode** - Full theme support across all pages, persisted to localStorage
- 📱 **Responsive** - Mobile-first design, works on all screen sizes
- ⚡ **Simulate detections** - Built-in test mode to simulate Arduino events without hardware

---

## 🖥️ Interface

The application is organized around four pages, each serving a distinct role in the detection-to-action pipeline.

### 🏠 Home - Live View

The operational command center. Four metric cards at the top show live counts of detected potholes, critical zones requiring immediate action, detections pending technical review, and alerts sent to the ayuntamiento.

Below the metrics, a live Leaflet map of Barcelona displays all current detections as color-coded pins. Red for critical, amber for medium, green for low severity. Pins can be filtered by severity category and clicking any pin navigates directly to its full alert detail. The right column shows a scrollable live alerts list and a simulation panel for testing the detection pipeline with fake Arduino events.

### 🔔 Alerts - Categorization Interface

The triage center. A full list of all incoming detections with a search bar that filters by street or zone name. Five filter pills narrow the list by status (All, Pending, Critical, Medium, Low) with a live count badge on the Pending filter. Each row shows the street name, zone, detection time, pothole count, and review status. Clicking any row opens the full detail page for that alert.

### 📍 Alert Detail - Individual Review

Each alert opens its own page at `/alert/:id`. The top navigation provides a context-aware back button that returns to whichever page the user came from, plus previous and next arrows for sequential review without returning to the list.

The main card shows three info cards summarizing location, detection time, and pothole count. Below that, a two-column layout places the detection image on the left and the tech review panel on the right. The review panel allows the technician to reclassify severity, add notes for the maintenance team, mark the detection as reviewed, and send it directly to the city.

### 🗺️ Map - Full Interactive View

A full-screen Leaflet map that takes over the entire viewport. Floating overlay cards show the total, critical, and unreviewed counts at the top left, severity filter pills at the top right, and a legend at the bottom left. Clicking any pin opens a detail card with street, time, severity, and review status. The map tiles switch automatically between CartoDB dark and light styles when the user toggles the theme.

### 📊 City Report

Designed for presentation to municipal authorities. Contains three summary stat cards, a horizontal bar chart of potholes by zone with expandable detail rows, a zone status grid with per-zone severity breakdown bars, a recent activity timeline, and a reports sent table with status badges. An Export PDF button captures the entire report as a high-resolution PDF.

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **TanStack Start** | Full-stack React framework, file-based routing, SSR |
| **TanStack Router** | Type-safe routing, active link detection, search params |
| **TanStack Query** | Server state management and data caching |
| **React** | UI components and state management |
| **Tailwind CSS v4** | Utility-first styling, dark/light mode via `@custom-variant` |
| **Leaflet (CDN)** | Interactive maps with CartoDB dark/light tile layers |
| **html2canvas + jsPDF** | PDF export for the City Report page |

### Backend *(to be documented by backend team)*

| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | REST API server |
| **MongoDB** | Database |
| **Python (pyserial)** | Arduino serial bridge |

### Hardware *(to be documented by hardware team)*

| Component | Purpose |
|-----------|---------|
| **Arduino UNO Q** | Edge computing board |
| **Accelerometer** | Vibration-based pothole detection |
| **Camera module** | Computer vision image capture |
| **Edge Impulse** | On-device AI model training and deployment |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/SanchezHL/PotholeMapTracker.git
cd PotholeMapTracker

# Install dependencies
cd app/web
npm install
```

### Running the frontend

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
PotholeMapTracker/
├── app/
│   └── web/
│       └── src/
│           ├── routes/
│           │   ├── __root.tsx          # Root layout, topbar, sidebar, dark mode
│           │   ├── index.tsx           # Home page, live map and alerts
│           │   ├── map.tsx             # Full-screen map page
│           │   ├── alerts.tsx          # Alert list page
│           │   ├── alert.$alertId.tsx  # Individual alert detail page
│           │   └── city-report.tsx     # City report and PDF export
│           └── styles/
│               └── app.css            # Global styles and Tailwind v4 config
├── services/                          # Backend services (Node.js, Python bridge)
└── README.md
```

---

## 🌙 Dark / Light Mode

MyRoute fully supports both themes across all pages. On first load it respects the OS preference via `prefers-color-scheme`. The toggle button in the topbar switches between modes and persists the choice to `localStorage`.

Map tiles switch automatically between CartoDB dark and light styles using a `MutationObserver` that watches the `html` element's class attribute. No page reload required.

---

## 📄 License

MIT © MyRoute Team - Hackathon Project, Barcelona 2026
