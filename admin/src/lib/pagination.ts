export const PAGE_SIZE = 20;
export function paginate<T>(items: readonly T[], requestedPage: number) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), pageCount);
  const offset = (page - 1) * PAGE_SIZE;
  return { page, pageCount, total, start: total ? offset + 1 : 0,
    end: Math.min(offset + PAGE_SIZE, total), items: items.slice(offset, offset + PAGE_SIZE) };
}
/** Keep first/last and nearby pages available without overflowing large lists. */
export function pageNumbers(page: number, pageCount: number): (number | string)[] {
  const pages = pageCount <= 7
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : [...new Set([1, pageCount, page - 1, page, page + 1])]
        .filter(value => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  return pages.flatMap((value, index) => index > 0 && value - pages[index - 1] > 1
    ? [`gap-${value}`, value] : [value]);
}
