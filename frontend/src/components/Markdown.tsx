import { createElement, Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Icon, { isIconName } from "./Icon";

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
const ICON_RE = /:([a-z][a-z0-9-]*):/g;

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

    if (token.startsWith("**")) {
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

function isBlockStart(line: string): boolean {
  return (
    /^(#{1,6})\s+/.test(line) ||
    /^```/.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^---+$/.test(line.trim())
  );
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

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        createElement(`h${level}`, { key: key++ }, renderInline(heading[2], `h-${key}`))
      );
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} />);
      i++;
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
          <p>{renderInline(quote.join(" "), `q-${key}`)}</p>
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
            <li key={idx}>{renderInline(item, `li-${key}-${idx}`)}</li>
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
            <li key={idx}>{renderInline(item, `oli-${key}-${idx}`)}</li>
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
    blocks.push(<p key={key++}>{renderInline(paragraph.join(" "), `p-${key}`)}</p>);
  }

  return <Fragment>{blocks}</Fragment>;
}
