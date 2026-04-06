import axios, { AxiosInstance } from 'axios';
import { Company, ScoreCard, ScreeningJob, AppSettings, DEFAULT_SETTINGS } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  private client: AxiosInstance;
  private settings: AppSettings = DEFAULT_SETTINGS;

  constructor() {
    this.client = axios.create({
      timeout: 60000,
    });
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem('app_settings');
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        this.updateBaseUrl();
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  private updateBaseUrl() {
    this.client.defaults.baseURL = this.settings.serverUrl;
  }

  async updateSettings(settings: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...settings };
    this.updateBaseUrl();
    await AsyncStorage.setItem('app_settings', JSON.stringify(this.settings));
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  // === Company APIs ===

  async searchCompanies(query: string): Promise<Company[]> {
    const { data } = await this.client.get('/api/companies/search', {
      params: { q: query },
    });
    return data;
  }

  async getCompanyList(market?: string): Promise<Company[]> {
    const { data } = await this.client.get('/api/companies', {
      params: { market: market || this.settings.market },
    });
    return data;
  }

  // === Screening APIs ===

  async startScreening(corpCodes?: string[]): Promise<ScreeningJob> {
    const { data } = await this.client.post('/api/screening/start', {
      corpCodes,
      market: this.settings.market,
      maxCompanies: this.settings.maxCompanies,
    });
    return data;
  }

  async getScreeningStatus(jobId: string): Promise<ScreeningJob> {
    const { data } = await this.client.get(`/api/screening/status/${jobId}`);
    return data;
  }

  async getScreeningResults(): Promise<ScoreCard[]> {
    const { data } = await this.client.get('/api/screening/results');
    return data;
  }

  // === Individual Company Analysis ===

  async analyzeCompany(corpCode: string): Promise<ScoreCard> {
    const { data } = await this.client.post('/api/analyze', { corpCode });
    return data;
  }

  // === Health Check ===

  async checkServerHealth(): Promise<boolean> {
    try {
      const { data } = await this.client.get('/api/health');
      return data.status === 'ok';
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
