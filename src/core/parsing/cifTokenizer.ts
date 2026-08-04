/**
 * Splits a single CIF line into tokens, respecting single/double-quoted
 * values that may contain whitespace (e.g. `"D-saccharide, beta linking"`,
 * or a nucleotide atom name like `"O5'"` where the value itself contains
 * the other quote character). A naive `split(' ')` breaks on both.
 *
 * Matches the common case in real RCSB ligand files: a quote only opens a
 * quoted token when it's the first character of that token, and closes on
 * the next occurrence of the same quote character. The CIF spec's stricter
 * rule (a closing quote must be followed by whitespace) isn't implemented,
 * since it doesn't come up in ligand atom/bond data — a value never has
 * text glued onto a closing quote in that data.
 */
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
      i += 1; // skip closing quote
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

/**
 * Splits raw CIF text into lines with multi-line `;`-delimited text blocks
 * removed. A block starts on a line beginning with `;` and ends on the next
 * line beginning with `;` — everything in between (and the delimiter lines
 * themselves) is dropped. None of that free-text data (synonyms, chemical
 * names) is needed for atom/bond parsing, but if it isn't stripped first,
 * line-based scanning downstream would misinterpret its content as tags or
 * loop rows and misalign everything that follows.
 */
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

/**
 * Finds a CIF category's data regardless of which of the two equivalent
 * representations the file uses:
 *  - `loop_` form: a `loop_` line, then one `_category.tag` line per
 *    column, then N data rows of that many whitespace/quote-tokenized
 *    values each (a row can wrap across physical lines — tokens are
 *    accumulated and re-chunked by tag count, not by line).
 *  - flat form: each tag on its own line with a single inline value, no
 *    `loop_` keyword at all. RCSB uses this for single-atom ligands (e.g.
 *    ZN, CA) where the atom/bond category has exactly one row.
 *
 * Returns null if the category isn't present in either form.
 */
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
