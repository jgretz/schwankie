export default (tags: string): string[] => tags.split(',').map((s) => s.trim().toLowerCase());
