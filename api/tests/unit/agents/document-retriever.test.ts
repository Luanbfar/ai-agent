import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { DocumentRetriever } from "../../../src/rag/retriever";

// Mock node-fetch (return a minimal Response-like object)
const mockFetch = jest.fn((...args: any[]) =>
  Promise.resolve({
    ok: true,
    text: async () => "fake document content",
  })
);
jest.unstable_mockModule("node-fetch", () => ({
  default: mockFetch,
}));

// Mock document-loader (returns array of Documents)
const mockProcessDocument = jest.fn((...args: any[]) => Promise.resolve([{ pageContent: "Processed content" }]));
jest.unstable_mockModule("../../../src/rag/document-loader", () => ({
  default: mockProcessDocument,
}));

// Mock vector-store
const mockAddDocuments = jest.fn((...args: any[]) => Promise.resolve());
const mockSimilaritySearch = jest.fn((...args: any[]) => Promise.resolve([{ pageContent: "Similar doc" }]));
jest.unstable_mockModule("../../../src/rag/vector-store", () => ({
  default: {
    addDocuments: mockAddDocuments,
    similaritySearch: mockSimilaritySearch,
  },
}));

// Mock log utilities
const mockIsDocumentUpToDate = jest.fn((...args: any[]) => Promise.resolve(false));
const mockLogDocumentUpdate = jest.fn((...args: any[]) => Promise.resolve());
jest.unstable_mockModule("../../../src/utils/log", () => ({
  isDocumentUpToDate: mockIsDocumentUpToDate,
  logDocumentUpdate: mockLogDocumentUpdate,
}));

describe("DocumentRetriever", () => {
  let documentRetriever: DocumentRetriever;

  beforeEach(() => {
    jest.clearAllMocks();
    documentRetriever = new DocumentRetriever();
  });

  it("should fetch and process documents correctly", async () => {
    // Arrange: adjust what the mocks will return for this test
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "fake document content",
    });

    mockProcessDocument.mockResolvedValue([{ pageContent: "Processed content" }]);
    mockAddDocuments.mockResolvedValue(undefined);

    mockIsDocumentUpToDate.mockResolvedValue(false);
    mockLogDocumentUpdate.mockResolvedValue(undefined);

    // Act
    const result = await documentRetriever.retrieve("some question");

    // Assert - ensure mocked integrations were used and result shaped as expected
    expect(mockFetch).toHaveBeenCalled(); // fetch called for each URL inside addDocumentChunks
    expect(mockProcessDocument).toHaveBeenCalledWith("fake document content");
    expect(mockAddDocuments).toHaveBeenCalled();
    expect(mockIsDocumentUpToDate).toHaveBeenCalled();

    // DocumentRetriever.retrieve returns { context: Document[] }
    expect(result).toEqual(
      expect.objectContaining({
        context: expect.any(Array),
      })
    );
  });
});
