import sqlite3
import json
import os
import uuid
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_FILE = 'nexuscare.db'
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "karunamanirathnam28@gmail.com"
EMAIL_PASSWORD = "nxldoiiubfgljwgz" 

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            securityQuestion TEXT,
            securityAnswer TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            experience TEXT,
            bio TEXT,
            imageUrl TEXT,
            availability TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patientId TEXT,
            patientName TEXT,
            patientEmail TEXT,
            patientContact TEXT,
            doctorId TEXT,
            doctorName TEXT,
            specialty TEXT,
            date TEXT,
            time TEXT,
            status TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({"status": "online", "engine": "SQLite3"}), 200

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    conn = get_db_connection()
    try:
        new_id = f"USR-{uuid.uuid4().hex[:6].upper()}"
        # Capture role from request, defaulting to PATIENT if not provided
        user_role = data.get('role', 'PATIENT').upper()
        
        conn.execute('''
            INSERT INTO users (id, username, email, password, role, securityQuestion, securityAnswer)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (new_id, data['name'], data['email'].lower(), data['password'], user_role, data['securityQuestion'], data['securityAnswer'].lower().strip()))
        conn.commit()
        return jsonify({
            "success": True, 
            "user": {
                "id": new_id, 
                "username": data['name'], 
                "email": data['email'].lower(),
                "role": user_role
            }
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Identity clash: Email already registered."}), 409
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').lower()
    password = data.get('password', '')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password)).fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "success": True, 
            "user": {
                "id": user['id'], 
                "username": user['username'], 
                "email": user['email'], 
                "role": user['role'] # Crucial for frontend role checking
            }
        }), 200
    return jsonify({"success": False, "message": "Invalid credentials. Identity unverified."}), 401

@app.route('/api/doctors', methods=['GET', 'POST'])
def handle_doctors():
    conn = get_db_connection()
    if request.method == 'GET':
        doctors = conn.execute('SELECT * FROM doctors').fetchall()
        conn.close()
        result = []
        for doc in doctors:
            d = dict(doc)
            d['availability'] = json.loads(d['availability'])
            result.append(d)
        return jsonify(result)
    
    data = request.get_json()
    new_id = f"DOC-{uuid.uuid4().hex[:6].upper()}"
    conn.execute('''
        INSERT INTO doctors (id, name, specialty, experience, bio, imageUrl, availability)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (new_id, data['name'], data['specialty'], data['experience'], data['bio'], data['imageUrl'], json.dumps(data.get('availability', []))))
    conn.commit()
    conn.close()
    return jsonify({"id": new_id, **data}), 201

@app.route('/api/appointments', methods=['GET', 'POST'])
def handle_appointments():
    conn = get_db_connection()
    if request.method == 'GET':
        apps = conn.execute('SELECT * FROM appointments').fetchall()
        conn.close()
        return jsonify([dict(a) for a in apps])
    
    data = request.get_json()
    new_id = f"APP-{uuid.uuid4().hex[:6].upper()}"
    conn.execute('''
        INSERT INTO appointments (id, patientId, patientName, patientEmail, patientContact, doctorId, doctorName, specialty, date, time, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (new_id, data['patientId'], data['patientName'], data['patientEmail'], data['patientContact'], data['doctorId'], data['doctorName'], data['specialty'], data['date'], data['time'], 'pending', datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": new_id}), 201

if __name__ == '__main__':
    app.run(port=5000, debug=True)
