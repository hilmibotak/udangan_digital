import mongoose, { Schema } from "mongoose";
const wishSchema = new Schema({ invitationId: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, index: true }, guestName: { type: String, required: true, trim: true, maxlength: 100 }, message: { type: String, required: true, trim: true, maxlength: 1000 }, status: { type: String, enum: ["visible", "hidden"], default: "visible" } }, { timestamps: { createdAt: true, updatedAt: false }, collection: "wishes" });
const Wish = mongoose.models.Wish ?? mongoose.model("Wish", wishSchema);
export default Wish;
