import os
import uuid
import boto3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

app = Flask(__name__)

# --- CONFIGURATION ---
# Permissive CORS allows your frontend (likely on a different port/IP) to communicate
CORS(app, resources={r"/api/*": {"origins": "*"}})

REGION = 'us-east-1'
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:688567297152:nexuscare' 

# --- AWS INITIALIZATION ---
# Boto3 uses IAM Roles automatically if deployed on EC2
dynamodb = boto3.resource('dynamodb', region_name=REGION)
sns = boto3.client('sns', region_name=REGION)

# Table References
users_table = dynamodb.Table('Users')
doctors_table = dynamodb.Table('Doctors')
appointments_table = dynamodb.Table('Appointments')

def send_sns_notification(subject, message):
    """Utility to push alerts to the configured SNS Topic"""
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
    except ClientError as e:
        print(f"SNS Publish Error: {e.response['Error']['Message']}")

# --- API ROUTES ---

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online", 
        "engine": "DynamoDB",
        "environment": "Cloud/EC2" if os.getenv('AWS_EXECUTION_ENV') else "Local/Dev",
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    
    if not email or not data.get('password'):
        return jsonify({"success": False, "message": "Missing email or password"}), 400

    try:
        # Check if user exists
        response = users_table.get_item(Key={'email': email})
        if 'Item' in response:
            return jsonify({"success": False, "message": "Email already registered."}), 409

        new_id = f"USR-{uuid.uuid4().hex[:6].upper()}"
        user_role = data.get('role', 'PATIENT').upper()
        
        user_item = {
            'email': email,
            'id': new_id,
            'username': data.get('name'),
            'password': data.get('password'), 
            'role': user_role,
            'securityQuestion': data.get('securityQuestion'),
            'securityAnswer': data.get('securityAnswer', '').lower().strip(),
            'createdAt': datetime.now().isoformat()
        }
        
        users_table.put_item(Item=user_item)
        send_sns_notification("New User Signup", f"User {email} joined as {user_role}.")
        
        return jsonify({
            "success": True, 
            "user": {"id": new_id, "username": data['name'], "email": email, "role": user_role}
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    
    try:
        response = users_table.get_item(Key={'email': email})
        user = response.get('Item')
        
        if user and user.get('password') == password:
            return jsonify({
                "success": True, 
                "user": {
                    "id": user['id'], 
                    "username": user['username'], 
                    "email": user['email'], 
                    "role": user['role']
                }
            }), 200
        
        return jsonify({"success": False, "message": "Invalid credentials."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctors', methods=['GET', 'POST'])
def handle_doctors():
    try:
        if request.method == 'GET':
            items = doctors_table.scan().get('Items', [])
            return jsonify(items), 200
        
        data = request.get_json()
        new_id = f"DOC-{uuid.uuid4().hex[:6].upper()}"
        data['id'] = new_id
        
        doctors_table.put_item(Item=data)
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/appointments', methods=['GET', 'POST'])
def handle_appointments():
    try:
        if request.method == 'GET':
            # Option: If you want only a specific user's appointments, use .query() instead
            items = appointments_table.scan().get('Items', [])
            # Sort by date (manual sort because Scan is unordered)
            items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return jsonify(items), 200
        
        data = request.get_json()
        app_id = f"APP-{uuid.uuid4().hex[:6].upper()}"
        
        appointment_item = {
            'id': app_id,
            'patientEmail': data.get('patientEmail'),
            'doctorName': data.get('doctorName'),
            'date': data.get('date'),
            'time': data.get('time'),
            'status': 'pending',
            'timestamp': datetime.now().isoformat()
        }
        
        appointments_table.put_item(Item=appointment_item)
        
        msg = f"New Appointment: {data['patientEmail']} with Dr. {data['doctorName']}."
        send_sns_notification("Appointment Booked", msg)
        
        return jsonify({"success": True, "id": app_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- START SERVER ---
if __name__ == '__main__':
    # host='0.0.0.0' allows external traffic to reach the Flask app on EC2
    app.run(host='0.0.0.0', port=5000, debug=True)
