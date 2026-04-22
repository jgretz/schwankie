function timestamp(): string {
  return new Date().toISOString();
}

function format(level: string, message: string, data?: Record<string, unknown>): string {
  const base = `[${timestamp()}] ${level}: ${message}`;
  return data ? `${base} ${JSON.stringify(data)}` : base;
}

export function info(message: string, data?: Record<string, unknown>): void {
  console.log(format('INFO', message, data));
}

export function warn(message: string, data?: Record<string, unknown>): void {
  console.warn(format('WARN', message, data));
}

export function error(message: string, data?: Record<string, unknown>): void {
  console.error(format('ERROR', message, data));
}
