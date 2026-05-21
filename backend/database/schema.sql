CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS athletes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    objective TEXT NOT NULL,
    FOREIGN KEY (coach_id) REFERENCES coaches (id)
);

CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id INTEGER NOT NULL,
    exercise TEXT NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    rpe INTEGER NOT NULL,
    date TEXT NOT NULL,
    recommendation TEXT,
    fatigue_status TEXT,
    FOREIGN KEY (athlete_id) REFERENCES athletes (id)
);

-- Datos iniciales
INSERT OR IGNORE INTO coaches (username, password, name) VALUES ('coach', '1234', 'Coach Sergio');

INSERT OR IGNORE INTO athletes (coach_id, name, objective) VALUES (1, 'Juan Pérez', 'Fuerza Máxima');
INSERT OR IGNORE INTO athletes (coach_id, name, objective) VALUES (1, 'Martina López', 'Hipertrofia');
INSERT OR IGNORE INTO athletes (coach_id, name, objective) VALUES (1, 'Diego Ruiz', 'Powerlifting');
