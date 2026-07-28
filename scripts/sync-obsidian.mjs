import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDir, "..")
const defaultVaultPath = process.platform === "win32" ? "E:\\Obsidian Vault" : ""
const vaultPath = path.resolve(
  valueAfter("--vault") || process.env.OBSIDIAN_VAULT_PATH || defaultVaultPath,
)
const initialize = process.argv.includes("--init")

const blogRoot = path.join(vaultPath, "Blog")
const manifestPath = path.join(repositoryRoot, ".blog-sync-manifest.json")
const templateSource = path.join(repositoryRoot, "content", "templates", "source-based-post.md")
const templateTarget = path.join(vaultPath, "Templates", "GitHub Blog Article.md")
const categories = ["current-affairs-finance", "math-physics-cs", "tech-industry"]
const referenceRoots = [
  path.join(vaultPath, "References", "Articles"),
  path.join(vaultPath, "References", "X"),
]

function valueAfter(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : ""
}

function normalizeRelative(filePath) {
  return filePath.split(path.sep).join("/")
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)
}

function walkFiles(root) {
  if (!fs.existsSync(root)) return []
  const files = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(fullPath))
    if (entry.isFile()) files.push(fullPath)
  }
  return files
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  return match?.[1] || ""
}

function isPublished(markdown) {
  return /^publish:\s*true\s*$/m.test(frontmatter(markdown))
}

function frontmatterValue(markdown, key) {
  const expression = new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m")
  const raw = frontmatter(markdown).match(expression)?.[1]?.trim() || ""
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1)
  }
  return raw
}

function referenceIndex() {
  const byTarget = new Map()
  const byBasename = new Map()

  for (const root of referenceRoots) {
    for (const filePath of walkFiles(root).filter((file) => file.endsWith(".md"))) {
      const markdown = fs.readFileSync(filePath, "utf8")
      const url = frontmatterValue(markdown, "url")
      if (!/^https?:\/\//i.test(url)) continue

      const vaultRelative = normalizeRelative(
        path.relative(vaultPath, filePath).replace(/\.md$/i, ""),
      )
      const basename = path.basename(filePath, ".md")
      const record = { url, basename }
      byTarget.set(vaultRelative.toLowerCase(), record)

      const key = basename.toLowerCase()
      if (!byBasename.has(key)) byBasename.set(key, record)
      else byBasename.set(key, null)
    }
  }

  return { byTarget, byBasename }
}

function externalizeReferenceLinks(markdown, index, sourcePath) {
  const unresolved = []
  const converted = markdown.replace(
    /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
    (original, rawTarget, rawLabel) => {
      const target = rawTarget.trim().replaceAll("\\", "/")
      const basename = target.split("/").at(-1)
      const record =
        index.byTarget.get(target.toLowerCase()) ?? index.byBasename.get(basename.toLowerCase())

      if (record) {
        const label = (rawLabel || record.basename).trim()
        return `[${label}](${record.url})`
      }

      if (/^References\/(?:Articles|X)\//i.test(target)) {
        unresolved.push(target)
      }
      return original
    },
  )

  if (unresolved.length > 0) {
    throw new Error(`${sourcePath}: URL을 찾지 못한 참고 노트: ${unresolved.join(", ")}`)
  }
  return converted
}

function writeAtomically(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.codex-${process.pid}.tmp`
  fs.writeFileSync(temporaryPath, content, "utf8")
  fs.renameSync(temporaryPath, filePath)
}

function initializeVault() {
  fs.mkdirSync(path.join(blogRoot, "90-drafts"), { recursive: true })
  for (const category of categories) {
    fs.mkdirSync(path.join(blogRoot, category), { recursive: true })
  }
  fs.mkdirSync(path.dirname(templateTarget), { recursive: true })

  if (!fs.existsSync(templateTarget)) {
    fs.copyFileSync(templateSource, templateTarget)
    console.log(`템플릿 생성: ${templateTarget}`)
  } else {
    console.log(`기존 템플릿 유지: ${templateTarget}`)
  }
  console.log(`블로그 작업 폴더 준비: ${blogRoot}`)
}

function readPreviousManifest() {
  if (!fs.existsSync(manifestPath)) return []
  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  return Array.isArray(parsed.markdownFiles) ? parsed.markdownFiles : []
}

function sync() {
  if (!fs.existsSync(blogRoot)) {
    throw new Error(
      `블로그 작업 폴더가 없습니다: ${blogRoot}\n먼저 npm run obsidian:init 을 실행하세요.`,
    )
  }

  const index = referenceIndex()
  const markdownWrites = []
  const assetCopies = []

  for (const category of categories) {
    const sourceRoot = path.join(blogRoot, category)
    const destinationRoot = path.join(repositoryRoot, "content", category)

    for (const sourcePath of walkFiles(sourceRoot)) {
      const relative = path.relative(sourceRoot, sourcePath)
      const destinationPath = path.join(destinationRoot, relative)

      if (sourcePath.toLowerCase().endsWith(".md")) {
        const markdown = fs.readFileSync(sourcePath, "utf8")
        if (!isPublished(markdown)) continue
        if (path.basename(sourcePath).toLowerCase() === "index.md") {
          throw new Error(
            `${sourcePath}: index.md는 블로그 섹션 첫 화면과 충돌하므로 다른 이름을 사용하세요.`,
          )
        }
        markdownWrites.push({
          destinationPath,
          content: externalizeReferenceLinks(markdown, index, sourcePath),
        })
      } else {
        assetCopies.push({ sourcePath, destinationPath })
      }
    }
  }

  const nextMarkdown = markdownWrites.map(({ destinationPath }) =>
    normalizeRelative(path.relative(repositoryRoot, destinationPath)),
  )
  const nextSet = new Set(nextMarkdown)

  for (const previousRelative of readPreviousManifest()) {
    if (nextSet.has(previousRelative)) continue
    const previousPath = path.resolve(repositoryRoot, previousRelative)
    const contentRoot = path.join(repositoryRoot, "content")
    const managedCategory = categories.some((category) =>
      isWithin(path.join(contentRoot, category), previousPath),
    )
    if (!managedCategory) {
      throw new Error(`안전하지 않은 이전 manifest 경로: ${previousRelative}`)
    }
    if (fs.existsSync(previousPath)) {
      fs.rmSync(previousPath)
      console.log(`공개 목록에서 제거: ${previousRelative}`)
    }
  }

  for (const { destinationPath, content } of markdownWrites) {
    writeAtomically(destinationPath, content)
  }
  for (const { sourcePath, destinationPath } of assetCopies) {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
    fs.copyFileSync(sourcePath, destinationPath)
  }

  writeAtomically(
    manifestPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        vaultPath,
        markdownFiles: nextMarkdown.sort(),
      },
      null,
      2,
    )}\n`,
  )

  console.log(`동기화 완료: 공개 글 ${markdownWrites.length}개, 첨부파일 ${assetCopies.length}개`)
  console.log("PDF reference archive는 GitHub 저장소로 복사하지 않았습니다.")
}

if (!vaultPath) {
  throw new Error("--vault 또는 OBSIDIAN_VAULT_PATH로 Obsidian vault 경로를 지정하세요.")
}
if (!fs.existsSync(vaultPath)) {
  throw new Error(`Obsidian vault를 찾을 수 없습니다: ${vaultPath}`)
}

if (initialize) initializeVault()
else sync()
