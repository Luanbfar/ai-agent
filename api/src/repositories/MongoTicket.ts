import { ITicket } from "../interfaces/ITicket";
import { ITicketRepository } from "../interfaces/ITicketRepository";
import TicketModel from "../models/ticket-model";

export class MongoTicketRepository implements ITicketRepository {
  async create(ticket: Partial<ITicket>): Promise<ITicket> {
    const created = new TicketModel(ticket);
    const saved = await created.save();
    return saved;
  }

  async findById(id: string): Promise<ITicket | null> {
    const doc = await TicketModel.findById(id).exec();
    if (!doc) return null;
    return doc;
  }

  async findAll(): Promise<ITicket[]> {
    const docs = await TicketModel.find().exec();
    return docs;
  }

  async updateStatus(id: string, status: string): Promise<ITicket | null> {
    const updated = await TicketModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!updated) return null;
    return updated;
  }
}
