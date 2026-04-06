const OpenAI = require('openai');

/**
 * OpenAI Structured Outputs를 활용한 AI 분석 서비스
 * 공시 데이터를 받아 고정 포맷으로 추출
 */
class AIService {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.client;
  }

  /**
   * JSON Schema for Structured Output
   * 모델에게 고정 포맷으로 추출 지시
   */
  getResponseSchema() {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'stock_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            metrics: {
              type: 'object',
              properties: {
                revenue: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      year: { type: 'string' },
                      value: { type: 'number' },
                      unit: { type: 'string' },
                    },
                    required: ['year', 'value', 'unit'],
                    additionalProperties: false,
                  },
                },
                operatingMargin: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      year: { type: 'string' },
                      value: { type: 'number' },
                      unit: { type: 'string' },
                    },
                    required: ['year', 'value', 'unit'],
                    additionalProperties: false,
                  },
                },
                operatingCashFlow: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      year: { type: 'string' },
                      value: { type: 'number' },
                      unit: { type: 'string' },
                    },
                    required: ['year', 'value', 'unit'],
                    additionalProperties: false,
                  },
                },
                capex: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      year: { type: 'string' },
                      value: { type: 'number' },
                      unit: { type: 'string' },
                    },
                    required: ['year', 'value', 'unit'],
                    additionalProperties: false,
                  },
                },
                netDebt: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      year: { type: 'string' },
                      value: { type: 'number' },
                      unit: { type: 'string' },
                    },
                    required: ['year', 'value', 'unit'],
                    additionalProperties: false,
                  },
                },
                shareCountChange: {
                  type: 'object',
                  properties: {
                    currentShares: { type: 'number' },
                    previousShares: { type: 'number' },
                    changePercent: { type: 'number' },
                    trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
                  },
                  required: ['currentShares', 'previousShares', 'changePercent', 'trend'],
                  additionalProperties: false,
                },
                treasuryStock: {
                  type: 'object',
                  properties: {
                    shares: { type: 'number' },
                    percentOfTotal: { type: 'number' },
                    recentActivity: { type: 'string' },
                  },
                  required: ['shares', 'percentOfTotal', 'recentActivity'],
                  additionalProperties: false,
                },
                dividend: {
                  type: 'object',
                  properties: {
                    dividendPerShare: { type: 'number' },
                    dividendYield: { type: 'number' },
                    payoutRatio: { type: 'number' },
                    trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
                  },
                  required: ['dividendPerShare', 'dividendYield', 'payoutRatio', 'trend'],
                  additionalProperties: false,
                },
              },
              required: [
                'revenue', 'operatingMargin', 'operatingCashFlow', 'capex',
                'netDebt', 'shareCountChange', 'treasuryStock', 'dividend',
              ],
              additionalProperties: false,
            },
            analysis: {
              type: 'object',
              properties: {
                ownerRisk: {
                  type: 'object',
                  properties: {
                    level: { type: 'string', enum: ['low', 'medium', 'high'] },
                    factors: { type: 'array', items: { type: 'string' } },
                    description: { type: 'string' },
                  },
                  required: ['level', 'factors', 'description'],
                  additionalProperties: false,
                },
                catalysts: {
                  type: 'array',
                  items: { type: 'string' },
                },
                counterArguments: {
                  type: 'array',
                  items: { type: 'string' },
                },
                summary: { type: 'string' },
              },
              required: ['ownerRisk', 'catalysts', 'counterArguments', 'summary'],
              additionalProperties: false,
            },
          },
          required: ['metrics', 'analysis'],
          additionalProperties: false,
        },
      },
    };
  }

  /**
   * Structured Output을 활용한 분석
   */
  async analyzeWithStructuredOutput(dartData) {
    const client = this.getClient();

    const systemPrompt = `당신은 한국 주식시장 전문 애널리스트입니다.
제공된 DART 공시 데이터를 분석하여 다음 항목을 정확하게 추출하고 평가하세요:

1. 재무 지표 (최근 3년):
   - 매출액 (revenue): 원 단위
   - 영업이익률 (operatingMargin): % 단위
   - 영업현금흐름 (operatingCashFlow): 원 단위
   - CAPEX: 원 단위
   - 순차입금 (netDebt): 원 단위 (순현금이면 음수)

2. 주주환원:
   - 주식수 변화: 최근 주식수, 이전 주식수, 변화율, 추세
   - 자사주: 수량, 비율, 최근 활동
   - 배당: 주당배당금, 배당수익률, 배당성향, 추세

3. 정성 분석:
   - 오너 리스크: 수준(low/medium/high), 요인, 설명
   - 촉매(catalysts): 주가 상승 트리거가 될 수 있는 요인들
   - 반대논리(counterArguments): 투자에 대한 주요 우려사항

4. 종합 평가 (summary): 2-3문장으로 핵심 투자 포인트

데이터가 부족한 경우 합리적인 추정을 하되, 확인 불가한 항목은 0 또는 빈 값으로 채우세요.`;

    const userPrompt = `다음 기업의 DART 공시 데이터를 분석해주세요:

기업명: ${dartData.company.corpName}
종목코드: ${dartData.company.stockCode}

=== 재무제표 (3년) ===
${JSON.stringify(dartData.financials3Y, null, 2)}

=== 최신 분기 보고서 ===
${JSON.stringify(dartData.latestQuarterly, null, 2)}

=== 최근 12개월 주요사항보고서 ===
${JSON.stringify(dartData.majorReports, null, 2)}`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: this.getResponseSchema(),
        temperature: 0.1,
        max_tokens: 4000,
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      // Return fallback empty analysis
      return this.getFallbackAnalysis(dartData);
    }
  }

  /**
   * API 실패 시 공시 데이터에서 직접 추출하는 폴백
   */
  getFallbackAnalysis(dartData) {
    const metrics = {
      revenue: [],
      operatingMargin: [],
      operatingCashFlow: [],
      capex: [],
      netDebt: [],
      shareCountChange: { currentShares: 0, previousShares: 0, changePercent: 0, trend: 'stable' },
      treasuryStock: { shares: 0, percentOfTotal: 0, recentActivity: 'N/A' },
      dividend: { dividendPerShare: 0, dividendYield: 0, payoutRatio: 0, trend: 'stable' },
    };

    // Extract from financial statements if available
    if (dartData.financials3Y) {
      for (const yearData of dartData.financials3Y) {
        const year = yearData.year;
        const items = yearData.items || [];

        const revenue = items.find(i =>
          i.account_nm?.includes('매출액') || i.account_nm?.includes('수익(매출액)')
        );
        const operatingProfit = items.find(i =>
          i.account_nm?.includes('영업이익')
        );

        if (revenue) {
          const revenueVal = parseFloat(revenue.thstrm_amount?.replace(/,/g, '') || '0');
          metrics.revenue.push({ year, value: revenueVal, unit: '원' });

          if (operatingProfit) {
            const opVal = parseFloat(operatingProfit.thstrm_amount?.replace(/,/g, '') || '0');
            const margin = revenueVal !== 0 ? (opVal / revenueVal) * 100 : 0;
            metrics.operatingMargin.push({ year, value: Math.round(margin * 10) / 10, unit: '%' });
          }
        }
      }
    }

    return {
      metrics,
      analysis: {
        ownerRisk: { level: 'medium', factors: ['데이터 부족으로 정확한 평가 어려움'], description: 'AI 분석 실패로 기본값 사용' },
        catalysts: ['추가 분석 필요'],
        counterArguments: ['데이터 부족'],
        summary: 'AI 분석에 실패하여 기본 재무 데이터만 추출되었습니다. 재분석을 권장합니다.',
      },
    };
  }
}

module.exports = new AIService();
