Markdown
# ENVIROTECH - AI-Powered Waste Photo Classifier for Smart Segregation

* Repository: [Sparsh8998/Elicit-Waste-Segregation](https://github.com/Sparsh8998/Elicit-Waste-Segregation)
* Team Name: Hakka Noodles
* Problem Statement: AI-Powered Waste Photo Classifier for Smart Segregation and Gamified Impact Tracking

Envirotech is a full-stack web application designed to eliminate waste contamination and "wishcycling." Utilizing vision-language models, the system allows users to capture or upload photos of waste items to receive immediate material breakdowns and sorting classifications (Recyclable, Compostable, or Landfill). To encourage long-term sustainable habits, the platform incorporates eco-points, milestone achievement badges, and real-time carbon footprint offset tracking.

---

## Key Features

* Instant Visual Classification: Leverages Google's gemini-3.5-flash-lite model for low-latency image processing, multi-layer material detection, and actionable disposal guidance.
* Strict Guardrails: Automatically flags non-waste subjects (such as humans or animals) to ensure input safety.
* Structured Output Pipeline: Formats model inference into structured JSON to power dynamic frontend status indicators.
* Gamified Incentive System: Awards eco-points for correctly categorized waste items and programmatically unlocks achievement badges (Plastic Pioneer, Green Champion, Climate Hero).
* Carbon Footprint Tracking: Computes and logs estimated grams of CO2 diverted from landfills per user.
* Session-Based Authentication: Provides isolated user accounts, preserving individual scan activity, point balances, and metrics.
* Mobile Camera Integration: Uses standard browser-level capture APIs for direct smartphone camera uploads.

---

## Tech Stack

* Frontend: HTML5, CSS3, Tailwind CSS (CDN), Jinja2 Templating
* Backend: Python 3.11+, Flask, Flask-Session
* AI and Vision: Google GenAI SDK (google-genai), Pillow (PIL)
* Database and ORM: SQLite, Flask-SQLAlchemy
* Environment Configuration: python-dotenv

---

## Project Structure

```text
elitic/
|-- .env
|-- .gitignore
|-- README.md
|-- sandbox.py
`-- templates/
    |-- classifier.html
    |-- classifications.html
    |-- dashboard.html
    |-- index.html
    `-- login.html

Database Schema
User Table: Manages unique user identities, accumulated eco-points, total diversion counts, aggregate CO2 savings, and unlocked badge lists.

ScanLog Table: Records individual scan events, foreign-keyed to the user, tracking item labels, material details, designated sorting categories, estimated carbon metrics, and UTC timestamps.

Local Setup and Installation
1. Clone the Repository
Bash
git clone [https://github.com/Sparsh8998/Elicit-Waste-Segregation.git](https://github.com/Sparsh8998/Elicit-Waste-Segregation.git)
cd Elicit-Waste-Segregation
2. Install Required Dependencies
Bash
pip install flask flask-sqlalchemy pillow google-genai python-dotenv
3. Configure Environment Variables
Create a .env file in the root directory and define your API key:

Code snippet
GEMINI_API_KEY=your_google_genai_api_key_here
FLASK_SECRET_KEY=your_custom_secret_key_here
4. Run the Application
Bash
python sandbox.py
5. Access the Web Application
Open a web browser and navigate to:

Plaintext
[http://127.0.0.1:5000](http://127.0.0.1:5000)
Roadmap and Future Scope
Phase 1 (Enhanced Intelligence): Integration of quantized on-device vision models for offline inference, multi-object recognition in single-frame scans, and packaging barcode cross-referencing.

Phase 2 (Hardware and IoT Integration): Interfacing the Flask API with microcontrollers (ESP32/Raspberry Pi) driving automated bin aperture mechanisms and integrated weight scales.

Phase 3 (Community and Enterprise Expansion): Neighborhood/campus leaderboards, municipal waste analytics dashboards, and third-party sustainability reward integrations.

Authors
Team Hakka Noodles