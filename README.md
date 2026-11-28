# Clinic Locator Web App

An interactive geospatial web application designed to improve healthcare accessibility. Users can enter an address or click directly on the map to find the nearest health facilities, visualize service coverage areas, and generate turn-by-turn travel routes.

## Features

* **Interactive Location Input:** Search for a specific address or click anywhere on the map to set your starting point.
* **Nearest Facility Search:** Uses spatial queries to identify and rank the closest clinics and hospitals.
* **Service Area Visualization:** Displays coverage zones and catchment boundaries around health facilities.
* **Travel Routing:** Calculates and renders travel routes and directions from the user's location to a selected clinic.

## Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Mapping :** Leaflet

## Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

* [Python 3](https://python.org) installed on your system
* A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd Clinic-Locator-Web-App
   ```

2. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

3. **Start the local development server:**
   ```bash
   python -m http.server 5500
   ```
   *(Note: Depending on your system configuration, you may need to use `python3` instead of `python`.)*

4. **Open the application:**
   Open your web browser and go to:
   ```text
   http://localhost:5500/index.html
   ```

## Frontend Structure

```text
Clinic-Locator-Web-App/
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
└── README.md
```
