from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Ruta absoluta para la base de datos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'database.db')

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
    # Intentar buscar como coach
    user = conn.execute('SELECT * FROM coaches WHERE username = ? AND password = ?',
                        (username, password)).fetchone()
    
    if user:
        conn.close()
        return jsonify({
            'status': 'success',
            'role': 'coach',
            'user': {'id': user['id'], 'name': user['name'], 'username': user['username']}
        })
    
    # Intentar buscar como atleta
    athlete = conn.execute('SELECT * FROM athletes WHERE username = ? AND password = ?',
                           (username, password)).fetchone()
    conn.close()
    
    if athlete:
        return jsonify({
            'status': 'success',
            'role': 'athlete',
            'user': {
                'id': athlete['id'], 
                'name': athlete['name'], 
                'username': athlete['username'], 
                'objective': athlete['objective']
            }
        })
        
    return jsonify({'status': 'error', 'message': 'Credenciales inválidas'}), 401

@app.route('/api/athletes', methods=['GET'])
def get_athletes():
    conn = get_db_connection()
    # Obtenemos atletas y la información del último ejercicio registrado en un plan completado
    athletes = conn.execute('''
        SELECT a.*, 
               pe.actual_rpe as last_rpe, 
               pe.fatigue_status as last_fatigue
        FROM athletes a
        LEFT JOIN (
            SELECT p.athlete_id, pe.actual_rpe, pe.fatigue_status, MAX(p.date)
            FROM plans p
            JOIN plan_exercises pe ON p.id = pe.plan_id
            WHERE p.status = 'completado' AND pe.actual_rpe IS NOT NULL
            GROUP BY p.athlete_id
        ) pe ON a.id = pe.athlete_id
    ''').fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in athletes])

@app.route('/api/plans', methods=['POST'])
def create_plan():
    data = request.json
    athlete_id = data.get('athlete_id')
    date = data.get('date')
    frequency = data.get('frequency')
    exercises = data.get('exercises', [])
    
    if not athlete_id or not date or not frequency or not exercises:
        return jsonify({'status': 'error', 'message': 'Datos del plan incompletos'}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO plans (athlete_id, date, frequency, status)
            VALUES (?, ?, ?, 'pendiente')
        ''', (athlete_id, date, frequency))
        plan_id = cursor.lastrowid
        
        for ex in exercises:
            cursor.execute('''
                INSERT INTO plan_exercises (plan_id, exercise, planned_weight, planned_reps, planned_rpe)
                VALUES (?, ?, ?, ?, ?)
            ''', (plan_id, ex['exercise'], ex['planned_weight'], ex['planned_reps'], ex['planned_rpe']))
        
        conn.commit()
        return jsonify({'status': 'success', 'plan_id': plan_id, 'message': 'Plan creado exitosamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/athletes/<int:athlete_id>/plans/pending', methods=['GET'])
def get_pending_plans(athlete_id):
    conn = get_db_connection()
    plans = conn.execute('SELECT * FROM plans WHERE athlete_id = ? AND status = ? ORDER BY date DESC', (athlete_id, 'pendiente')).fetchall()
    
    result = []
    for p in plans:
        plan_dict = dict(p)
        exercises = conn.execute('SELECT * FROM plan_exercises WHERE plan_id = ?', (p['id'],)).fetchall()
        plan_dict['exercises'] = [dict(ex) for ex in exercises]
        result.append(plan_dict)
        
    conn.close()
    return jsonify(result)

@app.route('/api/plans/<int:plan_id>/complete', methods=['POST'])
def complete_plan(plan_id):
    data = request.json
    exercises = data.get('exercises', [])
    
    if not exercises:
        return jsonify({'status': 'error', 'message': 'No se enviaron ejercicios completados'}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verificar si el plan existe y está pendiente
        plan = cursor.execute('SELECT * FROM plans WHERE id = ?', (plan_id,)).fetchone()
        if not plan:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Plan no encontrado'}), 404
        if plan['status'] == 'completado':
            conn.close()
            return jsonify({'status': 'error', 'message': 'El plan ya fue completado anteriormente'}), 400
            
        for ex in exercises:
            pe_id = ex.get('id')
            actual_weight = ex.get('actual_weight')
            actual_reps = ex.get('actual_reps')
            actual_rpe = ex.get('actual_rpe')
            
            # Calcular recomendación y fatiga según las reglas de negocio
            recommendation = "Mantener carga"
            fatigue_status = "Verde"
            
            if actual_rpe <= 7:
                recommendation = "Subir carga (+2.5 kg)"
                fatigue_status = "Verde"
            elif actual_rpe <= 9:
                recommendation = "Mantener carga"
                fatigue_status = "Amarillo"
            else:
                recommendation = "Bajar carga / Descarga"
                fatigue_status = "Rojo"
                
            cursor.execute('''
                UPDATE plan_exercises
                SET actual_weight = ?, actual_reps = ?, actual_rpe = ?, recommendation = ?, fatigue_status = ?
                WHERE id = ? AND plan_id = ?
            ''', (actual_weight, actual_reps, actual_rpe, recommendation, fatigue_status, pe_id, plan_id))
            
        # Marcar el plan como completado
        cursor.execute('UPDATE plans SET status = ? WHERE id = ?', ('completado', plan_id))
        
        conn.commit()
        return jsonify({'status': 'success', 'message': 'Plan completado exitosamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/athletes/<int:athlete_id>/history', methods=['GET'])
def get_athlete_history(athlete_id):
    conn = get_db_connection()
    plans = conn.execute('SELECT * FROM plans WHERE athlete_id = ? AND status = ? ORDER BY date DESC', (athlete_id, 'completado')).fetchall()
    
    result = []
    for p in plans:
        plan_dict = dict(p)
        exercises = conn.execute('SELECT * FROM plan_exercises WHERE plan_id = ?', (p['id'],)).fetchall()
        plan_dict['exercises'] = [dict(ex) for ex in exercises]
        result.append(plan_dict)
        
    conn.close()
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
