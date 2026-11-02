/** Matches the UTC date buckets used by the analytics API. */
export default function DetectionDates({ onApply }: { onApply: (query: string) => void }) {
  return (
    <form className="flex flex-wrap items-end gap-3 text-sm text-ink-700"
      onReset={() => onApply("")}
      onSubmit={event => {
        event.preventDefault();
        const form = event.currentTarget;
        const start = form.elements.namedItem("start") as HTMLInputElement;
        const end = form.elements.namedItem("end") as HTMLInputElement;
        if (start.value && end.value && start.value > end.value) {
          end.setCustomValidity("End date must be on or after the start date.");
          end.reportValidity();
          end.setCustomValidity("");
          return;
        }
        const params = new URLSearchParams();
        if (start.value) params.set("start", start.value);
        if (end.value) params.set("end", end.value);
        onApply(params.size ? "?" + params.toString() : "");
      }}>
      {["start", "end"].map(name => (
        <label key={name} className="grid gap-1 font-medium">
          {name === "start" ? "From (UTC)" : "Through (UTC)"}
          <input type="date" name={name} className="rounded-lg border border-ink-200 bg-white px-3 py-2" />
        </label>
      ))}
      <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-white">Apply dates</button>
      <button type="reset" className="rounded-lg border border-ink-200 bg-white px-4 py-2">Clear dates</button>
    </form>
  );
}
