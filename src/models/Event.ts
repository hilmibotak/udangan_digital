import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema({
  invitationId: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, index: true },
  type: { type: String, enum: ["akad", "reception", "other"], required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  date: { type: Date, required: true },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, default: "", trim: true },
  venue: { type: String, required: true, trim: true, maxlength: 160 },
  address: { type: String, required: true, trim: true, maxlength: 500 },
  mapsUrl: { type: String, default: "", trim: true, maxlength: 2000 },
}, { timestamps: true, collection: "events" });
const EventModel = mongoose.models.Event ?? mongoose.model("Event", eventSchema);
export default EventModel;
