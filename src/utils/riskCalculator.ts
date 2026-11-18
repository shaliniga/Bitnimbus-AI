import type { ContractDocument } from '../types/contract';
import type { Finding, FindingSeverity, FindingReviewState } from '../types/finding';

export interface SectionRiskMetric {
  sectionId: string;
  sectionNumber: string | null;
  sectionHeading: string;
  totalFindings: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  hasUnresolved: boolean;
  maxSeverity: FindingSeverity | null;
}

export interface RiskAnalytics {
  initialRiskScore: number; // 0 - 100
  residualRiskScore: number; // 0 - 100
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  totalFindings: number;
  pendingCount: number;
  acceptedCount: number;
  dismissedCount: number;
  completionPercentage: number;
  severityCounts: Record<FindingSeverity, number>;
  unresolvedSeverityCounts: Record<FindingSeverity, number>;
  categoryCounts: Record<string, number>;
  sectionMetrics: SectionRiskMetric[];
  documentWideFindings: Finding[];
}

const SEVERITY_BASE_POINTS: Record<FindingSeverity, number> = {
  high: 10,
  medium: 5,
  low: 2,
};

export function calculateRiskAnalytics(
  contract: ContractDocument,
  findings: Finding[],
  reviews: Record<string, FindingReviewState>
): RiskAnalytics {
  let totalWeightedInitialPoints = 0;
  let totalWeightedResidualPoints = 0;

  const severityCounts: Record<FindingSeverity, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  const unresolvedSeverityCounts: Record<FindingSeverity, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  const categoryCounts: Record<string, number> = {};
  let pendingCount = 0;
  let acceptedCount = 0;
  let dismissedCount = 0;

  const documentWideFindings: Finding[] = [];

  // Map paragraphs to sections for fast lookup
  const paragraphToSectionMap = new Map<string, string>();
  for (const sec of contract.sections) {
    for (const p of sec.paragraphs) {
      paragraphToSectionMap.set(p.id, sec.id);
    }
  }

  // Section metrics initialization
  const sectionMetricsMap = new Map<string, SectionRiskMetric>();
  for (const sec of contract.sections) {
    sectionMetricsMap.set(sec.id, {
      sectionId: sec.id,
      sectionNumber: sec.number,
      sectionHeading: sec.heading,
      totalFindings: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      hasUnresolved: false,
      maxSeverity: null,
    });
  }

  for (const finding of findings) {
    const review = reviews[finding.id] || { status: 'pending', notes: [] };
    const basePoints = SEVERITY_BASE_POINTS[finding.severity] * (finding.confidence || 0.8);

    totalWeightedInitialPoints += basePoints;

    severityCounts[finding.severity] = (severityCounts[finding.severity] || 0) + 1;
    categoryCounts[finding.category] = (categoryCounts[finding.category] || 0) + 1;

    if (review.status === 'accepted') {
      acceptedCount++;
      // Accepted / mitigated findings reduce risk completely
    } else if (review.status === 'dismissed') {
      dismissedCount++;
      // Dismissed findings were reviewed; minimal residual risk retained for audit
      totalWeightedResidualPoints += basePoints * 0.15;
    } else {
      pendingCount++;
      unresolvedSeverityCounts[finding.severity] =
        (unresolvedSeverityCounts[finding.severity] || 0) + 1;
      totalWeightedResidualPoints += basePoints;
    }

    // Assign to section or document-wide
    if (!finding.anchor) {
      documentWideFindings.push(finding);
    } else {
      const secId = paragraphToSectionMap.get(finding.anchor.paragraphId);
      if (secId && sectionMetricsMap.has(secId)) {
        const metric = sectionMetricsMap.get(secId)!;
        metric.totalFindings++;
        if (finding.severity === 'high') metric.highCount++;
        else if (finding.severity === 'medium') metric.mediumCount++;
        else if (finding.severity === 'low') metric.lowCount++;

        if (review.status === 'pending') {
          metric.hasUnresolved = true;
        }

        if (
          !metric.maxSeverity ||
          SEVERITY_BASE_POINTS[finding.severity] > SEVERITY_BASE_POINTS[metric.maxSeverity]
        ) {
          metric.maxSeverity = finding.severity;
        }
      }
    }
  }

  const totalFindings = findings.length;
  const completionPercentage =
    totalFindings > 0 ? Math.round(((acceptedCount + dismissedCount) / totalFindings) * 100) : 0;

  // Normalized scores out of 100
  // Benchmark maximum theoretical risk for ~24 findings with typical distributions
  const theoreticalBenchmark = findings.length * 7.5;
  const initialRiskScore = Math.min(
    100,
    Math.round((totalWeightedInitialPoints / theoreticalBenchmark) * 100)
  );
  const residualRiskScore = Math.min(
    100,
    Math.round((totalWeightedResidualPoints / theoreticalBenchmark) * 100)
  );

  let riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low' = 'Low';
  if (residualRiskScore >= 75) riskLevel = 'Critical';
  else if (residualRiskScore >= 50) riskLevel = 'High';
  else if (residualRiskScore >= 25) riskLevel = 'Moderate';

  return {
    initialRiskScore,
    residualRiskScore,
    riskLevel,
    totalFindings,
    pendingCount,
    acceptedCount,
    dismissedCount,
    completionPercentage,
    severityCounts,
    unresolvedSeverityCounts,
    categoryCounts,
    sectionMetrics: Array.from(sectionMetricsMap.values()),
    documentWideFindings,
  };
}
