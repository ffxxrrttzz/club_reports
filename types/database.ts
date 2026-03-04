export interface Report {
  id: number;
  club_name: string;
  report_date: string;
  visitors: number;
  revenue: number;
  created_at: string;
}

export interface SummaryData {
  [clubName: string]: {
    visitors: number;
    revenue: number;
  };
}

export interface ApiResponse {
  raw: Report[];
  summary: SummaryData;
}
