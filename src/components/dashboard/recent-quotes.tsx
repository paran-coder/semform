import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

const quotes = [
  {
    client: "ABC Cosmetic",
    project: "AI 신제품 SNS 광고",
    amount: "₩1,815,000",
    number: "Q-2026-0018",
    date: "09.15",
  },
  {
    client: "Studio B",
    project: "브랜드 필름 제작",
    amount: "₩2,750,000",
    number: "Q-2026-0017",
    date: "09.12",
  },
  {
    client: "Lumen Beauty",
    project: "AI 숏폼 캠페인",
    amount: "₩920,000",
    number: "Q-2026-0016",
    date: "09.09",
  },
];

export function RecentQuotes() {
  return (
    <section className="dashboard-section dashboard-section--recent" aria-labelledby="recent-heading">
      <div className="section-heading-row section-heading-row--recent">
        <div>
          <p className="eyebrow">최근 견적</p>
          <h2 id="recent-heading" className="sr-only">최근 견적 목록</h2>
        </div>
        <Link className="inline-link" href="/quotes">
          전체 보기
          <ChevronRightIcon size={15} />
        </Link>
      </div>

      <div className="quote-list" role="list">
        {quotes.map((quote) => (
          <Link className="quote-row" href={`/quotes/${quote.number}`} key={quote.number} role="listitem">
            <div className="quote-row__main">
              <span className="quote-row__client">{quote.client}</span>
              <span className="quote-row__project">{quote.project}</span>
              <span className="quote-row__meta">{quote.number}</span>
            </div>
            <div className="quote-row__side">
              <strong className="quote-row__amount">{quote.amount}</strong>
              <span className="quote-row__date">{quote.date}</span>
            </div>
            <span className="quote-row__chevron"><ChevronRightIcon size={18} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
