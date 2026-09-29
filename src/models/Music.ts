import mongoose, { Schema } from "mongoose";

const musicSchema = new Schema({
  invitationId: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  audioUrl: { type: String, required: true, trim: true, maxlength: 2000 },
  publicId: { type: String, default: "", trim: true, maxlength: 255 },
  enabled: { type: Boolean, default: true },
}, { timestamps: true, collection: "music" });
const Music = mongoose.models.Music ?? mongoose.model("Music", musicSchema);
export default Music;
