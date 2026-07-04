export type InboxItemKind = "email" | "approval" | "file" | "agent" | "digest";

export type InboxDay = "Today" | "Yesterday" | "Earlier";

export const DAY_ORDER: InboxDay[] = ["Today", "Yesterday", "Earlier"];

export type InboxItem = {
  id: string;
  kind: InboxItemKind;
  /** Who the message is from: a person, agent, library, or the product. */
  from: string;
  /** Email items only: sender address from the connected mail account. */
  fromEmail?: string;
  subject: string;
  /** One-line snippet shown under the subject in the list. */
  preview: string;
  /** Full message, one entry per paragraph. */
  body: string[];
  time: string;
  day: InboxDay;
  project?: string;
  unread: boolean;
  /** Approval items only: label for the primary action. */
  approveLabel?: string;
  /** Links the message to a library file so it can be opened in place. */
  fileId?: string;
};

/** Placeholder corpus until mail sync, agent runs, and approvals are wired up. */
export const INBOX_ITEMS: InboxItem[] = [
  {
    id: "i-action-slot",
    kind: "approval",
    from: "Product Agent",
    subject: "Approval needed: publish action-slot API",
    preview:
      "The toolbar slot proposal is ready. Review the naming before it lands in the shared shell.",
    body: [
      "The proposed API adds leading, center, and trailing toolbar slots to the panel shell.",
      "The implementation keeps product-specific action content outside the base package while preserving layout and keyboard behavior.",
      "Approving publishes the draft branch for review.",
    ],
    time: "25m ago",
    day: "Today",
    project: "Launch Desk",
    unread: true,
    approveLabel: "Publish draft",
  },
  {
    id: "i-riley-feedback",
    kind: "email",
    from: "Riley Chen",
    fromEmail: "riley@example.com",
    subject: "Panel interaction notes attached",
    preview:
      "The latest pass feels smoother. I left notes on selection state, density, and hover timing.",
    body: [
      "The latest panel build feels smoother overall.",
      "I left comments around selected-row contrast, bulk-action height, and the exact hover timing for row tools.",
      "Nothing blocks the next prototype, but the selected state should stay visually quiet.",
    ],
    time: "45m ago",
    day: "Today",
    project: "Launch Desk",
    unread: true,
  },
  {
    id: "i-audit-arrived",
    kind: "file",
    from: "Library",
    subject: "Accessibility Audit.pdf landed in Billing Hub",
    preview:
      "2.3 MB, from Riley's email. Not extracted yet; extract it before planning the cleanup pass.",
    body: [
      "Accessibility Audit.pdf arrived attached to Riley's email and was filed to Billing Hub.",
      "It has not been extracted yet, so issues and recommendations will not appear in answers until it is read.",
    ],
    time: "1h ago",
    day: "Today",
    project: "Billing Hub",
    unread: true,
    fileId: "f-audit",
  },
  {
    id: "i-release-check",
    kind: "agent",
    from: "Release Bot",
    subject: "Release check finished - 2 items need review",
    preview:
      "Build and smoke tests passed. Flagged: changelog copy and the onboarding screenshot.",
    body: [
      "The release check completed against the current staging build.",
      "Build and smoke tests passed. Two items need review: the changelog copy references a removed setting, and the onboarding screenshot is stale.",
    ],
    time: "2h ago",
    day: "Today",
    project: "Ops Portal",
    unread: true,
  },
  {
    id: "i-metrics-sweep",
    kind: "agent",
    from: "Metrics Agent",
    subject: "Activation sweep finished for Billing Hub",
    preview:
      "Trial starts rose 8%. Activation held steady, but median time to value moved in the wrong direction.",
    body: [
      "Swept the June activation workbook and compared it against the previous cohort.",
      "Trial starts rose 8%, activation held at 42.6%, and median time to value increased to 18 minutes.",
    ],
    time: "4h ago",
    day: "Today",
    project: "Billing Hub",
    unread: false,
    fileId: "f-metrics",
  },
  {
    id: "i-design-review",
    kind: "email",
    from: "Mara Patel",
    fromEmail: "mara@example.com",
    subject: "Design review moved to July 15",
    preview:
      "Confirmed for July 15 at 10am. Bring the updated wireframes and the QA screen bundle.",
    body: [
      "The design review is confirmed for July 15 at 10am.",
      "Please bring the updated wireframes and the QA screen bundle so we can compare the compact and comfortable density modes.",
    ],
    time: "yesterday",
    day: "Yesterday",
    project: "Launch Desk",
    unread: false,
  },
  {
    id: "i-low-confidence",
    kind: "agent",
    from: "Extraction",
    subject: "Roadmap model extracted - 1 fact needs review",
    preview:
      "Risk level read as Medium at 77% confidence. Confirm against Risks!C4 before sharing.",
    body: [
      "Q3 Roadmap Model.xlsx extracted with 4 facts. Three landed above 90% confidence.",
      "One needs a look: risk level read as Medium from Risks!C4 at 77% confidence.",
    ],
    time: "yesterday",
    day: "Yesterday",
    project: "Launch Desk",
    unread: true,
    fileId: "f-roadmap",
  },
  {
    id: "i-weekly-digest",
    kind: "digest",
    from: "Framework",
    subject: "Weekly digest: 3 projects, 8 new facts",
    preview:
      "Launch Desk added the most. Two files are waiting in the library inbox.",
    body: [
      "8 new facts landed across 3 projects this week. Launch Desk added the most: the roadmap model and panel wireframes.",
      "2 files are still waiting in the library inbox, and one approval is waiting on review.",
    ],
    time: "6d ago",
    day: "Earlier",
    unread: false,
  },
];

export function unreadCount(items: InboxItem[]): number {
  return items.filter((item) => item.unread).length;
}
