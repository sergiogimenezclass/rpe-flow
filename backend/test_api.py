import os
import sqlite3
import unittest
import json
import sys
from datetime import datetime, timedelta

# Add the backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import app as flask_app

class RpeFlowApiTestCase(unittest.TestCase):
    def setUp(self):
        # Set up a test database path
        self.test_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'test_database.db')
        flask_app.DB_PATH = self.test_db_path
        
        # Clean up existing test db if any
        if os.path.exists(self.test_db_path):
            try:
                os.remove(self.test_db_path)
            except OSError:
                pass
            
        # Recreate test database from schema
        schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
            
        conn = sqlite3.connect(self.test_db_path)
        conn.executescript(schema_sql)
        # Ensure default athletes are inserted (inserted by schema.sql)
        conn.commit()
        conn.close()
        
        # Flask test client
        self.client = flask_app.app.test_client()
        self.client.testing = True

    def tearDown(self):
        if os.path.exists(self.test_db_path):
            try:
                os.remove(self.test_db_path)
            except OSError:
                pass

    def test_save_plan_validation(self):
        # 1. Test session date out of week range (Monday is 2026-06-01, Sunday is 2026-06-07)
        # Session date 2026-06-08 is a Monday of the NEXT week, should be rejected
        payload_invalid = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 1,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-08",
                    "exercises": [
                        {
                            "exercise": "Sentadilla",
                            "set_number": 1,
                            "planned_weight": 100,
                            "planned_reps": 5,
                            "planned_rpe": 8
                        }
                    ]
                }
            ]
        }
        
        response = self.client.post('/api/plans', 
                                    data=json.dumps(payload_invalid),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'error')
        self.assertIn('está fuera del rango de la semana', data['message'])

        # 2. Test valid session dates within the same week
        payload_valid = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 2,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-01", # Monday
                    "exercises": [
                        {
                            "exercise": "Sentadilla",
                            "set_number": 1,
                            "planned_weight": 100,
                            "planned_reps": 5,
                            "planned_rpe": 8
                        }
                    ]
                },
                {
                    "day_number": 2,
                    "date": "2026-06-03", # Wednesday
                    "exercises": [
                        {
                            "exercise": "Press Banca",
                            "set_number": 1,
                            "planned_weight": 80,
                            "planned_reps": 5,
                            "planned_rpe": 8
                        }
                    ]
                }
            ]
        }
        
        response = self.client.post('/api/plans', 
                                    data=json.dumps(payload_valid),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')

    def test_duplicate_and_completed_constraints(self):
        # 1. Create a plan for 2026-06-01
        payload = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 1,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-01",
                    "exercises": [
                        {"exercise": "Sentadilla", "set_number": 1, "planned_weight": 100, "planned_reps": 5, "planned_rpe": 8}
                    ]
                }
            ]
        }
        response = self.client.post('/api/plans', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # 2. Re-send another plan for the same week (should overwrite since status is 'pendiente')
        payload_new = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 1,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-02", # changed date to Tuesday
                    "exercises": [
                        {"exercise": "Peso Muerto", "set_number": 1, "planned_weight": 120, "planned_reps": 3, "planned_rpe": 9}
                    ]
                }
            ]
        }
        response = self.client.post('/api/plans', data=json.dumps(payload_new), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verify the database has the updated exercises
        response_get = self.client.get('/api/athletes/1/plans/week?date=2026-06-01')
        plan_data = json.loads(response_get.data)
        self.assertEqual(plan_data['sessions'][0]['exercises'][0]['exercise'], 'Peso Muerto')
        
        # 3. Mark the plan as completed in the database manually to test completion lock
        conn = sqlite3.connect(self.test_db_path)
        conn.execute("UPDATE plans SET status = 'completado' WHERE athlete_id = 1 AND week_start_date = '2026-06-01'")
        conn.commit()
        conn.close()
        
        # 4. Attempt to save the plan again. It should be rejected because the plan is completed
        response = self.client.post('/api/plans', data=json.dumps(payload_new), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("No se puede modificar un plan semanal que ya fue completado", data['message'])

    def test_copy_plan(self):
        # 1. Create source plan for 2026-06-01 (Monday) with a session on 2026-06-03 (Wednesday, offset +2 days)
        payload = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 1,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-03",
                    "exercises": [
                        {"exercise": "Sentadilla", "set_number": 1, "planned_weight": 100, "planned_reps": 5, "planned_rpe": 8}
                    ]
                }
            ]
        }
        self.client.post('/api/plans', data=json.dumps(payload), content_type='application/json')
        
        # 2. Copy plan to 2026-06-08
        copy_payload = {
            "athlete_id": 1,
            "source_week": "2026-06-01",
            "target_week": "2026-06-08"
        }
        response = self.client.post('/api/plans/copy', data=json.dumps(copy_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # 3. Retrieve the copied plan and verify session date shifting
        response_get = self.client.get('/api/athletes/1/plans/week?date=2026-06-08')
        plan_data = json.loads(response_get.data)
        self.assertEqual(plan_data['frequency_days'], 1)
        self.assertEqual(plan_data['status'], 'pendiente')
        self.assertEqual(len(plan_data['sessions']), 1)
        
        # Wednesday in target week should be 2026-06-10
        self.assertEqual(plan_data['sessions'][0]['date'], '2026-06-10')
        self.assertEqual(plan_data['sessions'][0]['exercises'][0]['exercise'], 'Sentadilla')

    def test_complete_session_rpe_autoreregulation(self):
        # 1. Create a plan
        payload = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 1,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-01",
                    "exercises": [
                        {"exercise": "Sentadilla", "set_number": 1, "planned_weight": 100, "planned_reps": 5, "planned_rpe": 8},
                        {"exercise": "Sentadilla", "set_number": 2, "planned_weight": 100, "planned_reps": 5, "planned_rpe": 8}
                    ]
                }
            ]
        }
        self.client.post('/api/plans', data=json.dumps(payload), content_type='application/json')
        
        # Get the session ID and exercise IDs
        response_get = self.client.get('/api/athletes/1/plans/week?date=2026-06-01')
        plan_data = json.loads(response_get.data)
        session_id = plan_data['sessions'][0]['id']
        ex1_id = plan_data['sessions'][0]['exercises'][0]['id']
        ex2_id = plan_data['sessions'][0]['exercises'][1]['id']
        
        # 2. Complete session with actual weight, reps, and RPE per exercise
        # Sentadilla RPE = 6.5 (should recommend "Subir carga (+2.5 kg)", fatigue = "Verde")
        complete_payload = {
            "exercises": [
                {"id": ex1_id, "actual_weight": 100, "actual_reps": 5},
                {"id": ex2_id, "actual_weight": 102.5, "actual_reps": 5}
            ],
            "rpe_por_ejercicio": {
                "Sentadilla": 6.5
            }
        }
        
        response_complete = self.client.post(f'/api/sessions/{session_id}/complete',
                                             data=json.dumps(complete_payload),
                                             content_type='application/json')
        self.assertEqual(response_complete.status_code, 200)
        
        # 3. Retrieve the plan and assert database states
        response_get = self.client.get('/api/athletes/1/plans/week?date=2026-06-01')
        updated_plan = json.loads(response_get.data)
        
        # The plan and session should be marked 'completado'
        self.assertEqual(updated_plan['status'], 'completado')
        self.assertEqual(updated_plan['sessions'][0]['status'], 'completado')
        
        # Assert exercise recommendations and fatigue
        ex1 = updated_plan['sessions'][0]['exercises'][0]
        ex2 = updated_plan['sessions'][0]['exercises'][1]
        
        self.assertEqual(ex1['actual_rpe'], 6.5)
        self.assertEqual(ex1['recommendation'], 'Subir carga (+2.5 kg)')
        self.assertEqual(ex1['fatigue_status'], 'Verde')
        
        self.assertEqual(ex2['actual_rpe'], 6.5)
        self.assertEqual(ex2['recommendation'], 'Subir carga (+2.5 kg)')
        self.assertEqual(ex2['fatigue_status'], 'Verde')

    def test_delete_plan_with_completed_session_blocked(self):
        # 1. Create a plan
        payload = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 1,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-01",
                    "exercises": [
                        {"exercise": "Sentadilla", "set_number": 1, "planned_weight": 100, "planned_reps": 5, "planned_rpe": 8}
                    ]
                }
            ]
        }
        self.client.post('/api/plans', data=json.dumps(payload), content_type='application/json')
        
        # Get plan ID and session ID
        response_get = self.client.get('/api/athletes/1/plans/week?date=2026-06-01')
        plan_data = json.loads(response_get.data)
        plan_id = plan_data['id']
        session_id = plan_data['sessions'][0]['id']
        ex_id = plan_data['sessions'][0]['exercises'][0]['id']
        
        # 2. Complete session
        complete_payload = {
            "exercises": [{"id": ex_id, "actual_weight": 100, "actual_reps": 5}],
            "rpe_por_ejercicio": {"Sentadilla": 8.0}
        }
        self.client.post(f'/api/sessions/{session_id}/complete', data=json.dumps(complete_payload), content_type='application/json')
        
        # 3. Attempt to delete the plan. It should fail (400) because it has a completed session
        response_del = self.client.delete(f'/api/plans/{plan_id}')
        self.assertEqual(response_del.status_code, 400)
        data_del = json.loads(response_del.data)
        self.assertIn("ya contiene sesiones completadas", data_del['message'])

    def test_lower_frequency_below_completed_sessions_blocked(self):
        # 1. Create a 3-day plan
        payload = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 3,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-01",
                    "exercises": [{"exercise": "Sentadilla", "set_number": 1, "planned_weight": 100, "planned_reps": 5, "planned_rpe": 8}]
                },
                {
                    "day_number": 2,
                    "date": "2026-06-03",
                    "exercises": [{"exercise": "Press Banca", "set_number": 1, "planned_weight": 80, "planned_reps": 5, "planned_rpe": 8}]
                },
                {
                    "day_number": 3,
                    "date": "2026-06-05",
                    "exercises": [{"exercise": "Peso Muerto", "set_number": 1, "planned_weight": 120, "planned_reps": 5, "planned_rpe": 8}]
                }
            ]
        }
        self.client.post('/api/plans', data=json.dumps(payload), content_type='application/json')
        
        # Get session and exercise IDs
        response_get = self.client.get('/api/athletes/1/plans/week?date=2026-06-01')
        plan_data = json.loads(response_get.data)
        sess1_id = plan_data['sessions'][0]['id']
        ex1_id = plan_data['sessions'][0]['exercises'][0]['id']
        sess2_id = plan_data['sessions'][1]['id']
        ex2_id = plan_data['sessions'][1]['exercises'][0]['id']
        
        # 2. Complete first two sessions (leaving the 3rd pending, so plan status remains 'pendiente')
        self.client.post(f'/api/sessions/{sess1_id}/complete', data=json.dumps({
            "exercises": [{"id": ex1_id, "actual_weight": 100, "actual_reps": 5}],
            "rpe_por_ejercicio": {"Sentadilla": 8.0}
        }), content_type='application/json')
        
        self.client.post(f'/api/sessions/{sess2_id}/complete', data=json.dumps({
            "exercises": [{"id": ex2_id, "actual_weight": 80, "actual_reps": 5}],
            "rpe_por_ejercicio": {"Press Banca": 8.0}
        }), content_type='application/json')
        
        # 3. Attempt to update frequency to 1 day (completed sessions = 2, so frequency 1 is invalid)
        payload_invalid = {
            "athlete_id": 1,
            "week_start_date": "2026-06-01",
            "frequency_days": 1,
            "sessions": [
                {
                    "day_number": 1,
                    "date": "2026-06-01",
                    "exercises": [{"exercise": "Sentadilla", "set_number": 1, "planned_weight": 100, "planned_reps": 5, "planned_rpe": 8}]
                }
            ]
        }
        
        response_update = self.client.post('/api/plans', data=json.dumps(payload_invalid), content_type='application/json')
        self.assertEqual(response_update.status_code, 400)
        data_update = json.loads(response_update.data)
        self.assertIn("no puede ser menor a las sesiones ya completadas", data_update['message'])

if __name__ == '__main__':
    unittest.main()
