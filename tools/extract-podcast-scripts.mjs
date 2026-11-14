import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prismaDir = path.join(__dirname, '../packages/db/prisma');

function getMainSeedFile(n) {
  const prefix = `seed-course-${String(n).padStart(2, '0')}-`;
  const files = fs
    .readdirSync(prismaDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.ts') && !f.includes('-exam'));
  if (files.length !== 1) {
    throw new Error(`Expected 1 main seed for course ${n}, found: ${files.join(', ')}`);
  }
  return files[0];
}

function extractCourseTitle(content) {
  const m =
    content.match(/const COURSE_TITLE = '([^']*(?:\\'[^']*)*)';/) ??
    content.match(/const COURSE_TITLE = "([^"]*(?:\\"[^"]*)*)";/);
  if (!m) throw new Error('COURSE_TITLE not found');
  return m[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
}

function skipWhitespace(src, i) {
  while (i < src.length && /\s/.test(src[i])) i++;
  return i;
}

function extractStringLiteral(src, startIdx) {
  let i = startIdx;
  const quote = src[i];
  if (quote !== "'" && quote !== '"') {
    throw new Error(`Expected string at ${startIdx}, got ${JSON.stringify(src.slice(startIdx, startIdx + 20))}`);
  }
  i++;
  let out = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') {
      const next = src[i + 1];
      if (next === 'n') out += '\n';
      else if (next === 't') out += '\t';
      else if (next === 'r') out += '\r';
      else out += next;
      i += 2;
      continue;
    }
    if (ch === quote) return { value: out, end: i + 1 };
    out += ch;
    i++;
  }
  throw new Error('Unterminated string');
}

function skipTemplateLiteral(src, startIdx) {
  if (src[startIdx] !== '`') throw new Error('Expected template literal');
  let i = startIdx + 1;
  while (i < src.length) {
    if (src[i] === '\\') {
      i += 2;
      continue;
    }
    if (src[i] === '`') return i + 1;
    i++;
  }
  throw new Error('Unterminated template literal');
}

function skipExpression(src, startIdx) {
  let i = skipWhitespace(src, startIdx);
  const ch = src[i];
  if (ch === "'" || ch === '"') return extractStringLiteral(src, i).end;
  if (ch === '`') return skipTemplateLiteral(src, i);
  if (ch === '[') {
    let depth = 0;
    do {
      if (src[i] === '[') depth++;
      else if (src[i] === ']') depth--;
      i++;
    } while (i < src.length && depth > 0);
    i = skipWhitespace(src, i);
    if (src.slice(i, i + 5) === '.join') {
      const paren = src.indexOf(')', i);
      if (paren === -1) throw new Error('Unterminated .join()');
      return paren + 1;
    }
    return i;
  }
  const ident = src.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
  if (ident) return i + ident[0].length;
  throw new Error(`Cannot skip expression at ${i}: ${JSON.stringify(src.slice(i, i + 30))}`);
}

function extractArrayJoinFrom(src, startIdx) {
  let i = startIdx;
  if (src[i] !== '[') throw new Error('Expected [');
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  const arraySrc = src.slice(startIdx, i);
  const strings = [];
  let j = 0;
  while (j < arraySrc.length) {
    j = skipWhitespace(arraySrc, j);
    if (arraySrc[j] === ']') break;
    if (arraySrc[j] === ',') {
      j++;
      continue;
    }
    if (arraySrc[j] === "'" || arraySrc[j] === '"') {
      const { value, end } = extractStringLiteral(arraySrc, j);
      strings.push(value);
      j = end;
      continue;
    }
    j++;
  }
  return strings.join('\n');
}

function resolveVariableScript(content, varName) {
  const varRe = new RegExp(
    `(?:const|let)\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]\\.join\\([^)]+\\)|['\"][\\s\\S]*?['\"])\\s*;`,
  );
  const varMatch = content.match(varRe);
  if (!varMatch) throw new Error(`Could not resolve variable ${varName}`);
  const varSrc = varMatch[1];
  if (varSrc.startsWith('[')) {
    const arrStart = content.indexOf(varSrc);
    return extractArrayJoinFrom(content, arrStart);
  }
  return extractStringLiteral(varSrc, 0).value;
}

function extractNarrationScript(content, startIdx) {
  let i = skipWhitespace(content, startIdx);
  const ch = content[i];
  if (ch === "'" || ch === '"') return extractStringLiteral(content, i).value;
  if (ch === '[') return extractArrayJoinFrom(content, i);
  const identMatch = content.slice(i).match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
  if (identMatch) return resolveVariableScript(content, identMatch[1]);
  throw new Error(`Unknown narrationScript at ${i}`);
}

function labelFromId(id) {
  if (/-mv-audio$|s03-audio$/.test(id)) return 'statistics/mini-video';
  if (/-causes-audio$|s06-audio$/.test(id)) return 'causes';
  if (/-si-intro-audio$|s09-intro-audio$|emergency-intro/.test(id)) return 'emergency/scenario intro';
  if (/-cs-audio$|s11-audio$|case-podcast/.test(id)) return 'case study';
  return null;
}

function extractPendingAudioBlocks(content) {
  const blocks = [];
  const re = /pendingAudio\s*\(\s*['"]/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    let i = match.index + match[0].length - 1;
    i = skipWhitespace(content, i);
    const idLit = extractStringLiteral(content, i);
    i = skipWhitespace(content, idLit.end);
    if (content[i] !== ',') throw new Error('Expected comma after id');
    i = skipWhitespace(content, i + 1);
    i = skipExpression(content, i); // title
    i = skipWhitespace(content, i);
    if (content[i] !== ',') throw new Error('Expected comma after title');
    i = skipWhitespace(content, i + 1);
    i = skipExpression(content, i); // asset path
    i = skipWhitespace(content, i);
    if (content[i] !== ',') throw new Error('Expected comma after asset path');
    i = skipWhitespace(content, i + 1);
    const script = extractNarrationScript(content, i);
    const label = labelFromId(idLit.value) ?? `unknown (${idLit.value})`;
    blocks.push({ id: idLit.value, label, script });
  }
  return blocks;
}

function extractCourse(n) {
  const filename = getMainSeedFile(n);
  const content = fs.readFileSync(path.join(prismaDir, filename), 'utf8');
  const title = extractCourseTitle(content);
  const blocks = extractPendingAudioBlocks(content);
  if (blocks.length !== 4) {
    throw new Error(`Course ${n}: expected 4 pendingAudio blocks, found ${blocks.length}`);
  }
  return { n, title, filename, blocks };
}

function formatCourse(course) {
  const lines = [];
  lines.push(`=== COURSE ${String(course.n).padStart(2, '0')} — ${course.title} — ${course.filename} ===`);
  for (const block of course.blocks) {
    lines.push(`--- [${block.label}] block id: ${block.id} ---`);
    lines.push(block.script);
  }
  return lines.join('\n');
}

const start = Number(process.argv[2] || 12);
const end = Number(process.argv[3] || 25);
const out = [];
for (let n = start; n <= end; n++) {
  out.push(formatCourse(extractCourse(n)));
}
process.stdout.write(out.join('\n\n'));
