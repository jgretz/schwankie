export function parseTagIds(tagsParam: string | undefined): number[] {
  return tagsParam ? tagsParam.split(',').map(Number).filter(Boolean) : [];
}
