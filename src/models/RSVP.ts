import mongoose, { Schema } from "mongoose";
const rsvpSchema = new Schema({ invitationId: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, index: true }, guestName: { type: String, required: true, trim: true, maxlength: 100 }, attendance: { type: String, enum: ["attending", "not_attending", "maybe"], required: true }, guestCount: { type: Number, min: 0, max: 20, default: 1 }, message: { type: String, maxlength: 1000, default: "" } }, { timestamps: { createdAt: true, updatedAt: false }, collection: "rsvps" });
const RSVP = mongoose.models.RSVP ?? mongoose.model("RSVP", rsvpSchema);
export default RSVP;
