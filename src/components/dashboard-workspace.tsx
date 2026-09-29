"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
/* eslint @next/next/no-img-element: off -- this is a local File preview before the asset is uploaded. */
import { useRouter } from "next/navigation";

type InvitationChoice = { _id: string; title?: string; slug: string; status: string; template?: string; groom?: { name?: string }; bride?: { name?: string } };
type Field = { key: string; label: string; type?: "text" | "url" | "date" | "number" | "textarea" | "select" | "file"; options?: [string, string][]; required?: boolean; max?: number; media?: "image" | "audio" };
type Row = Record<string, string | number | boolean | null | undefined> & { _id: string };
const nav = [["couple", "Data Mempelai"], ["events", "Acara"], ["love-story", "Love Story"], ["gallery", "Galeri"], ["music", "Musik"], ["rsvp", "RSVP"], ["guests", "Tamu"], ["wishes", "Ucapan"], ["gifts", "Hadiah Digital"], ["templates", "Template"], ["preview", "Preview Undangan"], ["settings", "Pengaturan"]] as const;
const config: Record<string, { title: string; api: string; fields: Field[]; readOnly?: boolean }> = {
  events: { title: "Acara", api: "/api/events", fields: [
    { key: "type", label: "Jenis acara", type: "select", required: true, options: [["akad", "Akad nikah"], ["reception", "Resepsi"], ["other", "Acara lain"]] }, { key: "title", label: "Nama acara", required: true }, { key: "date", label: "Tanggal", type: "date", required: true }, { key: "startTime", label: "Mulai (WIB)", required: true }, { key: "endTime", label: "Selesai (WIB)" }, { key: "venue", label: "Tempat", required: true }, { key: "address", label: "Alamat", type: "textarea", required: true }, { key: "mapsUrl", label: "Tautan Google Maps", type: "url" },
  ] },
  gallery: { title: "Galeri Foto", api: "/api/gallery", fields: [{ key: "imageUrl", label: "Foto", type: "file", media: "image", required: true }, { key: "caption", label: "Keterangan" }, { key: "sortOrder", label: "Urutan", type: "number" }] },
  "love-story": { title: "Love Story", api: "/api/love-stories", fields: [{ key: "year", label: "Tahun", type: "number", required: true }, { key: "title", label: "Judul", required: true }, { key: "description", label: "Cerita", type: "textarea", required: true }, { key: "imageUrl", label: "Foto", type: "file", media: "image" }, { key: "sortOrder", label: "Urutan", type: "number" }] },
  music: { title: "Musik Undangan", api: "/api/music", fields: [{ key: "title", label: "Judul lagu", required: true }, { key: "artist", label: "Artis", type: "text" }, { key: "audioUrl", label: "URL musik (HTTPS)", type: "url" }, { key: "audioFile", label: "Atau upload MP3 / WAV", type: "file", media: "audio" }, { key: "enabled", label: "Aktif di undangan", type: "select", options: [["true", "Aktif"], ["false", "Nonaktif"]] }] },
  gifts: { title: "Hadiah Digital", api: "/api/gifts", fields: [{ key: "type", label: "Jenis", type: "select", required: true, options: [["bank", "Bank"], ["ewallet", "E-wallet"], ["qris", "QRIS"]] }, { key: "provider", label: "Bank / penyedia", required: true }, { key: "accountNumber", label: "Nomor rekening / akun" }, { key: "accountName", label: "Nama pemilik" }, { key: "qrImage", label: "Gambar QRIS", type: "file", media: "image" }] },
  guests: { title: "Daftar Tamu", api: "/api/guests", fields: [{ key: "name", label: "Nama tamu", required: true }, { key: "phone", label: "Nomor WhatsApp" }, { key: "category", label: "Kategori" }, { key: "invitationStatus", label: "Undangan", type: "select", options: [["pending", "Belum dikirim"], ["sent", "Terkirim"]] }, { key: "rsvpStatus", label: "Kehadiran", type: "select", options: [["pending", "Belum konfirmasi"], ["attending", "Hadir"], ["not_attending", "Tidak hadir"], ["maybe", "Belum pasti"]] }] },
  rsvp: { title: "Konfirmasi RSVP", api: "/api/rsvp", readOnly: true, fields: [] },
  wishes: { title: "Ucapan & Doa", api: "/api/wishes", fields: [{ key: "status", label: "Tampilkan di undangan", type: "select", options: [["visible", "Tampilkan"], ["hidden", "Sembunyikan"]] }] },
};

