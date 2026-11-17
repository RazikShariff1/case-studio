"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { INDIAN_STATES } from "@/lib/india";
import type { SavedAddress } from "@/lib/addresses";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data } as { ok: boolean; data: { error?: string; fields?: Record<string, string> } };
}

/** A field in the theme's account style: a label wrapping its input. */
export function TxField({ name, label, type = "text", error, hint, autoComplete, defaultValue, required = true, inputMode, full, disabled }: {
  name: string; label: string; type?: string; error?: string; hint?: string; autoComplete?: string; defaultValue?: string; required?: boolean;
  inputMode?: "numeric" | "tel" | "email" | "text"; full?: boolean; disabled?: boolean;
}) {
  return (
    <label className={`tx-ad__field${full ? " tx-ad__field--full" : ""}`}>
      <span>{label}</span>
      <input name={name} type={type} className={error ? "is-bad" : undefined} autoComplete={autoComplete} defaultValue={defaultValue} required={required} inputMode={inputMode} disabled={disabled}
        aria-invalid={!!error} />
      {hint && !error && <small className="tx-ad__field-hint">{hint}</small>}
      {error && <small className="tx-ad__field-err">{error}</small>}
    </label>
  );
}

function Status({ text, ok }: { text: string; ok: boolean }) {
  if (!text) return null;
  return ok ? <p role="status" className="tx-ad__ok">{text}</p> : <p role="alert" className="tx-ad__form-error">{text}</p>;
}

const icon = {
  lock: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  edit: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>,
  plus: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>,
  pin: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
};

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg({ text: "", ok: true }); setFields({});
    const r = await send("/api/account/profile", "PUT", Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (!r.ok) { setFields(r.data.fields ?? {}); return setMsg({ text: r.data.error ?? "Could not save", ok: false }); }
    setMsg({ text: "Saved.", ok: true });
    setEditing(false);
    router.refresh();
  }

  return (
    <>
      <div className="tx-ad__panel-head">
        <h2 className="tx-ad__h2">Profile</h2>
        {!editing && <button type="button" className="tx-ad__btn tx-ad__btn--light" onClick={() => { setEditing(true); setMsg({ text: "", ok: true }); }}>{icon.edit}Edit profile</button>}
      </div>
      <div className="tx-ad__card">
        <div className="tx-ad__card-head">
          <span className="tx-ad__avatar" aria-hidden="true">{(name || email).slice(0, 1).toUpperCase()}</span>
          <div>
            <p className="tx-ad__card-title">{name || "Your profile"}</p>
            <p className="tx-ad__soft">Thingx member</p>
          </div>
        </div>
        {!editing ? (
          <dl className="tx-ad__dl">
            <div className="tx-ad__dl-full"><dt>Full name</dt><dd>{name || "—"}</dd></div>
            <div className="tx-ad__dl-full"><dt>Mobile number</dt><dd>{phone || <span className="tx-ad__soft">Not added</span>}</dd></div>
            <div className="tx-ad__dl-full"><dt>Email</dt><dd>{email}</dd></div>
          </dl>
        ) : (
          <div className="tx-ad__inline">
            <form className="tx-ad__form" onSubmit={submit} noValidate>
              <div className="tx-ad__fields">
                <TxField name="name" label="Full name" defaultValue={name} autoComplete="name" error={fields.name} full />
                <TxField name="phone" type="tel" inputMode="tel" label="Mobile number (optional)" defaultValue={phone} autoComplete="tel" required={false} error={fields.phone} full />
                <label className="tx-ad__field tx-ad__field--full"><span>Email</span><input value={email} disabled readOnly /></label>
              </div>
              <Status {...msg} />
              <div className="tx-ad__sheet-foot">
                <button type="button" className="tx-ad__btn tx-ad__btn--light" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="tx-ad__btn" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
              </div>
            </form>
          </div>
        )}
        {!editing && <Status {...msg} />}
        <p className="tx-ad__secure">{icon.lock}Your email is how you sign in, so it can&apos;t be changed here.</p>
      </div>
      <div className="tx-ad__card"><PasswordForm /></div>
    </>
  );
}

