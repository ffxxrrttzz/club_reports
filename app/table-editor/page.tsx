"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@/types/database";

type SortField = keyof Report | null;
type SortOrder = "asc" | "desc";

export default function TableEditorPage() {
  const router = useRouter();
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]); // ИЗМЕНЕНО
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isClient, setIsClient] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    }
    setIsClient(true);
    loadPeriods();
  }, [router]);

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const res = await fetch("/api/periods");
      const json = await res.json();
      if (res.ok && json.periods && json.periods.length > 0) {
        setAvailablePeriods(json.periods);
        // Выбираем первый (последний) период по умолчанию
        if (!selectedPeriod) {
          setSelectedPeriod(json.periods[0]);
        }
      }
    } catch (err) {
      console.error("Error loading periods:", err);
    }
  };

  const loadData = async (period: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/report?period=${period}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.raw);
      } else {
        setMessage("❌ " + json.error);
      }
    } catch (err) {
      console.error("Load error:", err);
      setMessage("❌ Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setMessage("");
      const res = await fetch(`/api/export?period=${selectedPeriod}`);

      if (!res.ok) {
        const json = await res.json();
        setMessage("❌ " + (json.error || "Ошибка экспорта"));
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage("✅ Excel файл успешно скачан");
    } catch (err) {
      console.error("Export error:", err);
      setMessage("❌ Ошибка скачивания файла");
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortedData = () => {
    if (!sortField) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue as string, "ru")
          : (bValue as string).localeCompare(aValue, "ru");
      }

      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>⇅</span>;
    return sortOrder === "asc" ? <span>↑</span> : <span>↓</span>;
  };

  const sortedData = getSortedData();

  if (!isClient) {
    return <div style={{ textAlign: "center", padding: "20px" }}>⏳ Загрузка...</div>;
  }

  return (
    <div className="table-editor-container" suppressHydrationWarning>
      <div className="table-editor-card">
        <div className="table-editor-header">
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f0f0f0",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e0e0e0")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
            >
              ← Вернуться
            </button>
          </div>
          <h1>📊 Просмотр таблицы данных</h1>
          <p className="table-editor-subtitle">Сортировка и просмотр всех записей</p>
        </div>

        <div className="table-editor-controls">
          <div className="period-control">
            <label>Выберите период:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="table-editor-select"
            >
              {availablePeriods.map((period: string) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={sortedData.length === 0 || exporting}
            className="table-editor-export-btn"
          >
            {exporting ? "⏳ Экспорт..." : "📥 Скачать Excel"}
          </button>
        </div>

        {message && (
          <p
            className={`table-editor-msg ${
              message.startsWith("✅") ? "success" : "error"
            }`}
          >
            {message}
          </p>
        )}

        {loading ? (
          <p className="table-editor-loading">⏳ Загрузка данных...</p>
        ) : sortedData.length === 0 ? (
          <p className="table-editor-empty">
            Нет данных за выбранный период
          </p>
        ) : (
          <div className="table-editor-scroll">
            <table className="table-editor-table">
              <thead>
                <tr>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("supervisor_name")}
                    >
                      ФИО <SortIcon field="supervisor_name" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("club_name")}
                    >
                      Клуб <SortIcon field="club_name" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("direction")}
                    >
                      Направление <SortIcon field="direction" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("section_name")}
                    >
                      Секция <SortIcon field="section_name" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("rate")}
                    >
                      Ставка <SortIcon field="rate" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("actual_total_people")}
                    >
                      Люди (всего) <SortIcon field="actual_total_people" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("actual_age_14_17")}
                    >
                      14-17 лет <SortIcon field="actual_age_14_17" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("actual_age_18_35")}
                    >
                      18-35 лет <SortIcon field="actual_age_18_35" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("actual_families")}
                    >
                      Семьи <SortIcon field="actual_families" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-button"
                      onClick={() => handleSort("mso_total")}
                    >
                      МСО <SortIcon field="mso_total" />
                    </button>
                  </th>
                  <th>Примечание</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td>{row.supervisor_name}</td>
                    <td>{row.club_name}</td>
                    <td>{row.direction}</td>
                    <td>{row.section_name}</td>
                    <td className="number-cell">{row.rate}</td>
                    <td className="number-cell">{row.actual_total_people}</td>
                    <td className="number-cell">{row.actual_age_14_17}</td>
                    <td className="number-cell">{row.actual_age_18_35}</td>
                    <td className="number-cell">{row.actual_families}</td>
                    <td className="number-cell">{row.mso_total}</td>
                    <td className="notes-cell">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-editor-footer">
          <p>Всего записей: <strong>{sortedData.length}</strong></p>
        </div>
      </div>

      <style jsx>{`
        .table-editor-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .table-editor-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 1400px;
          padding: 40px;
        }

        .table-editor-header {
          margin-bottom: 30px;
          border-bottom: 3px solid #f0f0f0;
          padding-bottom: 20px;
        }

        .table-editor-header h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          color: #1a1a1a;
          font-weight: 700;
        }

        .table-editor-subtitle {
          margin: 0;
          color: #777;
          font-size: 15px;
          font-weight: 500;
        }

        .table-editor-controls {
          margin-bottom: 20px;
          display: flex;
          gap: 15px;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .period-control {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .period-control label {
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .table-editor-select {
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
          min-width: 150px;
          background-color: white;
        }

        .table-editor-select:hover {
          border-color: #bbb;
        }

        .table-editor-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .table-editor-export-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
        }

        .table-editor-export-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          transform: translateY(-1px);
        }

        .table-editor-export-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .table-editor-export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .table-editor-msg {
          padding: 14px 16px;
          border-radius: 6px;
          text-align: center;
          font-size: 14px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .table-editor-msg.success {
          background: linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%);
          color: #155724;
          border: 2px solid #c3e6cb;
          box-shadow: 0 2px 8px rgba(21, 87, 36, 0.1);
        }

        .table-editor-msg.error {
          background: linear-gradient(135deg, #f8d7da 0%, #ffcdd2 100%);
          color: #721c24;
          border: 2px solid #f5c6cb;
          box-shadow: 0 2px 8px rgba(114, 28, 36, 0.1);
        }

        .table-editor-loading,
        .table-editor-empty {
          text-align: center;
          color: #777;
          padding: 40px 20px;
          font-size: 16px;
          font-weight: 500;
        }

        .table-editor-scroll {
          overflow-x: auto;
          margin-bottom: 25px;
          border-radius: 8px;
          border: 1px solid #e8e8e8;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .table-editor-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .table-editor-table thead {
          background: linear-gradient(180deg, #f8f9fa 0%, #f0f1f3 100%);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .table-editor-table th {
          padding: 16px 12px;
          text-align: left;
          border-bottom: 2px solid #e0e0e0;
          font-weight: 700;
          color: #1a1a1a;
          background: linear-gradient(180deg, #f8f9fa 0%, #f0f1f3 100%);
        }

        .table-editor-table td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          color: #444;
        }

        .table-editor-table tbody tr {
          transition: background-color 0.2s;
        }

        .table-editor-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .table-editor-table tbody tr:nth-child(even) {
          background-color: #fafbfc;
        }

        .table-editor-table tbody tr:hover:nth-child(even) {
          background-color: #f5f6f7;
        }

        .number-cell {
          text-align: right;
          font-weight: 600;
          color: #667eea;
        }

        .notes-cell {
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #888;
          font-size: 13px;
        }

        .sort-button {
          background: none;
          border: none;
          color: #1a1a1a;
          cursor: pointer;
          padding: 0;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .sort-button:hover {
          color: #667eea;
        }

        .sort-button:active {
          transform: scale(0.98);
        }

        .table-editor-footer {
          text-align: right;
          color: #777;
          font-size: 14px;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
          font-weight: 500;
        }

        .table-editor-footer p {
          margin: 0;
        }

        .table-editor-footer strong {
          color: #667eea;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .table-editor-card {
            padding: 20px;
          }

          .table-editor-header h1 {
            font-size: 22px;
          }

          .table-editor-table {
            font-size: 12px;
          }

          .table-editor-table th,
          .table-editor-table td {
            padding: 8px 5px;
          }

          .sort-button {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}