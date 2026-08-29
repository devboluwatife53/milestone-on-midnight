import type { LedgerState } from "../hooks/useMidnight";

const shortAuthor = (author: string) => `${author.slice(0, 6)}…${author.slice(-4)}`;

export const MilestoneFeed = ({ ledgerState }: { ledgerState: LedgerState | null }) => {
  if (!ledgerState) {
    return (
      <section className="panel">
        <p className="panel__hint">Loading the wall...</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Milestone wall</h2>
      <div className="milestone-stats">
        <div className="milestone-stat">
          <span className="milestone-stat__value">{ledgerState.totalCelebrated.toString()}</span>
          <span className="milestone-stat__label">milestones celebrated</span>
        </div>
      </div>
      <p className="panel__hint">
        Everyone posts here anonymously by pseudonymous author key. Individual percentages stay
        private — only the achievement text and tier reached are ever revealed, and only once
        someone's private progress crosses a full 100%.
      </p>

      {ledgerState.feed.length === 0 ? (
        <p className="panel__hint">No milestones celebrated yet — be the first.</p>
      ) : (
        <ul className="milestone-feed">
          {ledgerState.feed.map((post, i) => (
            <li key={i} className="milestone-feed__item">
              <span className="milestone-feed__tier">🎉 Tier {post.tier.toString()}</span>
              <span className="milestone-feed__label">{post.label}</span>
              <span className="milestone-feed__author">{shortAuthor(post.author)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
