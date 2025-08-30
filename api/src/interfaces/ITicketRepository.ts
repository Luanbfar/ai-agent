import type { ITicket } from './ITicket.ts';

export interface ITicketRepository {
  /**
   * Create and store a new ticket
   * @param ticket Ticket data without id
   * @returns The created ticket with assigned id
   */
  create(ticket: Partial<ITicket>): Promise<ITicket>;

  /**
   * Find a ticket by its unique ID
   * @param id Ticket ID
   * @returns The ticket if found, otherwise null
   */
  findById(id: string): Promise<ITicket | null>;

  /**
   * Retrieve all tickets (optional: add pagination/filter later)
   * @returns List of all tickets
   */
  findAll(): Promise<ITicket[]>;

  /**
   * Update the status of a ticket
   * @param id Ticket ID
   * @param status New status
   * @returns The updated ticket or null if not found
   */
  updateStatus(id: string, status: string): Promise<ITicket | null>;
}
