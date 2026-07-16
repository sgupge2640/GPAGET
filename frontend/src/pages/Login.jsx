import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const path = isLogin ? "/api/login" : "/api/register";
      const body = isLogin ? { email, password } : { name, email, password };
      const data = await apiRequest(path, "POST", body);
      localStorage.setItem("jwt_token", data.token);
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page-card">
      <h2>{isLogin ? "ログイン" : "ユーザー登録"}</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        {!isLogin && (
          <label>
            名前
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label>
          メール
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          パスワード
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {message && <div className="error">{message}</div>}
        <button type="submit" className="primary-button">
          {isLogin ? "ログイン" : "登録"}
        </button>
      </form>
      <button className="text-button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "アカウントを作成" : "既にアカウントをお持ちですか？ログイン"}
      </button>
    </div>
  );
}
