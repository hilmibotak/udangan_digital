import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Kamu harus login.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const invitations = await Invitation.find({
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: JSON.parse(JSON.stringify(invitations)),
    });
  } catch (error) {
    console.error("GET /api/invitations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data undangan.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Kamu harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      slug,
      template,

      groom,
      bride,

      eventDate,

      quranSurah,
      quranVerse,
      quranText,

      closingText, backgroundType, backgroundColor, backgroundGradient, backgroundImage, backgroundImagePublicId, rsvpEnabled, wishesEnabled,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Judul undangan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Slug undangan wajib diisi.",
        },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");

    if (!cleanSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "Slug tidak valid.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingInvitation = await Invitation.findOne({
      slug: cleanSlug,
    });

    if (existingInvitation) {
      return NextResponse.json(
        {
          success: false,
          message: "Slug tersebut sudah digunakan. Silakan gunakan slug lain.",
        },
        { status: 409 }
      );
    }

    const invitation = await Invitation.create({
      userId: session.user.id,

      title: title.trim(),

      slug: cleanSlug,

      template:
        ["elegant", "romantic", "modern", "luxury", "nusantara"].includes(
          template
        )
          ? template
          : "elegant",

      status: "draft",

      groom: {
        name: groom?.name?.trim() || "",
        nickname: groom?.nickname?.trim() || "",
        fatherName: groom?.fatherName?.trim() || "",
        motherName: groom?.motherName?.trim() || "",
        birthOrder: groom?.birthOrder?.trim() || "",
        instagram: groom?.instagram?.trim() || "",
        photo: groom?.photo || "",
        photoPublicId: groom?.photoPublicId || "",
      },

      bride: {
        name: bride?.name?.trim() || "",
        nickname: bride?.nickname?.trim() || "",
        fatherName: bride?.fatherName?.trim() || "",
        motherName: bride?.motherName?.trim() || "",
        birthOrder: bride?.birthOrder?.trim() || "",
        instagram: bride?.instagram?.trim() || "",
        photo: bride?.photo || "",
        photoPublicId: bride?.photoPublicId || "",
      },

      eventDate: eventDate ? new Date(eventDate) : null,

      quranSurah: quranSurah?.trim() || "",
      quranVerse: quranVerse?.trim() || "",
      quranText: quranText?.trim() || "",

      closingText: closingText?.trim() || "",
      backgroundType: ["color", "gradient", "image"].includes(backgroundType) ? backgroundType : "color",
      backgroundColor: /^#[0-9a-fA-F]{6}$/.test(backgroundColor || "") ? backgroundColor : "#f8f8f4",
      backgroundGradient: backgroundGradient?.trim() || "",
      backgroundImage: backgroundImage?.trim() || "",
      backgroundImagePublicId: backgroundImagePublicId?.trim() || "",
      rsvpEnabled: rsvpEnabled !== false,
      wishesEnabled: wishesEnabled !== false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Undangan berhasil dibuat.",
        data: JSON.parse(JSON.stringify(invitation)),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/invitations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat undangan.",
      },
      { status: 500 }
    );
  }
}