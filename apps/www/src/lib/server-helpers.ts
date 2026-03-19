export async function requireAuth() {
  const {getSession} = await import('./session.server');
  const session = await getSession();
  if (!session?.authenticated) {
    throw new Error('Unauthorized');
  }
}

export async function getClient() {
  const {initClientServer} = await import('./init-client.server');
  initClientServer();
}
