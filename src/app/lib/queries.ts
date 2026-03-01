/**
 * React Query hooks with mock data adapters.
 *
 * Each hook fetches from the API client when a real backend is available;
 * otherwise it returns realistic mock data after a short simulated delay.
 * The query keys follow a [module, entity, ...params] convention for easy
 * invalidation (e.g. queryClient.invalidateQueries({ queryKey: ["documents"] })).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types (shared across modules) ──────────────────────────────

export interface DocumentItem {
  id: string;
  name: string;
  type: "transcript" | "analysis" | "summary" | "audio" | "video" | "pdf" | "docx";
  direction: "uploaded" | "exported";
  status: "processed" | "processing" | "failed";
  format: string;
  size: string;
  date: string;
  confidence?: number;
  speakers?: number;
  versions: number;
}

export interface CommitNode {
  id: string;
  hash: string;
  description: string;
  author: string;
  initials: string;
  time: string;
  additions: number;
  deletions: number;
  isLatest?: boolean;
  source?: "user" | "ai";
  branch: string;
  parentId: string | null;
}

export interface DiffLine {
  type: "context" | "removed" | "added";
  numOld: number | null;
  numNew: number | null;
  text: string;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: { added: number; removed: number };
  path: string;
}

// ─── Mock data ───────────────────────────────────────────────────

const MOCK_DOCUMENTS: DocumentItem[] = [
  { id: "1", name: "Q4 Strategy Review", type: "transcript", direction: "uploaded", status: "processed", format: "MP4", size: "248 MB", date: "2h ago", confidence: 94, speakers: 6, versions: 4 },
  { id: "2", name: "Q4 Strategy Review — Analysis", type: "analysis", direction: "exported", status: "processed", format: "PDF", size: "1.2 MB", date: "12 min ago", versions: 2 },
  { id: "3", name: "Product Sync — Sprint 14", type: "transcript", direction: "uploaded", status: "processed", format: "M4A", size: "86 MB", date: "5h ago", confidence: 88, speakers: 4, versions: 3 },
  { id: "4", name: "Product Sync — Summary", type: "summary", direction: "exported", status: "processed", format: "DOCX", size: "340 KB", date: "4h ago", versions: 1 },
  { id: "5", name: "Customer Discovery — Acme", type: "transcript", direction: "uploaded", status: "processed", format: "WAV", size: "420 MB", date: "1d ago", confidence: 91, speakers: 3, versions: 2 },
  { id: "6", name: "Board Meeting — Feb", type: "transcript", direction: "uploaded", status: "processed", format: "MP4", size: "1.8 GB", date: "2d ago", confidence: 76, speakers: 8, versions: 5 },
  { id: "7", name: "Board Meeting — Action Items", type: "analysis", direction: "exported", status: "processed", format: "PDF", size: "890 KB", date: "2d ago", versions: 1 },
  { id: "8", name: "1:1 — Engineering Lead", type: "transcript", direction: "uploaded", status: "processed", format: "M4A", size: "42 MB", date: "3d ago", confidence: 97, speakers: 2, versions: 1 },
  { id: "9", name: "Design Critique — v2.3", type: "transcript", direction: "uploaded", status: "processing", format: "MP4", size: "620 MB", date: "4h ago", speakers: 5, versions: 0 },
  { id: "10", name: "All-Hands — January", type: "transcript", direction: "uploaded", status: "failed", format: "MP4", size: "2.1 GB", date: "5d ago", speakers: 24, versions: 0 },
];

const MOCK_COMMITS: CommitNode[] = [
  { id: "1", hash: "a3f8c1d", description: "Refine action items with AI-suggested owners", author: "Jane Doe", initials: "JD", time: "12 min ago", additions: 24, deletions: 8, isLatest: true, source: "user", branch: "main", parentId: "2" },
  { id: "2", hash: "b7e2f09", description: "Add risk assessment section from chat analysis", author: "Jane Doe", initials: "JD", time: "47 min ago", additions: 42, deletions: 3, source: "user", branch: "main", parentId: "3" },
  { id: "3", hash: "c1d4a82", description: "Merge feature/expanded-summary into main", author: "Jane Doe", initials: "JD", time: "2h ago", additions: 0, deletions: 0, source: "user", branch: "main", parentId: "4" },
  { id: "4", hash: "d9f3b15", description: "Expand summary with participant context", author: "Alex R.", initials: "AR", time: "2h ago", additions: 31, deletions: 12, source: "ai", branch: "feature/expanded-summary", parentId: "5" },
  { id: "5", hash: "e5a7c28", description: "Extract key decisions from transcript", author: "Jane Doe", initials: "JD", time: "3h ago", additions: 56, deletions: 0, source: "user", branch: "main", parentId: "6" },
  { id: "6", hash: "f2b8d41", description: "Initial analysis generation", author: "ConvoCrystal AI", initials: "CC", time: "3h ago", additions: 128, deletions: 0, source: "ai", branch: "main", parentId: null },
];

const MOCK_DIFF: DiffResult = {
  path: "analysis/q4-strategy-review.md",
  stats: { added: 10, removed: 3 },
  lines: [
    { type: "context", numOld: 14, numNew: 14, text: "## Action Items" },
    { type: "context", numOld: 15, numNew: 15, text: "" },
    { type: "removed", numOld: 16, numNew: null, text: "- Sarah Chen — Complete APAC feasibility review (Due: Dec 6)" },
    { type: "removed", numOld: 17, numNew: null, text: "- Marcus Webb — Model usage-based pricing (Due: Dec 8)" },
    { type: "removed", numOld: 18, numNew: null, text: "- David Park — Draft phased rollout proposal (Due: Dec 10)" },
    { type: "added", numOld: null, numNew: 16, text: "**Sarah Chen (VP Product)**" },
    { type: "added", numOld: null, numNew: 17, text: "- Complete APAC localization feasibility review — Due: Friday, Dec 6" },
    { type: "added", numOld: null, numNew: 18, text: "- Present go/no-go recommendation at Monday standup" },
    { type: "added", numOld: null, numNew: 19, text: "" },
    { type: "added", numOld: null, numNew: 20, text: "**Marcus Webb (CFO)**" },
    { type: "added", numOld: null, numNew: 21, text: "- Model revenue impact of usage-based pricing — Due: End of week" },
    { type: "added", numOld: null, numNew: 22, text: "- Prepare grandfather clause terms for legal review" },
    { type: "added", numOld: null, numNew: 23, text: "" },
    { type: "added", numOld: null, numNew: 24, text: "**David Park (Eng Lead)**" },
    { type: "added", numOld: null, numNew: 25, text: "- Draft phased rollout proposal for Japan-first — Due: Dec 10" },
    { type: "context", numOld: 19, numNew: 26, text: "" },
    { type: "context", numOld: 20, numNew: 27, text: "## Open Questions" },
  ],
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Mock API adapters (swap for real api.get when backend exists) ─

async function fetchDocuments(): Promise<DocumentItem[]> {
  // In production: return api.get<DocumentItem[]>("/documents");
  await delay(300 + Math.random() * 200);
  return MOCK_DOCUMENTS;
}

async function fetchCommits(documentId: string): Promise<CommitNode[]> {
  // In production: return api.get<CommitNode[]>(`/documents/${documentId}/versions`);
  await delay(250 + Math.random() * 150);
  return MOCK_COMMITS;
}

async function fetchDiff(documentId: string, commitHash: string): Promise<DiffResult> {
  // In production: return api.get<DiffResult>(`/documents/${documentId}/diff/${commitHash}`);
  await delay(200 + Math.random() * 100);
  return MOCK_DIFF;
}

async function restoreVersion(documentId: string, commitHash: string, note: string): Promise<{ backupBranch: string }> {
  // In production: return api.post(`/documents/${documentId}/restore`, { commitHash, note });
  await delay(1200 + Math.random() * 300);
  return { backupBranch: `backup/${Date.now()}` };
}

async function deleteDocument(documentId: string): Promise<void> {
  // In production: return api.delete(`/documents/${documentId}`);
  await delay(400);
}

// ─── React Query hooks ───────────────────────────────────────────

/** Fetch all documents — stale after 30s, refetch on window focus */
export function useDocumentsQuery() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Fetch commit history for a specific document */
export function useCommitsQuery(documentId: string | null) {
  return useQuery({
    queryKey: ["versions", documentId],
    queryFn: () => fetchCommits(documentId!),
    enabled: !!documentId,
    staleTime: 15_000,
  });
}

/** Fetch diff for a specific commit */
export function useDiffQuery(documentId: string | null, commitHash: string | null) {
  return useQuery({
    queryKey: ["diff", documentId, commitHash],
    queryFn: () => fetchDiff(documentId!, commitHash!),
    enabled: !!documentId && !!commitHash,
    staleTime: 60_000,
  });
}

/** Restore a version — invalidates version cache on success */
export function useRestoreMutation(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commitHash, note }: { commitHash: string; note: string }) =>
      restoreVersion(documentId, commitHash, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions", documentId] });
      queryClient.invalidateQueries({ queryKey: ["diff", documentId] });
    },
  });
}

/** Delete a document — invalidates document list on success */
export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
