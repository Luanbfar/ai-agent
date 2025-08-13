# AI Agent System

A TypeScript-based multi-agent system for InfinitePay that intelligently routes user queries through specialized AI agents with RAG-enhanced knowledge retrieval.

## Architecture

The system implements a microservice-like agent architecture where each agent has a specific responsibility:

```
Request → Orchestrator Agent → [Knowledge Agent | CS Agent] → Personality Agent → Response
                                        ↓
                               RAG Pipeline (Supabase)
                                        ↓
                              Redis Memory & MongoDB Tickets
```

## Core Components

### Agent System

**Base Agent (`src/agents/agent.ts`)**
Abstract class providing OpenAI client initialization and common functionality for all specialized agents.

**Orchestrator Agent (`src/agents/orchestrator-agent.ts`)**
Routes incoming queries to appropriate specialized agents based on intent analysis. Returns structured JSON decisions.

**Knowledge Agent (`src/agents/knowledge-agent.ts`)**
Handles information retrieval queries using RAG pipeline integration. Augments responses with real-time document context from InfinitePay's website.

**Customer Service Agent (`src/agents/cs-agent.ts`)**
Processes customer support requests and generates structured ticket data when required.

**Personality Agent (`src/agents/personality-agent.ts`)**
Post-processes all responses to ensure consistent brand voice and tone alignment.

### RAG Pipeline

**Document Retriever (`src/rag/retriever.ts`)**

- Fetches HTML content from configured URLs
- Implements 24-hour document freshness validation
- Manages vector store updates and similarity searches

**Vector Store (`src/rag/vector-store.ts`)**
Supabase-backed vector storage using OpenAI embeddings for semantic document retrieval.

**Document Loader (`src/rag/document-loader.ts`)**
Processes HTML content into chunked documents using LangChain's RecursiveCharacterTextSplitter (1000 char chunks, 200 overlap).

### Data Persistence

**Redis Chat Memory (`src/repositories/RedisChatMemory.ts`)**

- Stores conversation history per user session
- Automatic trimming to 50 messages per session
- 7-day TTL with automatic expiration

**MongoDB Tickets (`src/repositories/MongoTicket.ts`)**
Persistent storage for customer support tickets with CRUD operations.

## API Interface

### POST /api/chat

```typescript
interface ChatRequest {
  chatInput: string;
  userId?: string;
}

interface ChatResponse {
  userId: string;
  response: string;
}

interface TicketResponse {
  userId: string;
  ticketResponse: string;
}
```

## Testing Strategy

### Unit Tests (`tests/unit/`)

Each agent is tested in isolation with mocked dependencies:

- **Agent Initialization**: Validates proper OpenAI client setup and configuration
- **Response Generation**: Tests core functionality with controlled inputs/outputs
- **Error Handling**: Validates graceful degradation when external services fail
- **JSON Parsing**: Ensures structured responses (orchestrator routing, ticket creation)

### End-to-End Tests (`tests/e2e/`)

Full system integration testing:

- **Complete Agent Pipeline**: Request → Orchestrator → Specialist → Personality → Response
- **RAG Integration**: Knowledge agent with document retrieval and context augmentation
- **Ticket Creation**: Full customer service workflow from query to ticket persistence
- **Error Scenarios**: API failures, malformed responses, and system recovery

### Test Implementation

```bash
npm test           # All tests
npm run test:unit  # Unit tests only
npm run test:e2e   # E2E tests only
npm run test:coverage  # Coverage report
```

**Mock Strategy**: External dependencies (OpenAI, Redis, MongoDB, Supabase) are mocked to ensure deterministic test execution and eliminate external service dependencies.

## Configuration

### Environment Variables

```bash
PORT=3000
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_API_KEY=...
REDIS_PASSWORD=...
REDIS_URL=...
MONGODB_URL=...
```

### System Prompts (`src/agents/prompts.ts`)

- **Knowledge Agent**: 3-sentence maximum responses with conciseness focus
- **Orchestrator**: JSON-only responses for agent type classification
- **Customer Service**: Structured ticket creation with InfinitePay context
- **Personality**: Brand voice consistency without pleasantries

## Installation & Development

### Local Development

```bash
# Dependencies
npm install

# Development with hot reload
npm run dev

# Run tests
npm test

# Production build
npm run build && npm start
```

### Docker Deployment

**File Structure:**

```
your-project/
├── Dockerfile
├── .dockerignore
└── api/
    ├── .env          # Your environment variables
    ├── src/
    └── package.json
```

**Commands:**

```bash
# Test
docker build -t ai-agent:test --target test .
docker run --rm ai-agent:test

# Development (with volume mounting for hot reload)
docker build -t ai-agent:dev --target dev .
docker run -p 3000:3000 -v $(pwd)/api/src:/app/src ai-agent:dev

# Production
docker build -t ai-agent:prod --target prod .
docker run -p 3000:3000 ai-agent:prod
```

### ES Modules Configuration

The project uses ES modules with TypeScript. Key configurations:

- `"type": "module"` in package.json
- Post-build compilation tool (`tools/compile.js`) adds `.js` extensions
- Top-level await support for Redis connection

## Document Management

### Automatic Updates

- 24-hour freshness checks for InfinitePay website content
- Configurable URL list in `src/config/urls.ts`
- Automatic vector store synchronization
- Update logging in `logs/document_chunks.log`

### Performance Optimizations

- Document caching to minimize API calls
- Efficient vector similarity search (5 documents max)
- Automatic conversation memory trimming
- Redis connection pooling

## Error Handling

### Graceful Degradation

- Agent routing failures default to customer service
- RAG pipeline failures return basic responses
- Memory persistence errors are non-blocking
- OpenAI API failures return structured error responses

### Logging

- Document update logs in `logs/document_chunks.log`
- Console error logging for debugging

## Deployment Considerations

### Infrastructure Requirements

- Node.js 22+
- Redis instance
- MongoDB database
- Supabase project with vector extensions
- OpenAI API access

### Scaling

- Stateless service design supports horizontal scaling
- Redis handles distributed session management
- Supabase provides managed vector store scaling
- MongoDB supports replica sets for high availability

### Performance Tuning

- Configure Redis memory policies for conversation data
- Optimize vector store index parameters
- Implement connection pooling for databases
- Set appropriate OpenAI API rate limits

## Production Deployment

### Monitoring

- Document update logs in `logs/document_chunks.log`
- Console error logging for debugging
- Basic service availability through container health checks

## Technical Decisions

### Agent Architecture

Multi-agent design provides better maintainability and testing isolation compared to monolithic AI approaches. Each agent can be developed, tested, and scaled independently.

### RAG Implementation

Real-time document retrieval ensures accuracy over pre-trained knowledge, critical for customer-facing applications where information changes frequently.

### Memory Strategy

Redis provides fast session storage with automatic expiration, balancing performance with resource management for high-volume conversations.

### Testing Approach

Comprehensive mocking enables reliable CI/CD pipelines while E2E tests validate real-world system behavior without external service dependencies.
