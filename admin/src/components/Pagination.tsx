import { pageNumbers } from "@/lib/pagination";
type Props = {
  page: number; pageCount: number; total: number; start: number; end: number;
  onPageChange: (page: number) => void;
};
export default function Pagination({ page, pageCount, total, start, end, onPageChange }: Props) {
  const button = "min-h-10 min-w-10 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="Table pagination" className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-200 p-4">
      <p className="text-sm text-ink-500" aria-live="polite">
        {total ? `Showing ${start}–${end} of ${total} items` : "0 items"}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className={button} disabled={page === 1 || !total}
          onClick={() => onPageChange(page - 1)}>Previous</button>
        {pageNumbers(page, pageCount).map(value => typeof value === "number" ? (
          <button key={value} type="button" aria-label={`Page ${value}`} aria-current={value === page ? "page" : undefined}
            className={`${button} ${value === page ? "bg-brand-100 text-ink-900 border-brand-500" : "bg-white text-ink-600"}`}
            onClick={() => onPageChange(value)}>{value}</button>
        ) : <span key={value} className="px-1 text-ink-500" aria-hidden="true">…</span>)}
        <button type="button" className={button} disabled={page === pageCount || !total}
          onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </nav>
  );
}