export function DashboardWorkspace({ section, invitations }: { section: string; invitations: InvitationChoice[] }) {
  const router = useRouter();
  const [invitationId, setInvitationId] = useState(invitations[0]?._id ?? "");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [rsvpSummary, setRsvpSummary] = useState<{ totalGuests: number; attending: number; notAttending: number; pending: number; totalPeople: number } | null>(null);
  const [search, setSearch] = useState("");
  const selected = invitations.find((item) => item._id === invitationId);
  const current = config[section];
  const filtered = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [rows, search]);
  useEffect(() => { if (!filePreview) return; return () => URL.revokeObjectURL(filePreview); }, [filePreview]);

  const load = useCallback(async () => {
    if (section === "couple" || !current || !invitationId) { setRows([]); return; }
    setBusy(true); setError("");
    try { const response = await fetch(`${current.api}?invitationId=${encodeURIComponent(invitationId)}`, { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Data belum dapat dimuat."); const source = section === "rsvp" && result.data?.rows ? result.data.rows : result.data; const data = Array.isArray(source) ? source : source ? [source] : []; setRows(data as Row[]); setRsvpSummary(result.data?.stats ?? null); }
    catch (e) { setError(e instanceof Error ? e.message : "Data belum dapat dimuat."); }
    finally { setBusy(false); }
  }, [section, current, invitationId]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!current || !invitationId) return;
    const form = event.currentTarget; const formData = new FormData(form); const payload: Record<string, string | number | boolean> = { invitationId };
    setBusy(true); setError(""); setMessage("");
    try {
      for (const field of current.fields) {
        if (field.type === "file") {
          const file = formData.get(field.key);
          if (file instanceof File && file.size > 0) {
            const upload = new FormData(); upload.set("invitationId", invitationId); upload.set("file", file);
            const uploaded = await fetch(`/api/upload/${field.media}`, { method: "POST", body: upload }); const asset = await uploaded.json(); if (!uploaded.ok) throw new Error(asset.error || "Upload gagal. Silakan coba lagi.");
            payload[field.key === "audioFile" ? "audioUrl" : field.key] = asset.data.url; payload.publicId = asset.data.publicId;
          } else if (editing?.[field.key === "audioFile" ? "audioUrl" : field.key]) { payload[field.key === "audioFile" ? "audioUrl" : field.key] = String(editing[field.key === "audioFile" ? "audioUrl" : field.key]); if (editing.publicId) payload.publicId = String(editing.publicId); }
          else if (field.required) throw new Error(`Pilih ${field.label.toLowerCase()} terlebih dahulu.`);
          continue;
        }
        const value = String(formData.get(field.key) ?? "").trim();
        if (field.type === "number") payload[field.key] = value ? Number(value) : 0;
        else if (field.type === "select" && (field.key === "enabled")) payload[field.key] = value === "true";
        else payload[field.key] = value;
      }
      if (editing) delete payload.invitationId;
      const path = editing ? `/api/manage/${section}/${editing._id}?invitationId=${encodeURIComponent(invitationId)}` : current.api;
      const response = await fetch(path, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Data gagal disimpan.");
      setMessage("Data berhasil disimpan."); setEditing(null); form.reset(); setFilePreview(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Data gagal disimpan."); }
    finally { setBusy(false); }
  }

  async function remove(row: Row) {
    if (!current || !window.confirm("Hapus data ini?")) return;
    setBusy(true); setError("");
    try { const response = await fetch(`/api/manage/${section}/${row._id}?invitationId=${encodeURIComponent(invitationId)}`, { method: "DELETE" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Data gagal dihapus."); setMessage("Data berhasil dihapus."); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Data gagal dihapus."); }
    finally { setBusy(false); }
  }

  async function reorder(row: Row, amount: number) {
    try { const ordered = [...rows].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)); const index = ordered.findIndex((item) => item._id === row._id); const neighbor = index + amount; if (neighbor < 0 || neighbor >= ordered.length) return; [ordered[index], ordered[neighbor]] = [ordered[neighbor], ordered[index]]; await Promise.all(ordered.map((item, sortOrder) => fetch(`/api/manage/${section}/${item._id}?invitationId=${encodeURIComponent(invitationId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder }) }).then((response) => { if (!response.ok) throw new Error("Urutan gagal disimpan."); }))); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Urutan gagal disimpan."); }
  }

  async function share() {
    if (!selected) return;
    const url = `${window.location.origin}/undangan/${selected.slug}`;
    try { if (navigator.share) await navigator.share({ title: selected.title || selected.slug, url }); else { await navigator.clipboard.writeText(url); setMessage("Link undangan berhasil disalin."); } }
    catch { try { await navigator.clipboard.writeText(url); setMessage("Link undangan berhasil disalin."); } catch { setError("Link belum dapat disalin dari browser ini."); } }
  }
  async function changeStatus(status: "published" | "draft") {
    if (!selected) return;
    setBusy(true); setError(""); setMessage("");
    try { const response = await fetch(`/api/invitations/${selected._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Status undangan gagal diubah."); setMessage(status === "published" ? "Undangan berhasil dipublikasikan." : "Undangan dipindahkan ke draft."); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Status undangan gagal diubah."); }
    finally { setBusy(false); }
  }
  function shareWhatsapp() {
    if (!selected) return;
    const names = `${selected.groom?.name || ""} & ${selected.bride?.name || ""}`.trim();
    const url = `${window.location.origin}/undangan/${selected.slug}`;
    const text = `Assalamu'alaikum.\n\nDengan penuh kebahagiaan, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan ${names}.\n\nUndangan: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="dash-shell">
    <aside className="dash-sidebar"><Link href="/" className="brand"><span className="brand-mark">r.</span>ruangjanji</Link><div className="dash-nav-group"><Link href="/dashboard" className="dash-nav-link">Dashboard</Link><Link href="/dashboard/invitations" className="dash-nav-link">Undangan Saya</Link><Link href="/dashboard/invitations/create" className="dash-nav-link">+ Buat Undangan</Link></div><p className="dash-nav-label">KELOLA UNDANGAN</p><nav className="dash-nav-group">{nav.map(([key, label]) => <Link key={key} href={`/dashboard/${key}`} className={`dash-nav-link ${section === key ? "active" : ""}`}>{label}</Link>)}</nav><Link href="/dashboard/invitations/create" className="button-primary dash-side-create">Buat undangan</Link></aside>
    <section className="dash-main"><header className="dash-top"><Link href="/dashboard" className="brand dash-mobile-brand"><span className="brand-mark">r.</span>ruangjanji</Link><span className="dash-breadcrumb">Ruang kerja / {current?.title || "Data Mempelai"}</span><Link className="button-secondary" href="/dashboard/invitations">Semua undangan</Link></header><div className="dash-content"><div className="dash-title-row"><div><p className="eyebrow">RUANG KERJAMU</p><h1>{current?.title || "Data Mempelai"}</h1><p className="dash-subtitle">Kelola informasi yang akan tampil di undangan digitalmu.</p></div><Link className="button-secondary" href="/dashboard/invitations/create">+ Undangan baru</Link></div>
    {invitations.length === 0 ? <div className="dash-empty"><h2>Mulai dengan membuat undangan</h2><p>Data acara, foto, dan fitur lainnya akan terhubung ke undangan yang kamu pilih.</p><Link className="button-primary" href="/dashboard/invitations/create">Buat undangan</Link></div> : <>
      <label className="dash-invitation-select">Undangan aktif<select value={invitationId} onChange={(event) => { setInvitationId(event.target.value); setEditing(null); }}><option value="" disabled>Pilih undangan</option>{invitations.map((item) => <option key={item._id} value={item._id}>{item.title || `${item.groom?.name || "Mempelai"} & ${item.bride?.name || "Mempelai"}`} · {item.status}</option>)}</select></label>
      {selected && <div className="dash-share-row"><span>tautan publik · /undangan/{selected.slug}</span><div><Link href={`/undangan/${selected.slug}${selected.status === "published" ? "" : "?preview=1"}`} target="_blank" className="button-secondary">Preview ↗</Link><Link href={`/dashboard/invitations/${selected._id}`} className="button-secondary">Pengaturan</Link><button className="button-primary" disabled={busy} onClick={() => void changeStatus(selected.status === "published" ? "draft" : "published")}>{selected.status === "published" ? "Jadikan draft" : "Publikasikan"}</button>{selected.status === "published" && <><button className="button-secondary" onClick={share}>Bagikan</button><button className="button-secondary" onClick={shareWhatsapp}>WhatsApp</button></>}</div></div>}
      {section === "couple" ? <CoupleEditor key={invitationId} invitation={selected} onSaved={(text) => { setMessage(text); router.refresh(); }}/> : !current ? section === "templates" ? <TemplatePicker invitation={selected} onSaved={(text) => { setMessage(text); router.refresh(); }}/> : <div className="dash-empty"><h2>{section === "preview" ? "Preview undangan" : "Pengaturan undangan"}</h2><p>{section === "preview" ? "Lihat undangan sebelum membagikannya." : "Atur identitas, tautan, dan publikasi undangan."}</p><Link href={section === "preview" ? `/undangan/${selected?.slug}${selected?.status === "published" ? "" : "?preview=1"}` : `/dashboard/invitations/${selected?._id}`} target={section === "preview" ? "_blank" : undefined} className="button-primary">{section === "preview" ? "Buka preview" : "Buka pengaturan"}</Link></div> : <>
        {!current.readOnly && <form className="dash-form" onSubmit={save}><div className="dash-form-heading"><h2>{editing ? "Edit data" : section === "music" ? "Atur musik" : `Tambah ${current.title.toLowerCase()}`}</h2>{editing && <button className="text-button" type="button" onClick={() => setEditing(null)}>Batal mengedit</button>}</div><div className="dash-fields">{current.fields.map((field) => <label className="field-label" key={field.key}>{field.label}{field.type === "textarea" ? <textarea className="field-input" name={field.key} required={field.required} maxLength={field.max || 1000} defaultValue={String(editing?.[field.key] ?? "")}/> : field.type === "select" ? <select className="field-input" name={field.key} defaultValue={String(editing?.[field.key] ?? field.options?.[0]?.[0] ?? "")} required={field.required}>{field.options?.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : field.type === "file" ? <><input className="field-input" name={field.key} type="file" accept={field.media === "image" ? "image/jpeg,image/png,image/webp" : "audio/mpeg,audio/wav"} required={field.required && !editing?.[field.key]} onChange={(event) => { const file = event.target.files?.[0]; setFilePreview(file ? URL.createObjectURL(file) : ""); }}/><span className="field-hint">{field.media === "image" ? "JPG, PNG, WEBP · maksimal 5 MB" : "MP3, WAV · maksimal 10 MB"}{editing?.[field.key] ? " · pilih file baru untuk mengganti" : ""}</span>{filePreview && (field.media === "image" ? <img className="dash-upload-preview" src={filePreview} alt="Preview file sebelum diunggah"/> : <audio className="dash-audio-preview" controls src={filePreview}>Browser tidak mendukung pemutar audio.</audio>)}</> : <input className="field-input" name={field.key} type={field.type || "text"} required={field.required} maxLength={field.max || 500} defaultValue={field.type === "date" && editing?.[field.key] ? new Date(String(editing[field.key])).toISOString().slice(0, 10) : String(editing?.[field.key] ?? "")}/>}</label>)}</div><button className="button-primary" disabled={busy}>{busy ? "Mengunggah & menyimpan…" : editing ? "Simpan perubahan" : "Simpan data"}</button></form>}
        {current.readOnly && <div className="dash-stats">{rsvpSummary ? [{ label: "Total tamu", value: rsvpSummary.totalGuests }, { label: "Hadir", value: rsvpSummary.attending }, { label: "Tidak hadir", value: rsvpSummary.notAttending }, { label: "Belum konfirmasi", value: rsvpSummary.pending }, { label: "Total orang hadir", value: rsvpSummary.totalPeople }].map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>) : rsvpStats(rows).map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}</div>}
        {current.readOnly || section === "guests" || section === "wishes" || section === "gallery" || section === "events" || section === "love-story" || section === "gifts" || section === "music" ? <section className="dash-list-panel"><div className="dash-list-header"><div><h2>{current.title}</h2><p>{rows.length} item{rows.length === 1 ? "" : "s"}</p></div>{rows.length > 3 && <input className="field-input dash-search" placeholder="Cari…" value={search} onChange={(event) => setSearch(event.target.value)}/>}</div>{busy && !rows.length ? <p className="dash-loading">Memuat data…</p> : filtered.length === 0 ? <p className="dash-empty-inline">Belum ada data untuk undangan ini.</p> : <div className="dash-record-list">{filtered.map((row) => <article className="dash-record" key={row._id}><RecordContent section={section} row={row}/><div className="dash-record-actions">{["gallery", "love-story"].includes(section) && <><button onClick={() => reorder(row, -1)} aria-label="Naikkan urutan">↑</button><button onClick={() => reorder(row, 1)} aria-label="Turunkan urutan">↓</button></>}{!current.readOnly && <button onClick={() => setEditing(row)}>Edit</button>}<button className="danger" onClick={() => void remove(row)}>{current.readOnly ? "Hapus" : "Hapus"}</button></div></article>)}</div>}</section> : null}
      </>}
    </>}{message && <p className="dash-alert success" role="status">{message}</p>}{error && <p className="dash-alert error" role="alert">{error}</p>}</div></section>
    <nav className="dash-mobile-nav">{[["/dashboard", "Home"], ["/dashboard/couple", "Mempelai"], ["/dashboard/events", "Acara"], ["/dashboard/gallery", "Galeri"], ["/dashboard/rsvp", "RSVP"], ["/dashboard/music", "Musik"]].map(([href, label]) => <Link key={href} href={href} className={href === `/dashboard/${section}` ? "active" : ""}>{label}</Link>)}</nav>
  </div>;
}

function rsvpStats(rows: Row[]) { const total = rows.length; const attending = rows.filter((row) => row.attendance === "attending"); const declined = rows.filter((row) => row.attendance === "not_attending"); return [{ label: "Total RSVP", value: total }, { label: "Hadir", value: attending.length }, { label: "Tidak hadir", value: declined.length }, { label: "Total orang hadir", value: attending.reduce((sum, row) => sum + Number(row.guestCount || 0), 0) }]; }
function RecordContent({ section, row }: { section: string; row: Row }) {
  const main = section === "events" ? String(row.title || "Acara") : section === "gallery" ? String(row.caption || "Foto galeri") : section === "love-story" ? `${row.year || ""} · ${row.title || "Cerita"}` : section === "music" ? String(row.title || "Musik") : section === "gifts" ? `${row.provider || "Hadiah"} · ${row.accountNumber || "QR"}` : section === "guests" ? String(row.name || "Tamu") : section === "rsvp" || section === "wishes" ? String(row.guestName || "Tamu") : "Data";
  const detail = section === "events" ? `${displayDate(row.date)} · ${row.startTime || ""} · ${row.venue || ""}` : section === "gallery" ? `Urutan ${row.sortOrder ?? 0}${row.imageUrl ? ` · ${row.caption || "Foto"}` : ""}` : section === "rsvp" ? `${attendanceText(String(row.attendance))} · ${row.guestCount || 0} orang · ${row.message || "Tanpa catatan"}` : section === "wishes" ? String(row.message || "") : section === "guests" ? `${row.phone || "Tanpa nomor"} · ${row.category || "Umum"} · ${attendanceText(String(row.rsvpStatus))}` : section === "music" ? (row.enabled ? "Aktif di undangan" : "Nonaktif") : section === "events" ? "" : String(row.description || row.type || "");
  return <div className="dash-record-copy">{section === "gallery" && row.imageUrl && <Image src={String(row.imageUrl)} alt={String(row.caption || "Foto galeri")} width={108} height={108} sizes="54px" loading="lazy"/>}<div><strong>{main}</strong><span>{detail}</span>{section === "music" && row.audioUrl && <audio controls preload="none" src={String(row.audioUrl)} aria-label={`Preview ${main}`}>Browser tidak mendukung pemutar audio.</audio>}</div></div>;
}
function displayDate(value: Row["date"]) { if (!value) return ""; return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(String(value))); }
function attendanceText(value: string) { return ({ attending: "Hadir", not_attending: "Tidak hadir", maybe: "Belum pasti", pending: "Belum konfirmasi" } as Record<string, string>)[value] || value; }

function TemplatePicker({ invitation, onSaved }: { invitation?: InvitationChoice; onSaved: (message: string) => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const invitationId = invitation?._id;
  if (!invitation || !invitationId) return null;
  const choices = [["elegant", "Elegant Romantic", "Ivory · sage · rose"], ["modern", "Minimal Modern", "Bersih · editorial"], ["luxury", "Luxury Gold", "Deep green · gold"], ["romantic", "Garden", "Warm rose · floral"], ["nusantara", "Nusantara", "Ornamen tradisional"]];
  async function choose(template: string) {
    setBusy(true); setError("");
    try { const response = await fetch(`/api/invitations/${invitationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Template gagal diubah."); onSaved("Template undangan berhasil diubah."); }
    catch (e) { setError(e instanceof Error ? e.message : "Template gagal diubah."); }
    finally { setBusy(false); }
  }
  return <section className="dash-template-grid">{choices.map(([value, title, description]) => <button className={`dash-template-option ${invitation.template === value ? "selected" : ""}`} key={value} disabled={busy} onClick={() => void choose(value)}><span className={`dash-template-swatch swatch-${value}`}><i>&</i></span><strong>{title}</strong><small>{description}</small>{invitation.template === value && <em>Template aktif</em>}</button>)}{error && <p className="dash-alert error">{error}</p>}</section>;
}

function CoupleEditor({ invitation, onSaved }: { invitation?: InvitationChoice; onSaved: (text: string) => void }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [groomPreview, setGroomPreview] = useState(""); const [bridePreview, setBridePreview] = useState(""); const [removeGroomPhoto, setRemoveGroomPhoto] = useState(false); const [removeBridePhoto, setRemoveBridePhoto] = useState(false);
  const invitationId = invitation?._id;
  useEffect(() => { if (invitationId) void fetch(`/api/invitations/${invitationId}`).then((r) => r.json()).then((result) => { if (result.data) setData(result.data as Record<string, unknown>); else setError(result.error || "Data mempelai belum dapat dimuat."); }).catch(() => setError("Data mempelai belum dapat dimuat.")); }, [invitationId]);
  useEffect(() => { if (groomPreview) return () => URL.revokeObjectURL(groomPreview); }, [groomPreview]);
  useEffect(() => { if (bridePreview) return () => URL.revokeObjectURL(bridePreview); }, [bridePreview]);
  if (!invitation) return null;
  async function save(event: FormEvent<HTMLFormElement>) {
    if (!invitationId) return;
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); setBusy(true); setError("");
    const groom = { ...((data?.groom || {}) as Record<string, unknown>) }; const bride = { ...((data?.bride || {}) as Record<string, unknown>) };
    try {
      for (const person of ["groom", "bride"] as const) {
        const target = person === "groom" ? groom : bride;
        for (const key of ["name", "nickname", "fatherName", "motherName", "birthOrder", "instagram"]) target[key] = String(values.get(`${person}_${key}`) || "").trim();
        const file = values.get(`${person}_photo`); if (file instanceof File && file.size) { const upload = new FormData(); upload.set("invitationId", invitationId); upload.set("file", file); const response = await fetch("/api/upload/image", { method: "POST", body: upload }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Upload foto gagal."); target.photo = result.data.url; target.photoPublicId = result.data.publicId; } else if (person === "groom" ? removeGroomPhoto : removeBridePhoto) { target.photo = ""; target.photoPublicId = ""; }
      }
      const response = await fetch(`/api/invitations/${invitationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groom, bride }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Data mempelai gagal disimpan."); setData(result.data);
      for (const [before, after] of [[(data?.groom as Record<string, string> | undefined)?.photoPublicId, groom.photoPublicId], [(data?.bride as Record<string, string> | undefined)?.photoPublicId, bride.photoPublicId]]) if (before && before !== after) void fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId, publicId: before, kind: "image" }) });
      setGroomPreview(""); setBridePreview(""); setRemoveGroomPhoto(false); setRemoveBridePhoto(false); onSaved("Data mempelai berhasil disimpan.");
    } catch (e) { setError(e instanceof Error ? e.message : "Data mempelai gagal disimpan."); }
    finally { setBusy(false); }
  }
  const person = (key: "groom" | "bride", label: string) => { const value = (data?.[key] || {}) as Record<string, string>; const preview = key === "groom" ? groomPreview : bridePreview; const removed = key === "groom" ? removeGroomPhoto : removeBridePhoto; return <fieldset className="dash-person"><legend>{label}</legend>{preview ? <img className="dash-couple-preview" src={preview} alt={`Preview foto ${label}`}/> : value.photo && !removed ? <Image className="dash-couple-preview" src={value.photo} alt={`Foto ${label}`} width={180} height={200} sizes="90px" loading="lazy"/> : null}<div className="dash-fields">{[["name","Nama lengkap"],["nickname","Nama panggilan"],["fatherName","Nama ayah"],["motherName","Nama ibu"],["birthOrder","Urutan anak"],["instagram","Instagram"]].map(([field, title]) => <label className="field-label" key={field}>{title}<input className="field-input" name={`${key}_${field}`} defaultValue={value[field] || ""} maxLength={120}/></label>)}<label className="field-label">Foto mempelai<input className="field-input" type="file" name={`${key}_photo`} accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; const next = file ? URL.createObjectURL(file) : ""; if (key === "groom") { setGroomPreview(next); setRemoveGroomPhoto(false); } else { setBridePreview(next); setRemoveBridePhoto(false); } }}/><span className="field-hint">JPG, PNG, WEBP · maksimal 5 MB</span></label>{value.photo && !removed && <button className="text-button dash-remove-photo" type="button" onClick={() => { if (key === "groom") { setRemoveGroomPhoto(true); setGroomPreview(""); } else { setRemoveBridePhoto(true); setBridePreview(""); } }}>Hapus foto saat disimpan</button>}</div></fieldset>; };
  return <form className="dash-form" onSubmit={save}><div className="dash-form-heading"><h2>Profil kedua mempelai</h2></div>{person("groom", "Mempelai pria")}{person("bride", "Mempelai wanita")}<button className="button-primary" disabled={busy}>{busy ? "Mengunggah & menyimpan…" : "Simpan profil"}</button>{error && <p role="alert" className="dash-alert error">{error}</p>}</form>;
}
