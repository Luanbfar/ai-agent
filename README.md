# AI Agent Project Documentation

## Overview

This is a TypeScript-based AI agent system that orchestrates multiple specialized AI agents to handle user queries intelligently. The system uses OpenAI's API, Redis for conversation memory, and Supabase for vector storage to provide contextual responses.

## Architecture

```
User Request → Express API → AgentsService → Orchestrator → Specialized Agent → Personality Agent → Response
                                ↓
                           Redis Memory
                                ↓
                        RAG (Supabase Vector Store)
```

## Project Structure

```
api/
├── src/
│   ├── agents/           # AI agent implementations
│   │   ├── agent.ts      # Base abstract agent class
│   │   ├── cs-agent.ts   # Customer service agent
│   │   ├── knowledge-agent.ts # Knowledge retrieval agent
│   │   ├── orchestrator-agent.ts # Agent routing logic
│   │   ├── personality-agent.ts # Response personality enhancement
│   │   └── prompts.ts    # System prompts for all agents
│   ├── app/
│   │   └── app.ts        # Express application setup
│   ├── config/           # Configuration and environment
│   │   ├── loadEnv.ts    # Environment variable validation
│   │   └── urls.ts       # InfinitePay URLs for RAG
│   ├── controllers/      # HTTP request handlers
│   │   └── chat-controller.ts
│   ├── database/         # Database connections
│   │   └── redis.ts      # Redis client configuration
│   ├── interfaces/       # TypeScript interfaces
│   │   └── IChatMemoryRepository.ts
│   ├── rag/             # Retrieval Augmented Generation
│   │   ├── document-loader.ts  # HTML parsing and chunking
│   │   ├── embedder.ts         # OpenAI embeddings
│   │   ├── retriever.ts        # Document retrieval logic
│   │   └── vector-store.ts     # Supabase vector store
│   ├── repositories/     # Data access layer
│   │   └── RedisChatMemory.ts
│   ├── routers/         # Express route definitions
│   │   └── chat-router.ts
│   ├── services/        # Business logic
│   │   └── agents-service.ts
│   ├── types/           # TypeScript type definitions
│   │   ├── AgentType.ts
│   │   ├── InputData.ts
│   │   └── OpenAIModels.ts
│   └── utils/
│       └── log.ts       # Document update logging
├── tools/
│   └── compile.js       # Post-build ES module fix
├── logs/                # Application logs
└── package.json
```

## Core Components

### 1. Agents System

#### Base Agent (`agents/agent.ts`)
Abstract base class for all AI agents providing:
- OpenAI client initialization
- Model configuration
- System prompt management

#### Specialized Agents

**Customer Service Agent** (`cs-agent.ts`)
- Handles customer support inquiries
- Uses customer service-specific prompts
- Direct response generation

**Knowledge Agent** (`knowledge-agent.ts`)
- Handles information retrieval queries
- Integrates with RAG system
- Augments responses with retrieved context

**Orchestrator Agent** (`orchestrator-agent.ts`)
- Routes queries to appropriate agents
- Returns JSON with agent type decisions
- Central routing logic

**Personality Agent** (`personality-agent.ts`)
- Post-processes responses for consistent tone
- Aligns with InfinitePay brand voice
- Final response enhancement

### 2. RAG (Retrieval Augmented Generation) System

#### Document Retriever (`rag/retriever.ts`)
- Fetches and processes InfinitePay URLs
- Manages document freshness (24-hour cache)
- Provides contextual information to knowledge agent

#### Components:
- **Document Loader**: Parses HTML and creates text chunks
- **Embedder**: Generates vector embeddings using OpenAI
- **Vector Store**: Stores and retrieves similar documents via Supabase

### 3. Memory System

#### Redis Chat Memory (`repositories/RedisChatMemory.ts`)
- Stores conversation history per user
- Automatically trims to last 50 messages
- 7-day expiration for conversations
- Supports conversation retrieval and clearing

### 4. Service Layer

