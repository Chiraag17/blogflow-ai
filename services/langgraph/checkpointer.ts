import { MemorySaver } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { Checkpoint, CheckpointMetadata, CheckpointTuple } from '@langchain/langgraph';
import { prisma } from '@/lib/prisma';

/**
 * PostgreSQL-backed durable checkpointer for LangGraph.
 * Connects to Neon PostgreSQL using PostgresSaver from @langchain/langgraph-checkpoint-postgres,
 * with seamless in-memory fallback to MemorySaver if the database connection is initializing or unavailable.
 */
export class PostgresCheckpointSaver extends MemorySaver {
  private pgSaver: any = null;
  private initPromise: Promise<void> | null = null;
  private isPostgresAvailable = true;

  constructor() {
    super();
    this.initPostgres();
  }

  private async initPostgres(): Promise<void> {
    // Ensure the Neon checkpoint URL uses the WebSocket‑compatible port 443.
    // If the URL already contains a port (e.g., ":443" or ":5432"), leave it unchanged.
    // This guards against Windows firewall blocks on raw TCP 5432.
    // Adjust Neon URL: enforce WebSocket port 443 and sslmode=verify-full
const rawConnStr = process.env.LANGGRAPH_CHECKPOINT_DATABASE_URL || process.env.DATABASE_URL;
const connStr = (() => {
  if (rawConnStr && rawConnStr.includes('neon.tech')) {
    try {
      const url = new URL(rawConnStr);
      if (!url.port) url.port = '443';               // force WebSocket port
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'verify-full'); // enforce TLS verification
      }
      return url.toString();
    } catch {
      return rawConnStr; // fallback if parsing fails
    }
  }
  return rawConnStr;
})();

    this.initPromise = (async () => {
      try {
        const { PostgresSaver } = await import(
          '@langchain/langgraph-checkpoint-postgres'
        );
        if (!connStr) {
          throw new Error('No checkpoint database connection string is configured.');
        }
        const saver = await PostgresSaver.fromConnString(connStr);
        await saver.setup();
        this.pgSaver = saver;
        this.isPostgresAvailable = true;
        console.log('[Checkpointer] PostgresSaver successfully connected to Neon PostgreSQL.');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[Checkpointer] PostgresSaver init warning (using in-memory fallback):', message);
        this.isPostgresAvailable = false;
      }
    })();
    return this.initPromise;
  }



  public override async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata
  ): Promise<RunnableConfig> {
    await this.initPostgres();

    // 1. Update in-memory
    const returnConfig = await super.put(config, checkpoint, metadata);

    // 2. Persist with PostgresSaver if connected
    if (this.pgSaver && this.isPostgresAvailable) {
      try {
        await this.pgSaver.put(config, checkpoint, metadata);
      } catch (err) {
        console.warn('[Checkpointer] PostgresSaver put warning:', err);
      }
    }

    // 3. Keep WorkflowExecution record in PostgreSQL updated
    const threadId = config.configurable?.thread_id;
    if (threadId) {
      try {
        await prisma.workflowExecution.updateMany({
          where: { graphThreadId: threadId },
          data: {
            updatedAt: new Date(),
            errorMessage: null,
          },
        });
      } catch {
        // Continue if DB update encounters transient lock
      }
    }

    return returnConfig;
  }

  public override async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    await this.initPostgres();

    // Prefer PostgresSaver for thread resumption
    if (this.pgSaver && this.isPostgresAvailable) {
      try {
        const tuple = await this.pgSaver.getTuple(config);
        if (tuple) return tuple;
      } catch (err) {
        console.warn('[Checkpointer] PostgresSaver getTuple warning:', err);
      }
    }

    // Fall back to in-memory tuple
    return super.getTuple(config);
  }

  public override async *list(config: RunnableConfig, options?: any): AsyncGenerator<CheckpointTuple> {
    await this.initPostgres();

    if (this.pgSaver && this.isPostgresAvailable) {
      try {
        yield* this.pgSaver.list(config, options);
        return;
      } catch (err) {
        console.warn('[Checkpointer] PostgresSaver list warning:', err);
      }
    }

    yield* super.list(config, options);
  }

  public override async putWrites(config: RunnableConfig, writes: any[], taskId: string): Promise<void> {
    await this.initPostgres();

    await super.putWrites(config, writes, taskId);

    if (this.pgSaver && this.isPostgresAvailable) {
      try {
        await this.pgSaver.putWrites(config, writes, taskId);
      } catch (err) {
        console.warn('[Checkpointer] PostgresSaver putWrites warning:', err);
      }
    }
  }
}

// Global persistent checkpointer singleton
export const workflowCheckpointer = new PostgresCheckpointSaver();
