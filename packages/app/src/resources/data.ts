export type FileKind =
  | "document"
  | "spreadsheet"
  | "contract"
  | "reference"
  | "report"
  | "media";

export type ExtractionStatus = "extracted" | "processing" | "queued";

export type ExtractedFact = {
  label: string;
  value: string;
  source: string;
  /** 0..1; below 0.8 is flagged for review. */
  confidence: number;
};

export type ResourceFile = {
  id: string;
  name: string;
  kind: FileKind;
  project: string;
  size: string;
  modified: string;
  status: ExtractionStatus;
  inContext: boolean;
  facts: ExtractedFact[];
};

export const KIND_LABELS: Record<FileKind, string> = {
  document: "Documents",
  spreadsheet: "Spreadsheets",
  contract: "Contracts",
  reference: "References",
  report: "Reports",
  media: "Media",
};

/** Placeholder corpus until the file service lands. */
export const RESOURCE_FILES: ResourceFile[] = [
  {
    id: "f-roadmap",
    name: "Product Roadmap.md",
    kind: "document",
    project: "Core Template",
    size: "38 KB",
    modified: "2h ago",
    status: "extracted",
    inContext: true,
    facts: [
      { label: "Primary goal", value: "Generalize the starter workflow", source: "Goals", confidence: 0.98 },
      { label: "Milestone", value: "Framework alpha", source: "Timeline", confidence: 0.96 },
      { label: "Owner", value: "Product team", source: "Overview", confidence: 0.94 },
      { label: "Open decision", value: "Plugin packaging model", source: "Risks", confidence: 0.76 },
    ],
  },
  {
    id: "f-metrics",
    name: "Metrics Snapshot.xlsx",
    kind: "spreadsheet",
    project: "Core Template",
    size: "412 KB",
    modified: "yesterday",
    status: "extracted",
    inContext: true,
    facts: [
      { label: "Activation rate", value: "42%", source: "Summary!B6", confidence: 0.97 },
      { label: "Weekly usage", value: "18.4K sessions", source: "Usage!D12", confidence: 0.95 },
      { label: "Median latency", value: "186 ms", source: "Perf!B9", confidence: 0.92 },
      { label: "Top request", value: "Template creation", source: "Requests!A4", confidence: 0.86 },
    ],
  },
  {
    id: "f-agreement",
    name: "Service Agreement Draft.docx",
    kind: "contract",
    project: "Core Template",
    size: "226 KB",
    modified: "3d ago",
    status: "processing",
    inContext: false,
    facts: [],
  },
  {
    id: "f-api",
    name: "API Integration Spec.pdf",
    kind: "reference",
    project: "Integration Kit",
    size: "1.8 MB",
    modified: "1w ago",
    status: "extracted",
    inContext: false,
    facts: [
      { label: "Auth method", value: "OAuth 2.0", source: "p. 3", confidence: 0.98 },
      { label: "Rate limit", value: "600 requests / min", source: "p. 7", confidence: 0.93 },
      { label: "Webhook retry", value: "Exponential backoff", source: "p. 12", confidence: 0.88 },
      { label: "Version", value: "2026-06", source: "p. 1", confidence: 0.91 },
    ],
  },
  {
    id: "f-research",
    name: "User Research Notes.pdf",
    kind: "report",
    project: "Integration Kit",
    size: "4.6 MB",
    modified: "4d ago",
    status: "extracted",
    inContext: false,
    facts: [
      { label: "Interview count", value: "12 sessions", source: "p. 2", confidence: 0.97 },
      { label: "Key friction", value: "Setup uncertainty", source: "p. 8", confidence: 0.9 },
      { label: "Requested feature", value: "Reusable templates", source: "p. 11", confidence: 0.87 },
    ],
  },
  {
    id: "f-feedback",
    name: "Feedback Export.csv",
    kind: "spreadsheet",
    project: "Integration Kit",
    size: "284 KB",
    modified: "just added",
    status: "queued",
    inContext: false,
    facts: [],
  },
  {
    id: "f-checklist",
    name: "Launch Checklist.md",
    kind: "document",
    project: "Launch Pack",
    size: "52 KB",
    modified: "3d ago",
    status: "extracted",
    inContext: false,
    facts: [
      { label: "Release step", value: "Publish starter package", source: "Release", confidence: 0.95 },
      { label: "Validation", value: "Run smoke tests", source: "QA", confidence: 0.93 },
      { label: "Docs status", value: "Needs final examples", source: "Docs", confidence: 0.74 },
    ],
  },
  {
    id: "f-assets",
    name: "Brand Assets.zip",
    kind: "media",
    project: "Launch Pack",
    size: "64 MB",
    modified: "2w ago",
    status: "queued",
    inContext: false,
    facts: [],
  },
  {
    id: "f-security",
    name: "Security Review.pdf",
    kind: "report",
    project: "Launch Pack",
    size: "940 KB",
    modified: "5d ago",
    status: "processing",
    inContext: false,
    facts: [],
  },
];

export function factCount(files: ResourceFile[]): number {
  return files.reduce((sum, file) => sum + file.facts.length, 0);
}
