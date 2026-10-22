import { createElement, Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Icon, { isIconName } from "./Icon";
import sanitizeHtml from "../lib/sanitizeHtml";

const INLINE_RE = /(\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)|!\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
const ICON_RE = /:([a-z][a-z0-9-]*):/g;
const HTML_TAG_RE =
  /<\/?(?:a|b|blockquote|br|center|code|details|div|em|figcaption|figure|h[1-6]|hr|i|img|li|ol|p|pre|s|section|source|span|strong|summary|table|tbody|td|th|thead|tr|u|ul|video)\b[^>]*>/i;
const HTML_START_RE =
  /^\s*<\/?(?:a|b|blockquote|br|center|code|details|div|em|figure|h[1-6]|hr|i|img|li|ol|p|pre|section|span|strong|summary|table|tbody|td|th|thead|tr|u|ul|video)\b/i;

function renderText(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  ICON_RE.lastIndex = 0;

  while ((match = ICON_RE.exec(text))) {
    const name = match[1];
    if (!isIconName(name)) continue;
    if (match.index > last) out.push(text.slice(last, match.index));
    out.push(<Icon key={`${key}-icon-${match.index}`} name={name} size={15} />);
    last = match.index + match[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;

  while ((match = INLINE_RE.exec(text))) {
    if (match.index > last) out.push(...renderText(text.slice(last, match.index), `${key}-${last}`));
    const token = match[0];
    const tokenKey = `${key}-${match.index}`;

    if (token.startsWith("[![")) {
      const linkedImage = /^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)$/.exec(token);
      if (linkedImage) {
        const [, alt, src, href] = linkedImage;
        out.push(
          <a key={tokenKey} href={href} target="_blank" rel="noreferrer">
            <img src={src} alt={alt} loading="lazy" decoding="async" />
          </a>
        );
      } else {
        out.push(...renderText(token, tokenKey));
      }
    } else if (token.startsWith("![")) {
      const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(token);
      if (image) {
        const [, alt, src] = image;
        out.push(<img key={tokenKey} src={src} alt={alt} loading="lazy" decoding="async" />);
      } else {
        out.push(...renderText(token, tokenKey));
      }
    } else if (token.startsWith("**")) {
      out.push(<strong key={tokenKey}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      out.push(<code key={tokenKey}>{token.slice(1, -1)}</code>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        const [, label, href] = link;
        out.push(
          href.startsWith("/") ? (
            <Link key={tokenKey} to={href}>{label}</Link>
          ) : (
            <a key={tokenKey} href={href} target="_blank" rel="noreferrer">{label}</a>
          )
        );
      } else {
        out.push(...renderText(token, tokenKey));
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) out.push(...renderText(text.slice(last), `${key}-${last}`));
  return out;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function imagesToHtml(text: string): string {
  return text
    .replace(/\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g, (_match, alt, src, href) =>
      `<a href="${escapeAttr(href)}"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"></a>`
    )
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) =>
      `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`
    );
}

function hasHtml(text: string): boolean {
  return HTML_TAG_RE.test(text);
}

function renderRichInline(text: string, key: string): ReactNode {
  if (hasHtml(text)) {
    return (
      <span
        key={key}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(imagesToHtml(text)) }}
      />
    );
  }
  return <Fragment key={key}>{renderInline(text, key)}</Fragment>;
}

function parseImageLine(line: string): ReactNode | null {
  const linked = /^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)$/.exec(line);
  if (linked) {
    const [, alt, src, href] = linked;
    return (
      <a href={href} target="_blank" rel="noreferrer">
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </a>
    );
  }
  const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line);
  if (image) {
    const [, alt, src] = image;
    return <img src={src} alt={alt} loading="lazy" decoding="async" />;
  }
  return null;
}

function isBlockStart(line: string): boolean {
  return (
    /^(#{1,6})\s+/.test(line) ||
    /^```/.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^---+$/.test(line.trim()) ||
    /^\s*\|/.test(line)
  );
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function cellAlignment(cell: string): "left" | "center" | "right" | undefined {
  const value = cell.trim();
  if (value.startsWith(":") && value.endsWith(":")) return "center";
  if (value.endsWith(":")) return "right";
  if (value.startsWith(":")) return "left";
  return undefined;
}

function renderCell(text: string, key: string): ReactNode {
  if (hasHtml(text)) {
    return <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(imagesToHtml(text)) }} />;
  }
  return <Fragment key={key}>{renderInline(text, key)}</Fragment>;
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      i++;
      const code: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={key++}>
          <code className={lang ? `language-${lang}` : undefined}>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const imageLine = parseImageLine(line.trim());
    if (imageLine) {
      blocks.push(<div className="md-image" key={key++}>{imageLine}</div>);
      i++;
      continue;
    }

    if (HTML_START_RE.test(line) || hasHtml(line)) {
      const html: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
        html.push(lines[i++]);
      }
      blocks.push(
        <div
          className="md-html"
          key={key++}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(imagesToHtml(html.join("\n"))) }}
        />
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        createElement(`h${level}`, { key: key++ }, renderRichInline(heading[2], `h-${key}`))
      );
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} />);
      i++;
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(line);
      const alignments = splitTableRow(lines[i + 1]).map(cellAlignment);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        rows.push(splitTableRow(lines[i++]));
      }
      blocks.push(
        <div className="md-table-wrap" key={key++}>
          <table>
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index} style={{ textAlign: alignments[index] }}>{renderCell(header, `th-${key}-${index}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} style={{ textAlign: alignments[cellIndex] }}>
                      {renderCell(cell, `td-${key}-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={key++}>
          <p>{renderRichInline(quote.join(" "), `q-${key}`)}</p>
        </blockquote>
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((item, idx) => (
            <li key={idx}>{renderRichInline(item, `li-${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++}>
          {items.map((item, idx) => (
            <li key={idx}>{renderRichInline(item, `oli-${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paragraph.push(lines[i++]);
    }
    const text = paragraph.join(" ");
    if (hasHtml(text)) {
      blocks.push(
        <div
          className="md-html"
          key={key++}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(imagesToHtml(text)) }}
        />
      );
    } else {
      blocks.push(<p key={key++}>{renderInline(text, `p-${key}`)}</p>);
    }
  }

  return <Fragment>{blocks}</Fragment>;
}
