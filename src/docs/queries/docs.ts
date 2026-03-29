import { HttpError } from 'wasp/server';
import type { GetDocsList, GetDocContent } from 'wasp/server/operations';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Config: Doc groups mapped to directory paths
// ============================================================================

// Runtime cwd thực tế thường là: <repo>/.wasp/out/server
// → repo root = ../../..
const REPO_ROOT = path.resolve(process.cwd(), '../../..');
const DOCS_BASE = path.join(REPO_ROOT, 'docs');
const AGENTS_BASE = path.join(REPO_ROOT, '..', 'agents');
const ROOT_BASE = REPO_ROOT;

const DOC_GROUPS: {
  key: string;
  label: string;
  icon: string;
  basePath: string;
  pattern?: RegExp;
  rootFiles?: string[];
}[] = [
  {
    key: 'core',
    label: 'Core',
    icon: '📐',
    basePath: path.join(DOCS_BASE, '01_core'),
  },
  {
    key: 'features',
    label: 'Features',
    icon: '🧩',
    basePath: path.join(DOCS_BASE, '02_features'),
  },
  {
    key: 'operations',
    label: 'Operations',
    icon: '⚙️',
    basePath: path.join(DOCS_BASE, '03_operations'),
  },
  {
    key: 'planning',
    label: 'Planning',
    icon: '📋',
    basePath: path.join(DOCS_BASE, '05_planning'),
  },
  {
    key: 'deployment',
    label: 'Deployment',
    icon: '🚀',
    basePath: path.join(DOCS_BASE, '06_deployment'),
  },
  {
    key: 'superpowers',
    label: 'Superpowers',
    icon: '⚡',
    basePath: path.join(DOCS_BASE, 'superpowers'),
  },
  {
    key: 'agents-ba',
    label: 'BA Specs',
    icon: '📝',
    basePath: path.join(AGENTS_BASE, 'ba'),
  },
  {
    key: 'agents-arch',
    label: 'Architecture',
    icon: '🏗️',
    basePath: path.join(AGENTS_BASE, 'architect'),
  },
  {
    key: 'agents-qa',
    label: 'QA Reports',
    icon: '🧪',
    basePath: path.join(AGENTS_BASE, 'qa'),
  },
  {
    key: 'agents-pm',
    label: 'PM / Sprints',
    icon: '📊',
    basePath: path.join(AGENTS_BASE, 'pm'),
  },
  {
    key: 'agents-dev',
    label: 'Dev Handoffs',
    icon: '💻',
    basePath: path.join(AGENTS_BASE, 'dev'),
  },
  {
    key: 'root',
    label: 'Project Root',
    icon: '📦',
    basePath: ROOT_BASE,
    rootFiles: ['README.md', 'MIGRATION_INSTRUCTIONS.md', 'TEST_ACCOUNTS.md', 'USER_MANAGEMENT_GUIDE.md', 'E2E_TEST_REPORT.md', 'AGENTS.md', 'CLAUDE.md'],
  },
];

// ============================================================================
// Helpers
// ============================================================================

function scanDir(dirPath: string, rootFiles?: string[]): { relativePath: string; name: string }[] {
  const results: { relativePath: string; name: string }[] = [];

  if (rootFiles) {
    // Only scan specific files in root
    for (const fileName of rootFiles) {
      const fullPath = path.join(dirPath, fileName);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        results.push({ relativePath: fileName, name: fileName });
      }
    }
    return results;
  }

  if (!fs.existsSync(dirPath)) return results;

  function walk(currentDir: string, prefix: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = path.join(currentDir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.name.endsWith('.md')) {
        results.push({
          relativePath: relPath,
          name: entry.name.replace(/\.md$/, ''),
        });
      }
    }
  }

  walk(dirPath, '');
  return results;
}

function humanizeName(name: string): string {
  return name
    .replace(/^\d+_?/, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\.md$/, '');
}

// ============================================================================
// Queries
// ============================================================================

export const getDocsList: GetDocsList<Record<string, never>, any> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, 'Chưa đăng nhập');
  if (!['ADMIN', 'OPS', 'ACCOUNTING', 'DISPATCHER'].includes(context.user.role)) {
    throw new HttpError(403, 'Không có quyền truy cập tài liệu');
  }

  const groups: any[] = [];

  for (const groupDef of DOC_GROUPS) {
    const files = scanDir(groupDef.basePath, groupDef.rootFiles);
    if (files.length === 0) continue;

    groups.push({
      key: groupDef.key,
      label: groupDef.label,
      icon: groupDef.icon,
      files: files.map(f => ({
        path: `${groupDef.key}::${f.relativePath}`,
        name: humanizeName(f.name),
        group: groupDef.key,
        groupLabel: groupDef.label,
      })),
    });
  }

  return { groups };
};

export const getDocContent: GetDocContent<{ path: string }, any> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Chưa đăng nhập');
  if (!['ADMIN', 'OPS', 'ACCOUNTING', 'DISPATCHER'].includes(context.user.role)) {
    throw new HttpError(403, 'Không có quyền truy cập tài liệu');
  }

  const { path: docPath } = args;
  if (!docPath || !docPath.includes('::')) {
    throw new HttpError(400, 'Đường dẫn tài liệu không hợp lệ');
  }

  const [groupKey, ...relParts] = docPath.split('::');
  const relativePath = relParts.join('::');

  const groupDef = DOC_GROUPS.find(g => g.key === groupKey);
  if (!groupDef) {
    throw new HttpError(404, 'Nhóm tài liệu không tồn tại');
  }

  // Security: prevent path traversal
  const resolved = path.resolve(groupDef.basePath, relativePath);
  if (!resolved.startsWith(groupDef.basePath)) {
    throw new HttpError(403, 'Truy cập không hợp lệ');
  }

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new HttpError(404, 'File tài liệu không tồn tại');
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  const stat = fs.statSync(resolved);

  return {
    content,
    name: path.basename(resolved, '.md'),
    path: relativePath,
    updatedAt: stat.mtime.toISOString(),
  };
};
