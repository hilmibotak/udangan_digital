import mongoose, { Schema } from "mongoose";

const giftSchema = new Schema({
  invitationId: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, index: true },
  type: { type: String, enum: ["bank", "ewallet", "qris"], required: true },
  provider: { type: String, required: true, trim: true, maxlength: 100 },
  accountNumber: { type: String, default: "", trim: true, maxlength: 100 },
  accountName: { type: String, default: "", trim: true, maxlength: 100 },
  qrImage: { type: String, default: "", trim: true, maxlength: 2000 },
  publicId: { type: String, default: "", trim: true, maxlength: 255 },
  fileId: { type: String, default: "", trim: true, maxlength: 50 },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: "gifts" });
const Gift = mongoose.models.Gift ?? mongoose.model("Gift", giftSchema);
export default Gift;
