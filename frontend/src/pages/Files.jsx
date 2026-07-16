import { useEffect, useState } from "react";
import { API_BASE, apiRequest } from "../api";

export default function Files() {
  const [files, setFiles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [uploadData, setUploadData] = useState({
    class_id: "",
    year: "",
    files: []
  });
  const [message, setMessage] = useState("");
  const [expandedYears, setExpandedYears] = useState({});

  const loadData = async () => {
    try {
      const [fileList, classList] = await Promise.all([
        apiRequest("/api/files"),
        apiRequest("/api/classes")
      ]);
      setFiles(fileList);
      setClasses(classList);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.files.length) {
      setMessage("画像を選択してください");
      return;
    }
    const formData = new FormData();
    formData.append("class_id", uploadData.class_id);
    formData.append("year", uploadData.year);
    uploadData.files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await apiRequest("/api/files", "POST", formData, true);
      setUploadData({ class_id: "", year: "", files: [] });
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/api/files/${id}`, "DELETE");
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleYear = (classId, year) => {
    const key = `${classId}-${year}`;
    setExpandedYears((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const grouped = classes.reduce((acc, classItem) => {
    const classFiles = files
      .filter((file) => file.class_id === classItem.id)
      .sort((a, b) => a.id - b.id);
    const years = [...new Set(classFiles.map((file) => file.year).filter(Boolean))].sort();
    acc[classItem.id] = { classItem, years, classFiles };
    return acc;
  }, {});

  return (
    <div className="page-card">
      <h2>過去問一覧</h2>
      {message && <div className="error">{message}</div>}

      <form onSubmit={handleUpload} className="form-grid">
        <label>
          教科
          <select
            value={uploadData.class_id}
            onChange={(e) => setUploadData({ ...uploadData, class_id: e.target.value })}
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
          年度
          <input
            value={uploadData.year}
            onChange={(e) => setUploadData({ ...uploadData, year: e.target.value })}
            required
          />
        </label>
        <label>
          過去問画像
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setUploadData({ ...uploadData, files: Array.from(e.target.files || []) })}
            required
          />
        </label>
        <button type="submit" className="primary-button">
          アップロード
        </button>
      </form>

      <div className="past-question-groups">
        {classes.map((classItem) => {
          const entry = grouped[classItem.id];
          if (!entry || entry.years.length === 0) return null;

          return (
            <section key={classItem.id} className="past-question-group">
              <h3>{classItem.name}</h3>
              <div className="past-question-year-list">
                {entry.years.map((year) => {
                  const key = `${classItem.id}-${year}`;
                  const isOpen = !!expandedYears[key];
                  const yearFiles = entry.classFiles.filter((file) => file.year === year);

                  return (
                    <div key={key} className="past-question-year-card">
                      <button
                        type="button"
                        className="past-question-year-button"
                        onClick={() => toggleYear(classItem.id, year)}
                      >
                        {year}年度
                      </button>
                      {isOpen && (
                        <div className="past-question-images-grid">
                          {yearFiles.map((file) => {
                            const imageSrc = file.view_url.startsWith("http")
                              ? file.view_url
                              : `${API_BASE}${file.view_url}`;

                            return (
                              <img
                                key={file.id}
                                src={imageSrc}
                                alt={file.filename}
                                className="past-question-image"
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {files.length === 0 && <div className="empty-state">過去問がありません</div>}
    </div>
  );
}
