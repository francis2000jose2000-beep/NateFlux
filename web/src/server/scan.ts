import { execFile } from "child_process";
import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { normalizePublicGithubRepoUrl } from "@/shared/github";
import type { ComplianceFinding, ComplianceReport, Severity, ScannerType } from "@/shared/scanTypes";

const execFileAsync = promisify(execFile);

export function resolveSubpathSafe(repoDir: string, subpath?: string) {
  if (!subpath) return repoDir;
  const target = path.resolve(repoDir, subpath);
  const base = path.resolve(repoDir);
  if (!target.startsWith(base + path.sep) && target !== base) return null;
  return target;
}

async function findTerraformFiles(dir: string) {
  const out: string[] = [];

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        if (
          e.name === ".git" ||
          e.name === "node_modules" ||
          e.name === ".terraform" ||
          e.name === "dist" ||
          e.name === "build"
        ) {
          continue;
        }
        await walk(path.join(current, e.name));
        continue;
      }

      if (e.isFile() && e.name.toLowerCase().endsWith(".tf")) {
        out.push(path.join(current, e.name));
      }
    }
  }

  await walk(dir);
  return out;
}

function highestSeverity(findings: ComplianceFinding[]): Severity | undefined {
  const order: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  let best = -1;
  for (const f of findings) {
    const idx = order.indexOf(f.severity);
    if (idx > best) best = idx;
  }
  return best >= 0 ? order[best] : undefined;
}

function summarize(findings: ComplianceFinding[], filesScanned: number) {
  const total = findings.length;
  const passed = findings.filter((f) => f.status === "PASSED").length;
  const failed = findings.filter((f) => f.status === "FAILED").length;
  const skipped = findings.filter((f) => f.status === "SKIPPED").length;
  return { filesScanned, total, passed, failed, skipped, highestSeverity: highestSeverity(findings) };
}

type ExecResult = { stdout: string; stderr: string };

async function execFileSafe(
  file: string,
  args: string[],
  opts: { cwd?: string; timeoutMs: number; maxBuffer?: number }
): Promise<ExecResult> {
  const maxBuffer = opts.maxBuffer ?? 20 * 1024 * 1024;
  const { stdout, stderr } = await execFileAsync(file, args, {
    cwd: opts.cwd,
    timeout: opts.timeoutMs,
    windowsHide: true,
    maxBuffer,
  });
  return { stdout: String(stdout ?? ""), stderr: String(stderr ?? "") };
}

export async function scanRepository(input: {
  repoUrl: string;
  ref?: string;
  subpath?: string;
  scanner?: ScannerType;
  timeouts?: { cloneMs?: number; scanMs?: number };
}): Promise<ComplianceReport> {
  const startedAt = new Date();
  const normalized = normalizePublicGithubRepoUrl(input.repoUrl);
  if (!normalized) {
    throw new ScanError("INVALID_URL", "Provide a public GitHub HTTPS repo URL.");
  }

  const cloneMs = input.timeouts?.cloneMs ?? 45_000;
  const scanMs = input.timeouts?.scanMs ?? 90_000;
  const requestedScanner: ScannerType = input.scanner ?? "mock";
  const tempBase = await fs.mkdtemp(path.join(os.tmpdir(), "tfcc-"));
  const repoDir = path.join(tempBase, "repo");

  const repoDisplay = normalized.normalizedRepoUrl;
  let scannerUsed: ScannerType = requestedScanner;

  try {
    const cloneArgs = ["clone", "--depth", "1", "--no-tags", "--single-branch"];
    if (input.ref) {
      cloneArgs.push("--branch", input.ref);
    }
    cloneArgs.push(normalized.normalizedRepoUrl, repoDir);

    try {
      await execFileSafe("git", cloneArgs, { timeoutMs: cloneMs });
    } catch (e) {
      if (input.ref) {
        const fallbackArgs = ["clone", "--depth", "1", "--no-tags", normalized.normalizedRepoUrl, repoDir];
        try {
          await execFileSafe("git", fallbackArgs, { timeoutMs: cloneMs });
          await execFileSafe("git", ["-C", repoDir, "checkout", input.ref], { timeoutMs: cloneMs });
        } catch (e2) {
          if (isTimeoutError(e) || isTimeoutError(e2)) {
            throw new ScanError("TIMEOUT", "Repository clone timed out.");
          }
          throw new ScanError("CLONE_FAILED", "Failed to clone the repository.");
        }
      } else {
        if (isTimeoutError(e)) throw new ScanError("TIMEOUT", "Repository clone timed out.");
        throw new ScanError("CLONE_FAILED", "Failed to clone the repository.");
      }
    }

    const scanDir = resolveSubpathSafe(repoDir, input.subpath);
    if (!scanDir) throw new ScanError("INVALID_URL", "Invalid subpath.");

    const tfFiles = await findTerraformFiles(scanDir);
    if (tfFiles.length === 0) {
      throw new ScanError("NO_TERRAFORM", "No Terraform (.tf) files were found in this repository.");
    }

    let findings: ComplianceFinding[] = [];

    if (requestedScanner === "checkov") {
      try {
        const { stdout } = await execFileSafe(
          "checkov",
          ["-d", scanDir, "--output", "json"],
          { timeoutMs: scanMs }
        );
        findings = mapCheckovJsonToFindings(stdout);
      } catch (e) {
        if (isCommandNotFound(e)) {
          scannerUsed = "mock";
          findings = await runMockScan(tfFiles, scanDir);
        } else if (isTimeoutError(e)) {
          throw new ScanError("TIMEOUT", "Scan timed out.");
        } else {
          throw new ScanError("SCAN_FAILED", "Scan failed.");
        }
      }
    } else {
      findings = await runMockScan(tfFiles, scanDir);
    }

    const finishedAt = new Date();
    return {
      repoUrl: repoDisplay,
      ref: input.ref,
      subpath: input.subpath,
      scanner: scannerUsed,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      summary: summarize(findings, tfFiles.length),
      findings,
    };
  } finally {
    await fs.rm(tempBase, { recursive: true, force: true });
  }
}

