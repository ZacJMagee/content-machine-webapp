export interface GenerationResponse {
  success: boolean;
  output?: string;
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
  started_at?: string;
  completed_at?: string;
}