#### Agents Service (`services/agents-service.ts`)
Central orchestration service that:
- Manages user sessions and conversation flow
- Routes queries through the agent pipeline
- Handles memory persistence
- Provides error handling and recovery

## API Endpoints

### POST /chat

Handles user chat interactions.

**Request Body:**
```json
{
  "chatInput": "What are your business hours?",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "userId": "generated-or-provided-user-id",
  "response": "Our business hours are 9 AM to 6 PM, Monday through Friday."
}
```

## Configuration

### Environment Variables

Required environment variables (defined in `config/loadEnv.ts`):

```bash
# Server
PORT=3000

# OpenAI
OPENAI_API_KEY=sk-...

# Supabase (Vector Store)
SUPABASE_URL=https://...
SUPABASE_API_KEY=eyJ...

# Redis (Chat Memory)
REDIS_PASSWORD=...
REDIS_URL=redis-host.com
```

### Agent Prompts

All system prompts are centralized in `agents/prompts.ts`:

- **Knowledge Agent**: 3-sentence max, concise answers
- **Customer Service**: Professional InfinitePay support tone
- **Orchestrator**: JSON response format for agent routing
- **Personality**: Consistent brand voice enhancement

## Data Flow

### 1. Query Processing Flow

```
1. User sends message via POST /chat
2. AgentsService.handleUserQuery() processes:
   a. Resolve/generate userId
   b. Retrieve conversation history from Redis
   c. Orchestrator determines appropriate agent
   d. Selected agent generates response (with RAG if knowledge agent)
   e. Personality agent enhances response tone
   f. Save conversation to Redis
   g. Return response to user
```

### 2. Knowledge Retrieval Flow (RAG)

```
1. Knowledge agent receives query
2. DocumentRetriever checks document freshness
3. If stale, fetches latest content from InfinitePay URLs
4. Processes HTML → chunks → embeddings → Supabase
5. Performs similarity search for relevant context
6. Augments user query with retrieved context
7. Generates contextual response
```

## Key Features

### 🤖 Intelligent Agent Routing
- Automatically determines whether queries need knowledge retrieval or customer service
- JSON-based routing decisions for reliability

### 💾 Persistent Conversations
- Redis-backed conversation memory
- Automatic message limiting and expiration
- Session continuity across interactions

### 🔍 RAG-Enhanced Knowledge
- Real-time document synchronization from InfinitePay
- Vector similarity search for relevant context
- Automatic freshness checks with 24-hour cache

### 🎭 Consistent Personality
- Post-processing for brand-aligned responses
- Professional, helpful tone maintenance
- Configurable personality enhancement

### ⚡ Performance Optimizations
- Document caching to reduce API calls
- Efficient Redis operations
- Modular agent architecture

## Development

### Prerequisites
- Node.js 18+
- TypeScript
- Redis instance
- Supabase account
- OpenAI API key

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

### ES Modules Configuration

The project uses ES modules with specific TypeScript configuration:
- `"type": "module"` in package.json
- Custom build tool (`tools/compile.js`) adds `.js` extensions
- Top-level await support for Redis connection

## Error Handling

### Graceful Degradation
- Agent failures don't crash the system
- Memory persistence failures are non-blocking
- RAG failures fall back to basic responses
- Comprehensive error logging throughout

### Error Types
- **Agent Routing Errors**: Unknown agent types
- **Memory Errors**: Redis connection issues
- **RAG Errors**: Document fetch/processing failures
- **API Errors**: OpenAI API failures

## Monitoring

### Logging
- Document update logs in `logs/document_chunks.log`
- Console error logging for debugging
- Automatic log rotation and cleanup

### Health Checks
- Document freshness validation
- Redis connection monitoring
- API endpoint availability

## Deployment Considerations

### Production Setup
1. Configure environment variables
2. Set up Redis instance with persistence
3. Configure Supabase project with vector extensions
4. Set up proper logging and monitoring
5. Consider rate limiting for OpenAI API

### Scaling
- Stateless service design allows horizontal scaling
- Redis handles distributed session management
- Supabase provides managed vector store scaling
