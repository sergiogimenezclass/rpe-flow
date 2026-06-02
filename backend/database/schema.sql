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

CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    frequency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente',
    FOREIGN KEY (athlete_id) REFERENCES athletes (id)
);

CREATE TABLE IF NOT EXISTS plan_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    exercise TEXT NOT NULL,
    planned_weight REAL NOT NULL,
    planned_reps INTEGER NOT NULL,
    planned_rpe INTEGER NOT NULL,
    actual_weight REAL,
    actual_reps INTEGER,
    actual_rpe INTEGER,
    recommendation TEXT,
    fatigue_status TEXT,
    FOREIGN KEY (plan_id) REFERENCES plans (id)
);

-- Datos iniciales
INSERT OR IGNORE INTO coaches (username, password, name) VALUES ('coach', '1234', 'Coach Sergio');

INSERT OR IGNORE INTO athletes (coach_id, username, password, name, objective) VALUES (1, 'juan', '1234', 'Juan Pérez', 'Fuerza Máxima');
INSERT OR IGNORE INTO athletes (coach_id, username, password, name, objective) VALUES (1, 'martina', '1234', 'Martina López', 'Hipertrofia');
INSERT OR IGNORE INTO athletes (coach_id, username, password, name, objective) VALUES (1, 'diego', '1234', 'Diego Ruiz', 'Powerlifting');

