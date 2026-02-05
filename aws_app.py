from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import uuid
import os
from datetime import datetime
from botocore.exceptions import ClientError

app = Flask(__name__)
CORS(app)

# --- AWS Configuration ---
# IAM: No hardcoded Access Keys. Boto3 automatically uses the IAM Role on EC2 
# or the local credentials configured via 'aws configure'.
REGION = 'us-east-1'
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:688567297152:nexuscare' 

# Initialize AWS Services
dynamodb = boto3.resource('dynamodb', region_name=REGION)
sns = boto3.client('sns', region_name=REGION)

# DynamoDB Table References
users_table = dynamodb.Table('Users')
doctors_table = dynamodb.Table('Doctors')
appointments_table = dynamodb.Table('Appointments')

def send_sns_notification(subject, message):
    """Helper to send alerts via SNS (Simple Notification Service)"""
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
    except ClientError as e:
        print(f"SNS Error: {e}")

# --- API Routes ---

@app.route('/api/status', methods=['GET'])
def status():
    """EC2/Local Environment Detection"""
    return jsonify({
        "status": "online", 
        "engine": "DynamoDB",
        "environment": "Cloud/EC2" if os.getenv('AWS_EXECUTION_ENV') else "Local"
    }), 200

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data['email'].lower()
    
    try:
        # Check if user already exists in DynamoDB
        response = users_table.get_item(Key={'email': email})
        if 'Item' in response:
            return jsonify({"success": False, "message": "Identity clash: Email already registered."}), 409

        new_id = f"USR-{uuid.uuid4().hex[:6].upper()}"
        user_role = data.get('role', 'PATIENT').upper()
        
        user_item = {
            'email': email,
            'id': new_id,
            'username': data['name'],
            'password': data['password'], 
            'role': user_role,
            'securityQuestion': data['securityQuestion'],
            'securityAnswer': data['securityAnswer'].lower().strip()
        }
        
        # Save to DynamoDB
        users_table.put_item(Item=user_item)
        
        # Notify via SNS
        send_sns_notification("New User Signup", f"User {email} has joined NexusCare as {user_role}.")
        
        return jsonify({
            "success": True, 
            "user": {"id": new_id, "username": data['name'], "email": email, "role": user_role}
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').lower()
    password = data.get('password', '')
    
    try:
        response = users_table.get_item(Key={'email': email})
        if 'Item' in response and response['Item']['password'] == password:
            user = response['Item']
            return jsonify({
                "success": True, 
                "user": {"id": user['id'], "username": user['username'], "email": user['email'], "role": user['role']}
            }), 200
        return jsonify({"success": False, "message": "Invalid credentials. Identity unverified."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctors', methods=['GET', 'POST'])
def handle_doctors():
    try:
        if request.method == 'GET':
            # Retrieve all doctors from DynamoDB
            items = doctors_table.scan().get('Items', [])
            return jsonify(items)
        
        data = request.get_json()
        new_id = f"DOC-{uuid.uuid4().hex[:6].upper()}"
        data['id'] = new_id
        
        # Add doctor to DynamoDB
        doctors_table.put_item(Item=data)
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/appointments', methods=['GET', 'POST'])
def handle_appointments():
    try:
        if request.method == 'GET':
            # Retrieve all appointments from DynamoDB
            items = appointments_table.scan().get('Items', [])
            return jsonify(items)
        
        data = request.get_json()
        app_id = f"APP-{uuid.uuid4().hex[:6].upper()}"
        
        appointment_item = {
            'id': app_id,
            'patientEmail': data['patientEmail'],
            'doctorName': data['doctorName'],
            'date': data['date'],
            'time': data['time'],
            'status': 'pending',
            'timestamp': datetime.now().isoformat()
        }
        
        # Save Appointment to DynamoDB
        appointments_table.put_item(Item=appointment_item)
        
        # Notify via SNS
        msg = f"New Appointment: {data['patientEmail']} with Dr. {data['doctorName']} on {data['date']} at {data['time']}."
        send_sns_notification("Appointment Booked", msg)
        
        return jsonify({"success": True, "id": app_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # host 0.0.0.0 is critical for EC2 accessibility
    app.run(host='0.0.0.0', port=5000, debug=True)
