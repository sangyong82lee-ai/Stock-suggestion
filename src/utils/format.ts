/**
 * 숫자를 한국식 표기로 변환 (억 단위)
 */
export function formatKRW(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_0000_0000_0000) {
    return `${sign}${(absValue / 1_0000_0000_0000).toFixed(1)}조`;
  }
  if (absValue >= 1_0000_0000) {
    return `${sign}${(absValue / 1_0000_0000).toFixed(0)}억`;
  }
  if (absValue >= 1_0000) {
    return `${sign}${(absValue / 1_0000).toFixed(0)}만`;
  }
  return `${sign}${absValue.toLocaleString()}`;
}

/**
 * 퍼센트 포맷
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * 날짜 포맷 (YYYYMMDD -> YYYY.MM.DD)
 */
export function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
  }
  if (dateStr.includes('T')) {
    return new Date(dateStr).toLocaleDateString('ko-KR');
  }
  return dateStr;
}

/**
 * 점수에 따른 등급
 */
export function getGrade(score: number): { grade: string; color: string } {
  if (score >= 85) return { grade: 'A+', color: '#00C851' };
  if (score >= 75) return { grade: 'A', color: '#00C851' };
  if (score >= 65) return { grade: 'B+', color: '#33b5e5' };
  if (score >= 55) return { grade: 'B', color: '#33b5e5' };
  if (score >= 45) return { grade: 'C+', color: '#ffbb33' };
  if (score >= 35) return { grade: 'C', color: '#ffbb33' };
  return { grade: 'D', color: '#ff4444' };
}

/**
 * 리스크 레벨 색상
 */
export function getRiskColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low': return '#00C851';
    case 'medium': return '#ffbb33';
    case 'high': return '#ff4444';
  }
}

/**
 * 트렌드 아이콘
 */
export function getTrendIcon(trend: 'increasing' | 'decreasing' | 'stable'): string {
  switch (trend) {
    case 'increasing': return '↑';
    case 'decreasing': return '↓';
    case 'stable': return '→';
  }
}
