export type ScannerType = "checkov" | "mock";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FindingStatus = "FAILED" | "PASSED" | "SKIPPED";

export interface ComplianceFinding {
  id: string;
  title: string;
  status: FindingStatus;
  severity: Severity;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  message: string;
  remediation?: string;
}

export interface ComplianceSummary {
  filesScanned: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  highestSeverity?: Severity;
}

export interface ComplianceReport {
  repoUrl: string;
  ref?: string;
  subpath?: string;
  scanner: ScannerType;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  summary: ComplianceSummary;
  findings: ComplianceFinding[];
}

export interface ScanApiRequest {
  repoUrl: string;
  ref?: string;
  subpath?: string;
  scanner?: ScannerType;
}

export type ScanErrorCode =
  | "INVALID_URL"
  | "CLONE_FAILED"
  | "NO_TERRAFORM"
  | "SCAN_FAILED"
  | "TIMEOUT"
  | "NETWORK_ERROR";

export type ScanApiResponse =
  | { ok: true; report: ComplianceReport }
  | { ok: false; error: { code: ScanErrorCode; message: string } };

