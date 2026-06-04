CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS athletes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    objective TEXT NOT NULL,
    FOREIGN KEY (coach_id) REFERENCES coaches (id)
);

-- Plan Semanal
CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id INTEGER NOT NULL,
    week_start_date TEXT NOT NULL, -- Fecha del Lunes de esa semana (YYYY-MM-DD)
    frequency_days INTEGER NOT NULL, -- Cantidad de días de entrenamiento planificados
    status TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente' o 'completado'
    FOREIGN KEY (athlete_id) REFERENCES athletes (id),
    UNIQUE(athlete_id, week_start_date)
);

-- Sesión de entrenamiento (Día dentro del plan semanal)
CREATE TABLE IF NOT EXISTS plan_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL, -- 1, 2, 3...
    date TEXT NOT NULL, -- Fecha específica asignada a este día (YYYY-MM-DD)
    status TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente' o 'completado'
    FOREIGN KEY (plan_id) REFERENCES plans (id)
);

-- Ejercicio detallado por Serie (Set)
CREATE TABLE IF NOT EXISTS plan_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    exercise TEXT NOT NULL,
    set_number INTEGER NOT NULL, -- 1, 2, 3...
    planned_weight REAL NOT NULL,
    planned_reps INTEGER NOT NULL,
    planned_rpe REAL NOT NULL,
    actual_weight REAL,
    actual_reps INTEGER,
    actual_rpe REAL,
    recommendation TEXT,
    fatigue_status TEXT,
    video_url TEXT,
    FOREIGN KEY (session_id) REFERENCES plan_sessions (id)
);

-- Datos iniciales
INSERT OR IGNORE INTO coaches (username, password, name) VALUES ('coach', '1234', 'Coach Sergio');

INSERT OR IGNORE INTO athletes (coach_id, username, password, name, objective) VALUES (1, 'juan', '1234', 'Juan Pérez', 'Fuerza Máxima');
INSERT OR IGNORE INTO athletes (coach_id, username, password, name, objective) VALUES (1, 'martina', '1234', 'Martina López', 'Hipertrofia');
INSERT OR IGNORE INTO athletes (coach_id, username, password, name, objective) VALUES (1, 'diego', '1234', 'Diego Ruiz', 'Powerlifting');
