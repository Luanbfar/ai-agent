import mongoose, { Schema, Model } from "mongoose";
import type { ITicket } from '../interfaces/ITicket.ts';

const TicketSchema: Schema = new Schema(
  {
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: "open" },
  },
  { timestamps: true }
);

const TicketModel: Model<ITicket> = mongoose.model<ITicket>("tickets", TicketSchema);

export default TicketModel;
