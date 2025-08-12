import { ITicket } from "../interfaces/ITicket";
import { ITicketRepository } from "../interfaces/ITicketRepository";
import { MongoTicketRepository } from "../repositories/MongoTicket";
import { TicketDetails } from "../types/TicketDetails";

export class TicketService {
  private mongoTicketRepository: ITicketRepository;
  constructor() {
    this.mongoTicketRepository = new MongoTicketRepository();
  }

  /**
   * Create a ticket with the given details.
   * Replace this with actual ticket creation logic.
   */
  private async createTicket(ticketDetails: TicketDetails): Promise<ITicket | undefined> {
    try {
      const ticketData: Partial<ITicket> = {
        subject: ticketDetails.subject,
        description: ticketDetails.description,
        status: ticketDetails.status,
      };
      const createdTicket = await this.mongoTicketRepository.create(ticketData);

      return createdTicket;
    } catch (error) {
      console.error(error);
      return;
    }
  }
  async handleTicketCreation(response: string): Promise<{ response: string } | null> {
    try {
      const parsed = JSON.parse(response);

      if (parsed.action === "create_ticket") {
        const ticketDetails: TicketDetails = {
          subject: parsed.subject,
          description: parsed.description,
          status: parsed.status || "open",
        };

        const createdTicket = await this.createTicket(ticketDetails);

        if (createdTicket) {
          return {
            response: `Ticket created successfully with subject: "${
              createdTicket.subject
            } at ${createdTicket.createdAt?.toLocaleTimeString()}`,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("handleTicketCreation error:", error);
      return null;
    }
  }
}
