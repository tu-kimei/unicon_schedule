import { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getDocsList, getDocContent } from 'wasp/client/operations';
import { Layout } from '../../shared/components/Layout';
import { RoleGuard } from '../../shared/components/RoleGuard';

interface DocFile {
  path: string;
  name: string;
  group: string;
  groupLabel: string;
}

interface DocGroup {
  key: string;
  label: string;
  icon: string;
  files: DocFile[];
}

// Simple markdown → HTML renderer (no external dep)
function renderMarkdown(md: string): string {
  // Escape HTML first
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (triple backtick)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre class="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm my-4"><code>${code.trimEnd()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  // Tables — basic support
  html = html.replace(/(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g, (table) => {
    const rows = table.trim().split('\n');
    const header = rows[0].split('|').filter(c => c.trim() !== '').map(c =>
      `<th class="px-3 py-2 text-left bg-gray-100 font-semibold text-gray-700 border border-gray-200">${c.trim()}</th>`
    ).join('');
    const body = rows.slice(2).map(row =>
      `<tr>${row.split('|').filter(c => c.trim() !== '').map(c =>
        `<td class="px-3 py-2 text-gray-700 border border-gray-200">${c.trim()}</td>`
      ).join('')}</tr>`
    ).join('');
    return `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-200 text-sm">\
<thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
  });

  // HR
  html = html.replace(/^---$/gm, '<hr class="my-6 border-gray-200" />');

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="text-xs font-semibold text-gray-600 mt-4 mb-1">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="text-sm font-semibold text-gray-700 mt-4 mb-1">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="text-base font-semibold text-gray-800 mt-5 mb-2">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-200">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-2 mb-4">$1</h1>');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>');

  // Blockquote
  html = html.replace(/^&gt;\s+(.+)$/gm,
    '<blockquote class="border-l-4 border-primary-400 pl-4 py-1 my-2 text-gray-600 bg-primary-50 rounded-r-md">$1</blockquote>'
  );

  // Unordered lists
  html = html.replace(/((?:^[ \t]*[-*+]\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line =>
      `<li class="ml-5 list-disc text-gray-700 my-0.5">${line.replace(/^[ \t]*[-*+]\s/, '')}</li>`
    ).join('');
    return `<ul class="my-3 space-y-0.5">${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\.\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line =>
      `<li class="ml-5 list-decimal text-gray-700 my-0.5">${line.replace(/^\d+\.\s/, '')}</li>`
    ).join('');
    return `<ol class="my-3 space-y-0.5">${items}</ol>`;
  });

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-600 underline hover:text-primary-800">$1</a>'
  );

  // Checkboxes
  html = html.replace(/^- \[x\]\s+(.+)$/gmi,
    '<div class="flex items-center gap-2 my-0.5"><span class="text-green-500">✅</span><span class="text-gray-700">$1</span></div>'
  );
  html = html.replace(/^- \[ \]\s+(.+)$/gmi,
    '<div class="flex items-center gap-2 my-0.5"><span class="text-gray-400">⬜</span><span class="text-gray-600">$1</span></div>'
  );

  // Paragraphs — wrap bare text lines
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p class="text-gray-700 leading-relaxed my-2">$1</p>');

  // Double newlines → spacer
  html = html.replace(/\n\n/g, '<div class="my-2"></div>');

  return html;
}

export const DocsPage = () => {
  const { data: docsList, isLoading: listLoading } = useQuery(getDocsList, {});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mobilePanelView, setMobilePanelView] = useState<'list' | 'content'>('list');

  const { data: docData, isLoading: contentLoading } = useQuery(
    getDocContent,
    { path: selectedPath ?? '' },
    { enabled: !!selectedPath }
  );

  // Auto-select first group and file when list loads
  useEffect(() => {
    if (docsList?.groups?.length && !activeGroup) {
      const firstGroup = docsList.groups[0];
      setActiveGroup(firstGroup.key);
      if (firstGroup.files?.length) {
        setSelectedPath(firstGroup.files[0].path);
      }
    }
  }, [docsList]);

  const groups: DocGroup[] = docsList?.groups ?? [];

  const filteredGroups = search.trim()
    ? groups.map(g => ({
        ...g,
        files: g.files.filter(f =>
          f.name.toLowerCase().includes(search.toLowerCase())
        )
      })).filter(g => g.files.length > 0)
    : groups;

  const activeGroupData = filteredGroups.find(g => g.key === activeGroup);

  const handleSelectFile = (path: string) => {
    setSelectedPath(path);
    setMobilePanelView('content');
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OPS', 'ACCOUNTING', 'DISPATCHER']}>
      <Layout>
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          {/* ── Left: Group list ── */}
          <div className="hidden md:flex w-48 flex-col border-r border-gray-200 bg-white overflow-y-auto py-3">
            <div className="px-3 mb-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Nhóm tài liệu</p>
            </div>
            {listLoading ? (
              <div className="px-3 space-y-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-8 rounded bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-0.5 px-2">
                {groups.map(group => (
                  <button
                    key={group.key}
                    onClick={() => {
                      setActiveGroup(group.key);
                      setSearch('');
                      if (group.files.length) setSelectedPath(group.files[0].path);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      activeGroup === group.key
                        ? 'bg-primary-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{group.icon}</span>
                    <span className="truncate">{group.label}</span>
                    <span className={`ml-auto text-xs rounded-full px-1.5 py-0.5 ${
                      activeGroup === group.key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{group.files.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Middle: File list (hidden on mobile when viewing content) ── */}
          <div className={`${mobilePanelView === 'content' ? 'hidden md:flex' : 'flex'} w-full md:w-64 flex-col border-r border-gray-200 bg-gray-50 overflow-hidden`}>
            {/* Mobile: group selector */}
            <div className="md:hidden px-3 py-2 border-b bg-white">
              <select
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                value={activeGroup ?? ''}
                onChange={e => {
                  const g = groups.find(x => x.key === e.target.value);
                  if (g) {
                    setActiveGroup(g.key);
                    if (g.files.length) setSelectedPath(g.files[0].path);
                  }
                }}
              >
                {groups.map(g => (
                  <option key={g.key} value={g.key}>{g.icon} {g.label}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b bg-white">
              <div className="relative">
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm tài liệu..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">✕</button>
                )}
              </div>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto py-2">
              {listLoading ? (
                <div className="px-3 space-y-2 mt-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-10 rounded bg-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : (filteredGroups.find(g => g.key === activeGroup)?.files ?? filteredGroups.flatMap(g => g.files)).map(file => (
                <button
                  key={file.path}
                  onClick={() => handleSelectFile(file.path)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedPath === file.path
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="leading-snug">{file.name}</span>
                  </div>
                </button>
              ))}
              {!listLoading && (filteredGroups.find(g => g.key === activeGroup)?.files ?? []).length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Không có tài liệu nào
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Content panel ── */}
          <div className={`${mobilePanelView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden bg-white`}>
            {/* Mobile back button */}
            <div className="md:hidden px-4 py-2 border-b bg-gray-50 flex items-center gap-2">
              <button
                onClick={() => setMobilePanelView('list')}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Danh sách
              </button>
            </div>

            {/* Content */}
            {!selectedPath ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-base font-medium text-gray-400">Chọn một tài liệu để đọc</p>
              </div>
            ) : contentLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="space-y-3 w-full max-w-2xl px-8">
                  <div className="h-8 bg-gray-100 rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-4/5" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                  <div className="mt-6 h-6 bg-gray-100 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ) : docData?.content ? (
              <div className="flex-1 overflow-y-auto">
                {/* Header bar */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-800">{docData.name}</span>
                    {docData.path && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-xs text-gray-400">{docData.path}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {docData.updatedAt && (
                      <span className="text-xs text-gray-400">
                        Cập nhật: {new Date(docData.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Markdown content */}
                <div
                  className="px-8 py-6 max-w-4xl prose-docs"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(docData.content) }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Không thể tải nội dung tài liệu
              </div>
            )}
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
};
