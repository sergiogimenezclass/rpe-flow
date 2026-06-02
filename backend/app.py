from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# Ruta absoluta para la base de datos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'database.db')

# Diccionario de videos demostrativos
VIDEO_MAP = {
    "Sentadilla": "https://www.youtube.com/embed/gcNh17Ckb14",
    "Press Banca": "https://www.youtube.com/embed/gRVjAtPip0Y",
    "Peso Muerto": "https://www.youtube.com/embed/op9kVnSso6Q",
    "Press Militar": "https://www.youtube.com/embed/HESmM0Z0o_o"
}

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_monday_of_week(date_str):
    try:
        d = datetime.strptime(date_str, '%Y-%m-%d')
        monday = d - timedelta(days=d.weekday())
        return monday.strftime('%Y-%m-%d')
    except Exception:
        return date_str

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'RPE Flow API is running. Access the frontend app at http://localhost:8000'
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    # Buscar como coach
    user = conn.execute('SELECT * FROM coaches WHERE username = ? AND password = ?',
                        (username, password)).fetchone()
    
    if user:
        conn.close()
        return jsonify({
            'status': 'success',
            'role': 'coach',
            'user': {'id': user['id'], 'name': user['name'], 'username': user['username']}
        })
    
    # Buscar como atleta
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
    # Obtenemos atletas y la información del último RPE y fatiga de cualquier serie completada
    athletes = conn.execute('''
        SELECT a.*, 
               pe.actual_rpe as last_rpe, 
               pe.fatigue_status as last_fatigue
        FROM athletes a
        LEFT JOIN (
            SELECT p.athlete_id, pe.actual_rpe, pe.fatigue_status, MAX(ps.date)
            FROM plans p
            JOIN plan_sessions ps ON p.id = ps.plan_id
            JOIN plan_exercises pe ON ps.id = pe.session_id
            WHERE ps.status = 'completado' AND pe.actual_rpe IS NOT NULL
            GROUP BY p.athlete_id
        ) pe ON a.id = pe.athlete_id
    ''').fetchall()
    conn.close()
    return jsonify([dict(row) for row in athletes])

