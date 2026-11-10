/** Shown at once while a page is prepared, so a click always responds. */
export default function Loading() {
  return (
    <div className="container-s animate-pulse py-14 md:py-20" role="status" aria-label="Loading">
      <div className="h-10 w-2/3 rounded-xl bg-surface md:h-14" />
      <div className="mt-4 h-5 w-1/2 rounded-lg bg-surface" />
      <div className="mt-12 h-72 rounded-[28px] bg-surface" />
    </div>
  );
}
