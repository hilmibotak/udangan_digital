import mongoose, { Schema } from "mongoose";

const personSchema = new Schema({ name: { type: String, default: "" }, nickname: { type: String, default: "" }, fatherName: { type: String, default: "" }, motherName: { type: String, default: "" }, birthOrder: { type: String, default: "" }, instagram: { type: String, default: "" }, photo: { type: String, default: "" }, photoPublicId: { type: String, default: "" } }, { _id: false });
const invitationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: { type: String, default: "", trim: true, maxlength: 120 },
  template: { type: String, enum: ["elegant", "romantic", "modern", "luxury", "nusantara"], default: "elegant" },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
  groom: { type: personSchema, default: () => ({}) },
  bride: { type: personSchema, default: () => ({}) },
  eventDate: { type: Date, default: null },
  quranSurah: { type: String, default: "" },
  quranVerse: { type: String, default: "" },
  quranText: { type: String, default: "" },
  closingText: { type: String, default: "" },
  backgroundType: { type: String, enum: ["color", "gradient", "image"], default: "color" },
  backgroundColor: { type: String, default: "#f8f8f4", trim: true, maxlength: 20 },
  backgroundGradient: { type: String, default: "", trim: true, maxlength: 300 },
  backgroundImage: { type: String, default: "", trim: true, maxlength: 2000 },
  backgroundImagePublicId: { type: String, default: "", trim: true, maxlength: 255 },
  rsvpEnabled: { type: Boolean, default: true },
  wishesEnabled: { type: Boolean, default: true },
}, { timestamps: true });

// Recompile the model during Next.js HMR after adding fields to the schema.
if (mongoose.models.Invitation && (!mongoose.models.Invitation.schema.path("title") || !mongoose.models.Invitation.schema.path("groom.photoPublicId") || !mongoose.models.Invitation.schema.path("backgroundType") || !mongoose.models.Invitation.schema.path("rsvpEnabled") || !mongoose.models.Invitation.schema.path("wishesEnabled"))) {
  delete mongoose.models.Invitation;
}
const Invitation = mongoose.models.Invitation ?? mongoose.model("Invitation", invitationSchema);
export default Invitation;
