import json
import os
import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, g
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import jwt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
allowed_origins = [origin.strip() for origin in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if origin.strip()]
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "replace-with-a-secure-secret")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "replace-with-another-secret")
app.config["JWT_EXPIRATION_SECONDS"] = 3600
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

db = SQLAlchemy(app)
CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    classes = db.relationship("Class", backref="user", cascade="all, delete-orphan")
    tasks = db.relationship("Task", backref="user", cascade="all, delete-orphan")
    exams = db.relationship("Exam", backref="user", cascade="all, delete-orphan")
    study_times = db.relationship("StudyTime", backref="user", cascade="all, delete-orphan")
    files = db.relationship("FileUpload", backref="user", cascade="all, delete-orphan")


class Class(db.Model):
    __tablename__ = "classes"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    day_of_week = db.Column(db.String(20), nullable=True)
    period = db.Column(db.Integer, nullable=True)
    teacher = db.Column(db.String(200), nullable=True)
    is_weekly = db.Column(db.Boolean, nullable=False, default=False)
    weekly_progress = db.Column(db.Text, nullable=True)
    weekly_deadline_day = db.Column(db.String(10), nullable=True)
    weekly_task_start_date = db.Column(db.String(20), nullable=True)
    weekly_task_end_date = db.Column(db.String(20), nullable=True)
    tasks = db.relationship("Task", backref="class_item", cascade="all, delete-orphan")
    exams = db.relationship("Exam", backref="class_item", cascade="all, delete-orphan")
    study_times = db.relationship("StudyTime", backref="class_item", cascade="all, delete-orphan")
    files = db.relationship("FileUpload", backref="class_item", cascade="all, delete-orphan")


class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(250), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.String(20), nullable=True)
    is_submitted = db.Column(db.Boolean, nullable=False, default=False)
    submitted_at = db.Column(db.String(20), nullable=True)
    is_weekly = db.Column(db.Boolean, nullable=False, default=False)
    start_date = db.Column(db.String(20), nullable=True)
    end_date = db.Column(db.String(20), nullable=True)


class Exam(db.Model):
    __tablename__ = "exams"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    test_date = db.Column(db.String(20), nullable=False)
    scope = db.Column(db.Text, nullable=True)


class StudyTime(db.Model):
    __tablename__ = "study_times"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    study_time = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(20), nullable=False)


class FileUpload(db.Model):
    __tablename__ = "files"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    year = db.Column(db.String(20), nullable=True)
    file_path = db.Column(db.String(300), nullable=False)
    original_filename = db.Column(db.String(250), nullable=False)


def create_access_token(user_id):
    payload = {
        "sub": str(user_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=app.config["JWT_EXPIRATION_SECONDS"]),
        "iat": datetime.datetime.utcnow(),
    }
    token = jwt.encode(payload, app.config["JWT_SECRET_KEY"], algorithm="HS256")
    return token


