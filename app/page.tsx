"use client";

import { useState, useEffect } from "react";
import { utils, writeFile } from "xlsx";
import type { Report, ClubSummary, FormData, Direction } from "@/types/database";
import { DIRECTIONS, RATES, PERIODS } from "@/types/database";

const CLUBS = ["Клуб А", "Клуб Б", "Клуб В"];

const SECTIONS: Record<Direction, { name: string; supervisor: string }[]> = {
  'КДН': [
    { name: "Шахматы", supervisor: "Иванов Иван Иванович" },
    { name: "Рисование", supervisor: "Петрова Анна Сергеевна" },
    { name: "Музыка", supervisor: "Сидоров Пётр Николаевич" },
  ],
  'ДПИ': [
    { name: "Керамика", supervisor: "Сидорова Мария Петровна" },
    { name: "Вышивка", supervisor: "Козлов Дмитрий Андреевич" },
    { name: "Лепка", supervisor: "Волкова Елена Сергеевна" },
  ],
  'Спортивное': [
    { name: "Футбол", supervisor: "Смирнов Алексей Владимирович" },
    { name: "Баскетбол", supervisor: "Волкова Елена Сергеевна" },
    { name: "Плавание", supervisor: "Николаев Игорь Петрович" },
  ],
  'Социальное': [
    { name: "Волонтёры", supervisor: "Николаева Ольга Петровна" },
    { name: "Помощь пожилым", supervisor: "Александрова Татьяна Ивановна" },
  ],
  'Патриотическое': [
    { name: "Юнармия", supervisor: "Петров Сергей Иванович" },
    { name: "Поисковый отряд", supervisor: "Васильев Андрей Михайлович" },
  ],
};

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    club_name: "",
    direction: "",
    section_name: "",
    supervisor_name: "",
    period: PERIODS[new Date().getMonth()],
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
    password: "",
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>(PERIODS[new Date().getMonth()]);
  const [availableSections, setAvailableSections] = useState<{ name: string; supervisor: string }[]>([]);
  const [data, setData] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod]);

  useEffect(() => {
    if (formData.direction && formData.direction in SECTIONS) {
      setAvailableSections(SECTIONS[formData.direction as Direction]);
      setFormData(prev => ({ ...prev, section_name: "", supervisor_name: "" }));
    }
  }, [formData.direction]);

  useEffect(() => {
    if (formData.section_name && availableSections.length > 0) {
      const section = availableSections.find(s => s.name === formData.section_name);
      if (section) {
        setFormData(prev => ({ ...prev, supervisor_name: section.supervisor }));
      }
    }
  }, [formData.section_name, availableSections]);

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

    const downloadExcel = () => {
    try {
      if (data.length === 0) {
        alert("⚠️ Нет данных за выбранный период!");
        return;
      }

      const today = new Date().toLocaleDateString('ru-RU');

      // === ЛИСТ 1: Данные ===
      const sheet1Data: (string | number)[][] = [];

      sheet1Data.push([
        "№ п/п",
        `ФИО работника\nСведения на ${today}`,
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
        sheet1Data.push([
          rowNum++,
          row.supervisor_name,
          row.club_name,
          row.section_name,
          row.rate,
          row.norm_capacity_people,
          1,
          row.direction,
          row.actual_age_14_17,
          row.actual_age_18_35,
          row.actual_families,
          row.notes,
        ]);

        totalRate += row.rate;
        totalSections += 1;
        totalAge14_17 += row.actual_age_14_17;
        totalAge18_35 += row.actual_age_18_35;
        totalFamilies += row.actual_families;
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
      interface ClubStats {
        club_name: string;
        total_sections: number;
        total_rate: number;
        total_norm_people: number;
        total_people: number;
        total_families: number;
        total_norm_mso: number;
        total_mso: number;
        notes: string;
      }

      const sheet2Data: (string | number)[][] = [];

      sheet2Data.push([
        "№ п/п",
        "Название клуба",
        "Количество кружков",
        "Нагрузка (общая)",
        "Норма занимающихся (общая)",
        "Количество занимающихся",
        "Количество семей",
        "",
        "",
        "Норма МСО",
        "МСО фактическое",
        "Примечание",
      ]);

      let clubNum = 1;
      summary.forEach((club: ClubStats) => {
        sheet2Data.push([
          clubNum++,
          club.club_name,
          club.total_sections,
          club.total_rate,
          club.total_norm_people,
          club.total_people,
          club.total_families,
          "",
          "",
          club.total_norm_mso,
          club.total_mso,
          club.notes,
        ]);
      });

      const wb = utils.book_new();
      const ws1 = utils.aoa_to_sheet(sheet1Data);
      utils.book_append_sheet(wb, ws1, "Данные");
      const ws2 = utils.aoa_to_sheet(sheet2Data);
      utils.book_append_sheet(wb, ws2, "Итоги по клубам");

      const filename = `Report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.xlsx`;
      writeFile(wb, filename);
      setMessage("✅ Excel скачан!");
    } catch (err) {
      console.error("Excel error:", err);
      setMessage("❌ Ошибка Excel: " + (err as Error).message);
    }
  };

  return (
    <div className="container">
      <h1 className="title">📊 Отчётность детских кружков</h1>

      {/* Выбор периода */}
      <div className="period-selector">
        <label>Выберите период для отчёта:</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="input"
        >
          {PERIODS.map(period => (
            <option key={period} value={period}>{period}</option>
          ))}
        </select>
      </div>

      {/* Форма */}
      <div className="card">
        <h2>Внести данные</h2>
        <form onSubmit={handleSubmit} className="form">
          
          <select
            value={formData.club_name}
            onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
            className="input"
            required
          >
            <option value="">Выберите клуб</option>
            {CLUBS.map(club => (
              <option key={club} value={club}>{club}</option>
            ))}
          </select>

          <select
            value={formData.direction}
            onChange={(e) => setFormData({ ...formData, direction: e.target.value as Direction })}
            className="input"
            required
          >
            <option value="">Выберите направление</option>
            {DIRECTIONS.map(dir => (
              <option key={dir} value={dir}>{dir}</option>
            ))}
          </select>

          <select
            value={formData.section_name}
            onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
            className="input"
            required
            disabled={!formData.direction}
          >
            <option value="">Выберите секцию</option>
            {availableSections.map(sec => (
              <option key={sec.name} value={sec.name}>{sec.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="ФИО руководителя"
            value={formData.supervisor_name}
            className="input"
            required
            readOnly
            style={{ backgroundColor: '#f5f5f5' }}
          />

          <select
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            className="input"
            required
          >
            <option value="">Выберите период</option>
            {PERIODS.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>

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

          <input
            type="password"
            placeholder="Пароль (club2024)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input"
            required
          />

          <button type="submit" disabled={loading} className={loading ? "btn-disabled" : "btn"}>
            {loading ? "..." : "Отправить"}
          </button>
        </form>
        {message && <p className="msg">{message}</p>}
      </div>

      {/* Экспорт и сводка */}
      <div className="card">
        <h2>📈 Итоги за {selectedPeriod}</h2>
        {summary.length > 0 ? (
          <>
            <button onClick={downloadExcel} className="excel-btn">
              📥 Скачать Excel за {selectedPeriod}
            </button>
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
          </>
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