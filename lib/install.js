// Install a skill from a GitHub repository into the local shared library.
//
// Local rules this module must keep (see the user's AGENTS.md):
//   • the one real copy lives in `~/.agents/skills/<name>` — a real directory,
//     never a symlink to some other checkout;
//   • a skill's identity is the `name` in its SKILL.md front matter, not the
//     folder name;
//   • an existing skill is never overwritten — a name collision is reported and
//     left alone.
//
// Nothing here talks to the network except through `git clone`, and the clone
// lands in a temp directory that is removed before returning.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, relative, resolve, sep } from 'node:path'
import { parseFrontmatter, splitFrontmatter, firstLine } from './frontmatter.js'

const run = promisify(execFile)

const SKILL_FILE = 'SKILL.md'
const MAX_DEPTH = 6
const SKIP_DIR = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'vendor', '__pycache__'])
const GIT_TIMEOUT_MS = 120_000

/** Default install target: the shared skill library every agent reads. */
export function defaultTarget(home = homedir()) {
  return join(home, '.agents', 'skills')
}

/**
 * Understand what the user pasted.
 *
 * Accepted: `owner/repo`, `https://github.com/owner/repo`, an optional
 * `/tree/<branch>/<subdir>` suffix, a `git@host:owner/repo.git` address, or any
 * plain https git URL. Local paths are refused on purpose — installing from a
 * directory on this machine is not a download, and this route exists for
 * "把 GitHub 上开源的这个 skill 装到本机".
 */
export function parseSource(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return { ok: false, error: '请填一个 GitHub 仓库地址或 owner/repo' }

  if (/^(file:|\.\.?\/|\/|~)/.test(raw)) {
    return { ok: false, error: '本地路径不在这里安装：请直接在 ~/.agents/skills 下放一个真实目录' }
  }

  let url = raw
  let branch = ''
  let subdir = ''

  // https://github.com/owner/repo/tree/main/skills/foo
  const tree = raw.match(/^https?:\/\/[^/]+\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/?(.*)$/i)
  if (tree) {
    branch = tree[3]
    subdir = tree[4] ?? ''
    url = `https://github.com/${tree[1]}/${tree[2]}.git`
  } else if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(raw)) {
    url = `https://github.com/${raw}.git`
  } else if (/^https?:\/\//i.test(raw)) {
    url = raw.endsWith('.git') ? raw : `${raw.replace(/\/+$/, '')}.git`
  } else if (/^git@[^:]+:.+/.test(raw)) {
    url = raw
  } else {
    return { ok: false, error: `看不懂这个来源：${raw}（要 owner/repo 或 https://github.com/owner/repo）` }
  }

  const ownerRepo = url.match(/[/:]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/)
  return {
    ok: true,
    url,
    branch,
    subdir,
    owner: ownerRepo?.[1] ?? '',
    repo: (ownerRepo?.[2] ?? '').replace(/\.git$/, ''),
    raw,
  }
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

async function findSkillDirs(root, base = root, depth = 0, out = []) {
  if (!(await isDirectory(root))) return out

  try {
    const text = await readFile(join(root, SKILL_FILE), 'utf8')
    out.push({ dir: root, relPath: relative(base, root) || '.', text })
  } catch {
    /* this directory is not a skill; look one level down */
  }

  if (depth >= MAX_DEPTH) return out
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIR.has(entry.name) || entry.name.startsWith('.')) continue
    await findSkillDirs(join(root, entry.name), base, depth + 1, out)
  }
  return out
}

function describeSkill(dir, relPath, text) {
  const split = splitFrontmatter(text)
  const data = split ? parseFrontmatter(split.frontmatterText) : {}
  const fallback = (relPath === '.' ? dir.split(sep).pop() : relPath.split(sep).pop()) ?? 'skill'
  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : fallback
  return {
    name,
    description: firstLine(data.description ?? '', 240),
    relPath,
    dir,
  }
}

/**
 * Clone the source and list every skill it contains — no writes to the library.
 * @param {{source: string, branch?: string, tmp?: string}} options
 */
export async function previewSource({ source, branch = '' }) {
  const parsed = parseSource(source)
  if (!parsed.ok) return parsed
  return scanClone({ url: parsed.url, branch: branch || parsed.branch, subdir: parsed.subdir, parsed })
}

/**
 * Clone one URL and list the skills inside it. Split out from
 * {@link previewSource} so tests can point it at a local repository.
 */
