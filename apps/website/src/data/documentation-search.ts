export type SearchDocument = {
  url: string;
  title: string;
  section: string;
  category: string;
  body: string;
};

export function normalizeSearch(value: string): string {
  return value.replace(/([a-z])([A-Z])/gu, "$1 $2").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function compact(value: string): string {
  return value.replaceAll(" ", "");
}

function matches(field: string, compactField: string, term: string): boolean {
  return field.includes(term) || compactField.includes(term);
}

/** All words must match; exact headings outrank incidental mentions in prose. */
export function searchDocuments(documents: readonly SearchDocument[], query: string): SearchDocument[] {
  const normalized = normalizeSearch(query);
  if (!normalized)
    return [];
  const terms = normalized.split(/\s+/u);
  return documents.map((document) => {
    const heading = normalizeSearch(document.section);
    const title = normalizeSearch(document.title);
    const body = normalizeSearch(document.body);
    // Preserve word matching while also accepting lowercase API identifiers,
    // e.g. "selectmenu" for a heading normalized from "SelectMenu".
    const fields = [heading, title, body];
    const compactFields = fields.map(compact);
    if (!terms.every(term => fields.some((field, index) => matches(field, compactFields[index]!, term))))
      return { document, score: 0 };
    const score = (compactFields[0] === compact(normalized)
      ? 200
      : 0) + (compactFields[1] === compact(normalized)
      ? 120
      : 0)
    + terms.reduce((sum, term) => sum + (matches(heading, compactFields[0]!, term)
      ? 30
      : 0) + (matches(title, compactFields[1]!, term)
      ? 15
      : 0) + (matches(body, compactFields[2]!, term)
      ? 1
      : 0), 0);
    return { document, score };
  }).filter(result => result.score > 0).sort((left, right) => right.score - left.score || left.document.url.localeCompare(right.document.url, "en")).slice(0, 30).map(result => result.document);
}