@app.route('/api/plans', methods=['POST'])
def save_plan():
    data = request.json
    athlete_id = data.get('athlete_id')
    week_start_date = get_monday_of_week(data.get('week_start_date'))
    frequency_days = data.get('frequency_days')
    sessions = data.get('sessions', [])
    
    if not athlete_id or not week_start_date or not frequency_days:
        return jsonify({'status': 'error', 'message': 'Datos del plan semanales incompletos'}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verificar si ya existe un plan para esa semana
        existing_plan = cursor.execute('SELECT * FROM plans WHERE athlete_id = ? AND week_start_date = ?', 
                                      (athlete_id, week_start_date)).fetchone()
        
        if existing_plan:
            if existing_plan['status'] == 'completado':
                conn.close()
                return jsonify({'status': 'error', 'message': 'No se puede modificar un plan semanal que ya fue completado'}), 400
            plan_id = existing_plan['id']
            # Borrar ejercicios anteriores de las sesiones del plan
            cursor.execute('DELETE FROM plan_exercises WHERE session_id IN (SELECT id FROM plan_sessions WHERE plan_id = ?)', (plan_id,))
            # Borrar sesiones anteriores
            cursor.execute('DELETE FROM plan_sessions WHERE plan_id = ?', (plan_id,))
            # Actualizar la frecuencia
            cursor.execute('UPDATE plans SET frequency_days = ? WHERE id = ?', (frequency_days, plan_id))
        else:
            cursor.execute('''
                INSERT INTO plans (athlete_id, week_start_date, frequency_days, status)
                VALUES (?, ?, ?, 'pendiente')
            ''', (athlete_id, week_start_date, frequency_days))
            plan_id = cursor.lastrowid
            
        # Insertar nuevas sesiones y ejercicios
        for sess in sessions:
            day_number = sess.get('day_number')
            sess_date = sess.get('date')
            
            cursor.execute('''
                INSERT INTO plan_sessions (plan_id, day_number, date, status)
                VALUES (?, ?, ?, 'pendiente')
            ''', (plan_id, day_number, sess_date))
            session_id = cursor.lastrowid
            
            for ex in sess.get('exercises', []):
                exercise_name = ex.get('exercise')
                set_number = ex.get('set_number')
                planned_weight = ex.get('planned_weight')
                planned_reps = ex.get('planned_reps')
                planned_rpe = ex.get('planned_rpe')
                video_url = VIDEO_MAP.get(exercise_name, "")
                
                cursor.execute('''
                    INSERT INTO plan_exercises (session_id, exercise, set_number, planned_weight, planned_reps, planned_rpe, video_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (session_id, exercise_name, set_number, planned_weight, planned_reps, planned_rpe, video_url))
                
        conn.commit()
        return jsonify({'status': 'success', 'plan_id': plan_id, 'message': 'Plan semanal guardado exitosamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/athletes/<int:athlete_id>/plans/week', methods=['GET'])
def get_weekly_plan(athlete_id):
    week_start_date = get_monday_of_week(request.args.get('date'))
    if not week_start_date:
        return jsonify({'status': 'error', 'message': 'Se requiere la fecha de inicio de semana (date)'}), 400
        
    conn = get_db_connection()
    plan = conn.execute('SELECT * FROM plans WHERE athlete_id = ? AND week_start_date = ?', 
                        (athlete_id, week_start_date)).fetchone()
    
    if not plan:
        conn.close()
        return jsonify({'status': 'not_found', 'message': 'No hay plan para esta semana'}), 200
        
    plan_dict = dict(plan)
    sessions = conn.execute('SELECT * FROM plan_sessions WHERE plan_id = ? ORDER BY day_number ASC', 
                            (plan['id'],)).fetchall()
    
    sessions_list = []
    for sess in sessions:
        sess_dict = dict(sess)
        exercises = conn.execute('SELECT * FROM plan_exercises WHERE session_id = ? ORDER BY exercise ASC, set_number ASC', 
                                 (sess['id'],)).fetchall()
        sess_dict['exercises'] = [dict(ex) for ex in exercises]
        sessions_list.append(sess_dict)
        
    plan_dict['sessions'] = sessions_list
    conn.close()
    return jsonify(plan_dict)

@app.route('/api/sessions/<int:session_id>', methods=['GET'])
def get_session_details(session_id):
    conn = get_db_connection()
    session = conn.execute('SELECT * FROM plan_sessions WHERE id = ?', (session_id,)).fetchone()
    if not session:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Sesión no encontrada'}), 404
        
    session_dict = dict(session)
    exercises = conn.execute('SELECT * FROM plan_exercises WHERE session_id = ? ORDER BY exercise ASC, set_number ASC', 
                             (session_id,)).fetchall()
    session_dict['exercises'] = [dict(ex) for ex in exercises]
    conn.close()
    return jsonify(session_dict)

@app.route('/api/sessions/<int:session_id>/complete', methods=['POST'])
def complete_session(session_id):
    data = request.json
    exercises = data.get('exercises', [])
    
    if not exercises:
        return jsonify({'status': 'error', 'message': 'No se enviaron datos de ejercicio'}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        session = cursor.execute('SELECT * FROM plan_sessions WHERE id = ?', (session_id,)).fetchone()
        if not session:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Sesión no encontrada'}), 404
        if session['status'] == 'completado':
            conn.close()
            return jsonify({'status': 'error', 'message': 'Esta sesión ya ha sido completada'}), 400
            
        for ex in exercises:
            pe_id = ex.get('id')
            actual_weight = ex.get('actual_weight')
            actual_reps = ex.get('actual_reps')
            actual_rpe = ex.get('actual_rpe')
            
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
                WHERE id = ? AND session_id = ?
            ''', (actual_weight, actual_reps, actual_rpe, recommendation, fatigue_status, pe_id, session_id))
            
        cursor.execute("UPDATE plan_sessions SET status = 'completado' WHERE id = ?", (session_id,))
        
        # Verificar si todo el plan semanal está completado
        plan_id = session['plan_id']
        total_sessions = cursor.execute('SELECT COUNT(*) as count FROM plan_sessions WHERE plan_id = ?', (plan_id,)).fetchone()['count']
        completed_sessions = cursor.execute("SELECT COUNT(*) as count FROM plan_sessions WHERE plan_id = ? AND status = 'completado'", (plan_id,)).fetchone()['count']
        
        if total_sessions == completed_sessions:
            cursor.execute("UPDATE plans SET status = 'completado' WHERE id = ?", (plan_id,))
            
        conn.commit()
        return jsonify({'status': 'success', 'message': 'Sesión completada exitosamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/athletes/<int:athlete_id>/history', methods=['GET'])
def get_athlete_history(athlete_id):
    conn = get_db_connection()
    sessions = conn.execute('''
        SELECT ps.*, p.week_start_date, p.frequency_days
        FROM plan_sessions ps
        JOIN plans p ON ps.plan_id = p.id
        WHERE p.athlete_id = ? AND ps.status = 'completado'
        ORDER BY ps.date DESC, ps.day_number DESC
    ''', (athlete_id,)).fetchall()
    
    result = []
    for sess in sessions:
        sess_dict = dict(sess)
        exercises = conn.execute('SELECT * FROM plan_exercises WHERE session_id = ? ORDER BY exercise ASC, set_number ASC', 
                                 (sess['id'],)).fetchall()
        sess_dict['exercises'] = [dict(ex) for ex in exercises]
        result.append(sess_dict)
        
    conn.close()
    return jsonify(result)

@app.route('/api/plans/<int:plan_id>', methods=['DELETE'])
def delete_plan(plan_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        plan = cursor.execute('SELECT * FROM plans WHERE id = ?', (plan_id,)).fetchone()
        if not plan:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Plan no encontrado'}), 404
        if plan['status'] == 'completado':
            conn.close()
            return jsonify({'status': 'error', 'message': 'No se puede eliminar un plan completado'}), 400
            
        cursor.execute('DELETE FROM plan_exercises WHERE session_id IN (SELECT id FROM plan_sessions WHERE plan_id = ?)', (plan_id,))
        cursor.execute('DELETE FROM plan_sessions WHERE plan_id = ?', (plan_id,))
        cursor.execute('DELETE FROM plans WHERE id = ?', (plan_id,))
        conn.commit()
        return jsonify({'status': 'success', 'message': 'Plan eliminado correctamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
