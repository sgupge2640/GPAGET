import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Files from "./pages/Files";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt_token");

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">GPAGET</div>
        {token && (
          <nav className="nav-links">
            <Link to="/dashboard">ダッシュボード</Link>
            <Link to="/classes">授業一覧</Link>
            <Link to="/tasks">特別課題一覧</Link>
            <Link to="/calendar">カレンダー</Link>
            <Link to="/files">過去問</Link>
            <button className="logout-button" onClick={handleLogout}>
              ログアウト
            </button>
          </nav>
        )}
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <Classes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Files />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
