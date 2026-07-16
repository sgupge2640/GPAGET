import { useEffect, useState } from "react";
import { apiRequest } from "../api";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    class_id: "",
    title: "",
    description: "",
    due_date: "",
    is_submitted: false
  });
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const [taskData, classData] = await Promise.all([
        apiRequest("/api/tasks?sort=due_date"),
        apiRequest("/api/classes")
      ]);
      setTasks(taskData);
      setClasses(classData);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/api/tasks", "POST", form);
      setForm({
        class_id: "",
        title: "",
        description: "",
        due_date: "",
        is_submitted: false
      });
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleSubmitted = async (task) => {
    try {
      await apiRequest(`/api/tasks/${task.id}`, "PUT", {
        is_submitted: !task.is_submitted
      });
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteTask = async (id) => {
    try {
      await apiRequest(`/api/tasks/${id}`, "DELETE");
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page-card">
      <h2>特別課題一覧</h2>
      {message && <div className="error">{message}</div>}

      <form onSubmit={handleCreate} className="form-grid">
        <label>
          科目
          <select
            value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: Number(e.target.value) })}
            required
          >
            <option value="">選択してください</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          タイトル
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>
        <label>
          説明
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label>
          提出〆切
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.is_submitted}
            onChange={(e) => setForm({ ...form, is_submitted: e.target.checked })}
          />
          提出済み
        </label>
        <button type="submit" className="primary-button">
          課題を追加
        </button>
      </form>

      <ul className="list-card">
        {tasks.length === 0 && <li>課題がありません</li>}
        {tasks.map((task) => (
          <li key={task.id}>
            <div>
              <strong>{task.title}</strong>
            </div>
            <div>提出〆切: {task.due_date || "未設定"}</div>
            <div>提出済み: {task.is_submitted ? "はい" : "いいえ"}</div>
            {task.is_submitted && task.submitted_at && (
              <div>提出日: {task.submitted_at}</div>
            )}
            <div className="button-row">
              <button className="secondary-button" onClick={() => toggleSubmitted(task)}>
                {task.is_submitted ? "未提出に戻す" : "提出済みにする"}
              </button>
              <button className="danger-button" onClick={() => deleteTask(task.id)}>
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
