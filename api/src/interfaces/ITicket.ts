import { Document } from "mongoose";
import { TicketDetails } from "../types/TicketDetails";

export interface ITicket extends TicketDetails, Document {
  createdAt?: Date;
  updatedAt?: Date;
}
