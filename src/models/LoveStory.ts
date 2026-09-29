import mongoose, { Schema } from "mongoose";

const loveStorySchema = new Schema({
  invitationId: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, index: true },
  year: { type: Number, required: true, min: 1900, max: 2200 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  imageUrl: { type: String, default: "", trim: true, maxlength: 2000 },
  publicId: { type: String, default: "", trim: true, maxlength: 255 },
  sortOrder: { type: Number, default: 0, min: 0 },
}, { timestamps: true, collection: "love_stories" });

const LoveStory = mongoose.models.LoveStory ?? mongoose.model("LoveStory", loveStorySchema);
export default LoveStory;
