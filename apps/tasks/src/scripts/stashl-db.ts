import postgres from 'postgres';

let conn: postgres.Sql | null = null;

export async function getStashlDb(databaseUrl: string): Promise<postgres.Sql> {
  if (!conn) {
    conn = postgres(databaseUrl);
  }
  return conn;
}

export async function closeStashlDb(): Promise<void> {
  if (conn) {
    await conn.end();
    conn = null;
  }
}
