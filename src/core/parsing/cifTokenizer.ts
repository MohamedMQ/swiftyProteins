export function tokenizeCifLine(line: string): string[] {
  const tokens: string[] = [];
  const length = line.length;
  let i = 0;

  while (i < length) {
    while (i < length && /\s/.test(line[i])) {
      i += 1;
    }
    if (i >= length) {
      break;
    }

    const ch = line[i];
    if (ch === '"' || ch === "'") {
      i += 1;
      const start = i;
      while (i < length && line[i] !== ch) {
        i += 1;
      }
      tokens.push(line.slice(start, i));
      i += 1;
    } else {
      const start = i;
      while (i < length && !/\s/.test(line[i])) {
        i += 1;
      }
      tokens.push(line.slice(start, i));
    }
  }

  return tokens;
}

export function stripCifTextBlocks(rawText: string): string[] {
  const rawLines = rawText.split(/\r?\n/);
  const cleanLines: string[] = [];
  let inBlock = false;

  for (const line of rawLines) {
    if (inBlock) {
      if (line.startsWith(';')) {
        inBlock = false;
      }
      continue;
    }
    if (line.startsWith(';')) {
      inBlock = true;
      continue;
    }
    cleanLines.push(line);
  }

  return cleanLines;
}

export interface CifCategoryTable {
  tags: string[];
  rows: Record<string, string>[];
}

export function extractCifCategory(
  lines: string[],
  category: string
): CifCategoryTable | null {
  const prefix = `_${category}.`;

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() !== 'loop_') {
      continue;
    }

    let j = i + 1;
    const tags: string[] = [];
    while (j < lines.length && lines[j].trim().startsWith(prefix)) {
      tags.push(lines[j].trim().slice(prefix.length));
      j += 1;
    }
    if (tags.length === 0) {
      continue;
    }

    const tokens: string[] = [];
    while (j < lines.length) {
      const trimmed = lines[j].trim();
      if (trimmed.length === 0) {
        j += 1;
        continue;
      }
      if (
        trimmed.startsWith('_') ||
        trimmed === 'loop_' ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('data_')
      ) {
        break;
      }
      tokens.push(...tokenizeCifLine(lines[j]));
      j += 1;
    }

    const rows: Record<string, string>[] = [];
    for (let k = 0; k + tags.length <= tokens.length; k += tags.length) {
      const row: Record<string, string> = {};
      for (let t = 0; t < tags.length; t += 1) {
        row[tags[t]] = tokens[k + t];
      }
      rows.push(row);
    }

    return { tags, rows };
  }

  const flatTags: string[] = [];
  const flatRow: Record<string, string> = {};
  let found = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(prefix)) {
      found = true;
      const rest = trimmed.slice(prefix.length);
      const spaceIndex = rest.search(/\s/);
      if (spaceIndex === -1) {
        continue;
      }
      const tagName = rest.slice(0, spaceIndex);
      const value = tokenizeCifLine(rest.slice(spaceIndex))[0] ?? '';
      flatTags.push(tagName);
      flatRow[tagName] = value;
    } else if (found) {
      break;
    }
  }

  return found ? { tags: flatTags, rows: [flatRow] } : null;
}
