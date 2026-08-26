import styles from "./professional-skeleton.module.css";

type ProfessionalSkeletonProps = {
  variant?: "home" | "tools" | "tool";
};

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <span className={styles.line} style={{ width }} aria-hidden="true" />;
}

function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.icon} />
      <SkeletonLine width="64%" />
      <SkeletonLine width="92%" />
      <SkeletonLine width="76%" />
    </div>
  );
}

export function ProfessionalSkeleton({
  variant = "home",
}: ProfessionalSkeletonProps) {
  const toolView = variant === "tool";

  return (
    <main
      className={styles.shell}
      aria-busy="true"
      aria-label="Loading AJN PDF"
    >
      <span className={styles.srOnly} role="status" aria-live="polite">
        Loading AJN PDF…
      </span>

      <div className={styles.header}>
        <div className={styles.brand} />
        <div className={styles.nav}>
          <SkeletonLine width="72px" />
          <SkeletonLine width="88px" />
          <SkeletonLine width="68px" />
        </div>
      </div>

      {toolView ? (
        <section className={styles.toolLayout}>
          <div className={styles.toolIntro}>
            <SkeletonLine width="126px" />
            <div className={styles.titleLine} />
            <SkeletonLine width="88%" />
            <SkeletonLine width="68%" />
          </div>

          <div className={styles.uploadPanel}>
            <div className={styles.uploadIcon} />
            <div className={styles.uploadTitle} />
            <SkeletonLine width="58%" />
            <div className={styles.button} />
          </div>

          <div className={styles.steps}>
            <SkeletonLine width="94%" />
            <SkeletonLine width="82%" />
            <SkeletonLine width="90%" />
          </div>
        </section>
      ) : (
        <>
          <section className={styles.hero}>
            <SkeletonLine width="128px" />
            <div className={styles.heroTitle} />
            <SkeletonLine width="76%" />
            <SkeletonLine width="58%" />
            <div className={styles.heroActions}>
              <div className={styles.button} />
              <div className={styles.secondaryButton} />
            </div>
          </section>

          <section className={styles.grid} aria-hidden="true">
            {Array.from({ length: variant === "tools" ? 12 : 8 }).map(
              (_, index) => (
                <SkeletonCard key={index} />
              ),
            )}
          </section>
        </>
      )}
    </main>
  );
}
