import { describe, expect, it, jest, beforeEach, beforeAll } from "@jest/globals";

// Mock all dependencies with proper structure
jest.mock("node-fetch", () => ({
  default: jest.fn(),
}));

jest.mock("../../../src/rag/document-loader", () => ({
  default: jest.fn(),
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

describe("DocumentRetriever", () => {
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

  it("should retrieve documents when up to date", async () => {
    isDocumentUpToDateMock.mockResolvedValue(true);
    similaritySearchMock.mockResolvedValue([{ pageContent: "InfinitePay business hours information" }]);

    const result = await retriever.retrieve("business hours");

    expect(result).toEqual({
      context: [{ pageContent: "InfinitePay business hours information" }],
    });
  });

  it("should handle errors and return empty context", async () => {
    isDocumentUpToDateMock.mockRejectedValue(new Error("Database error"));

    const result = await retriever.retrieve("test query");

    expect(result).toEqual({ context: [] });
  });
});
