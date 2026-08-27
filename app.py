import os
import json
import datetime
import io
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from PIL import Image
from google import genai
from google.genai import types
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super_secret_eco_key_change_me")

# Initialize Limiter after app creation
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Database configuration (Cloud/Serverless and Local compatible)
if os.environ.get("NETLIFY") or os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    db_path = "/tmp/envirotech.db"
else:
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, 'envirotech.db')

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

# Allowed extensions for secure uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==========================================
# DATABASE MODELS & GAMIFICATION LOGIC
# ==========================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    total_recycled = db.Column(db.Integer, default=0)
    points = db.Column(db.Integer, default=0)
    total_co2_saved = db.Column(db.Float, default=0.0)
    current_streak = db.Column(db.Integer, default=0)
    last_scan_date = db.Column(db.Date, nullable=True)
    badges = db.Column(db.String(500), default="Newbie Recycler")
    scans = db.relationship('ScanLog', backref='user', lazy=True)

    @property
    def level_info(self):
        """Calculates dynamic RPG-style levels based on eco-points"""
        if self.points < 100:
            return {"title": "Seedling", "next_tier": 100, "progress_pct": (self.points / 100) * 100}
        elif self.points < 300:
            return {"title": "Sprout", "next_tier": 300, "progress_pct": ((self.points - 100) / 200) * 100}
        elif self.points < 1000:
            return {"title": "Forest Guardian", "next_tier": 1000, "progress_pct": ((self.points - 300) / 700) * 100}
        else:
            return {"title": "Eco Legend", "next_tier": self.points, "progress_pct": 100}

class ScanLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    material = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    co2_saved = db.Column(db.Float, default=0.0)
    disposal_steps = db.Column(db.String(1000), default="[]") 
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

with app.app_context():
    db.create_all()

# ==========================================
# CORE ROUTES
# ==========================================
@app.route('/')
def home():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    
    total_scans_logged = ScanLog.query.count()
    wrappers_diverted = 14200 + total_scans_logged
    contamination_prevented = 87.4
    
    db_co2_grams = db.session.query(db.func.sum(ScanLog.co2_saved)).scalar() or 0.0
    landfill_avoided_tons = round(18.5 + (db_co2_grams / 1000000.0), 2)

    stats = {
        "wrappers_diverted": f"{wrappers_diverted:,}",
        "contamination_prevented": f"{contamination_prevented}%",
        "landfill_avoided_tons": f"{landfill_avoided_tons}"
    }

    return render_template('index.html', user=user, stats=stats)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        if username:
            user = User.query.filter_by(username=username).first()
            if not user:
                user = User(username=username, points=0, badges="Newbie Recycler")
                db.session.add(user)
                db.session.commit()
            session['user_id'] = user.id
            return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('home'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    recent_scans = ScanLog.query.filter_by(user_id=user.id).order_by(ScanLog.timestamp.desc()).all()
    
    smartphone_charges = int(user.total_co2_saved / 8.22)
    ev_miles = round(user.total_co2_saved / 150.0, 1)

    return render_template(
        'dashboard.html', 
        user=user, 
        recent_scans=recent_scans,
        smartphone_charges=smartphone_charges,
        ev_miles=ev_miles
    )

@app.route('/classifier')
def classifier():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('classifier.html', user=user)

@app.route('/classifications')
def classifications():
    user = User.query.get(session['user_id']) if 'user_id' in session else None
    return render_template('classifications.html', user=user)

@app.route('/rules')
def rules():
    user = User.query.get(session['user_id']) if 'user_id' in session else None
    return render_template('rules.html', user=user)

@app.route('/leaderboard')
def leaderboard():
    user = db.session.get(User, session.get('user_id')) if 'user_id' in session else None
    top_users = User.query.order_by(User.points.desc()).all()
    return render_template('leaderboard.html', user=user, top_users=top_users)

# ==========================================
# SECURE ASYNC API ROUTE WITH RATE LIMITING
# ==========================================
@app.route('/api/classify', methods=['POST'])
@limiter.limit("10 per minute")
def api_classify():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized. Please sign in."}), 401
    
    user = db.session.get(User, session['user_id'])
    if not user:
        session.pop('user_id', None)
        return jsonify({"error": "Session expired. Please log in again."}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No image file provided."}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file."}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed."}), 400

    file_bytes = file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        return jsonify({"error": "File size exceeds the 10MB limit."}), 400

    try:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img.thumbnail((800, 800))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85)
        processed_image_bytes = img_byte_arr.getvalue()

        prompt = """
        Analyze this complex packaging or item. Break it down into its separate physical component layers (e.g., cap, body, sleeve, liner).
        Return STRICTLY a valid JSON object with no markdown wrappers:
        {
          "error": null,
          "item_name": "Name of overall item",
          "material": "General material summary",
          "category": "Recyclable",
          "components": [
            {"part": "Plastic Lid/Cap", "material": "Polypropylene (PP)", "destination": "Blue Bin (Recyclable)", "action": "Rinse and toss loose"},
            {"part": "Paper Sleeve", "material": "Cardboard", "destination": "Paper Bin", "action": "Flatten and keep dry"},
            {"part": "Inner Foil Lining", "material": "Aluminum/Plastic laminate", "destination": "Specialized Soft Plastic Drop-off", "action": "Do not curb bin"}
          ],
          "co2_saved_grams": 45.0
        }
        Category must be ONLY one of: "Recyclable", "Landfill", "Compostable".
        If human/animal present, populate "error" and set other fields to null.
        """

        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=[types.Part.from_bytes(data=processed_image_bytes, mime_type='image/jpeg'), prompt]
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"): raw_text = raw_text[7:]
        if raw_text.endswith("```"): raw_text = raw_text[:-3]
        
        data = json.loads(raw_text.strip())
        
        if not data.get("error"):
            today = datetime.date.today()
            if user.last_scan_date is None:
                user.current_streak = 1
            elif user.last_scan_date == today - datetime.timedelta(days=1):
                user.current_streak += 1
            elif user.last_scan_date < today - datetime.timedelta(days=1):
                user.current_streak = 1
            user.last_scan_date = today

            cat = data.get("category", "Landfill")
            co2 = float(data.get("co2_saved_grams", 0.0))
            earned_points = 15 if cat in ["Recyclable", "Compostable"] else 5
            
            user.total_recycled += 1
            user.points += earned_points
            user.total_co2_saved += co2

            new_scan = ScanLog(
                user_id=user.id,
                item_name=data.get("item_name", "Unknown Item"),
                material=data.get("material", "Unknown Material"),
                category=cat,
                co2_saved=co2,
                disposal_steps=json.dumps(data.get("components", []))
            )
            db.session.add(new_scan)
            db.session.commit()
            
            data["points_earned"] = earned_points
            data["current_level"] = user.level_info["title"]

        return jsonify(data)
        
    except Exception as e:
        return jsonify({"error": f"Processing error: {str(e)}"}), 500

# ==========================================
# PWA SUPPORT
# ==========================================
@app.route('/manifest.json')
def serve_manifest():
    manifest = {
        "name": "Envirotech Smart Sorting",
        "short_name": "Envirotech",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#f8fafc",
        "theme_color": "#059669",
        "icons": [{
            "src": "https://cdn-icons-png.flaticon.com/512/2921/2921822.png",
            "sizes": "512x512",
            "type": "image/png"
        }]
    }
    response = make_response(jsonify(manifest))
    response.headers["Content-Type"] = "application/manifest+json"
    return response

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)