import { ITicket } from "../interfaces/ITicket";
import { ITicketRepository } from "../interfaces/ITicketRepository";
import TicketModel from "../models/ticket-model";

/**
 * MongoTicketRepository implements ITicketRepository using Mongoose ODM.
 * Handles CRUD operations for Ticket documents in MongoDB.
 */
export class MongoTicketRepository implements ITicketRepository {
  /**
   * Creates and saves a new ticket document in the database.
   * @param ticket - Partial ticket data to create.
   * @returns The saved ticket document.
   * @throws Throws if saving fails.
   */
  async create(ticket: Partial<ITicket>): Promise<ITicket> {
    const created = new TicketModel(ticket);
    const saved = await created.save();
    return saved;
  }

  /**
   * Finds a ticket document by its unique ID.
   * @param id - The MongoDB document ID.
   * @returns The ticket document or null if not found.
   */
  async findById(id: string): Promise<ITicket | null> {
    const doc = await TicketModel.findById(id).exec();
    if (!doc) return null;
    return doc;
  }

  /**
   * Retrieves all ticket documents from the database.
   * @returns An array of all ticket documents.
   */
  async findAll(): Promise<ITicket[]> {
    const docs = await TicketModel.find().exec();
    return docs;
  }

  /**
   * Updates the status field of a ticket by its ID.
   * @param id - The MongoDB document ID of the ticket.
   * @param status - The new status value.
   * @returns The updated ticket document or null if not found.
   */
  async updateStatus(id: string, status: string): Promise<ITicket | null> {
    const updated = await TicketModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!updated) return null;
    return updated;
  }
}
