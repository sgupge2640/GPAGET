import { useEffect, useState } from "react";
import { apiRequest } from "../api";

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export default function Calendar() {
  const [calendar, setCalendar] = useState({});
  const [message, setMessage] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    async function loadCalendar() {
      try {
        const data = await apiRequest("/api/calendar");
        setCalendar(data);
      } catch (error) {
        setMessage(error.message);
      }
    }
    loadCalendar();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayIndex = firstDay.getDay();

  const dayCells = [];
  for (let i = 0; i < firstDayIndex; i += 1) {
    dayCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    dayCells.push(new Date(year, month, day));
  }
  while (dayCells.length % 7 !== 0) {
    dayCells.push(null);
  }

  const formatKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectedEvents = selectedDate ? calendar[selectedDate] || [] : [];

  return (
    <div className="page-card">
      <h2>カレンダー</h2>
      {message && <div className="error">{message}</div>}
      <div className="calendar-controls">
        <button type="button" className="secondary-button" onClick={goToPreviousMonth}>
          前月
        </button>
        <h3>
          {year}年{month + 1}月
        </h3>
        <button type="button" className="secondary-button" onClick={goToNextMonth}>
          次月
        </button>
      </div>
      <div className="calendar-month-view">
        <div className="calendar-weekdays">
          {weekdayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="calendar-days-grid">
          {dayCells.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="calendar-day-cell empty" />;
            }

            const key = formatKey(date);
            const events = calendar[key] || [];
            const isToday =
              date.getFullYear() === new Date().getFullYear() &&
              date.getMonth() === new Date().getMonth() &&
              date.getDate() === new Date().getDate();
            const isSelected = selectedDate === key;

            return (
              <button
                type="button"
                key={key}
                className={`calendar-day-cell${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
                onClick={() => setSelectedDate(key)}
              >
                <div className="calendar-day-number">{date.getDate()}</div>
                <div className="calendar-event-list">
                  {events.map((event, eventIndex) => (
                    <div key={`${key}-${eventIndex}`} className="calendar-event-pill">
                      <span>{event.type === "task" ? "課題" : "テスト"}</span>
                      <span>{event.title}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="calendar-detail-panel">
          <h3>{selectedDate} の予定</h3>
          {selectedEvents.length === 0 ? (
            <p>この日に登録された予定はありません。</p>
          ) : (
            <div className="calendar-detail-list">
              {selectedEvents.map((event, eventIndex) => (
                <div key={`${selectedDate}-${eventIndex}`} className="calendar-detail-item">
                  <div className="calendar-detail-type">{event.type === "task" ? "課題" : "テスト"}</div>
                  <div className="calendar-detail-title">{event.title}</div>
                  {event.class_name && <div>授業: {event.class_name}</div>}
                  {event.description && <div>詳細: {event.description}</div>}
                  {event.scope && <div>範囲: {event.scope}</div>}
                  {typeof event.is_submitted === "boolean" && (
                    <div>提出状況: {event.is_submitted ? "提出済み" : "未提出"}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
