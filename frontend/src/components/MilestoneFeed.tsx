import { useState } from "react";
import type { LedgerState } from "../hooks/useMidnight";
import type { MilestonePost } from "../midnight/contract";
import { pinColorFor, rotationClassFor, shortHash } from "./pinColor";

const Note = ({
  post,
  busy,
  onReply,
}: {
  post: MilestonePost;
  busy: string | null;
  onReply: (parentId: bigint, label: string) => Promise<void>;
}) => {
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");

  const submitReply = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    await onReply(post.id, trimmed);
    setDraft("");
    setReplying(false);
  };

  return (
    <div className={`note ${rotationClassFor(post.id)}`}>
      <span className="note__pin" style={{ background: pinColorFor(post.author) }} />
      <p className="note__label">{post.label}</p>
      <div className="note__footer">
        <span className="note__author">pinned by {shortHash(post.author)}</span>
        <button className="note__reply-toggle" onClick={() => setReplying((v) => !v)}>
          {replying ? "Never mind" : "Reply"}
        </button>
      </div>
      {replying && (
        <div className="reply-composer">
          <div className="compose">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say congrats, or add your own spin…"
              maxLength={280}
              autoFocus
            />
            <div className="compose__row">
              <span className="compose__hint">{busy ?? ""}</span>
              <button onClick={submitReply} disabled={!!busy || !draft.trim()}>
                Pin reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MilestoneFeed = ({
  ledgerState,
  busy,
  onReply,
}: {
  ledgerState: LedgerState | null;
  busy: string | null;
  onReply: (parentId: bigint, label: string) => Promise<void>;
}) => {
  if (!ledgerState) {
    return <p className="hint">Loading the wall...</p>;
  }

  const byId = new Map(ledgerState.feed.map((post) => [post.id, post]));

  // Walk parentId up to the root post of the thread — a reply to a reply
  // still belongs to the original thread, just flattened one level rather
  // than rendered as its own nested sub-thread.
  const rootOf = (post: MilestonePost): bigint => {
    let current = post;
    const seen = new Set<bigint>();
    while (current.parentId !== 0n && byId.has(current.parentId) && !seen.has(current.id)) {
      seen.add(current.id);
      current = byId.get(current.parentId)!;
    }
    return current.id;
  };

  const repliesByRoot = new Map<bigint, MilestonePost[]>();
  for (const post of ledgerState.feed) {
    if (post.parentId === 0n) continue;
    const root = rootOf(post);
    const siblings = repliesByRoot.get(root) ?? [];
    siblings.push(post);
    repliesByRoot.set(root, siblings);
  }
  const topLevel = ledgerState.feed
    .filter((post) => post.parentId === 0n)
    .sort((a, b) => Number(b.id - a.id));

  if (topLevel.length === 0) {
    return <p className="feed__empty">The wall is empty — pin the first milestone.</p>;
  }

  return (
    <div className="feed">
      {topLevel.map((post) => {
        const replies = (repliesByRoot.get(post.id) ?? []).sort(
          (a, b) => Number(a.id - b.id),
        );
        return (
          <div className="thread" key={post.id.toString()}>
            <Note post={post} busy={busy} onReply={onReply} />
            {replies.length > 0 && (
              <div className="replies">
                {replies.map((reply) => (
                  <Note key={reply.id.toString()} post={reply} busy={busy} onReply={onReply} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
