import { useMemo } from 'react';

interface FormattedMessageProps {
  content: string;
}

// Simple markdown-like parser for chat messages
export function FormattedMessage({ content }: FormattedMessageProps) {
  const elements = useMemo(() => parseContent(content), [content]);
  return <div className="space-y-4">{elements}</div>;
}

function parseContent(content: string): JSX.Element[] {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentList: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';
  let key = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key++} className="my-2 space-y-2 pl-1">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-base text-gray-600">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vault-purple/60" />
              <span className="leading-7">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <div key={key++} className="my-2 overflow-hidden rounded-lg border border-gray-200">
          {codeBlockLang && (
            <div className="border-b border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              {codeBlockLang}
            </div>
          )}
          <pre className="overflow-x-auto bg-gray-50 p-4 text-base leading-relaxed">
            <code className="text-gray-800">{codeBlockContent.join('\n')}</code>
          </pre>
        </div>
      );
      codeBlockContent = [];
      codeBlockLang = '';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Headers
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={key++} className="mt-5 mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="h-5 w-1 rounded-full bg-vault-purple" />
          {parseInline(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="mt-4 mb-2 text-base font-semibold text-gray-800">
          {parseInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    // List items
    if (line.match(/^[-*]\s/)) {
      const listContent = line.replace(/^[-*]\s/, '').trim();
      currentList.push(listContent);
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      flushList();
      const num = line.match(/^(\d+)\./)?.[1] || '1';
      const listContent = line.replace(/^\d+\.\s/, '').trim();
      elements.push(
        <div key={key++} className="flex items-start gap-2.5 text-base text-gray-600">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-vault-purple/10 text-xs font-medium text-vault-purple">
            {num}
          </span>
          <span className="leading-7">{parseInline(listContent)}</span>
        </div>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      flushList();
      elements.push(<hr key={key++} className="my-4 border-gray-200" />);
      continue;
    }

    // Table row detection - collect all consecutive table rows
    if (line.includes('|') && line.trim().startsWith('|')) {
      flushList();
      const tableRows: string[] = [line];
      // Look ahead for more table rows
      let j = i + 1;
      while (j < lines.length && lines[j].includes('|') && lines[j].trim().startsWith('|')) {
        tableRows.push(lines[j]);
        j++;
      }
      // Skip the rows we've consumed
      i = j - 1;

      // Parse the table
      const parsedRows = tableRows
        .filter((row) => !row.match(/^\|[\s-:|]+\|$/)) // Filter out separator rows
        .map((row) =>
          row
            .split('|')
            .slice(1, -1) // Remove empty first/last from split
            .map((cell) => cell.trim())
        );

      if (parsedRows.length > 0) {
        const headerRow = parsedRows[0];
        const bodyRows = parsedRows.slice(1);

        elements.push(
          <div key={key++} className="my-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headerRow.map((cell, cellIdx) => (
                    <th
                      key={cellIdx}
                      className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2.5 text-base text-gray-600">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={key++} className="text-base leading-7 text-gray-600">
        {parseInline(line)}
      </p>
    );
  }

  flushList();
  flushCodeBlock();

  return elements;
}

function parseInline(text: string): JSX.Element[] {
  const elements: JSX.Element[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold text **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        elements.push(...parseInlineCode(remaining.slice(0, boldMatch.index), key));
        key++;
      }
      elements.push(
        <strong key={`bold-${key++}`} className="font-semibold text-gray-900">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // If no more special patterns, handle code and plain text
    elements.push(...parseInlineCode(remaining, key));
    break;
  }

  return elements;
}

function parseInlineCode(text: string, startKey: number): JSX.Element[] {
  const elements: JSX.Element[] = [];
  let remaining = text;
  let key = startKey;

  while (remaining.length > 0) {
    // Inline code `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        elements.push(
          <span key={`text-${key++}`}>{remaining.slice(0, codeMatch.index)}</span>
        );
      }
      elements.push(
        <code
          key={`code-${key++}`}
          className="rounded bg-vault-purple/10 px-1.5 py-0.5 font-mono text-sm text-vault-purple"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // Plain text
    if (remaining.length > 0) {
      elements.push(<span key={`text-${key++}`}>{remaining}</span>);
    }
    break;
  }

  return elements;
}
