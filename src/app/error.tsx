"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="tx-err">
      <p>The store could not be reached just now. Please try again.</p>
      <h1>Something went wrong</h1>
      <button onClick={reset} className="tx-ad__btn">Try again</button>
    </div>
  );
}