export function PasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg({ text: "", ok: true }); setFields({});
    const r = await send("/api/account/password", "PUT", Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (!r.ok) { setFields(r.data.fields ?? {}); return setMsg({ text: r.data.error ?? "Could not change your password", ok: false }); }
    // Changing the password signs every device out, this one included.
    router.push("/login?next=/account");
    router.refresh();
  }

  return (
    <form className="tx-ad__form" onSubmit={submit} noValidate>
      <p className="tx-ad__card-title">Password</p>
      <div className="tx-ad__fields">
        <TxField name="currentPassword" type="password" label="Current password" autoComplete="current-password" error={fields.currentPassword} full />
        <TxField name="newPassword" type="password" label="New password" autoComplete="new-password" hint="At least 8 characters. You will be signed out everywhere afterwards." error={fields.newPassword} full />
      </div>
      <Status {...msg} />
      <div className="tx-ad__sheet-foot"><button type="submit" className="tx-ad__btn" disabled={busy}>{busy ? "Changing…" : "Change password"}</button></div>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const [removing, setRemoving] = useState<SavedAddress | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [fields, setFields] = useState<Record<string, string>>({});
  const current = editing && editing !== "new" ? editing : null;
  const open = (a: SavedAddress | "new") => { setEditing(a); setRemoving(null); setMsg({ text: "", ok: true }); setFields({}); };

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg({ text: "", ok: true }); setFields({});
    const f = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(f), isDefault: f.get("isDefault") === "on" };
    const r = current ? await send(`/api/account/addresses/${current.id}`, "PUT", body) : await send("/api/account/addresses", "POST", body);
    setBusy(false);
    if (!r.ok) { setFields(r.data.fields ?? {}); return setMsg({ text: r.data.error ?? "Could not save the address", ok: false }); }
    setEditing(null);
    router.refresh();
  }

  async function remove() {
    if (!removing) return;
    setBusy(true);
    const r = await send(`/api/account/addresses/${removing.id}`, "DELETE");
    setBusy(false);
    if (!r.ok) return setMsg({ text: r.data.error ?? "Could not remove the address", ok: false });
    setRemoving(null);
    router.refresh();
  }

  return (
    <>
      <div className="tx-ad__panel-head">
        <h2 className="tx-ad__h2">Saved addresses</h2>
        {addresses.length > 0 && !editing && <button type="button" className="tx-ad__btn tx-ad__btn--light" disabled={addresses.length >= 20} onClick={() => open("new")}>{icon.plus}Add address</button>}
      </div>

      {editing && (
        <div className="tx-ad__inline tx-ad__inline--address">
          <form key={current?.id ?? "new"} className="tx-ad__form" onSubmit={save} noValidate>
            <p className="tx-ad__sheet-title">{current ? "Edit address" : "New address"}</p>
            <div className="tx-ad__fields">
              <TxField name="recipient" label="Full name" defaultValue={current?.recipient} autoComplete="name" error={fields.recipient} />
              <TxField name="phone" type="tel" inputMode="tel" label="Mobile number" defaultValue={current?.phone} autoComplete="tel" error={fields.phone} />
              <TxField name="label" label="Label (optional)" defaultValue={current?.label} hint="For example Home or Office" required={false} full />
              <TxField name="line1" label="Flat, house no., street, area" defaultValue={current?.line1} autoComplete="address-line1" error={fields.line1} full />
              <TxField name="line2" label="Apartment, landmark (optional)" defaultValue={current?.line2} autoComplete="address-line2" required={false} full />
              <TxField name="city" label="City" defaultValue={current?.city} autoComplete="address-level2" error={fields.city} />
              <TxField name="postalCode" label="PIN code" defaultValue={current?.postalCode} inputMode="numeric" autoComplete="postal-code" error={fields.postalCode} />
              <label className="tx-ad__field"><span>State</span>
                <select name="state" required defaultValue={current?.state ?? ""} autoComplete="address-level1" className={fields.state ? "is-bad" : undefined}>
                  <option value="" disabled>Select state</option>
                  {INDIAN_STATES.map((st) => <option key={st}>{st}</option>)}
                </select>
                {fields.state && <small className="tx-ad__field-err">{fields.state}</small>}
              </label>
              <label className="tx-ad__field"><span>Country</span><select name="country" defaultValue="India"><option>India</option></select></label>
              <label className="tx-ad__check tx-ad__field--full"><input type="checkbox" name="isDefault" defaultChecked={current?.isDefault} /><span>Use as my default address</span></label>
            </div>
            <Status {...msg} />
            <div className="tx-ad__sheet-foot">
              <button type="button" className="tx-ad__btn tx-ad__btn--light" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="tx-ad__btn" disabled={busy}>{busy ? "Saving…" : "Save address"}</button>
            </div>
          </form>
        </div>
      )}

      {removing && (
        <div className="tx-ad__inline tx-ad__inline--confirm">
          <div className="tx-ad__form">
            <p className="tx-ad__confirm-title">Delete this address?</p>
            <p className="tx-ad__soft">{removing.line1}, {removing.city}</p>
            <Status {...msg} />
            <div className="tx-ad__sheet-foot">
              <button type="button" className="tx-ad__btn tx-ad__btn--light" onClick={() => setRemoving(null)}>Keep it</button>
              <button type="button" className="tx-ad__btn tx-ad__btn--danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

      {addresses.length > 0 ? (
        <ul className="tx-ad__addresses" role="list">
          {addresses.map((a) => (
            <li key={a.id} className={`tx-ad__address${a.isDefault ? " is-default" : ""}`}>
              <div className="tx-ad__address-head">
                <span className="tx-ad__chip tx-ad__chip--icon">{icon.pin}{a.label || a.city || "Address"}</span>
                {a.isDefault && <span className="tx-ad__status tx-ad__status--shipped">Default</span>}
              </div>
              <div className="tx-ad__address-body">
                <strong>{a.recipient}</strong><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.postalCode}
              </div>
              {a.phone && <p className="tx-ad__soft">{a.phone}</p>}
              <div className="tx-ad__address-actions">
                <button type="button" className="tx-ad__mini" onClick={() => open(a)}>{icon.edit}Edit</button>
                <button type="button" className="tx-ad__mini tx-ad__mini--danger" onClick={() => { setRemoving(a); setEditing(null); setMsg({ text: "", ok: true }); }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      ) : !editing && (
        <div className="tx-ad__empty">
          <span className="tx-ad__empty-icon">{icon.pin}</span>
          <p className="tx-ad__empty-title">No saved addresses</p>
          <p>Save an address once and check out faster next time.</p>
          <button type="button" className="tx-ad__btn" onClick={() => open("new")}>Add an address</button>
        </div>
      )}
    </>
  );
}

export function SignOut({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  return (
    <a className="tx-ad__out" href="/api/auth/logout" data-logout
      onClick={async (e) => { e.preventDefault(); await send("/api/auth/logout", "POST"); router.push("/"); router.refresh(); }}>
      {children}
    </a>
  );
}
