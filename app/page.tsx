"use client";

import { useState, useEffect } from "react";
import { utils, writeFile } from "xlsx";
import type { Report, SummaryData } from "@/types/database";

interface FormData {
  club_name: string;
  report_date: string;
  visitors: string;
  revenue: string;
  password: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    club_name: "Клуб А",
    report_date: new Date().toISOString().split("T")[0],
    visitors: "",
    revenue: "",
    password: "",
  });

  const [data, setData] = useState<Report[]>([]);
  const [summary, setSummary] = useState<SummaryData>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Помечаем что клиент загрузился (для избежания гидратации)
  useEffect(() => {
    setIsClient(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/report");
      const json = await res.json();

      if (res.ok) {
        setData(json.raw);
        setSummary(json.summary);
      } else {
        setMessage("❌ " + json.error);
      }
    } catch (err) {
      console.error("Load error:", err);
      setMessage("❌ Ошибка загрузки");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok) {
        setMessage("✅ Отправлено!");
        setFormData((prev) => ({
          ...prev,
          visitors: "",
          revenue: "",
        }));
        loadData();
      } else {
        setMessage("❌ " + json.message);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage("❌ Ошибка отправки");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    try {
      console.log("📊 Download started", { dataCount: data.length, summary });

      if (data.length === 0 && Object.keys(summary).length === 0) {
        alert("⚠️ Нет данных для экспорта! Сначала добавьте отчеты.");
        return;
      }

      const wb = utils.book_new();

      // Лист с данными
      const wsData = utils.json_to_sheet(data);
      utils.book_append_sheet(wb, wsData, "Данные");

      // Сводный лист
      const summaryData = Object.entries(summary).map(([club, stats]) => ({
        Клуб: club,
        Посетители: stats.visitors,
        Выручка: stats.revenue,
      }));
      const wsSummary = utils.json_to_sheet(summaryData);
      utils.book_append_sheet(wb, wsSummary, "Итоги");

      const filename = `Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      console.log("📥 Downloading:", filename);

      writeFile(wb, filename);

      setMessage("✅ Excel скачан!");
    } catch (err) {
      console.error("Excel error:", err);
      setMessage("❌ Ошибка Excel: " + (err as Error).message);
    }
  };

  // Пока клиент не загрузился - показываем заглушку
  if (!isClient) {
    return <div style={{ padding: 20, textAlign: "center" }}>Загрузка...</div>;
  }

  return (
    <div className="container" suppressHydrationWarning>
      <h1 className="title">📊 Отчетность клубов</h1>

      {/* Форма */}
      <div className="card">
        <h2>Внести данные</h2>
        <form onSubmit={handleSubmit} className="form">
          <select
            value={formData.club_name}
            onChange={(e) =>
              setFormData({ ...formData, club_name: e.target.value })
            }
            className="input"
          >
            <option>Клуб А</option>
            <option>Клуб Б</option>
            <option>Клуб В</option>
          </select>

          <input
            type="date"
            value={formData.report_date}
            onChange={(e) =>
              setFormData({ ...formData, report_date: e.target.value })
            }
            className="input"
            required
          />

          <input
            type="number"
            placeholder="Посетители"
            value={formData.visitors}
            onChange={(e) =>
              setFormData({ ...formData, visitors: e.target.value })
            }
            className="input"
            min="0"
            required
          />

          <input
            type="number"
            placeholder="Выручка (₽)"
            value={formData.revenue}
            onChange={(e) =>
              setFormData({ ...formData, revenue: e.target.value })
            }
            className="input"
            min="0"
            step="0.01"
            required
          />

          <input
            type="password"
            placeholder="Пароль (club2024)"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="input"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={loading ? "btn-disabled" : "btn"}
          >
            {loading ? "..." : "Отправить"}
          </button>
        </form>
        {message && <p className="msg">{message}</p>}
      </div>

      {/* Сводка */}
      <div className="card">
        <h2>📈 Итоги</h2>
        {Object.keys(summary).length > 0 ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Клуб</th>
                  <th>Посетители</th>
                  <th>Выручка</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary).map(([club, stats]) => (
                  <tr key={club}>
                    <td>{club}</td>
                    <td>{stats.visitors}</td>
                    <td>{stats.revenue.toLocaleString()} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={downloadExcel} className="excel-btn">
              📥 Скачать Excel
            </button>
          </>
        ) : (
          <p>Нет данных</p>
        )}
      </div>

      {/* Последние записи */}
      <div className="card">
        <h3>Последние записи</h3>
        <ul className="list">
          {data.slice(0, 5).map((row) => (
            <li key={row.id}>
              <b>{row.club_name}</b> ({row.report_date}): {row.visitors} чел.
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
