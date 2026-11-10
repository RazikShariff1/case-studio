export default function Loading() {
  return (
    <div className="container-x mt-12 grid animate-pulse gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16" role="status" aria-label="Loading the product">
      <div className="aspect-[4/5] rounded-[28px] bg-surface md:aspect-square" />
      <div className="space-y-5 pt-6">
        <div className="h-10 w-3/4 rounded-xl bg-surface" />
        <div className="h-6 w-1/4 rounded-lg bg-surface" />
        <div className="h-40 rounded-2xl bg-surface" />
        <div className="h-14 rounded-full bg-surface" />
      </div>
    </div>
  );
}
