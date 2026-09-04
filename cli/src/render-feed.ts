import { Buffer } from "node:buffer";

type FeedPost = { id: bigint; parentId: bigint; author: Uint8Array; label: string };

const shortAuthor = (author: Uint8Array): string =>
  Buffer.from(author).toString("hex").slice(0, 12) + "…";

/**
 * Renders the flat, newest-first on-chain feed as a threaded text wall:
 * top-level posts (parentId 0) followed by their replies, oldest reply first.
 */
export const renderFeedAsThreads = (feed: FeedPost[]): string => {
  if (feed.length === 0) return "  (the wall is empty — be the first to post)";

  const byId = new Map(feed.map((post) => [post.id, post]));
  const repliesByParent = new Map<bigint, FeedPost[]>();
  for (const post of feed) {
    if (post.parentId === 0n) continue;
    if (!byId.has(post.parentId)) continue; // orphaned parentId, ignore
    const siblings = repliesByParent.get(post.parentId) ?? [];
    siblings.push(post);
    repliesByParent.set(post.parentId, siblings);
  }

  const topLevel = feed
    .filter((post) => post.parentId === 0n)
    .sort((a, b) => Number(b.id - a.id));

  const lines: string[] = [];
  for (const post of topLevel) {
    lines.push(`  #${post.id} ${shortAuthor(post.author)} — ${post.label}`);
    const replies = (repliesByParent.get(post.id) ?? []).sort(
      (a, b) => Number(a.id - b.id),
    );
    for (const reply of replies) {
      lines.push(`      ↳ #${reply.id} ${shortAuthor(reply.author)} — ${reply.label}`);
    }
  }
  return lines.join("\n");
};
