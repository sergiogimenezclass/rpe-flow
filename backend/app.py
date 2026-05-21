from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH = 'backend/database/database.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM coaches WHERE username = ? AND password = ?',
                        (username, password)).fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'status': 'success',
            'user': {'id': user['id'], 'name': user['name'], 'username': user['username']}
        })
    else:
        return jsonify({'status': 'error', 'message': 'Credenciales inválidas'}), 401

@app.route('/api/athletes', methods=['GET'])
def get_athletes():
    conn = get_db_connection()
    # Obtenemos atletas y su último entrenamiento para mostrar fatiga y último RPE
    athletes = conn.execute('''
        SELECT a.*, 
               w.rpe as last_rpe, 
               w.fatigue_status as last_fatigue
        FROM athletes a
        LEFT JOIN (
            SELECT athlete_id, rpe, fatigue_status, MAX(date)
            FROM workouts
            GROUP BY athlete_id
        ) w ON a.id = w.athlete_id
    ''').fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in athletes])

@app.route('/api/workouts', methods=['POST'])
def create_workout():
    data = request.json
    athlete_id = data.get('athlete_id')
    exercise = data.get('exercise')
    weight = data.get('weight')
    reps = data.get('reps')
    rpe = data.get('rpe')
    date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Lógica de Recomendación y Fatiga
    recommendation = "Mantener carga"
    fatigue_status = "Verde"
    
    if rpe <= 7:
        recommendation = "Subir carga (+2.5 kg)"
        fatigue_status = "Verde"
    elif rpe <= 9:
        recommendation = "Mantener carga"
        fatigue_status = "Amarillo"
    else:
        recommendation = "Bajar carga / Descarga"
        fatigue_status = "Rojo"
        
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO workouts (athlete_id, exercise, weight, reps, rpe, date, recommendation, fatigue_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (athlete_id, exercise, weight, reps, rpe, date, recommendation, fatigue_status))
    conn.commit()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'recommendation': recommendation,
        'fatigue_status': fatigue_status
    })

@app.route('/api/athletes/<int:athlete_id>/history', methods=['GET'])
def get_athlete_history(athlete_id):
    conn = get_db_connection()
    history = conn.execute('SELECT * FROM workouts WHERE athlete_id = ? ORDER BY date DESC', (athlete_id,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in history])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
