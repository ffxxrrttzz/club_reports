"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@/types/database";
import { PERIODS } from "@/types/database";

type SortField = keyof Report | null;
type SortOrder = "asc" | "desc";

export default function TableEditorPage() {
  const router = useRouter();
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(PERIODS[PERIODS.length - 1]);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>(PERIODS);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    }
    setIsClient(true);
  }, [router]);

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod]);

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
          <h1>📊 Редактор таблицы данных</h1>
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
              {availablePeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
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
          padding: 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 20px;
        }

        .table-editor-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 1400px;
          padding: 30px;
        }

        .table-editor-header {
          margin-bottom: 25px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 15px;
        }

        .table-editor-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          color: #333;
        }

        .table-editor-subtitle {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .table-editor-controls {
          margin-bottom: 20px;
          display: flex;
          gap: 15px;
          align-items: flex-end;
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
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s;
          min-width: 150px;
        }

        .table-editor-select:focus {
          border-color: #667eea;
        }

        .table-editor-msg {
          padding: 12px;
          border-radius: 4px;
          text-align: center;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .table-editor-msg.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .table-editor-msg.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .table-editor-loading,
        .table-editor-empty {
          text-align: center;
          color: #666;
          padding: 20px;
          font-size: 14px;
        }

        .table-editor-scroll {
          overflow-x: auto;
          margin-bottom: 20px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .table-editor-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .table-editor-table thead {
          background: #f8f9fa;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .table-editor-table th {
          padding: 12px 10px;
          text-align: left;
          border-bottom: 2px solid #ddd;
          border-right: 1px solid #ddd;
          font-weight: 600;
          color: #333;
        }

        .table-editor-table th:last-child {
          border-right: none;
        }

        .table-editor-table td {
          padding: 10px;
          border-bottom: 1px solid #eee;
          border-right: 1px solid #eee;
          color: #555;
        }

        .table-editor-table td:last-child {
          border-right: none;
        }

        .table-editor-table tbody tr:hover {
          background-color: #f9f9f9;
        }

        .number-cell {
          text-align: right;
          font-weight: 500;
          color: #667eea;
        }

        .notes-cell {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #999;
          font-size: 12px;
        }

        .sort-button {
          background: none;
          border: none;
          color: #333;
          cursor: pointer;
          padding: 0;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: color 0.2s;
        }

        .sort-button:hover {
          color: #667eea;
        }

        .sort-button:active {
          transform: scale(0.95);
        }

        .table-editor-footer {
          text-align: right;
          color: #666;
          font-size: 13px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .table-editor-footer p {
          margin: 0;
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