export async function scanClone({ url, branch = '', subdir = '', parsed = null }) {
  const source = parsed ?? { ok: true, url, branch, subdir, owner: '', repo: '', raw: url }
  const root = await mkdtemp(join(tmpdir(), 'skill-hub-'))
  const work = join(root, 'src')
  try {
    const args = ['clone', '--depth', '1', '--quiet']
    if (branch) args.push('--branch', branch)
    args.push(url, work)
    try {
      await run('git', args, { timeout: GIT_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024 })
    } catch (error) {
      const detail = String(error?.stderr || error?.message || error)
        .split('\n')
        .filter(Boolean)
        .slice(-2)
        .join(' ')
      return { ok: false, error: `git clone 失败：${detail}` }
    }

    const scope = subdir ? join(work, subdir) : work
    if (!(await isDirectory(scope))) {
      await rm(root, { recursive: true, force: true })
      return { ok: false, error: `仓库里没有这个子目录：${subdir}` }
    }

    const found = await findSkillDirs(scope)
    const candidates = found
      .map((item) => describeSkill(item.dir, item.relPath, item.text))
      .sort((a, b) => a.relPath.localeCompare(b.relPath))

    return {
      ok: true,
      source,
      root: subdir || '.',
      total: candidates.length,
      // Keep the staging directory alive for the install step; the caller owns it.
      stage: root,
      candidates: candidates.map((item) => ({ ...item, dir: undefined })),
      _dirs: candidates.map((item) => ({ name: item.name, dir: item.dir })),
    }
  } catch (error) {
    await rm(root, { recursive: true, force: true })
    return { ok: false, error: error?.message ?? String(error) }
  }
}

function safeName(name) {
  const text = String(name ?? '').trim()
  if (!text) return ''
  if (text.startsWith('.') || text.includes('/') || text.includes('\\') || text.includes('..')) return ''
  if (!/^[\w.\-\u4e00-\u9fa5 ]{1,80}$/.test(text)) return ''
  return text
}

async function copySkill(from, to) {
  await cp(from, to, {
    recursive: true,
    dereference: true,
    filter: (src) => {
      const base = src.split(sep).pop() ?? ''
      return !SKIP_DIR.has(base)
    },
  })
}

/**
 * Copy the chosen skills into the library.
 * @param {{preview: object, names: string[], target?: string, dir?: string, log?: (line: string) => Promise<void> | void}} options
 */
export async function installSkills({ preview, names, target = defaultTarget(), log }) {
  if (!preview?.ok || !Array.isArray(preview._dirs)) {
    return { ok: false, error: '预览结果已失效，请重新点一次「预览」' }
  }
  const picked = new Set((names ?? []).map((item) => String(item)))
  const wanted = preview._dirs.filter((item) => picked.size === 0 || picked.has(item.name))
  if (wanted.length === 0) return { ok: false, error: '没有选中要安装的 skill' }

  await mkdir(target, { recursive: true })
  const installed = []
  const skipped = []

  // A name the repo does not contain is worth saying out loud: it is usually a
  // typo or a skill that lives in another subdirectory.
  for (const name of picked) {
    if (!preview._dirs.some((item) => item.name === name)) {
      skipped.push({ name, reason: '这个仓库里没有同名 skill' })
    }
  }

  for (const item of wanted) {
    const name = safeName(item.name)
    if (!name) {
      skipped.push({ name: item.name, reason: '名字不合法（不能含路径分隔符或以点开头）' })
      continue
    }
    const dest = join(target, name)
    if (await isDirectory(dest)) {
      skipped.push({ name, reason: `已存在同名目录：${dest}（不覆盖）` })
      continue
    }
    if (!(await isDirectory(item.dir))) {
      skipped.push({ name, reason: '暂存目录已丢失，请重新预览' })
      continue
    }
    try {
      await copySkill(item.dir, dest)
      const ok = await stat(join(dest, SKILL_FILE)).then(() => true, () => false)
      if (!ok) {
        await rm(dest, { recursive: true, force: true })
        skipped.push({ name, reason: '复制后没有 SKILL.md，已回滚' })
        continue
      }
      installed.push({ name, path: dest })
      if (log) await log(`${new Date().toISOString()}\tinstall\t${preview.source?.url ?? ''}\t${name}\t${dest}`)
    } catch (error) {
      await rm(dest, { recursive: true, force: true }).catch(() => {})
      skipped.push({ name, reason: error?.message ?? String(error) })
    }
  }

  return { ok: installed.length > 0, installed, skipped, target }
}

/** Remove a staging directory created by {@link previewSource}. */
export async function cleanupPreview(preview) {
  if (!preview?.stage) return
  const stage = resolve(preview.stage)
  if (!stage.startsWith(resolve(tmpdir()))) return
  await rm(stage, { recursive: true, force: true }).catch(() => {})
}
