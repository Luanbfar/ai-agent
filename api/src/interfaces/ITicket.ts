import { Document } from "mongoose";
import { TicketDetails } from "../types/TicketDetails";

/**
 * Interface representing a Ticket document in MongoDB.
 * Extends Mongoose Document and TicketDetails properties.
 */
export interface ITicket extends TicketDetails, Document {
  /**
   * The timestamp when the ticket was created.
   */
  createdAt?: Date;

  /**
   * The timestamp when the ticket was last updated.
   */
  updatedAt?: Date;
}
