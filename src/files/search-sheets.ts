// Search across a user's files, so the browser no longer downloads every file to search.
type Cell = string | number;
interface Sheet {
  name: string;
  rows: Cell[][];
}
interface SearchSource {
  id: string;
  fileName: string;
  sheets: Record<string, unknown>[];
}

export interface SearchGroup {
  fileId: string;
  fileName: string;
  sheetIndex: number;
  sheetName: string;
  header: Cell[];
  hits: { key: string; n: number; cells: Cell[]; match: string }[];
  total: number;
}

const MAX_PER_GROUP = 100;
// Invisible characters and spaces count as empty (same rule as the frontend's readWorkbook).
const INVISIBLE = /[\s\p{Z}\p{Cf}\p{Cc}]/gu;
const isFilled = (v: Cell | undefined) => v !== undefined && String(v).replace(INVISIBLE, '') !== '';

// Only filled rows and columns, as the frontend shows them.
function trim(rows: Cell[][]): Cell[][] {
  const kept = rows.filter((row) => row.some(isFilled));
  const width = Math.max(0, ...kept.map((r) => r.length));
  const cols = Array.from({ length: width }, (_, i) => i).filter((i) => kept.some((r) => isFilled(r[i])));
  return kept.map((r) => cols.map((i) => r[i] ?? ''));
}

export function searchSheets(files: SearchSource[], query: string): SearchGroup[] {
  const q = query.toLowerCase();
  const groups: SearchGroup[] = [];
  for (const file of files) {
    (file.sheets as unknown as Sheet[]).forEach((sheet, sheetIndex) => {
      const [header = [], ...body] = trim(Array.isArray(sheet?.rows) ? sheet.rows : []);
      const hits: SearchGroup['hits'] = [];
      let total = 0;
      body.forEach((cells, i) => {
        const match = cells.find((v) => String(v).toLowerCase().includes(q));
        if (match === undefined) return;
        total++;
        if (hits.length < MAX_PER_GROUP) hits.push({ key: `${file.id}:${sheetIndex}:${i + 2}`, n: i + 2, cells, match: String(match) });
      });
      if (total) groups.push({ fileId: file.id, fileName: file.fileName, sheetIndex, sheetName: String(sheet?.name ?? ''), header, hits, total });
    });
  }
  return groups;
}
