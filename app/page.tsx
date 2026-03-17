"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { utils, writeFile } from "xlsx";
import ComboBox from "@/components/ComboBox";
import { logout } from "@/lib/auth";
import type { Report, ClubSummary, FormData, Direction } from "@/types/database";
import { RATES, PERIODS } from "@/types/database";

function getDefaultPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default function Home() {
  const router = useRouter();

  // Check authentication on client side
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const [formData, setFormData] = useState<FormData>({
    club_name: "",
    direction: "",
    section_name: "",
    supervisor_name: "",
    period: getDefaultPeriod(),
    rate: "1",
    norm_capacity_people: "",
    actual_age_14_17: "",
    actual_age_18_35: "",
    norm_capacity_families: "",
    actual_families: "",
    norm_mso: "",
    mso_age_14_17: "",
    mso_age_18_35: "",
    notes: "",
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>(getDefaultPeriod());
  const [availablePeriods, setAvailablePeriods] = useState<string[]>(PERIODS);
  const [periodInputValue, setPeriodInputValue] = useState<string>("");
  const [data, setData] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Combo box options
  const [clubs, setClubs] = useState<string[]>([]);
  const [directions, setDirections] = useState<string[]>([]);
  const [sections, setSections] = useState<{ name: string; supervisor: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // User session
  const [userEmail, setUserEmail] = useState<string>("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Get email from localStorage
    const email = localStorage.getItem("user_email");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  // Load combo options on mount
  useEffect(() => {
    loadComboOptions();
  }, []);

  // Load report data when period changes
  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod]);

  // Load sections when direction changes
  useEffect(() => {
    if (formData.direction) {
      loadSections(formData.direction);
      setFormData(prev => ({ ...prev, section_name: "", supervisor_name: "" }));
    }
  }, [formData.direction]);

  // Auto-fill supervisor when section changes
  useEffect(() => {
    if (formData.section_name && sections.length > 0) {
      const section = sections.find(s => s.name === formData.section_name);
      if (section) {
        setFormData(prev => ({ ...prev, supervisor_name: section.supervisor }));
      }
    }
  }, [formData.section_name, sections]);

  const loadComboOptions = async () => {
    try {
      setLoadingOptions(true);
      const [clubRes, dirRes] = await Promise.all([
        fetch("/api/combo-options?type=clubs"),
        fetch("/api/combo-options?type=directions"),
      ]);

      if (clubRes.ok) {
        const clubData = await clubRes.json();
        setClubs(clubData.options || []);
      }

      if (dirRes.ok) {
        const dirData = await dirRes.json();
        setDirections(dirData.options || []);
      }
    } catch (err) {
      console.error("Error loading combo options:", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadSections = async (direction: string) => {
    try {
      const res = await fetch(`/api/combo-options?type=sections&direction=${encodeURIComponent(direction)}`);
      if (res.ok) {
        const data = await res.json();
        setSections(data.options || []);
      }
    } catch (err) {
      console.error("Error loading sections:", err);
    }
  };

  const loadData = async (period: string) => {
    try {
      const res = await fetch(`/api/report?period=${period}`);
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

  const handleAddClub = async (value: string) => {
    try {
      const res = await fetch("/api/combo-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clubs", value }),
      });

      if (res.ok) {
        await loadComboOptions();
        return true;
      } else if (res.status === 409) {
        return false;
      }
      return false;
    } catch (err) {
      console.error("Error adding club:", err);
      return false;
    }
  };

  const handleAddSection = async (value: string) => {
    try {
      const res = await fetch("/api/combo-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sections",
          value,
          direction: formData.direction,
          supervisor: formData.supervisor_name,
        }),
      });

      if (res.ok) {
        if (formData.direction) {
          await loadSections(formData.direction);
        }
        return true;
      } else if (res.status === 409) {
        return false;
      }
      return false;
    } catch (err) {
      console.error("Error adding section:", err);
      return false;
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
        setFormData(prev => ({
          ...prev,
          club_name: "",
          direction: "",
          section_name: "",
          supervisor_name: "",
          rate: "1",
          norm_capacity_people: "",
          actual_age_14_17: "",
          actual_age_18_35: "",
          norm_capacity_families: "",
          actual_families: "",
          norm_mso: "",
          mso_age_14_17: "",
          mso_age_18_35: "",
          notes: "",
        }));
        loadData(selectedPeriod);
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

  const handleLogout = async () => {
    setLoggingOut(true);
    const success = await logout();
    if (success) {
      router.push("/login");
    } else {
      setLoggingOut(false);
      setMessage("❌ Ошибка выхода");
    }
  };

  const downloadExcel = () => {
    try {
      if (data.length === 0) {
        setMessage("⚠️ Нет данных за выбранный период!");
        return;
      }

      const today = new Date().toLocaleDateString('ru-RU');

      // === ЛИСТ 1: Данные ===
      const sheet1Data: (string | number)[][] = [];

      // Первая строка заголовков (основные категории)
      sheet1Data.push([
        "№ п/п",
        `ФИО работника\n(Сведения на ${today})`,
        "Подразделение",
        "Название кружка, секции, клубного формирования",
        "Нагрузка",
        "Норма наполняемости",
        "Количество кружков",
        "Направление работы",
        "Количество занимающихся",
        "",
        "",
        "Примечание",
      ]);

      // Вторая строка заголовков (подзаголовки)
      sheet1Data.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "14-18 лет",
        "18-35 лет",
        "молодая семья",
        "",
      ]);

      let rowNum = 1;
      let totalRate = 0;
      let totalSections = 0;
      let totalAge14_17 = 0;
      let totalAge18_35 = 0;
      let totalFamilies = 0;

      data.forEach((row: Report) => {
        const safeRate = Number(row.rate) || 0;
        const safeNormPeople = Number(row.norm_capacity_people) || 0;
        const safeAge14_17 = Number(row.actual_age_14_17) || 0;
        const safeAge18_35 = Number(row.actual_age_18_35) || 0;
        const safeFamilies = Number(row.actual_families) || 0;

        sheet1Data.push([
          rowNum++,
          row.supervisor_name || "",
          row.club_name || "",
          row.section_name || "",
          safeRate,
          safeNormPeople,
          1,
          row.direction || "",
          safeAge14_17,
          safeAge18_35,
          safeFamilies,
          row.notes || "",
        ]);

        totalRate += safeRate;
        totalSections += 1;
        totalAge14_17 += safeAge14_17;
        totalAge18_35 += safeAge18_35;
        totalFamilies += safeFamilies;
      });

      sheet1Data.push([
        "Итого",
        "",
        "",
        "",
        totalRate,
        "",
        totalSections,
        "",
        totalAge14_17,
        totalAge18_35,
        totalFamilies,
        "",
      ]);

      // === ЛИСТ 2: Итоги по клубам ===
      const sheet2Data: (string | number)[][] = [];

      sheet2Data.push([
        "№ п/п",
        "Название клуба",
        "Количество кружков",
        "Нагрузка (общая)",
        "Норма занимающихся (общая)",
        "Количество занимающихся",
        "Количество семей",
        "Норма МСО",
        "МСО фактическое",
        "Примечание",
      ]);

      let clubNum = 1;
      summary.forEach((club) => {
        sheet2Data.push([
          clubNum++,
          club.club_name || "",
          club.total_sections || 0,
          Number(club.total_rate) || 0,
          Number(club.total_norm_people) || 0,
          Number(club.total_people) || 0,
          Number(club.total_families) || 0,
          Number(club.total_norm_mso) || 0,
          Number(club.total_mso) || 0,
          club.notes || "",
        ]);
      });

      const wb = utils.book_new();
      const ws1 = utils.aoa_to_sheet(sheet1Data);

      // Установка ширины колонок для лучшей читаемости
      ws1['!cols'] = [
        { wch: 8 },  // № п/п
        { wch: 25 }, // ФИО
        { wch: 15 }, // Подразделение
        { wch: 30 }, // Название кружка
        { wch: 10 }, // Нагрузка
        { wch: 15 }, // Норма
        { wch: 12 }, // Кол-во кружков
        { wch: 15 }, // Направление
        { wch: 15 }, // 14-18
        { wch: 15 }, // 18-35
        { wch: 15 }, // Семья
        { wch: 20 }, // Примечание
      ];

      // Установка высоты строк для заголовков
      ws1['!rows'] = [
        { hpx: 40 },  // Высота первой строки заголовков
        { hpx: 30 },  // Высота второй строки заголовков
      ];

      // Применяем стиль к заголовкам (первые 2 строки)
      const headerStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };

      // Стилизуем первую и вторую строку (заголовки)
      for (let col = 0; col < sheet1Data[0].length; col++) {
        const cell1 = utils.encode_cell({ r: 0, c: col });
        const cell2 = utils.encode_cell({ r: 1, c: col });
        if (!ws1[cell1]) ws1[cell1] = { v: '', t: 's' };
        if (!ws1[cell2]) ws1[cell2] = { v: '', t: 's' };
        ws1[cell1].s = headerStyle;
        ws1[cell2].s = headerStyle;
      }

      // Добавляем объединение ячеек для заголовков
      ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },  // № п/п
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },  // ФИО
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },  // Подразделение
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },  // Название кружка
        { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },  // Нагрузка
        { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },  // Норма наполняемости
        { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } },  // Кол-во кружков
        { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } },  // Направление работы
        { s: { r: 0, c: 8 }, e: { r: 0, c: 10 } }, // Количество занимающихся (объединяет 3 подколонки)
        { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } } // Примечание
      ];

      utils.book_append_sheet(wb, ws1, "Данные");

      const ws2 = utils.aoa_to_sheet(sheet2Data);
      ws2['!cols'] = [
        { wch: 8 },  // № п/п
        { wch: 20 }, // Название клуба
        { wch: 12 }, // Кол-во кружков
        { wch: 15 }, // Нагрузка
        { wch: 15 }, // Норма
        { wch: 15 }, // Кол-во людей
        { wch: 12 }, // Семьи
        { wch: 12 }, // Норма МСО
        { wch: 12 }, // МСО факт
        { wch: 20 }, // Примечание
      ];

      // Применяем стиль к заголовку второго листа
      for (let col = 0; col < sheet2Data[0].length; col++) {
        const cell = utils.encode_cell({ r: 0, c: col });
        if (!ws2[cell]) ws2[cell] = { v: '', t: 's' };
        ws2[cell].s = headerStyle;
      }

      utils.book_append_sheet(wb, ws2, "Итоги по клубам");

      const filename = `Report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.xlsx`;
      writeFile(wb, filename);
      setMessage("✅ Excel скачан успешно!");
    } catch (err) {
      console.error("Excel error:", err);
      const errorMsg = err instanceof Error ? err.message : "Неизвестная ошибка";
      setMessage("❌ Ошибка при создании Excel: " + errorMsg);
    }
  };

  if (!isClient) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>⏳ Загрузка...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px", paddingBottom: "40px" }}>
      {/* User header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        padding: "10px 0",
        borderBottom: "1px solid #eee",
      }}>
        <h1 className="title" style={{ margin: 0 }}>📊 Отчётность детских кружков</h1>
        {userEmail && (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ color: "#666", fontSize: "14px" }}>👤 {userEmail}</span>
            <button
              onClick={() => router.push("/table-editor")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              📋 Редактор таблицы
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                padding: "8px 16px",
                backgroundColor: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loggingOut ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                opacity: loggingOut ? 0.7 : 1,
              }}
            >
              {loggingOut ? "⏳" : "🚪 Выход"}
            </button>
          </div>
        )}
      </div>

      {/* Выбор периода */}
      <div className="period-selector">
        <label>Выберите период для отчёта:</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          >
            {availablePeriods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="YYYY-MM"
            value={periodInputValue}
            onChange={(e) => setPeriodInputValue(e.target.value)}
            className="input"
            style={{ width: '120px' }}
            pattern="\d{4}-\d{2}"
          />
          <button
            type="button"
            onClick={() => {
              const regex = /^\d{4}-\d{2}$/;
              if (regex.test(periodInputValue) && !availablePeriods.includes(periodInputValue)) {
                setAvailablePeriods([...availablePeriods, periodInputValue].sort());
                setSelectedPeriod(periodInputValue);
                setPeriodInputValue("");
              }
            }}
            className="btn"
            style={{ padding: '8px 16px', minWidth: '80px' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Форма */}
      <div className="card">
        <h2>Внести данные</h2>
        <form onSubmit={handleSubmit} className="form">
          {loadingOptions ? (
            <p>⏳ Загрузка опций...</p>
          ) : (
            <>
              <ComboBox
                options={clubs}
                value={formData.club_name}
                onChange={(value) => setFormData({ ...formData, club_name: value })}
                onAddNew={handleAddClub}
                placeholder="Выберите или добавьте клуб"
                required
              />

              <ComboBox
                options={directions}
                value={formData.direction}
                onChange={(value) => setFormData({ ...formData, direction: value as Direction })}
                placeholder="Выберите направление"
                required
              />

              <ComboBox
                options={sections.map(s => s.name)}
                value={formData.section_name}
                onChange={(value) => setFormData({ ...formData, section_name: value })}
                onAddNew={handleAddSection}
                placeholder="Выберите или добавьте секцию"
                disabled={!formData.direction}
                required
              />

              <input
                type="text"
                placeholder="ФИО руководителя"
                value={formData.supervisor_name}
                onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                className="input"
                required
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={formData.period}
                  onChange={(e) => {
                    setFormData({ ...formData, period: e.target.value });
                    setPeriodInputValue("");
                  }}
                  className="input"
                  style={{ flex: 1 }}
                  required
                >
                  <option value="">Выберите период</option>
                  {availablePeriods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '-8px' }}>
                Или введите новый период (YYYY-MM):
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Например: 2025-01"
                  value={periodInputValue}
                  onChange={(e) => setPeriodInputValue(e.target.value)}
                  className="input"
                  style={{ flex: 1 }}
                  pattern="\d{4}-\d{2}"
                />
                <button
                  type="button"
                  onClick={() => {
                    const regex = /^\d{4}-\d{2}$/;
                    if (regex.test(periodInputValue) && !availablePeriods.includes(periodInputValue)) {
                      setAvailablePeriods([...availablePeriods, periodInputValue].sort());
                      setFormData({ ...formData, period: periodInputValue });
                      setPeriodInputValue("");
                    }
                  }}
                  className="btn"
                  style={{ padding: '8px 16px', minWidth: '100px' }}
                >
                  Добавить
                </button>
              </div>

              <select
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="input"
                required
              >
                <option value="">Выберите ставку</option>
                {RATES.map(rate => (
                  <option key={rate} value={rate}>{rate}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Норма наполняемости (чел.)"
                value={formData.norm_capacity_people}
                onChange={(e) => setFormData({ ...formData, norm_capacity_people: e.target.value })}
                className="input"
                min="0"
                step="0.01"
              />

              <div className="form-row">
                <label>Фактическое кол-во занимающихся (чел.)</label>
                <div className="form-row-inner">
                  <input
                    type="number"
                    placeholder="14-17 лет"
                    value={formData.actual_age_14_17}
                    onChange={(e) => setFormData({ ...formData, actual_age_14_17: e.target.value })}
                    className="input"
                    min="0"
                    required
                  />
                  <input
                    type="number"
                    placeholder="18-35 лет"
                    value={formData.actual_age_18_35}
                    onChange={(e) => setFormData({ ...formData, actual_age_18_35: e.target.value })}
                    className="input"
                    min="0"
                    required
                  />
                </div>
                <small className="hint">
                  Всего: {(Number(formData.actual_age_14_17) || 0) + (Number(formData.actual_age_18_35) || 0)} чел.
                </small>
              </div>

              <input
                type="number"
                placeholder="Норма наполняемости (семьи)"
                value={formData.norm_capacity_families}
                onChange={(e) => setFormData({ ...formData, norm_capacity_families: e.target.value })}
                className="input"
                min="0"
              />

              <input
                type="number"
                placeholder="Факт (семьи)"
                value={formData.actual_families}
                onChange={(e) => setFormData({ ...formData, actual_families: e.target.value })}
                className="input"
                min="0"
              />

              <input
                type="number"
                placeholder="Норма МСО"
                value={formData.norm_mso}
                onChange={(e) => setFormData({ ...formData, norm_mso: e.target.value })}
                className="input"
                min="0"
              />

              <div className="form-row">
                <label>МСО фактическое</label>
                <div className="form-row-inner">
                  <input
                    type="number"
                    placeholder="14-17 лет"
                    value={formData.mso_age_14_17}
                    onChange={(e) => setFormData({ ...formData, mso_age_14_17: e.target.value })}
                    className="input"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="18-35 лет"
                    value={formData.mso_age_18_35}
                    onChange={(e) => setFormData({ ...formData, mso_age_18_35: e.target.value })}
                    className="input"
                    min="0"
                  />
                </div>
                <small className="hint">
                  Всего МСО: {(Number(formData.mso_age_14_17) || 0) + (Number(formData.mso_age_18_35) || 0)}
                </small>
              </div>

              <textarea
                placeholder="Примечание"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input textarea"
                rows={3}
              />

              <button type="submit" disabled={loading} className={loading ? "btn-disabled" : "btn"}>
                {loading ? "..." : "Отправить"}
              </button>
            </>
          )}
        </form>
        {message && <p className="msg">{message}</p>}
      </div>

      {/* Экспорт и сводка */}
      <div className="card">
        <h2>📈 Итоги за {selectedPeriod}</h2>
        <button onClick={downloadExcel} className="excel-btn">
          📥 Скачать Excel за {selectedPeriod}
        </button>
        {summary.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Клуб</th>
                <th>Кружков</th>
                <th>Нагрузка</th>
                <th>Норма</th>
                <th>Люди</th>
                <th>Семьи</th>
                <th>МСО норма</th>
                <th>МСО факт</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((club) => (
                <tr key={club.club_name}>
                  <td>{club.club_name}</td>
                  <td>{club.total_sections}</td>
                  <td>{club.total_rate}</td>
                  <td>{club.total_norm_people}</td>
                  <td>{club.total_people}</td>
                  <td>{club.total_families}</td>
                  <td>{club.total_norm_mso}</td>
                  <td>{club.total_mso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Нет данных за выбранный период</p>
        )}
      </div>

      {/* Последние записи */}
      <div className="card">
        <h3>Последние записи</h3>
        <ul className="list">
          {data.slice(0, 5).map((row) => (
            <li key={row.id}>
              <b>{row.club_name}</b> • {row.direction} • {row.section_name}: 
              {row.actual_total_people} чел., МСО: {row.mso_total}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
