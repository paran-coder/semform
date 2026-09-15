const summary = [
  { label: "견적금액", value: "₩12,400,000" },
  { label: "견적 수", value: "8건" },
  { label: "평균 견적", value: "₩1,550,000" },
];

export function MonthlySummary() {
  return (
    <section className="dashboard-section" aria-labelledby="monthly-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">이번 달</p>
          <h2 id="monthly-heading" className="sr-only">이번 달 견적 요약</h2>
        </div>
        <span className="section-period">2026.09</span>
      </div>
      <div className="summary-grid">
        {summary.map((item) => (
          <div className="summary-item" key={item.label}>
            <strong className="summary-item__value">{item.value}</strong>
            <span className="summary-item__label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
