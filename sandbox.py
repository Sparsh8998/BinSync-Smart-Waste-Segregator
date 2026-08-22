import os
import json
import datetime
import io
from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from PIL import Image
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super_secret_eco_key_change_me")

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///envirotech.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    total_recycled = db.Column(db.Integer, default=0)
    points = db.Column(db.Integer, default=0)
    total_co2_saved = db.Column(db.Float, default=0.0)
    badges = db.Column(db.String(500), default="🌱 Newbie Recycler")
    scans = db.relationship('ScanLog', backref='user', lazy=True)

class ScanLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    material = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    co2_saved = db.Column(db.Float, default=0.0)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    return render_template('index.html', user=user)

@app.route('/classifications')
def classifications():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    return render_template('classifications.html', user=user)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        if username:
            user = User.query.filter_by(username=username).first()
            if not user:
                user = User(
                    username=username,
                    points=0,
                    total_recycled=0,
                    total_co2_saved=0.0,
                    badges="🌱 Newbie Recycler"
                )
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
    if not user:
        return redirect(url_for('logout'))
    recent_scans = ScanLog.query.filter_by(user_id=user.id).order_by(ScanLog.timestamp.desc()).all()
    return render_template('dashboard.html', user=user, recent_scans=recent_scans)

@app.route('/rules')
def rules():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    return render_template('rules.html', user=user)

@app.route('/classifier', methods=['GET', 'POST'])
def classifier():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        return redirect(url_for('logout'))
        
    structured_data = None

    if request.method == 'POST':
        file = request.files.get('file')
        if file and file.filename != '':
            try:
                img = Image.open(file.stream).convert("RGB")
                img.thumbnail((800, 800))
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=85)
                image_bytes = img_byte_arr.getvalue()

                prompt = """
                Analyze this waste image. Return STRICTLY a valid JSON object with no markdown wrappers:
                {
                  "error": null,
                  "item_name": "Name of item",
                  "material": "Material breakdown",
                  "category": "Recyclable",
                  "advice": "Short recycling instruction",
                  "co2_saved_grams": 45.0
                }
                Category must be ONLY one of: "Recyclable", "Landfill", "Compostable".
                If a human or animal is detected, populate "error" with an explanation and set all other fields to null.
                """

                response = client.models.generate_content(
                    model='gemini-3.5-flash-lite',
                    contents=[types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'), prompt]
                )
                
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                
                structured_data = json.loads(raw_text.strip())
                
                if not structured_data.get("error"):
                    cat = structured_data.get("category", "Landfill")
                    co2 = float(structured_data.get("co2_saved_grams", 0.0))
                    earned_points = 15 if cat in ["Recyclable", "Compostable"] else 5
                    
                    user.total_recycled += 1
                    user.points += earned_points
                    user.total_co2_saved += co2

                    current_badges = [b.strip() for b in user.badges.split(",") if b.strip()]
                    if user.total_recycled >= 3 and "♻️ Plastic Pioneer" not in current_badges:
                        current_badges.append("♻️ Plastic Pioneer")
                    if user.points >= 50 and "⭐ Green Champion" not in current_badges:
                        current_badges.append("⭐ Green Champion")
                    if user.total_co2_saved >= 200 and "🌍 Climate Hero" not in current_badges:
                        current_badges.append("🌍 Climate Hero")
                    
                    user.badges = ", ".join(current_badges)

                    new_scan = ScanLog(
                        user_id=user.id,
                        item_name=structured_data.get("item_name", "Unknown Item"),
                        material=structured_data.get("material", "Unknown Material"),
                        category=cat,
                        co2_saved=co2
                    )
                    db.session.add(new_scan)
                    db.session.commit()
                
            except Exception as e:
                structured_data = {"error": f"Processing error: {str(e)}"}

    return render_template('classifier.html', data=structured_data, user=user)

if __name__ == '__main__':
    app.run(debug=False, use_reloader=False, port=5000)