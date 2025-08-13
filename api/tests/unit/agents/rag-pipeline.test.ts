import { describe, expect, it, jest, beforeEach, beforeAll } from "@jest/globals";

// Mock all dependencies with proper structure
jest.mock("node-fetch", () => ({
  default: jest.fn(),
}));

jest.mock("../../../src/rag/document-loader", () => ({
  __esModule: true,
  default: jest.fn(async () => {
    const { mockHtmlPage } = await import("../../mocks/sample-page.html");
    return [
      {
        pageContent: mockHtmlPage,
        metadata: { source: "https://help.infinitepay.com/business-hours" },
      },
    ];
  }),
}));

jest.mock("../../../src/rag/vector-store", () => ({
  __esModule: true,
  default: {
    similaritySearch: jest.fn(),
    addDocuments: jest.fn(),
  },
}));

jest.mock("../../../src/utils/log", () => ({
  isDocumentUpToDate: jest.fn(),
  logDocumentUpdate: jest.fn(),
}));

// Import after mocking
import { DocumentRetriever } from "../../../src/rag/retriever";

let isDocumentUpToDateMock: jest.Mock<any>;
let similaritySearchMock: jest.Mock<any>;

beforeAll(async () => {
  const utilsLog = await import("../../../src/utils/log");
  const vectorStore = await import("../../../src/rag/vector-store");

  isDocumentUpToDateMock = utilsLog.isDocumentUpToDate as jest.Mock;
  similaritySearchMock = vectorStore.default.similaritySearch as jest.Mock;
});

describe("RAG Pipeline", () => {
  let retriever: DocumentRetriever;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock behavior
    isDocumentUpToDateMock.mockResolvedValue(true);
    similaritySearchMock.mockResolvedValue([]);

    retriever = new DocumentRetriever();
  });

  it("should create a retriever successfully", () => {
    expect(retriever).toBeDefined();
    expect(retriever).toBeInstanceOf(DocumentRetriever);
  });

  it("should retrieve information from the mocked HTML page", async () => {
    // Make documents stale so loader runs
    isDocumentUpToDateMock.mockResolvedValue(false);

    similaritySearchMock.mockResolvedValue([
      { pageContent: "Our customer support is available Monday to Friday from 9:00 AM to 6:00 PM (BRT)." },
    ]);

    const result = await retriever.retrieve("What are your business hours?");

    expect(result.context[0].pageContent).toMatch(/Monday to Friday from 9:00 AM to 6:00 PM/);
  });

  it("should retrieve documents when up to date", async () => {
    isDocumentUpToDateMock.mockResolvedValue(true);
    similaritySearchMock.mockResolvedValue([{ pageContent: "InfinitePay business hours information" }]);

    const result = await retriever.retrieve("business hours");

    expect(result).toEqual({
      context: [{ pageContent: "InfinitePay business hours information" }],
    });
  });

  it("should call similaritySearch with correct question and limit", async () => {
    // Ensure no refresh is triggered
    isDocumentUpToDateMock.mockResolvedValue(true);

    // Mock similarity search returning fake docs
    similaritySearchMock.mockResolvedValue([
      { pageContent: "InfinitePay supports payments via credit card." },
      { pageContent: "Business hours are Monday to Friday, 9am–6pm BRT." },
    ]);

    const result = await retriever.retrieve("What payment methods do you support?");

    // Verify similarity search was called correctly
    expect(similaritySearchMock).toHaveBeenCalledTimes(1);
    expect(similaritySearchMock).toHaveBeenCalledWith("What payment methods do you support?", 5);

    // Verify returned context
    expect(result).toEqual({
      context: [
        { pageContent: "InfinitePay supports payments via credit card." },
        { pageContent: "Business hours are Monday to Friday, 9am–6pm BRT." },
      ],
    });
  });

  it("should handle errors and return empty context", async () => {
    isDocumentUpToDateMock.mockRejectedValue(new Error("Database error"));

    const result = await retriever.retrieve("test query");

    expect(result).toEqual({ context: [] });
  });
});
