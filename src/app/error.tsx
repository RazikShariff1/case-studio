"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-xs py-28 text-center">
      <h1 className="h-page">Something went wrong.</h1>
      <p className="h-sub mt-3 text-muted">The store could not be reached just now. Please try again.</p>
      <button onClick={reset} className="btn btn-blue mt-8">Try again</button>
    </div>
  );
}
