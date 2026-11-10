export default function Loading() {
  return (
    <div className="container-x animate-pulse pb-8 pt-14 md:pt-20" role="status" aria-label="Loading the store">
      <div className="h-10 w-1/2 rounded-xl bg-surface md:h-12" />
      <div className="mt-10 h-24 rounded-2xl bg-surface" />
      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] rounded-[28px] bg-surface" />
            <div className="mt-4 h-5 w-3/4 rounded-lg bg-surface" />
            <div className="mt-2 h-4 w-1/3 rounded-lg bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
