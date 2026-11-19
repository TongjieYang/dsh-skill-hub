// Minimal YAML-subset reader for SKILL.md front matter.
// Handles: plain scalars, single/double quoted (incl. multi-line), block
// scalars (`>` folded, `|` literal), and one level of nested mappings
// (kept as a flat `indent` map that callers can ignore).

const KEY_RE = /^([A-Za-z0-9_.-]+):\s*(.*)$/

/** Split a file into `{ frontmatterText, body }`. Returns null when absent. */
export function splitFrontmatter(text) {
  const src = String(text ?? '').replace(/\r\n/g, '\n')
  if (!src.startsWith('---')) return null
  const nl = src.indexOf('\n')
  if (nl < 0) return null
  const rest = src.slice(nl + 1)
  const endMatch = /\n---[ \t]*(?:\n|$)/.exec(rest)
  if (!endMatch) return null
  const fm = rest.slice(0, endMatch.index)
  const body = rest.slice(endMatch.index + endMatch[0].length)
  return { frontmatterText: fm, body }
}

function unquoteDouble(raw) {
  // Best effort: JSON semantics, keeping unknown escapes literal.
  try {
    return JSON.parse(raw)
  } catch {
    const inner = raw.slice(1, -1)
    return inner.replace(/\\(.)/g, (_, ch) => {
      if (ch === 'n') return '\n'
      if (ch === 't') return '\t'
      if (ch === '"') return '"'
      if (ch === '\\') return '\\'
      return ch
    })
  }
}

/** Parse the front matter block into a flat record of strings. */
export function parseFrontmatter(frontmatterText) {
  const data = {}
  const lines = String(frontmatterText ?? '').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '' || /^\s*#/.test(line)) {
      i += 1
      continue
    }
    if (/^\s/.test(line)) {
      // Indented content we don't model (nested mapping, sequence item).
      i += 1
      continue
    }
    const m = KEY_RE.exec(line)
    if (!m) {
      i += 1
      continue
    }
    const key = m[1]
    let value = m[2].trim()
    i += 1

    if (value === '>' || value === '|' || /^[>|][+-]?$/.test(value)) {
      const folded = value.startsWith('>')
      const collected = []
      while (i < lines.length) {
        const next = lines[i]
        if (next.trim() === '') {
          collected.push('')
          i += 1
          continue
        }
        if (!/^\s/.test(next)) break
        collected.push(next.replace(/^\s{1,}/, ''))
        i += 1
      }
      while (collected.length && collected[collected.length - 1] === '') collected.pop()
      data[key] = folded ? collected.join(' ').replace(/\s+/g, ' ').trim() : collected.join('\n').trim()
      continue
    }

    if (value.startsWith('"')) {
      let buf = value
      while (!/^"(?:[^"\\]|\\.)*"$/.test(buf) && i < lines.length) {
        buf += '\n' + lines[i]
        i += 1
      }
      data[key] = buf.startsWith('"') ? unquoteDouble(buf) : buf
    } else if (value.startsWith("'")) {
      let buf = value
      while (!(buf.length > 1 && buf.endsWith("'") && !buf.endsWith("\\'")) && i < lines.length) {
        buf += '\n' + lines[i]
        i += 1
      }
      data[key] = buf.slice(1, buf.endsWith("'") ? -1 : undefined).replace(/''/g, "'").trim()
    } else {
      // Plain scalar: consume indented continuation lines.
      const parts = [value]
      while (i < lines.length && /^\s+\S/.test(lines[i])) {
        parts.push(lines[i].trim())
        i += 1
      }
      data[key] = parts.join(' ').trim()
    }
  }
  return data
}

export function firstLine(text, max = 400) {
  const one = String(text ?? '').replace(/\s+/g, ' ').trim()
  return one.length > max ? one.slice(0, max - 1) + '…' : one
}
