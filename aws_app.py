from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import json
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

app = Flask(__name__)
CORS(app)

# AWS Configuration
REGION = 'us-east-1'
dynamodb = boto3.resource('dynamodb', region_name=REGION)

# DynamoDB Tables
users_table = dynamodb.Table('Users')
doctors_table = dynamodb.Table('Doctors')
appointments_table = dynamodb.Table('Appointments')

@app.route('/api/status', methods=['GET'])
def status():
    # Updated engine name to reflect AWS usage
    return jsonify({"status": "online", "engine": "AWS DynamoDB"}), 200

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data['email'].lower()
    
    try:
        # Check if user already exists
        response = users_table.get_item(Key={'email': email})
        if 'Item' in response:
            return jsonify({"success": False, "message": "Identity clash: Email already registered."}), 409

        new_id = f"USR-{uuid.uuid4().hex[:6].upper()}"
        user_role = data.get('role', 'PATIENT').upper()
        
        user_item = {
            'id': new_id,
            'username': data['name'],
            'email': email,
            'password': data['password'], # Note: In production, hash this!
            'role': user_role,
            'securityQuestion': data['securityQuestion'],
            'securityAnswer': data['securityAnswer'].lower().strip()
        }
        
        users_table.put_item(Item=user_item)
        
        return jsonify({
            "success": True, 
            "user": {
                "id": new_id, 
                "username": data['name'], 
                "email": email,
                "role": user_role
            }
        }), 201
    except ClientError as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').lower()
    password = data.get('password', '')
    
    try:
        response = users_table.get_item(Key={'email': email})
        
        if 'Item' in response:
            user = response['Item']
            if user['password'] == password:
                return jsonify({
                    "success": True, 
                    "user": {
                        "id": user['id'], 
                        "username": user['username'], 
                        "email": user['email'], 
                        "role": user.get('role', 'PATIENT')
                    }
                }), 200
                
        return jsonify({"success": False, "message": "Invalid credentials. Identity unverified."}), 401
    except ClientError as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/doctors', methods=['GET', 'POST'])
def handle_doctors():
    try:
        if request.method == 'GET':
            # Scan returns all items in DynamoDB
            response = doctors_table.scan()
            return jsonify(response.get('Items', []))
        
        # POST Logic
        data = request.get_json()
        new_id = f"DOC-{uuid.uuid4().hex[:6].upper()}"
        
        doctor_item = {
            'id': new_id,
            'name': data['name'],
            'specialty': data['specialty'],
            'experience': data['experience'],
            'bio': data['bio'],
            'imageUrl': data['imageUrl'],
            'availability': data.get('availability', []) # DynamoDB supports Lists directly
        }
        
        doctors_table.put_item(Item=doctor_item)
        return jsonify(doctor_item), 201
    except ClientError as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/appointments', methods=['GET', 'POST'])
def handle_appointments():
    try:
        if request.method == 'GET':
            response = appointments_table.scan()
            return jsonify(response.get('Items', []))
        
        # POST Logic
        data = request.get_json()
        new_id = f"APP-{uuid.uuid4().hex[:6].upper()}"
        
        appointment_item = {
            'id': new_id,
            'patientId': data['patientId'],
            'patientName': data['patientName'],
            'patientEmail': data['patientEmail'],
            'patientContact': data['patientContact'],
            'doctorId': data['doctorId'],
            'doctorName': data['doctorName'],
            'specialty': data['specialty'],
            'date': data['date'],
            'time': data['time'],
            'status': 'pending',
            'timestamp': datetime.now().isoformat()
        }
        
        appointments_table.put_item(Item=appointment_item)
        return jsonify({"success": True, "id": new_id}), 201
    except ClientError as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)