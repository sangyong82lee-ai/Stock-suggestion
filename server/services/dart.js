const axios = require('axios');

const DART_BASE_URL = 'https://opendart.fss.or.kr/api';

/**
 * OpenDART API 서비스
 * API 문서: https://opendart.fss.or.kr
 */
class DartService {
  constructor() {
    this.apiKey = process.env.DART_API_KEY;
    this.client = axios.create({
      baseURL: DART_BASE_URL,
      timeout: 30000,
    });
    this.corpListCache = null;
    this.corpListCacheTime = 0;
  }

  getApiKey(override) {
    return override || this.apiKey;
  }

  /**
   * 기업 개황 조회
   */
  async getCompanyInfo(corpCode) {
    const { data } = await this.client.get('/company.json', {
      params: {
        crtfc_key: this.getApiKey(),
        corp_code: corpCode,
      },
    });
    return data;
  }

  /**
   * 고유번호로 기업 목록 조회 (DART 기업코드 파일 활용)
   * 실제 운영시에는 corpCode.xml 파일을 다운로드하여 사용
   */
  async getCompanyList(market) {
    // Cache for 1 hour
    if (this.corpListCache && Date.now() - this.corpListCacheTime < 3600000) {
      return this.filterByMarket(this.corpListCache, market);
    }

    try {
      // 상장기업 목록 조회 (주요 상장 기업)
      const { data } = await this.client.get('/corpCode.xml', {
        params: { crtfc_key: this.getApiKey() },
        responseType: 'text',
      });

      // Parse XML to extract listed companies
      const companies = this.parseCorpCodeXml(data);
      this.corpListCache = companies;
      this.corpListCacheTime = Date.now();

      return this.filterByMarket(companies, market);
    } catch (error) {
      console.error('Failed to fetch company list:', error.message);
      // Return sample data for development
      return this.getSampleCompanies();
    }
  }

  parseCorpCodeXml(xmlData) {
    // Simple XML parsing for corp_code entries
    const companies = [];
    const regex = /<list>[\s\S]*?<corp_code>(\d+)<\/corp_code>[\s\S]*?<corp_name>(.*?)<\/corp_name>[\s\S]*?<stock_code>(.*?)<\/stock_code>[\s\S]*?<\/list>/g;

    let match;
    while ((match = regex.exec(xmlData)) !== null) {
      const stockCode = match[3].trim();
      if (stockCode) { // Only listed companies
        companies.push({
          corpCode: match[1],
          corpName: match[2].trim(),
          stockCode: stockCode,
        });
      }
    }

    return companies;
  }

  filterByMarket(companies, market) {
    if (!market || market === 'all') return companies;
    // Market filtering would require additional data
    return companies;
  }

  /**
   * 기업 검색
   */
  async searchCompanies(query) {
    const allCompanies = await this.getCompanyList('all');
    if (!query) return allCompanies.slice(0, 50);

    return allCompanies.filter(
      c => c.corpName.includes(query) || c.stockCode.includes(query)
    ).slice(0, 50);
  }

  /**
   * 기업의 전체 공시 데이터 수집
   * - 최근 3년 사업보고서
   * - 최신 분기보고서
   * - 최근 12개월 주요사항보고서
   */
  async getCompanyData(corpCode) {
    const currentYear = new Date().getFullYear();

    // Parallel fetch all required data
    const [
      companyInfo,
      financials3Y,
      latestQuarterly,
      majorReports,
    ] = await Promise.all([
      this.getCompanyInfo(corpCode).catch(() => null),
      this.getFinancialStatements(corpCode, currentYear - 3, currentYear - 1),
      this.getLatestQuarterlyReport(corpCode, currentYear),
      this.getMajorReports(corpCode),
    ]);

    const company = {
      corpCode,
      corpName: companyInfo?.corp_name || 'Unknown',
      stockCode: companyInfo?.stock_code || '',
      sector: companyInfo?.induty_code || '',
      market: companyInfo?.corp_cls === 'Y' ? 'KOSPI' : 'KOSDAQ',
    };

    return {
      company,
      financials3Y,
      latestQuarterly,
      majorReports,
      rawData: { companyInfo },
    };
  }

  /**
   * 3년간 재무제표 조회
   */
  async getFinancialStatements(corpCode, startYear, endYear) {
    const results = [];

    for (let year = startYear; year <= endYear; year++) {
      try {
        const { data } = await this.client.get('/fnlttSinglAcnt.json', {
          params: {
            crtfc_key: this.getApiKey(),
            corp_code: corpCode,
            bsns_year: String(year),
            reprt_code: '11011', // 사업보고서
            fs_div: 'CFS', // 연결재무제표
          },
        });

        if (data.status === '000' && data.list) {
          results.push({
            year: String(year),
            items: data.list,
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch financials for ${corpCode} year ${year}:`, error.message);
      }
    }

    return results;
  }

  /**
   * 최신 분기보고서 조회
   */
  async getLatestQuarterlyReport(corpCode, year) {
    // Try quarterly reports in reverse order: Q3, Q2, Q1
    const quarterCodes = ['11014', '11012', '11013']; // 3분기, 반기, 1분기

    for (const code of quarterCodes) {
      try {
        const { data } = await this.client.get('/fnlttSinglAcnt.json', {
          params: {
            crtfc_key: this.getApiKey(),
            corp_code: corpCode,
            bsns_year: String(year),
            reprt_code: code,
            fs_div: 'CFS',
          },
        });

        if (data.status === '000' && data.list) {
          return { year: String(year), quarter: code, items: data.list };
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * 최근 12개월 주요사항보고서 조회
   */
  async getMajorReports(corpCode) {
    const endDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0].replace(/-/g, '');

    try {
      const { data } = await this.client.get('/list.json', {
        params: {
          crtfc_key: this.getApiKey(),
          corp_code: corpCode,
          bgn_de: startDate,
          end_de: endDate,
          pblntf_ty: 'D', // 주요사항보고
          page_count: 100,
        },
      });

      if (data.status === '000' && data.list) {
        return data.list;
      }
    } catch (error) {
      console.warn(`Failed to fetch major reports for ${corpCode}:`, error.message);
    }

    return [];
  }

  /**
   * 개발용 샘플 기업 데이터
   */
  getSampleCompanies() {
    return [
      { corpCode: '00126380', corpName: '삼성전자', stockCode: '005930', market: 'KOSPI' },
      { corpCode: '00164779', corpName: 'SK하이닉스', stockCode: '000660', market: 'KOSPI' },
      { corpCode: '00104299', corpName: 'LG에너지솔루션', stockCode: '373220', market: 'KOSPI' },
      { corpCode: '00159500', corpName: '현대자동차', stockCode: '005380', market: 'KOSPI' },
      { corpCode: '00164742', corpName: 'NAVER', stockCode: '035420', market: 'KOSPI' },
      { corpCode: '00356361', corpName: '카카오', stockCode: '035720', market: 'KOSPI' },
      { corpCode: '00126186', corpName: 'POSCO홀딩스', stockCode: '005490', market: 'KOSPI' },
      { corpCode: '00131054', corpName: '삼성바이오로직스', stockCode: '207940', market: 'KOSPI' },
      { corpCode: '00145561', corpName: '셀트리온', stockCode: '068270', market: 'KOSPI' },
      { corpCode: '00126308', corpName: '기아', stockCode: '000270', market: 'KOSPI' },
    ];
  }
}

module.exports = new DartService();
