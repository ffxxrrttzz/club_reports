// Направления кружков
export type Direction = 'КДН' | 'ДПИ' | 'Спортивное' | 'Социальное' | 'Патриотическое';

export const DIRECTIONS: Direction[] = [
  'КДН',
  'ДПИ',
  'Спортивное',
  'Социальное',
  'Патриотическое',
];

// Ставки
export const RATES = [0, 0.25, 0.5, 0.75, 1];

// Периоды (месяцы)
export const PERIODS = [
  '2024-01', '2024-02', '2024-03',
  '2024-04', '2024-05', '2024-06',
  '2024-07', '2024-08', '2024-09',
  '2024-10', '2024-11', '2024-12',
];

// Данные отчёта
export interface Report {
  id: number;
  club_name: string;
  direction: Direction;
  section_name: string;
  supervisor_name: string;
  period: string;
  rate: number;
  norm_capacity_people: number;
  actual_age_14_17: number;
  actual_age_18_35: number;
  actual_total_people: number;
  norm_capacity_families: number;
  actual_families: number;
  norm_mso: number;
  mso_age_14_17: number;
  mso_age_18_35: number;
  mso_total: number;
  notes: string;
  created_at: string;
}

// Сводка по клубам
export interface ClubSummary {
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

// Ответ API
export interface ApiResponse {
  raw: Report[];
  summary: ClubSummary[];
}

// Форма ввода
export interface FormData {
  club_name: string;
  direction: Direction | '';
  section_name: string;
  supervisor_name: string;
  period: string;
  rate: string;
  norm_capacity_people: string;
  actual_age_14_17: string;
  actual_age_18_35: string;
  norm_capacity_families: string;
  actual_families: string;
  norm_mso: string;
  mso_age_14_17: string;
  mso_age_18_35: string;
  notes: string;
  password: string;
}