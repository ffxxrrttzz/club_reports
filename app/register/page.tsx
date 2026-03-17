"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (!email || !password || !fullName) {
      setMessage("❌ Заполните все обязательные поля");
      return;
    }

    if (password.length < 6) {
      setMessage("❌ Пароль должен быть не менее 6 символов");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("❌ Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setMessage("✅ Регистрация успешна! Перенаправляю на вход...");
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      } else if (res.status === 409) {
        setMessage("❌ Этот email уже зарегистрирован");
      } else {
        setMessage("❌ " + json.error);
      }
    } catch (err) {
      console.error("Register error:", err);
      setMessage("❌ Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>📝 Регистрация</h1>
        <p className="auth-subtitle">Создайте аккаунт руководителя</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Электронная почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />

          <input
            type="text"
            placeholder="ФИО"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
            required
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />

          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            required
          />

          <button type="submit" disabled={loading} className={loading ? "btn-disabled" : "btn"}>
            {loading ? "⏳ Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        {message && <p className={`msg ${message.startsWith("✅") ? "success" : "error"}`}>{message}</p>}

        <div className="auth-footer">
          <p>Уже есть аккаунт? <Link href="/login" className="auth-link">Войти</Link></p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .auth-card {
          background: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
        }

        .auth-card h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          color: #333;
          text-align: center;
        }

        .auth-subtitle {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin: 0 0 30px 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .auth-form input,
        .auth-form select {
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s;
          font-family: inherit;
        }

        .auth-form input:focus,
        .auth-form select:focus {
          border-color: #667eea;
        }

        .auth-form button {
          padding: 12px;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .auth-form button:hover:not(:disabled) {
          background-color: #5568d3;
        }

        .auth-form button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .msg {
          padding: 12px;
          border-radius: 4px;
          text-align: center;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .msg.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .msg.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .auth-footer {
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        .auth-footer p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .auth-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
        }

        .auth-link:hover {
          color: #5568d3;
        }
      `}</style>
    </div>
  );
}
