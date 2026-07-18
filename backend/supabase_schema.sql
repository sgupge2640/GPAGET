-- GPAGET Supabase migration
-- This script creates the tables needed by the Flask + SQLAlchemy backend.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password VARCHAR(200) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    day_of_week VARCHAR(20),
    period INTEGER,
    teacher VARCHAR(200),
    is_weekly BOOLEAN NOT NULL DEFAULT FALSE,
    weekly_progress TEXT,
    weekly_deadline_day VARCHAR(10),
    weekly_task_start_date VARCHAR(20),
    weekly_task_end_date VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes (user_id);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    due_date VARCHAR(20),
    is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at VARCHAR(20),
    is_weekly BOOLEAN NOT NULL DEFAULT FALSE,
    start_date VARCHAR(20),
    end_date VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_class_id ON tasks (class_id);

CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    test_date VARCHAR(20) NOT NULL,
    scope TEXT
);

CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams (user_id);
CREATE INDEX IF NOT EXISTS idx_exams_class_id ON exams (class_id);

CREATE TABLE IF NOT EXISTS study_times (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    study_time INTEGER NOT NULL,
    date VARCHAR(20) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_times_user_id ON study_times (user_id);
CREATE INDEX IF NOT EXISTS idx_study_times_class_id ON study_times (class_id);

CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    year VARCHAR(20),
    file_path VARCHAR(300) NOT NULL,
    original_filename VARCHAR(250) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files (user_id);
CREATE INDEX IF NOT EXISTS idx_files_class_id ON files (class_id);

-- Optional: create a non-privileged database role for the application if using Supabase SQL editor.
-- Grant usage is handled by Supabase automatically for the project role.
