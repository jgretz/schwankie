export function parseTagSlugs(tagsParam: string | undefined): string[] {
  return tagsParam ? tagsParam.split(',').filter(Boolean) : [];
}
