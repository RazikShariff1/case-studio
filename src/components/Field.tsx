/** A labelled text input with an error line. Used by every form. */
export function Field({ name, label, type = "text", error, hint, autoComplete, defaultValue, required = true, inputMode }: {
  name: string; label: string; type?: string; error?: string; hint?: string; autoComplete?: string; defaultValue?: string; required?: boolean;
  inputMode?: "numeric" | "tel" | "email" | "text";
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" autoComplete={autoComplete} defaultValue={defaultValue} required={required} inputMode={inputMode}
        aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} />
      {hint && !error && <p className="fine mt-1.5">{hint}</p>}
      {error && <p id={`${name}-err`} className="mt-1.5 text-[12px] text-danger">{error}</p>}
    </div>
  );
}

export function StateSelect({ error, defaultValue = "", states }: { error?: string; defaultValue?: string; states: readonly string[] }) {
  return (
    <div>
      <label className="label" htmlFor="state">State</label>
      <select id="state" name="state" required defaultValue={defaultValue} autoComplete="address-level1" className="input" aria-invalid={!!error}>
        <option value="" disabled>Select state</option>
        {states.map((st) => <option key={st}>{st}</option>)}
      </select>
      {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
