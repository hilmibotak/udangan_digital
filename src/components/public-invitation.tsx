"use client";
/* eslint @next/next/no-img-element: off -- image URLs are user-managed Cloudinary assets; no fixed remote image domain is configured. */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowDown, ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Copy, MapPin, Music2, Pause, Play, X } from "lucide-react";

type Couple = { name: string; nickname?: string; fatherName: string; motherName: string; birthOrder?: string; instagram?: string; photo?: string };
type EventItem = { _id: string; type: string; title: string; date: string; startTime: string; endTime: string; venue: string; address: string; mapsUrl: string };
type GalleryItem = { _id: string; imageUrl: string; caption: string };
type GiftItem = { _id: string; type: string; provider: string; accountNumber: string; accountName: string; qrImage: string };
type StoryItem = { _id: string; year: number; title: string; description: string; imageUrl: string };
type WishItem = { _id?: string; guestName: string; message: string; createdAt?: string };
type Invitation = {
  groom: Couple; bride: Couple; template: string; eventDate?: string | null;
  quranSurah?: string; quranVerse?: string; quranText?: string; closingText?: string;
};

export function PublicInvitation({ slug, invitation, guestName, events, gallery, gifts, music, stories, initialWishes, totalWishes }: {
  slug: string; invitation: Invitation; guestName: string; events: EventItem[]; gallery: GalleryItem[];
  gifts: GiftItem[]; music: { title: string; audioUrl: string } | null; stories: StoryItem[];
  initialWishes: WishItem[]; totalWishes: number;
}) {
  const [opened, setOpened] = useState(false);
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [wishes, setWishes] = useState(initialWishes);
  const [wishOffset, setWishOffset] = useState(initialWishes.length);
  const [hasMoreWishes, setHasMoreWishes] = useState(initialWishes.length < totalWishes);
  const groom = invitation.groom;
  const bride = invitation.bride;
  const targetDate = invitation.eventDate || events[0]?.date || null;
  const eventHeroImage = gallery[0]?.imageUrl || groom.photo || bride.photo;

  useEffect(() => {
    if (activePhoto === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePhoto(null);
      if (event.key === "ArrowRight") setActivePhoto((current) => current === null ? null : (current + 1) % gallery.length);
      if (event.key === "ArrowLeft") setActivePhoto((current) => current === null ? null : (current - 1 + gallery.length) % gallery.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [activePhoto, gallery.length]);

  useEffect(() => {
    if (!opened) return;
    const sections = document.querySelectorAll<HTMLElement>(".inv-reveal");
    if (!("IntersectionObserver" in window)) {
      sections.forEach((section) => section.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -45px 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [opened, events.length, gallery.length, gifts.length, stories.length]);

  async function loadMoreWishes() {
    const response = await fetch(`/api/public/${encodeURIComponent(slug)}/wishes?skip=${wishOffset}`, { cache: "no-store" });
    if (!response.ok) return;
    const result = await response.json() as { data: WishItem[]; total: number };
    setWishes((current) => [...current, ...result.data]);
    setWishOffset((current) => current + result.data.length);
    setHasMoreWishes(wishOffset + result.data.length < result.total);
  }

  function openInvitation() {
    setOpened(true);
    window.dispatchEvent(new Event("invitation:opened"));
    window.setTimeout(() => document.getElementById("invitation-content")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  return <main className={`invitation invitation-${invitation.template}`}>
    <section id="home" className={`inv-cover ${opened ? "inv-cover-open" : ""}`} style={eventHeroImage ? { backgroundImage: `linear-gradient(180deg,rgba(24,32,26,.24),rgba(24,32,26,.62)),url("${safeCssUrl(eventHeroImage)}")` } : undefined}>
      <div className="inv-cover-grain" />
      <div className="inv-cover-content">
        <span className="inv-kicker">THE WEDDING CELEBRATION</span>
        <span className="inv-flower" aria-hidden="true">✳</span>
        <h1><span>{groom.name || "Mempelai pria"}</span><i>&</i><span>{bride.name || "Mempelai wanita"}</span></h1>
        {targetDate && <p className="inv-date-line">{formatDate(targetDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>}
        <div className="inv-address"><span>Kepada Yth.</span><strong>{guestName || "Bapak/Ibu/Saudara/i"}</strong><small>Mohon maaf apabila terdapat kesalahan dalam penulisan nama atau gelar.</small></div>
        <button className="inv-open-button" onClick={openInvitation}>Buka Undangan <ArrowDown size={15}/></button>
      </div>
      <span className="inv-cover-side">A DAY TO REMEMBER · WITH LOVE</span>
    </section>

    <div id="invitation-content" className={`inv-body ${opened ? "inv-body-visible" : ""}`}>
      <header className="inv-hero" style={eventHeroImage ? { backgroundImage: `linear-gradient(180deg,rgba(33,42,34,.10),rgba(33,42,34,.60)),url("${safeCssUrl(eventHeroImage)}")` } : undefined}>
        <div className="inv-hero-inner"><p className="inv-kicker">BISMILLAHIRRAHMANIRRAHIM</p><p className="inv-hero-label">The Wedding Of</p><h2>{groom.name}<i>&</i>{bride.name}</h2>{targetDate && <p className="inv-hero-date">{formatDate(targetDate, { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", " · ")}</p>}<a className="inv-scroll-cue" href="#countdown" aria-label="Gulir ke undangan"><ArrowDown size={16}/></a></div>
      </header>

      <section id="countdown" className="inv-countdown section-pad inv-reveal"><p className="inv-kicker">MENUJU HARI BAHAGIA</p><h2>Awal dari selamanya</h2>{targetDate ? <Countdown target={targetDate}/> : <p className="inv-muted">Tanggal acara akan segera diumumkan.</p>}</section>

      {(invitation.quranText || invitation.quranSurah || invitation.quranVerse) && <section className="inv-quote section-pad inv-reveal"><span className="inv-quote-mark">“</span><p className="inv-arabic" lang="ar" dir="rtl">{invitation.quranText}</p><p className="inv-quote-ref">{[invitation.quranSurah, invitation.quranVerse].filter(Boolean).join(" : ")}</p></section>}

      <section className="inv-couple section-pad inv-reveal"><div className="inv-section-title"><p className="inv-kicker">DUA HATI, SATU CERITA</p><h2>We Are Getting Married</h2><span className="inv-divider">✳</span></div><div className="inv-couple-grid"><PersonCard person={groom} label="Mempelai Pria" gender="Putra"/><span className="inv-couple-sign">&</span><PersonCard person={bride} label="Mempelai Wanita" gender="Putri"/></div></section>

      {stories.length > 0 && <section className="inv-story section-pad inv-reveal"><div className="inv-section-title"><p className="inv-kicker">JEJAK YANG KAMI TEMPUH</p><h2>Love Story</h2></div><div className="inv-timeline">{stories.map((story) => <article className="inv-story-item" key={story._id}><span className="inv-story-year">{story.year}</span><div className="inv-story-card">{story.imageUrl && <Image src={story.imageUrl} width={260} height={172} sizes="(max-width: 700px) 75px, 130px" alt="" loading="lazy"/>}<div><h3>{story.title}</h3><p>{story.description}</p></div></div></article>)}</div></section>}

      {events.length > 0 && <section className="inv-events section-pad inv-reveal"><div className="inv-section-title"><p className="inv-kicker">CATAT TANGGALNYA</p><h2>Acara Pernikahan</h2></div><div className="inv-event-grid">{events.map((event) => <EventCard event={event} key={event._id}/>)}</div></section>}

      {gallery.length > 0 && <section className="inv-gallery section-pad inv-reveal"><div className="inv-section-title"><p className="inv-kicker">FRAGMEN KISAH KAMI</p><h2>Gallery</h2><p className="inv-muted">Sebuah cerita, dalam potongan kenangan.</p></div><div className="inv-gallery-grid">{gallery.map((photo, index) => <button className={`inv-gallery-photo inv-gallery-photo-${index % 5}`} key={photo._id} onClick={() => setActivePhoto(index)} aria-label={`Lihat foto ${index + 1}`}><Image src={photo.imageUrl} width={640} height={640} sizes="(max-width: 700px) 50vw, 25vw" alt={photo.caption || `Momen ${index + 1}`} loading="lazy"/>{photo.caption && <span>{photo.caption}</span>}</button>)}</div></section>}

      {gifts.length > 0 && <section className="inv-gifts section-pad inv-reveal"><div className="inv-section-title"><p className="inv-kicker">TANDA KASIH</p><h2>Wedding Gift</h2><p className="inv-muted">Doa restu Anda adalah hadiah terindah. Jika ingin berbagi tanda kasih, kami menerimanya dengan penuh syukur.</p></div><div className="inv-gift-grid">{gifts.map((gift) => <GiftCard gift={gift} key={gift._id}/>)}</div></section>}

      <section className="inv-rsvp section-pad inv-reveal"><div className="inv-section-title"><p className="inv-kicker">KEHADIRAN ANDA BERARTI</p><h2>Konfirmasi Kehadiran</h2><p className="inv-muted">Mohon konfirmasi kehadiran Anda melalui formulir berikut.</p></div><GuestForm slug={slug} kind="rsvp" guestName={guestName}/></section>

      <section className="inv-wishes section-pad inv-reveal"><div className="inv-section-title"><p className="inv-kicker">DOA BAIK UNTUK KAMI</p><h2>Ucapan & Doa</h2></div><div className="inv-wish-layout"><GuestForm slug={slug} kind="wishes" guestName={guestName} onWish={(wish) => { setWishes((current) => [wish, ...current]); setWishOffset((current) => current + 1); }}/><div className="inv-wish-list" aria-live="polite">{wishes.length ? wishes.map((wish, index) => <article className="inv-wish-card" key={wish._id || `${wish.guestName}-${index}`}><div className="inv-wish-top"><strong>{wish.guestName}</strong><span>{wish.createdAt ? relativeTime(wish.createdAt) : "Baru saja"}</span></div><p>{wish.message}</p></article>) : <p className="inv-empty-wish">Jadilah yang pertama mengirim doa.</p>}{hasMoreWishes && <button className="inv-load-more" onClick={loadMoreWishes}>Muat ucapan lainnya</button>}</div></div></section>

      <footer className="inv-closing inv-reveal" style={eventHeroImage ? { backgroundImage: `linear-gradient(180deg,rgba(32,42,34,.78),rgba(32,42,34,.76)),url("${safeCssUrl(eventHeroImage)}")` } : undefined}><span className="inv-closing-flower">✳</span><p>{invitation.closingText || "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."}</p><p className="inv-closing-salam">Wassalamu’alaikum Warahmatullahi Wabarakatuh</p>{eventHeroImage ? <div className="inv-closing-portrait"><Image src={eventHeroImage} width={188} height={188} sizes="94px" alt={`${groom.name} dan ${bride.name}`} loading="lazy"/></div> : null}<h2>{groom.name} <i>&</i> {bride.name}</h2><small>WITH LOVE, ALWAYS</small></footer>
    </div>

    {music && <MusicToggle music={music}/>}
    {activePhoto !== null && <div className="inv-lightbox" role="dialog" aria-modal="true" aria-label="Galeri foto" onClick={() => setActivePhoto(null)}><button className="inv-lightbox-close" onClick={() => setActivePhoto(null)} aria-label="Tutup"><X/></button><button className="inv-lightbox-arrow inv-lightbox-prev" onClick={(event) => { event.stopPropagation(); setActivePhoto((activePhoto - 1 + gallery.length) % gallery.length); }} aria-label="Foto sebelumnya"><ArrowLeft/></button><figure onClick={(event) => event.stopPropagation()}><Image src={gallery[activePhoto].imageUrl} width={1600} height={1200} sizes="90vw" alt={gallery[activePhoto].caption || "Foto pasangan"}/>{gallery[activePhoto].caption && <figcaption>{gallery[activePhoto].caption}</figcaption>}</figure><button className="inv-lightbox-arrow inv-lightbox-next" onClick={(event) => { event.stopPropagation(); setActivePhoto((activePhoto + 1) % gallery.length); }} aria-label="Foto berikutnya"><ArrowRight/></button></div>}
  </main>;
}

function safeCssUrl(value: string) { return value.replace(/["\\()\n\r]/g, ""); }
function formatDate(value: string, options: Intl.DateTimeFormatOptions) { return new Intl.DateTimeFormat("id-ID", { ...options, timeZone: "Asia/Jakarta" }).format(new Date(value)); }

function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    let timer: number | undefined;
    const update = () => {
      const next = new Date(target).getTime() - Date.now();
      setRemaining(Math.max(0, next));
      if (next <= 0 && timer !== undefined) window.clearInterval(timer);
      return next;
    };
    if (update() > 0) timer = window.setInterval(update, 1000);
    return () => { if (timer !== undefined) window.clearInterval(timer); };
  }, [target]);
  const seconds = remaining === null ? null : Math.floor(remaining / 1000);
  const values = seconds === null ? ["—", "—", "—", "—"] : [Math.floor(seconds / 86400), Math.floor((seconds % 86400) / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((n) => String(n).padStart(2, "0"));
  return <div className="inv-countdown-grid">{["Hari", "Jam", "Menit", "Detik"].map((label, i) => <div key={label}><strong>{values[i]}</strong><span>{label}</span></div>)}</div>;
}

function PersonCard({ person, label, gender }: { person: Couple; label: string; gender: "Putra" | "Putri" }) {
  const handle = person.instagram?.replace(/^@/, "").trim();
  return <article className="inv-person">{person.photo ? <Image className="inv-person-photo" src={person.photo} width={420} height={540} sizes="178px" alt={person.name} loading="lazy"/> : <div className="inv-person-monogram">{person.name?.trim().charAt(0) || "✳"}</div>}<span className="inv-person-label">{label}</span><h3>{person.name}</h3>{person.nickname && <p className="inv-person-nickname">“{person.nickname}”</p>}{(person.fatherName || person.motherName) && <p className="inv-person-parents">{gender}{person.birthOrder ? ` ke-${person.birthOrder}` : ""} dari<br/>{person.fatherName || "—"} & {person.motherName || "—"}</p>}{handle && /^[a-zA-Z0-9._]{1,30}$/.test(handle) && <a className="inv-person-instagram" href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noreferrer">@{handle}</a>}</article>;
}

function EventCard({ event }: { event: EventItem }) {
  return <article className="inv-event-card"><span className="inv-event-icon"><CalendarDays size={18}/></span><p className="inv-event-type">{event.type === "akad" ? "AKAD NIKAH" : event.type === "reception" ? "RESEPSI" : "ACARA"}</p><h3>{event.title}</h3><div className="inv-event-detail"><CalendarDays size={15}/><span>{formatDate(event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></div><div className="inv-event-detail"><Clock3 size={15}/><span>{event.startTime}{event.endTime ? ` — ${event.endTime}` : " — selesai"} WIB</span></div><div className="inv-event-detail"><MapPin size={15}/><span><b>{event.venue}</b><br/>{event.address}</span></div>{event.mapsUrl && <a className="inv-map-button" href={event.mapsUrl} target="_blank" rel="noreferrer">Lihat Lokasi <ArrowRight size={14}/></a>}</article>;
}

function GiftCard({ gift }: { gift: GiftItem }) {
  const [copied, setCopied] = useState(false);
  async function copyNumber() { try { await navigator.clipboard.writeText(gift.accountNumber); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); } }
  return <article className="inv-gift-card"><span className="inv-gift-type">{gift.type === "qris" ? "QRIS" : gift.type === "ewallet" ? "E-WALLET" : "REKENING BANK"}</span><h3>{gift.provider}</h3>{gift.qrImage && <a className="inv-qr-link" href={gift.qrImage} target="_blank" rel="noreferrer"><Image src={gift.qrImage} width={284} height={284} sizes="142px" alt={`QR ${gift.provider}`} loading="lazy"/><span>Ketuk untuk memperbesar</span></a>}{gift.accountNumber && <><strong className="inv-account-number">{gift.accountNumber}</strong><span className="inv-account-name">a.n. {gift.accountName}</span><button className="inv-copy-button" onClick={copyNumber}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Nomor rekening berhasil disalin" : "Salin rekening"}</button></>}</article>;
}

function MusicToggle({ music }: { music: { title: string; audioUrl: string } }) {
  const audio = useRef<HTMLAudioElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const tryPlay = () => { if (!userPaused.current) void audio.current?.play().catch(() => undefined); };
    window.addEventListener("invitation:opened", tryPlay);
    return () => window.removeEventListener("invitation:opened", tryPlay);
  }, []);
  const toggle = useCallback(async () => {
    const element = audio.current; if (!element) return;
    if (element.paused) { try { await element.play(); userPaused.current = false; setPlaying(true); } catch { setPlaying(false); } }
    else { userPaused.current = true; element.pause(); setPlaying(false); }
  }, []);
  return <><audio ref={audio} src={music.audioUrl} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}/><button className={`inv-music-toggle ${playing ? "is-playing" : ""}`} onClick={toggle} aria-label={playing ? `Jeda musik ${music.title}` : `Putar musik ${music.title}`} title={music.title}>{playing ? <Pause size={18}/> : <Play size={18}/>}<Music2 size={13}/></button></>;
}

function GuestForm({ slug, kind, guestName, onWish }: { slug: string; kind: "rsvp" | "wishes"; guestName: string; onWish?: (wish: WishItem) => void }) {
  const [state, setState] = useState(""); const [busy, setBusy] = useState(false); const [guestCount, setGuestCount] = useState(1);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setBusy(true); setState(""); const data = new FormData(form);
    const payload = kind === "rsvp" ? { guestName: data.get("name"), attendance: data.get("attendance"), guestCount: data.get("guestCount"), message: data.get("message") } : { guestName: data.get("name"), message: data.get("message") };
    try {
      const response = await fetch(`/api/public/${encodeURIComponent(slug)}/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Pengiriman gagal.");
      setState(kind === "rsvp" ? "Terima kasih, konfirmasi kehadiran Anda sudah tercatat." : "Terima kasih atas doa baik Anda.");
      if (kind === "wishes") { onWish?.(result.data as WishItem); form.reset(); }
    } catch (error) { setState(error instanceof Error ? error.message : "Pengiriman gagal. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="inv-form"><label>Nama<input className="field-input" name="name" required minLength={2} maxLength={100} defaultValue={guestName} placeholder="Nama Anda" autoComplete="name"/></label>{kind === "rsvp" && <><fieldset className="inv-attendance"><legend>Konfirmasi Kehadiran</legend><div>{[["attending","Hadir"],["not_attending","Tidak hadir"],["maybe","Belum pasti"]].map(([value,label])=><label key={value}><input type="radio" name="attendance" value={value} defaultChecked={value==="attending"}/><span>{label}</span></label>)}</div></fieldset><fieldset className="inv-guest-count"><legend>Jumlah Tamu</legend><button type="button" aria-label="Kurangi jumlah tamu" onClick={() => setGuestCount((count) => Math.max(1, count - 1))}>−</button><strong>{guestCount}</strong><input type="hidden" name="guestCount" value={guestCount}/><button type="button" aria-label="Tambah jumlah tamu" onClick={() => setGuestCount((count) => Math.min(20, count + 1))}>+</button><span>orang</span></fieldset></>}<label>{kind === "rsvp" ? "Ucapan & doa (opsional)" : "Ucapan & doa"}<textarea className="field-input" name="message" maxLength={1000} minLength={kind === "wishes" ? 2 : undefined} required={kind === "wishes"} placeholder={kind === "rsvp" ? "Tuliskan pesan untuk kedua mempelai" : "Semoga menjadi keluarga yang bahagia…"}/></label><button className="inv-submit" disabled={busy}>{busy ? "Mengirim…" : kind === "rsvp" ? "Kirim Konfirmasi" : "Kirim Ucapan"}<ArrowRight size={15}/></button>{state && <p className="inv-form-status" role="status">{state}</p>}</form>;
}

function relativeTime(date: string) { const elapsed = Math.max(0, Date.now() - new Date(date).getTime()); const minutes = Math.floor(elapsed / 60_000); if (minutes < 1) return "Baru saja"; if (minutes < 60) return `${minutes} menit lalu`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours} jam lalu`; return `${Math.floor(hours / 24)} hari lalu`; }
