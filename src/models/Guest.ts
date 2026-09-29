import mongoose, { Schema } from "mongoose";

const guestSchema = new Schema({
  invitationId: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, default: "", trim: true, maxlength: 32 },
  category: { type: String, default: "Umum", trim: true, maxlength: 80 },
  invitationStatus: { type: String, enum: ["pending", "sent"], default: "pending" },
  rsvpStatus: { type: String, enum: ["pending", "attending", "not_attending", "maybe"], default: "pending" },
}, { timestamps: true, collection: "guests" });
const Guest = mongoose.models.Guest ?? mongoose.model("Guest", guestSchema);
export default Guest;