def normalize_email(email):
    return email.strip().lower() if isinstance(email, str) else email


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        if not auth_header:
            return jsonify({"message": "Authorization header missing"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"message": "Invalid authorization header"}), 401

        token = parts[1]
        try:
            payload = jwt.decode(token, app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
            user = User.query.get(int(payload["sub"]))
            if user is None:
                return jsonify({"message": "User not found"}), 401
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated


def allowed_file(filename):
    if "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].strip().lower()
    return extension in {"png", "jpg", "jpeg", "gif", "webp", "bmp"}


def normalize_weekly_progress(raw):
    if not isinstance(raw, dict):
        return {}

    normalized = {}
    status_keys = ("submitted", "unsubmitted", "attended", "absent", "late")
    for key, value in raw.items():
        week_key = str(key)
        if isinstance(value, dict):
            normalized[week_key] = {status: bool(value.get(status, False)) for status in status_keys}
        else:
            normalized[week_key] = {status: (value == status) for status in status_keys}
    return normalized


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name")
    email = normalize_email(data.get("email"))
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "name, email, password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email is already registered"}), 400

    hashed_password = generate_password_hash(password)
    user = User(name=name, email=email, password=hashed_password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(user.id)
    return jsonify({"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = normalize_email(data.get("email"))
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if user is None or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(user.id)
    return jsonify({"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}})


@app.route("/api/logout", methods=["POST"])
@token_required
def logout():
    return jsonify({"message": "Logout successful"}), 200


@app.route("/api/classes", methods=["GET", "POST"])
@token_required
def classes():
    user = g.current_user
    if request.method == "GET":
        classes = Class.query.filter_by(user_id=user.id).all()
        return jsonify([{
            "id": c.id,
            "name": c.name,
            "day_of_week": c.day_of_week,
            "period": c.period,
            "teacher": c.teacher,
            "is_weekly": bool(c.is_weekly),
            "weekly_progress": json.loads(c.weekly_progress) if c.weekly_progress else {},
            "weekly_deadline_day": c.weekly_deadline_day,
            "weekly_task_start_date": c.weekly_task_start_date,
            "weekly_task_end_date": c.weekly_task_end_date
        } for c in classes])

    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"message": "Class name is required"}), 400

    weekly_progress = data.get("weekly_progress")
    if weekly_progress is None:
        weekly_progress = {}
    elif not isinstance(weekly_progress, dict):
        return jsonify({"message": "weekly_progress must be an object"}), 400

    normalized_progress = normalize_weekly_progress(weekly_progress)
    new_class = Class(
        user_id=user.id,
        name=data["name"],
        day_of_week=data.get("day_of_week"),
        period=data.get("period"),
        teacher=data.get("teacher"),
        is_weekly=bool(data.get("is_weekly", False)),
        weekly_progress=json.dumps(normalized_progress),
        weekly_deadline_day=data.get("weekly_deadline_day"),
        weekly_task_start_date=data.get("weekly_task_start_date"),
        weekly_task_end_date=data.get("weekly_task_end_date")
    )
    db.session.add(new_class)
    db.session.commit()
    return jsonify({"message": "Class created", "id": new_class.id}), 201


@app.route("/api/classes/<int:class_id>", methods=["GET", "PUT", "DELETE"])
@token_required
def class_detail(class_id):
    user = g.current_user
    class_item = Class.query.filter_by(id=class_id, user_id=user.id).first()
    if not class_item:
        return jsonify({"message": "Class not found"}), 404

    if request.method == "GET":
        return jsonify({
            "id": class_item.id,
            "name": class_item.name,
            "day_of_week": class_item.day_of_week,
            "period": class_item.period,
            "teacher": class_item.teacher,
            "is_weekly": bool(class_item.is_weekly),
            "weekly_progress": json.loads(class_item.weekly_progress) if class_item.weekly_progress else {},
            "weekly_deadline_day": class_item.weekly_deadline_day,
            "weekly_task_start_date": class_item.weekly_task_start_date,
            "weekly_task_end_date": class_item.weekly_task_end_date
        })
    if request.method == "PUT":
        data = request.get_json() or {}
        class_item.name = data.get("name", class_item.name)
        class_item.day_of_week = data.get("day_of_week", class_item.day_of_week)
        class_item.period = data.get("period", class_item.period)
        class_item.teacher = data.get("teacher", class_item.teacher)
        if "is_weekly" in data:
            class_item.is_weekly = bool(data["is_weekly"])
        if "weekly_progress" in data:
            weekly_progress = data["weekly_progress"]
            if not isinstance(weekly_progress, dict):
                return jsonify({"message": "weekly_progress must be an object"}), 400
            class_item.weekly_progress = json.dumps(normalize_weekly_progress(weekly_progress))
        if "weekly_deadline_day" in data:
            class_item.weekly_deadline_day = data["weekly_deadline_day"]
        if "weekly_task_start_date" in data:
            class_item.weekly_task_start_date = data["weekly_task_start_date"]
        if "weekly_task_end_date" in data:
            class_item.weekly_task_end_date = data["weekly_task_end_date"]
        db.session.commit()
        return jsonify({"message": "Class updated"})

    db.session.delete(class_item)
    db.session.commit()
    return jsonify({"message": "Class deleted"})


@app.route("/api/tasks", methods=["GET", "POST"])
@token_required
def tasks():
    user = g.current_user
    if request.method == "GET":
        query = Task.query.filter_by(user_id=user.id)
        if request.args.get("sort") == "due_date":
            query = query.order_by(Task.due_date.asc())
        tasks = query.all()
        return jsonify([{
            "id": t.id,
            "class_id": t.class_id,
            "title": t.title,
            "description": t.description,
            "due_date": t.due_date,
            "is_submitted": t.is_submitted,
            "submitted_at": t.submitted_at,
            "is_weekly": t.is_weekly,
            "start_date": t.start_date,
            "end_date": t.end_date
        } for t in tasks])

    data = request.get_json() or {}
    required = ["class_id", "title"]
    if not all(data.get(k) for k in required):
        return jsonify({"message": "class_id and title are required"}), 400

    class_item = Class.query.filter_by(id=data["class_id"], user_id=user.id).first()
    if not class_item:
        return jsonify({"message": "Class not found"}), 404

    task = Task(
        user_id=user.id,
        class_id=data["class_id"],
        title=data["title"],
        description=data.get("description"),
        due_date=data.get("due_date"),
        is_submitted=bool(data.get("is_submitted", False)),
        submitted_at=data.get("submitted_at") if data.get("submitted_at") else (datetime.date.today().isoformat() if bool(data.get("is_submitted", False)) else None),
        is_weekly=bool(data.get("is_weekly", False)),
        start_date=data.get("start_date"),
        end_date=data.get("end_date")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Task created", "id": task.id}), 201


@app.route("/api/tasks/<int:task_id>", methods=["GET", "PUT", "DELETE"])
@token_required
def task_detail(task_id):
    user = g.current_user
    task = Task.query.filter_by(id=task_id, user_id=user.id).first()
    if not task:
        return jsonify({"message": "Task not found"}), 404

    if request.method == "GET":
        return jsonify({
            "id": task.id,
            "class_id": task.class_id,
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date,
            "is_submitted": task.is_submitted,
            "submitted_at": task.submitted_at,
            "is_weekly": task.is_weekly,
            "start_date": task.start_date,
            "end_date": task.end_date
        })
    if request.method == "PUT":
        data = request.get_json() or {}
        if data.get("class_id"):
            class_item = Class.query.filter_by(id=data["class_id"], user_id=user.id).first()
            if not class_item:
                return jsonify({"message": "Class not found"}), 404
            task.class_id = data["class_id"]
        task.title = data.get("title", task.title)
        task.description = data.get("description", task.description)
        task.due_date = data.get("due_date", task.due_date)
        if "submitted_at" in data:
            task.submitted_at = data["submitted_at"]
        if "is_submitted" in data:
            task.is_submitted = bool(data["is_submitted"])
            if task.is_submitted and not task.submitted_at:
                task.submitted_at = datetime.date.today().isoformat()
            elif not task.is_submitted:
                task.submitted_at = None
        if "is_weekly" in data:
            task.is_weekly = bool(data["is_weekly"])
        start_date = data.get("start_date", task.start_date)
        end_date = data.get("end_date", task.end_date)
        if start_date and end_date and start_date > end_date:
            return jsonify({"message": "start_date must be before or equal to end_date"}), 400
        task.start_date = start_date
        task.end_date = end_date
        db.session.commit()
        return jsonify({"message": "Task updated"})

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"})


@app.route("/api/exams", methods=["GET", "POST"])
@token_required
def exams():
    user = g.current_user
    if request.method == "GET":
        exams = Exam.query.filter_by(user_id=user.id).all()
        return jsonify([{
            "id": e.id,
            "class_id": e.class_id,
            "test_date": e.test_date,
            "scope": e.scope
        } for e in exams])

    data = request.get_json() or {}
    required = ["class_id", "test_date"]
    if not all(data.get(k) for k in required):
        return jsonify({"message": "class_id and test_date are required"}), 400

    class_item = Class.query.filter_by(id=data["class_id"], user_id=user.id).first()
    if not class_item:
        return jsonify({"message": "Class not found"}), 404

    exam = Exam(
        user_id=user.id,
        class_id=data["class_id"],
        test_date=data["test_date"],
        scope=data.get("scope")
    )
    db.session.add(exam)
    db.session.commit()
    return jsonify({"message": "Exam created", "id": exam.id}), 201


@app.route("/api/exams/<int:exam_id>", methods=["GET", "PUT", "DELETE"])
@token_required
def exam_detail(exam_id):
    user = g.current_user
    exam = Exam.query.filter_by(id=exam_id, user_id=user.id).first()
    if not exam:
        return jsonify({"message": "Exam not found"}), 404

    if request.method == "GET":
        return jsonify({
            "id": exam.id,
            "class_id": exam.class_id,
            "test_date": exam.test_date,
            "scope": exam.scope
        })
    if request.method == "PUT":
        data = request.get_json() or {}
        if data.get("class_id"):
            class_item = Class.query.filter_by(id=data["class_id"], user_id=user.id).first()
            if not class_item:
                return jsonify({"message": "Class not found"}), 404
            exam.class_id = data["class_id"]
        exam.test_date = data.get("test_date", exam.test_date)
        exam.scope = data.get("scope", exam.scope)
        db.session.commit()
        return jsonify({"message": "Exam updated"})

    db.session.delete(exam)
    db.session.commit()
    return jsonify({"message": "Exam deleted"})


@app.route("/api/study-times", methods=["GET", "POST"])
@token_required
def study_times():
    user = g.current_user
    if request.method == "GET":
        records = StudyTime.query.filter_by(user_id=user.id).all()
        return jsonify([{
            "id": r.id,
            "class_id": r.class_id,
            "study_time": r.study_time,
            "date": r.date
        } for r in records])

    data = request.get_json() or {}
    required = ["class_id", "study_time", "date"]
    if not all(data.get(k) for k in required):
        return jsonify({"message": "class_id, study_time, date are required"}), 400

    class_item = Class.query.filter_by(id=data["class_id"], user_id=user.id).first()
    if not class_item:
        return jsonify({"message": "Class not found"}), 404

    record = StudyTime(
        user_id=user.id,
        class_id=data["class_id"],
        study_time=int(data["study_time"]),
        date=data["date"]
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": "Study time recorded", "id": record.id}), 201


@app.route("/api/files", methods=["GET", "POST"])
@token_required
def files():
    user = g.current_user
    if request.method == "GET":
        file_records = FileUpload.query.filter_by(user_id=user.id).order_by(FileUpload.id.asc()).all()
        return jsonify([{
            "id": f.id,
            "class_id": f.class_id,
            "year": f.year,
            "filename": f.original_filename,
            "file_path": f.file_path,
            "view_url": f"/api/files/view/{f.id}"
        } for f in file_records])

    class_id = request.form.get("class_id")
    year = request.form.get("year", "")
    uploaded_files = request.files.getlist("files")

    if not class_id or not uploaded_files:
        return jsonify({"message": "class_id and files are required"}), 400

    class_item = Class.query.filter_by(id=class_id, user_id=user.id).first()
    if not class_item:
        return jsonify({"message": "Class not found"}), 404

    user_folder = os.path.join(app.config["UPLOAD_FOLDER"], str(user.id))
    os.makedirs(user_folder, exist_ok=True)

    saved_ids = []
    for uploaded_file in uploaded_files:
        if uploaded_file.filename == "" or not allowed_file(uploaded_file.filename):
            continue

        filename = secure_filename(uploaded_file.filename)
        save_path = os.path.join(user_folder, filename)

        if os.path.exists(save_path):
            base, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(save_path):
                save_path = os.path.join(user_folder, f"{base}_{counter}{ext}")
                counter += 1

        uploaded_file.save(save_path)
        record = FileUpload(
            user_id=user.id,
            class_id=class_id,
            year=year,
            file_path=save_path,
            original_filename=os.path.basename(save_path)
        )
        db.session.add(record)
        db.session.commit()
        saved_ids.append(record.id)

    if not saved_ids:
        return jsonify({"message": "No valid image files were uploaded"}), 400

    return jsonify({"message": "Files uploaded", "ids": saved_ids}), 201


@app.route("/api/files/<int:file_id>", methods=["DELETE"])
@token_required
def delete_file(file_id):
    user = g.current_user
    record = FileUpload.query.filter_by(id=file_id, user_id=user.id).first()
    if not record:
        return jsonify({"message": "File not found"}), 404

    try:
        if os.path.exists(record.file_path):
            os.remove(record.file_path)
    except OSError:
        pass
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "File deleted"})


@app.route("/api/files/view/<int:file_id>", methods=["GET"])
def view_file(file_id):
    record = FileUpload.query.get(file_id)
    if not record or not os.path.exists(record.file_path):
        return jsonify({"message": "File not found"}), 404

    directory, filename = os.path.split(record.file_path)
    return send_from_directory(directory, filename)


@app.route("/api/visualization", methods=["GET"])
@token_required
def visualization():
    user = g.current_user
    classes = Class.query.filter_by(user_id=user.id).all()
    result = []
    for c in classes:
        tasks = Task.query.filter_by(user_id=user.id, class_id=c.id).all()
        study_sum = db.session.query(db.func.sum(StudyTime.study_time)).filter_by(user_id=user.id, class_id=c.id).scalar() or 0

        if c.is_weekly:
            raw_progress = json.loads(c.weekly_progress) if c.weekly_progress else {}
            weekly_progress = normalize_weekly_progress(raw_progress)
            unsubmitted_count = sum(
                1 for week in weekly_progress.values()
                if week.get("unsubmitted")
            )
        else:
            unsubmitted_count = sum(1 for t in tasks if not t.is_submitted)

        result.append({
            "class_id": c.id,
            "class_name": c.name,
            "unsubmitted_count": unsubmitted_count,
            "total_study_time": int(study_sum)
        })
    return jsonify(result)


@app.route("/api/calendar", methods=["GET"])
@token_required
def calendar():
    user = g.current_user
    events = {}
    tasks = Task.query.filter_by(user_id=user.id).all()
    exams = Exam.query.filter_by(user_id=user.id).all()

    for task in tasks:
        if task.due_date:
            class_name = Class.query.filter_by(id=task.class_id, user_id=user.id).first()
            events.setdefault(task.due_date, []).append({
                "type": "task",
                "title": task.title,
                "class_id": task.class_id,
                "class_name": class_name.name if class_name else None,
                "description": task.description,
                "is_submitted": task.is_submitted,
                "submitted_at": task.submitted_at,
            })
    for exam in exams:
        if exam.test_date:
            class_name = Class.query.filter_by(id=exam.class_id, user_id=user.id).first()
            events.setdefault(exam.test_date, []).append({
                "type": "exam",
                "title": f"Exam: {exam.scope or '範囲未定'}",
                "class_id": exam.class_id,
                "class_name": class_name.name if class_name else None,
                "scope": exam.scope,
            })
    sorted_events = {date: events[date] for date in sorted(events.keys())}
    return jsonify(sorted_events)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"message": "Not found"}), 404

    if path and not os.path.exists(os.path.join(FRONTEND_DIST_DIR, path)):
        return send_from_directory(FRONTEND_DIST_DIR, "index.html")

    if path:
        return send_from_directory(FRONTEND_DIST_DIR, path)

    return send_from_directory(FRONTEND_DIST_DIR, "index.html")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
