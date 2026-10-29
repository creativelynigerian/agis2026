# Accelerate Global Impact Summit 2026 (AGIS 2026)
### Theme: *FRESH OIL — For Innovative Thinking*
**Powered by CCYI Global Enterprise & Access Chapel**  
**Date:** 27th–28th November 2026  
**Venue:** Access Chapel Auditorium, Ogun State, Nigeria (Lat: 6.6853° N, Lng: 3.2845° E)

---

## 📱 AGIS 2026 Payment & Event Companion (PWA)

The **AGIS 2026 Companion PWA** is a high-performance, mobile-first progressive web application built for summit attendees, school delegations, sponsors, and event coordinators. It combines online payment verification, digital ticketing, GradReady-style venue navigation, and consent-based live GPS tracking.

---

### 🌟 Key Capabilities

#### 1. Online Payments & Multi-Tier Registration
- **Individual Attendees**:
  - Friday Tech Summit Masterclass (Configurable: ₦5,000)
  - Saturday Grand Leadership Summit (Complimentary / Free)
  - Both Days All-Access Pass (₦5,000)
  - VIP Executive Pass (₦25,000)
- **School & Student Delegations**:
  - Group registration for secondary schools, universities, and coding clubs.
  - School Delegation Pack (₦15,000 for 5 students + 1 chaperone free, plus ₦3,000 per extra student).
  - Individual Student Competitor tickets (₦3,000).
- **Summit Volunteers**:
  - Complimentary passes across Ushering, Media/Photography, Sound/AV, Logistics, and Medical.
- **Sponsors & Exhibitors**:
  - Tech Exhibition Booth (₦50,000), Bronze (₦50,000), Silver (₦150,000), Gold (₦300,000), and Platinum Partner (₦1,000,000).
- **Payment Gateway Integration**:
  - **Paystack Inline JS**: Supports Nigerian cards (Mastercard, Visa, Verve), Bank Transfer, USSD (*737#, *966#), and mobile money.
  - **Instant Test Mode Toggle**: Allows offline and testing simulation of instant payment verification without deducting funds.
  - **Direct Nigerian Bank Transfer Fallback**: Official GTBank details (`0131301273 - Impact Makers Creativity Services Co`) with dynamic payment reference and direct WhatsApp proof link (`0803 569 0386`).

#### 2. GradReady-Style Location Tracker & Venue Radar
- **Venue Profile**: Access Chapel Auditorium, Ogun State (Coordinates: 6.6853° N, 3.2845° E).
- **Distance & Travel Time**: Live Haversine calculation showing kilometers/meters to the venue, bearing, and estimated driving/walking time.
- **Navigation Shortcuts**: One-tap direct links to Google Maps and Apple Maps navigation.
- **Privacy & Consent Shield**: Explicit consent toggle (`Share My Live Location`). Tracking only operates with user authorization and can be paused or stopped anytime.
- **Interactive Map & Vector Radar**:
  - Leaflet.js interactive OpenStreetMap with venue geofence ring (500m radius).
  - Venue Points of Interest (Main Auditorium, Accreditation Booth, Tech Challenge Arena, VIP Lounge, Vehicle Parking).
  - High-resolution SVG/Canvas vector radar fallback with rotating sweep hand.
- **One-Tap GPS Arrival Check-In**:
  - Automatic geofencing unlocks when the participant arrives within 500 meters of Access Chapel Auditorium.
  - Includes a "Test Arrival at Venue" simulator button for demonstration.

#### 3. Digital QR Tickets & Ticket Wallet
- **Scannable QR Codes**: Generated dynamically with client-side SVG/Canvas generator (100% offline-compatible, zero external library dependency).
- **Ticket Design**: Royal purple and gold holographic summit pass displaying Attendee Name, Tier, Ticket ID, Validity, and multi-day status.
- **Multi-Day Attendance Badges**:
  - Day 1 (Friday 27 Nov) Check-in status
  - Day 2 (Saturday 28 Nov) Check-in status
- **Ticket Actions**:
  - 📥 Download Ticket as high-resolution PNG image
  - 🖨️ Print Ticket / Save as PDF
  - 📱 Share Ticket Pass
  - 🔍 Ticket Search & Retrieval by Ticket ID, Phone, or Email

#### 4. Event Coordinator & Administrator Command Center
- **Security**: Passcode protected (Default PIN: `1234` or `agis2026admin`).
- **Real-Time KPIs**: Total Revenue (₦), Total Registrations, Paid vs Free ratio, Day 1 & Day 2 Check-Ins, and Live Tracked Attendees.
- **Live Coordinator Radar**: Real-time map displaying consenting school buses, student delegates, and volunteers with distance to venue.
- **Entrance QR Camera Scanner**:
  - Live video stream camera scanner for entrance ushers.
  - Photo file upload scanner fallback.
  - Multi-day selector (Day 1 vs Day 2) with re-entry fraud prevention.
  - Web Audio synthesizer chimes (pleasant tone for success, warning buzzer for duplicate/unpaid).
- **Registration Management**: Searchable and filterable table with manual "Mark as Paid", "View Pass", and "Delete" actions.
- **Dynamic Fee Configuration**: Update ticket prices, Paystack keys, and geofence radius live without editing code.
- **Data Export**: One-click CSV export of full registration ledger formatted for CCYI Global Enterprise.

#### 5. Progressive Web App (PWA) Capabilities
- `manifest.json`: Configured for standalone full-screen experience on Android & iOS.
- `sw.js`: Service worker caching static assets for offline access.
- Online/Offline connectivity indicators.

---

### 🚀 Running the App Locally

Start the local server using Python 3:

```bash
python3 serve.py 8080
```

Then open in your browser:
- **Companion App (PWA)**: [http://localhost:8080/app.html](http://localhost:8080/app.html)
- **Summit Landing Page**: [http://localhost:8080/index.html](http://localhost:8080/index.html)
