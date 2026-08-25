import type { LedgerState } from "../hooks/useMidnight";

const MILESTONE_STEP = 100n;

export const MilestoneProgress = ({ ledgerState }: { ledgerState: LedgerState | null }) => {
  if (!ledgerState) {
    return (
      <section className="panel">
        <p className="panel__hint">Loading milestone progress...</p>
      </section>
    );
  }

  const nextMilestone = (ledgerState.milestonesReached + 1n) * MILESTONE_STEP;
  const progressPct = Number((ledgerState.lastDisclosedTotal * 100n) / nextMilestone);

  return (
    <section className="panel">
      <h2>Milestone progress</h2>
      <div className="milestone-stats">
        <div className="milestone-stat">
          <span className="milestone-stat__value">{ledgerState.milestonesReached.toString()}</span>
          <span className="milestone-stat__label">milestones reached</span>
        </div>
        <div className="milestone-stat">
          <span className="milestone-stat__value">
            {ledgerState.lastDisclosedTotal.toString()}
          </span>
          <span className="milestone-stat__label">publicly disclosed total</span>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${Math.min(progressPct, 100)}%` }} />
      </div>
      <p className="panel__hint">
        Progress toward the next milestone at {nextMilestone.toString()}. Individual
        contributions stay private — only the cumulative total is ever revealed, and only once
        it crosses a milestone.
      </p>
    </section>
  );
};
