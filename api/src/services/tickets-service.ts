import type { ITicket } from "../interfaces/ITicket.ts";
import type { ITicketRepository } from "../interfaces/ITicketRepository.ts";
import type { TicketDetails } from "../types/TicketDetails.ts";

/**
 * Service responsible for handling ticket creation and management.
 */
export class TicketService {
  private ticketRepository: ITicketRepository;

  /**
   * Initializes a new instance of TicketService
   * and sets up the MongoDB ticket repository.
   */
  constructor(ticketRepository: ITicketRepository) {
    this.ticketRepository = ticketRepository;
  }

  /**
   * Creates a new ticket in the database using the provided details.
   *
   * @param ticketDetails - The details of the ticket to create.
   * @returns The created ticket document or undefined if creation failed.
   */
  private async createTicket(ticketDetails: TicketDetails): Promise<ITicket | undefined> {
    try {
      const ticketData: Partial<ITicket> = {
        subject: ticketDetails.subject,
        description: ticketDetails.description,
        status: ticketDetails.status,
      };
      const createdTicket = await this.ticketRepository.create(ticketData);
      return createdTicket;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * Parses the response from the AI model and, if it indicates
   * a ticket creation action, creates a ticket with the parsed details.
   *
   * @param response - The AI model's JSON string response.
   * @returns An object with a confirmation message or null if no ticket was created.
   */
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
            }" at ${createdTicket.createdAt?.toLocaleTimeString()}`,
          };
        }
      }

      return null;
    } catch (error) {
      if (error instanceof SyntaxError) {
        return null; // Not a JSON response, so no ticket action
      }
      console.error("handleTicketCreation error:", error);
      return null;
    }
  }
}