function isTimeoutError(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const e = err as { killed?: boolean; signal?: string; code?: string };
  return e.killed === true || e.signal === "SIGTERM" || e.code === "ETIMEDOUT";
}

function isCommandNotFound(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string };
  return e.code === "ENOENT";
}

export class ScanError extends Error {
  public readonly code: "INVALID_URL" | "CLONE_FAILED" | "NO_TERRAFORM" | "SCAN_FAILED" | "TIMEOUT";

  constructor(code: ScanError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function safeJsonParse(input: string): unknown | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

type CheckovCheck = {
  check_id?: unknown;
  check_name?: unknown;
  file_path?: unknown;
  file_line_range?: unknown;
  severity?: unknown;
  description?: unknown;
  guideline?: unknown;
};

type CheckovResults = {
  failed_checks?: unknown;
  passed_checks?: unknown;
  skipped_checks?: unknown;
};

type CheckovOutput = {
  results?: unknown;
};

function isCheckovCheckArray(value: unknown): value is CheckovCheck[] {
  return Array.isArray(value);
}

function mapCheckovJsonToFindings(stdout: string): ComplianceFinding[] {
  const parsed = safeJsonParse(stdout);
  if (!parsed || typeof parsed !== "object") {
    return [
      {
        id: "CHECKOV_PARSE_ERROR",
        title: "Checkov output could not be parsed",
        status: "FAILED",
        severity: "MEDIUM",
        filePath: "(scanner)",
        message: "Checkov returned non-JSON output.",
        remediation: "Ensure Checkov is installed and accessible in PATH.",
      },
    ];
  }

  const root = parsed as CheckovOutput;
  const results = (root.results && typeof root.results === "object" ? (root.results as CheckovResults) : {}) ?? {};
  const failed = isCheckovCheckArray(results.failed_checks) ? results.failed_checks : [];
  const passed = isCheckovCheckArray(results.passed_checks) ? results.passed_checks : [];
  const skipped = isCheckovCheckArray(results.skipped_checks) ? results.skipped_checks : [];

  const toFinding = (item: CheckovCheck, status: "FAILED" | "PASSED" | "SKIPPED"): ComplianceFinding => {
    const checkId = typeof item.check_id === "string" ? item.check_id : "UNKNOWN";
    const title = typeof item.check_name === "string" ? item.check_name : checkId;
    const filePath = typeof item.file_path === "string" ? item.file_path : "(unknown)";

    const lineRangeRaw = item.file_line_range;
    const lineRange =
      Array.isArray(lineRangeRaw) &&
      lineRangeRaw.length >= 2 &&
      typeof lineRangeRaw[0] === "number" &&
      typeof lineRangeRaw[1] === "number"
        ? ([lineRangeRaw[0], lineRangeRaw[1]] as const)
        : undefined;

    const severity = normalizeSeverity(typeof item.severity === "string" ? item.severity : "MEDIUM");
    const message = typeof item.description === "string" ? item.description : title;
    const remediation = typeof item.guideline === "string" ? item.guideline : undefined;

    return {
      id: checkId,
      title,
      status,
      severity,
      filePath,
      lineStart: lineRange?.[0],
      lineEnd: lineRange?.[1],
      message,
      remediation,
    };
  };

  return [
    ...failed.map((i) => toFinding(i, "FAILED")),
    ...passed.map((i) => toFinding(i, "PASSED")),
    ...skipped.map((i) => toFinding(i, "SKIPPED")),
  ];
}

function normalizeSeverity(input: string): Severity {
  const upper = input.toUpperCase();
  if (upper === "LOW" || upper === "MEDIUM" || upper === "HIGH" || upper === "CRITICAL") return upper;
  return "MEDIUM";
}

type MockFile = { filePath: string; content: string };

export function runMockRules(files: MockFile[]) {
  const findings: ComplianceFinding[] = [];

  const allowedShapes = ["VM.Standard.E2.1.Micro", "VM.Standard.A1.Flex"];
  const hasAnyTags = files.some((f) => /\b(defined_tags|freeform_tags)\b/.test(f.content));

  for (const f of files) {
    const lines = f.content.split(/\r?\n/);

    const shapeMatch = lines.findIndex((l) => /\bshape\s*=/.test(l));
    if (shapeMatch >= 0) {
      const line = lines[shapeMatch];
      const allowed = allowedShapes.some((s) => line.includes(s));
      findings.push({
        id: "OCI_ALWAYS_FREE_SHAPES",
        title: "Compute shape uses Always Free eligible type",
        status: allowed ? "PASSED" : "FAILED",
        severity: allowed ? "LOW" : "HIGH",
        filePath: f.filePath,
        lineStart: shapeMatch + 1,
        lineEnd: shapeMatch + 1,
        message: allowed
          ? "Compute shape appears to be Always Free eligible."
          : "Compute shape does not appear to be Always Free eligible.",
        remediation: allowed
          ? undefined
          : `Use an Always Free shape like ${allowedShapes.join(" or ")}.`,
      });
    }

    const openIngressLine = lines.findIndex((l) => l.includes("0.0.0.0/0"));
    if (openIngressLine >= 0) {
      findings.push({
        id: "NO_OPEN_INGRESS",
        title: "Avoid 0.0.0.0/0 in network rules",
        status: "FAILED",
        severity: "HIGH",
        filePath: f.filePath,
        lineStart: openIngressLine + 1,
        lineEnd: openIngressLine + 1,
        message: "Detected 0.0.0.0/0, which may expose resources to the public internet.",
        remediation: "Restrict CIDR ranges or scope rules to required sources only.",
      });
    }

  }

  findings.push({
    id: "RESOURCE_TAGGING",
    title: "Resources include tagging metadata",
    status: hasAnyTags ? "PASSED" : "FAILED",
    severity: hasAnyTags ? "LOW" : "MEDIUM",
    filePath: "(repo)",
    message: hasAnyTags
      ? "Tag fields were detected."
      : "No tag fields were detected. Consider adding tags for governance.",
    remediation: hasAnyTags ? undefined : "Add `freeform_tags` or `defined_tags` to resources.",
  });

  const present = files.length > 0;
  findings.unshift({
    id: "TERRAFORM_PRESENT",
    title: "Terraform files were discovered",
    status: present ? "PASSED" : "FAILED",
    severity: present ? "LOW" : "MEDIUM",
    filePath: "(repo)",
    message: present ? `Discovered ${files.length} Terraform files.` : "No Terraform files were discovered.",
  });

  return findings;
}

async function runMockScan(tfFiles: string[], scanDir: string) {
  const mockFiles: MockFile[] = [];
  for (const abs of tfFiles) {
    const content = await fs.readFile(abs, "utf8");
    mockFiles.push({ filePath: path.relative(scanDir, abs), content });
  }
  return runMockRules(mockFiles);
}

export function createScanId() {
  return crypto.randomBytes(12).toString("hex");
}
