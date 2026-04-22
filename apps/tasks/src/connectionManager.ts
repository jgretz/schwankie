import PgBoss from 'pg-boss';

interface ConnectionConfig {
  retryIntervalMs: number;
  maxRetries: number;
}

let isShuttingDown = false;

function getConfig(): ConnectionConfig {
  return {
    retryIntervalMs: parseInt(process.env.RETRY_INTERVAL_MS || '30000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '0', 10),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isConnectionError(error: Error): boolean {
  return (
    error.message?.includes('Connection terminated') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ECONNRESET') ||
    error.message?.includes('ETIMEDOUT') ||
    error.message?.includes('AbortError') ||
    error.message?.includes('connection was closed') ||
    error.message?.includes('The connection was closed')
  );
}

interface TaskRunnerContext {
  boss: PgBoss;
  shutdown: () => Promise<void>;
}

type SetupCallback = (boss: PgBoss) => Promise<void>;

async function createTaskRunner(setupCallback: SetupCallback): Promise<TaskRunnerContext> {
  const config = getConfig();
  let retryCount = 0;

  async function attemptConnection(): Promise<PgBoss> {
    const pgBossUrl = process.env.PGBOSS_DATABASE_URL;
    if (!pgBossUrl) {
      throw new Error('PGBOSS_DATABASE_URL is required');
    }

    const parsedPoolSize = parseInt(process.env.PG_POOL_SIZE || '10', 10);
    const poolSize = Number.isFinite(parsedPoolSize) && parsedPoolSize > 0 ? parsedPoolSize : 10;

    console.log('Connecting to pg-boss database...');

    const boss = new PgBoss({
      connectionString: pgBossUrl,
      max: poolSize,
      retryLimit: 3,
      retryDelay: 1000,
      retryBackoff: true,
      archiveCompletedAfterSeconds: 3600,
      supervise: true,
    });

    await boss.start();
    console.log(`pg-boss started (pool size: ${poolSize})`);

    return boss;
  }

  async function runWithRecovery(): Promise<TaskRunnerContext> {
    while (true) {
      try {
        const boss = await attemptConnection();
        await setupCallback(boss);

        retryCount = 0;

        const shutdown = async () => {
          isShuttingDown = true;
          try {
            await boss.stop();
          } catch (error) {
            console.error('pg-boss stop error during shutdown:', error);
          }
        };

        return {boss, shutdown};
      } catch (error) {
        if (isShuttingDown) throw error;
        retryCount++;

        if (config.maxRetries > 0 && retryCount >= config.maxRetries) {
          console.error(`Max retries (${config.maxRetries}) exceeded. Giving up.`);
          throw error;
        }

        const retryMsg =
          config.maxRetries > 0 ? `(attempt ${retryCount}/${config.maxRetries})` : `(attempt ${retryCount})`;

        console.error(`Connection failed ${retryMsg}:`, error);
        console.log(`Waiting ${config.retryIntervalMs / 1000}s before retry...`);

        await sleep(config.retryIntervalMs);
      }
    }
  }

  return runWithRecovery();
}

let currentSigTermHandler: (() => void) | null = null;
let currentSigIntHandler: (() => void) | null = null;

export async function runWithAutoRecovery(setupCallback: SetupCallback): Promise<void> {
  const config = getConfig();

  while (true) {
    try {
      const {boss, shutdown} = await createTaskRunner(setupCallback);

      if (currentSigTermHandler) process.off('SIGTERM', currentSigTermHandler);
      if (currentSigIntHandler) process.off('SIGINT', currentSigIntHandler);

      const handleShutdown = async (signal: string) => {
        isShuttingDown = true;
        console.log(`Received ${signal}, shutting down...`);
        await shutdown();
        process.exit(0);
      };

      currentSigTermHandler = () => handleShutdown('SIGTERM');
      currentSigIntHandler = () => handleShutdown('SIGINT');
      process.on('SIGTERM', currentSigTermHandler);
      process.on('SIGINT', currentSigIntHandler);

      await new Promise((_, reject) => {
        boss.on('error', (error) => {
          if (isConnectionError(error)) {
            reject(error);
          } else {
            console.error('pg-boss error:', error);
          }
        });
      });
    } catch (error) {
      if (isShuttingDown) return;
      console.error('Task runner crashed:', error);
      console.log(`Waiting ${config.retryIntervalMs / 1000}s before full restart...`);

      await sleep(config.retryIntervalMs);
    }
  }
}
