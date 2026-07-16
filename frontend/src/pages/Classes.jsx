import { useEffect, useState } from "react";
import { apiRequest } from "../api";

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    name: "",
    day_of_week: "",
    period: "",
    teacher: "",
    is_weekly: false
  });
  const [message, setMessage] = useState("");

  const fetchClasses = async () => {
    try {
      const data = await apiRequest("/api/classes");
      setClasses(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/api/classes", "POST", {
        ...form,
        period: form.period ? Number(form.period) : null
      });
      setForm({
        name: "",
        day_of_week: "",
        period: "",
        teacher: "",
        is_weekly: false
      });
      fetchClasses();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/api/classes/${id}`, "DELETE");
      fetchClasses();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page-card">
      <h2>授業一覧</h2>
      {message && <div className="error">{message}</div>}

      <form onSubmit={handleCreate} className="form-grid">
        <label>
          授業名
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          曜日
          <input
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
          />
        </label>
        <label>
          時限
          <input
            type="number"
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
          />
        </label>
        <label>
          教員
          <input
            value={form.teacher}
            onChange={(e) => setForm({ ...form, teacher: e.target.value })}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.is_weekly}
            onChange={(e) => setForm({ ...form, is_weekly: e.target.checked })}
          />
          週課題あり
        </label>
        <button type="submit" className="primary-button">
          授業を追加
        </button>
      </form>

      <ul className="list-card">
        {classes.length === 0 && <li>まだ授業がありません</li>}
        {classes.map((c) => (
          <li key={c.id}>
            <div>
              <strong>{c.name}</strong> ({c.day_of_week} / {c.period}限)
            </div>
            <div>{c.teacher}</div>
            <div>{c.is_weekly ? "週課題あり" : "週課題なし"}</div>
            <button className="danger-button" onClick={() => handleDelete(c.id)}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
