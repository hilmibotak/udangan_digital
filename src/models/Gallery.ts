import mongoose, { Schema } from "mongoose";

const gallerySchema = new Schema({
  invitationId: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, index: true },
  imageUrl: { type: String, required: true, trim: true, maxlength: 2000 },
  publicId: { type: String, default: "", trim: true, maxlength: 255 },
  fileId: { type: String, default: "", trim: true, maxlength: 50 },
  caption: { type: String, default: "", trim: true, maxlength: 240 },
  sortOrder: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
}, { collection: "galleries" });
const Gallery = mongoose.models.Gallery ?? mongoose.model("Gallery", gallerySchema);
export default Gallery;
