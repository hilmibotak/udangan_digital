"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

type Template =
  | "elegant"
  | "romantic"
  | "modern"
  | "luxury"
  | "nusantara";

type PersonForm = {
  name: string;
  nickname: string;
  fatherName: string;
  motherName: string;
  birthOrder: string;
  instagram: string;
};

const templates: {
  value: Template;
  name: string;
  description: string;
}[] = [
  {
    value: "elegant",
    name: "Elegant",
    description: "Minimalis, bersih, dan berkelas.",
  },
  {
    value: "romantic",
    name: "Romantic",
    description: "Nuansa romantis dengan sentuhan lembut.",
  },
  {
    value: "modern",
    name: "Modern",
    description: "Tampilan modern dan minimal.",
  },
  {
    value: "luxury",
    name: "Luxury",
    description: "Mewah dengan nuansa premium.",
  },
  {
    value: "nusantara",
    name: "Nusantara",
    description: "Terinspirasi budaya Indonesia.",
  },
];

const emptyPerson: PersonForm = {
  name: "",
  nickname: "",
  fatherName: "",
  motherName: "",
  birthOrder: "",
  instagram: "",
};

export default function InvitationCreateForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const [template, setTemplate] =
    useState<Template>("elegant");

  const [groom, setGroom] =
    useState<PersonForm>({ ...emptyPerson });

  const [bride, setBride] =
    useState<PersonForm>({ ...emptyPerson });

  const [eventDate, setEventDate] = useState("");

  const [quranSurah, setQuranSurah] = useState("");
  const [quranVerse, setQuranVerse] = useState("");
  const [quranText, setQuranText] = useState("");

  const [closingText, setClosingText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug) {
      const generatedSlug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");

      setSlug(generatedSlug);
    }
  }

  function updatePerson(
    type: "groom" | "bride",
    field: keyof PersonForm,
    value: string
  ) {
    if (type === "groom") {
      setGroom((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setBride((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Judul undangan wajib diisi.");
      return;
    }

    if (!slug.trim()) {
      setError("Slug undangan wajib diisi.");
      return;
    }

    if (!groom.name.trim()) {
      setError("Nama mempelai pria wajib diisi.");
      return;
    }

    if (!bride.name.trim()) {
      setError("Nama mempelai wanita wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          template,

          groom,
          bride,

          eventDate: eventDate
            ? new Date(eventDate).toISOString()
            : null,

          quranSurah,
          quranVerse,
          quranText,

          closingText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal membuat undangan."
        );
      }

      const invitationId = result.data?._id;

      if (!invitationId) {
        throw new Error(
          "Undangan berhasil dibuat tetapi ID tidak ditemukan."
        );
      }

      router.push(
        `/dashboard/undangan/${invitationId}`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* =========================
          INFORMASI DASAR
      ========================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Informasi Dasar
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tentukan judul dan alamat undangan kamu.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* Judul */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Judul Undangan
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                handleTitleChange(e.target.value)
              }
              placeholder="Pernikahan Hilmi & Aulia"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          {/* Slug */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              URL Undangan
            </label>

            <div className="flex overflow-hidden rounded-xl border border-slate-300 focus-within:border-slate-900">
              <div className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">
                /undangan/
              </div>

              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "")
                  )
                }
                placeholder="hilmi-aulia"
                className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Contoh: /undangan/hilmi-aulia
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          TEMPLATE
      ========================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Pilih Template
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Template dapat kamu ubah lagi nanti.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {templates.map((item) => {
            const selected =
              template === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setTemplate(item.value)
                }
                className={`relative rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                {selected && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}

                <div className="mb-3 h-24 rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-200" />

                <h3 className="font-semibold text-slate-900">
                  {item.name}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================
          MEMPELAI
      ========================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Data Mempelai
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Masukkan informasi kedua mempelai.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">

          {/* PRIA */}
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900">
                Mempelai Pria
              </h3>

              <p className="text-sm text-slate-500">
                Informasi calon mempelai pria.
              </p>
            </div>

            <PersonFields
              person={groom}
              type="groom"
              updatePerson={updatePerson}
            />
          </div>

          {/* WANITA */}
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900">
                Mempelai Wanita
              </h3>

              <p className="text-sm text-slate-500">
                Informasi calon mempelai wanita.
              </p>
            </div>

            <PersonFields
              person={bride}
              type="bride"
              updatePerson={updatePerson}
            />
          </div>
        </div>
      </section>

      {/* =========================
          ACARA
      ========================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Waktu Pernikahan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tanggal ini nantinya digunakan untuk countdown.
          </p>
        </div>

        <div className="max-w-md">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Tanggal & Waktu
          </label>

          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) =>
              setEventDate(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
      </section>

      {/* =========================
          AYAT
      ========================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Ayat / Kutipan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Bagian ini bisa dikosongkan.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Surah
            </label>

            <input
              type="text"
              value={quranSurah}
              onChange={(e) =>
                setQuranSurah(e.target.value)
              }
              placeholder="QS. Ar-Rum"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Ayat
            </label>

            <input
              type="text"
              value={quranVerse}
              onChange={(e) =>
                setQuranVerse(e.target.value)
              }
              placeholder="21"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Teks
            </label>

            <textarea
              value={quranText}
              onChange={(e) =>
                setQuranText(e.target.value)
              }
              rows={5}
              placeholder="Masukkan ayat atau kutipan..."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>
      </section>

      {/* =========================
          PENUTUP
      ========================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Pesan Penutup
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Pesan yang ditampilkan di bagian akhir undangan.
          </p>
        </div>

        <textarea
          value={closingText}
          onChange={(e) =>
            setClosingText(e.target.value)
          }
          rows={5}
          placeholder="Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir..."
          className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ACTION */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/undangan")
          }
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              Buat Undangan
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function PersonFields({
  person,
  type,
  updatePerson,
}: {
  person: PersonForm;
  type: "groom" | "bride";
  updatePerson: (
    type: "groom" | "bride",
    field: keyof PersonForm,
    value: string
  ) => void;
}) {
  return (
    <div className="space-y-4">

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nama Lengkap
        </label>

        <input
          type="text"
          value={person.name}
          onChange={(e) =>
            updatePerson(type, "name", e.target.value)
          }
          placeholder="Nama lengkap"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nama Panggilan
        </label>

        <input
          type="text"
          value={person.nickname}
          onChange={(e) =>
            updatePerson(type, "nickname", e.target.value)
          }
          placeholder="Nama panggilan"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nama Ayah
          </label>

          <input
            type="text"
            value={person.fatherName}
            onChange={(e) =>
              updatePerson(
                type,
                "fatherName",
                e.target.value
              )
            }
            placeholder="Nama ayah"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nama Ibu
          </label>

          <input
            type="text"
            value={person.motherName}
            onChange={(e) =>
              updatePerson(
                type,
                "motherName",
                e.target.value
              )
            }
            placeholder="Nama ibu"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Anak ke-
        </label>

        <input
          type="text"
          value={person.birthOrder}
          onChange={(e) =>
            updatePerson(
              type,
              "birthOrder",
              e.target.value
            )
          }
          placeholder="Contoh: 2 dari 3 bersaudara"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Instagram
        </label>

        <input
          type="text"
          value={person.instagram}
          onChange={(e) =>
            updatePerson(
              type,
              "instagram",
              e.target.value
            )
          }
          placeholder="@username"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
      </div>
    </div>
  );
}