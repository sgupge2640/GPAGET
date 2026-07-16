import { useEffect, useState } from "react";
import { apiRequest } from "../api";

export default function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [visualization, setVisualization] = useState([]);
  const [message, setMessage] = useState("");
  const [studyDate, setStudyDate] = useState(new Date().toISOString().slice(0, 10));
  const [studyMinutes, setStudyMinutes] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadData = async () => {
    try {
      const classData = await apiRequest("/api/classes");
      const visData = await apiRequest("/api/visualization");
      setClasses(classData);
      setVisualization(visData);
      if (!selectedClassId && classData.length > 0) {
        setSelectedClassId(String(classData[0].id));
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isTimerRunning || !timerStartedAt) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - timerStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isTimerRunning, timerStartedAt]);

  const selectedClass = classes.find((c) => String(c.id) === String(selectedClassId));
  const weeklyProgress = selectedClass?.weekly_progress || {};
  const formatElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const updateWeeklyProgress = async (nextProgress) => {
    if (!selectedClass) return;
    try {
      await apiRequest(`/api/classes/${selectedClass.id}`, "PUT", {
        weekly_progress: nextProgress
      });
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedClass.id ? { ...c, weekly_progress: nextProgress } : c
        )
      );
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleWeekStatus = async (weekNumber, status) => {
    const key = String(weekNumber);
    const current = weeklyProgress[key] || {};
    const nextProgress = { ...weeklyProgress };

    nextProgress[key] = {
      ...current,
      [status]: !current[status]
    };

    await updateWeeklyProgress(nextProgress);
    await loadData();
  };

  const saveStudyTime = async (minutesToSave) => {
    if (!selectedClassId) {
      setMessage("科目を選択してください");
      return;
    }

    try {
      await apiRequest("/api/study-times", "POST", {
        class_id: Number(selectedClassId),
        study_time: Number(minutesToSave),
        date: studyDate
      });
      setMessage("勉強時間を保存しました");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startTimer = () => {
    if (!selectedClassId) {
      setMessage("科目を選択してください");
      return;
    }

    setStudyDate(new Date().toISOString().slice(0, 10));
    setElapsedSeconds(0);
    setTimerStartedAt(Date.now());
    setIsTimerRunning(true);
    setMessage("勉強時間の計測を開始しました");
  };

  const stopTimer = async () => {
    if (!isTimerRunning) return;

    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    setIsTimerRunning(false);
    setTimerStartedAt(null);
    await saveStudyTime(minutes);
    setElapsedSeconds(0);
  };

  return (
    <div className="page-card">
      <h2>ダッシュボード</h2>
      {message && <div className="error">{message}</div>}

      <section className="dashboard-section">
        <h3>週課題の状態</h3>
        <label>
          科目を選択
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {selectedClass && (
          <>
            <div>{selectedClass.is_weekly ? "週課題あり" : "週課題なし"}</div>
            {selectedClass.is_weekly ? (
              <div className="weekly-grid">
                {Array.from({ length: 15 }, (_, i) => i + 1).map((week) => (
                  <div key={week} className="weekly-row">
                    <span>{week}回</span>
                    <div className="weekly-status-group">
                      <span className="weekly-status-label">提出状況</span>
                      <div className="weekly-status-options">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!(weeklyProgress[String(week)] || {})["submitted"]}
                            onChange={() => toggleWeekStatus(week, "submitted")}
                          />
                          提出
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!(weeklyProgress[String(week)] || {})["unsubmitted"]}
                            onChange={() => toggleWeekStatus(week, "unsubmitted")}
                          />
                          未提出
                        </label>
                      </div>
                    </div>
                    <div className="weekly-status-group">
                      <span className="weekly-status-label">出欠</span>
                      <div className="weekly-status-options">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!(weeklyProgress[String(week)] || {})["attended"]}
                            onChange={() => toggleWeekStatus(week, "attended")}
                          />
                          出席
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!(weeklyProgress[String(week)] || {})["absent"]}
                            onChange={() => toggleWeekStatus(week, "absent")}
                          />
                          欠席
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!(weeklyProgress[String(week)] || {})["late"]}
                            onChange={() => toggleWeekStatus(week, "late")}
                          />
                          遅刻
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>この科目では週課題を設定していません。</div>
            )}
          </>
        )}
      </section>

      <section className="dashboard-section">
        <h3>勉強時間を記録</h3>
        <div className="study-timer-card">
          <div className="study-timer-controls">
            <label>
              日付
              <input
                type="date"
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
              />
            </label>
            <label>
              勉強時間（分）
              <input
                type="number"
                min="1"
                value={studyMinutes}
                onChange={(e) => setStudyMinutes(e.target.value)}
              />
            </label>
          </div>
          <div className="study-timer-actions">
            <button type="button" className="primary-button" onClick={startTimer} disabled={isTimerRunning}>
              計測開始
            </button>
            <button type="button" className="primary-button" onClick={stopTimer} disabled={!isTimerRunning}>
              計測停止
            </button>
            <span className="study-timer-readout">{formatElapsed(elapsedSeconds)}</span>
            <button
              type="button"
              className="primary-button"
              onClick={() => saveStudyTime(studyMinutes)}
            >
              手入力で保存
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <h3>科目別学習状況</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>科目</th>
              <th>課題未提出</th>
              <th>勉強時間(分)</th>
            </tr>
          </thead>
          <tbody>
            {visualization.length === 0 && (
              <tr>
                <td colSpan="3">データがありません</td>
              </tr>
            )}
            {visualization.map((item) => (
              <tr key={item.class_id}>
                <td>{item.class_name}</td>
                <td>{item.unsubmitted_count}</td>
                <td>{item.total_study_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
