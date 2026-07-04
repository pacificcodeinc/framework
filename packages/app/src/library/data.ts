export type FileKind =
  | "drawing"
  | "legal"
  | "financial"
  | "site"
  | "report"
  | "photo";

export type ExtractionStatus = "extracted" | "processing" | "inbox";

export type ExtractedFact = {
  label: string;
  value: string;
  source: string;
  /** 0..1; below 0.8 is flagged for review. */
  confidence: number;
};

export type LibraryFile = {
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
  drawing: "Designs",
  legal: "Legal",
  financial: "Metrics",
  site: "Research",
  report: "Reports",
  photo: "Media",
};

/** Placeholder corpus until the file service lands. */
export const LIBRARY_FILES: LibraryFile[] = [
  {
    id: "f-roadmap",
    name: "Q3 Roadmap Model.xlsx",
    kind: "financial",
    project: "Launch Desk",
    size: "412 KB",
    modified: "2h ago",
    status: "extracted",
    inContext: true,
    facts: [
      { label: "Planned releases", value: "4 milestones", source: "Plan!B7", confidence: 0.98 },
      { label: "Highest effort item", value: "Contextual actions", source: "Plan!E12", confidence: 0.95 },
      { label: "Target date", value: "2026-08-14", source: "Summary!B3", confidence: 0.92 },
      { label: "Risk level", value: "Medium", source: "Risks!C4", confidence: 0.77 },
    ],
  },
  {
    id: "f-wireframes",
    name: "Panel Wireframes.pdf",
    kind: "drawing",
    project: "Launch Desk",
    size: "5.8 MB",
    modified: "yesterday",
    status: "extracted",
    inContext: true,
    facts: [
      { label: "Primary surface", value: "Right-side panel", source: "p. 2", confidence: 0.96 },
      { label: "Toolbar slots", value: "Leading, center, trailing", source: "p. 4", confidence: 0.89 },
      { label: "Mobile breakpoint", value: "720 px", source: "p. 7", confidence: 0.84 },
    ],
  },
  {
    id: "f-dpa",
    name: "Vendor DPA - Draft v3.docx",
    kind: "legal",
    project: "Ops Portal",
    size: "188 KB",
    modified: "3d ago",
    status: "processing",
    inContext: false,
    facts: [],
  },
  {
    id: "f-research-map",
    name: "User Research Map.pdf",
    kind: "site",
    project: "Ops Portal",
    size: "1.4 MB",
    modified: "1w ago",
    status: "extracted",
    inContext: false,
    facts: [
      { label: "Interview count", value: "12 users", source: "p. 1", confidence: 0.98 },
      { label: "Top theme", value: "Faster triage", source: "p. 3", confidence: 0.94 },
      { label: "Open question", value: "Bulk action labels", source: "p. 5", confidence: 0.73 },
    ],
  },
  {
    id: "f-metrics",
    name: "Activation Metrics - June.xlsx",
    kind: "financial",
    project: "Billing Hub",
    size: "326 KB",
    modified: "4d ago",
    status: "extracted",
    inContext: false,
    facts: [
      { label: "Trial starts", value: "1,842", source: "Funnel!B4", confidence: 0.99 },
      { label: "Activation rate", value: "42.6%", source: "Funnel!C9", confidence: 0.97 },
      { label: "Median time to value", value: "18 min", source: "Cohorts!D12", confidence: 0.88 },
    ],
  },
  {
    id: "f-audit",
    name: "Accessibility Audit.pdf",
    kind: "report",
    project: "Billing Hub",
    size: "2.3 MB",
    modified: "just added",
    status: "inbox",
    inContext: false,
    facts: [],
  },
  {
    id: "f-screens",
    name: "Design QA Screens.zip",
    kind: "photo",
    project: "Launch Desk",
    size: "96 MB",
    modified: "2w ago",
    status: "inbox",
    inContext: false,
    facts: [],
  },
];

export function factCount(files: LibraryFile[]): number {
  return files.reduce((sum, file) => sum + file.facts.length, 0);
}
