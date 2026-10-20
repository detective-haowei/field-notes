import type { ReactNode } from "react";

// Update text is plain text. It is turned into nodes here: links become
// anchors, @mentions become chips, and search terms get highlighted.

const URL_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
const MENTION_RE = /(^|[\s([{"'])@([A-Za-z0-9_][\w'’.-]*)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;
const TRAILING_NAME_CHARS = /[.'’-]+$/;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A regex matching any of the search terms, or null when there are none. */
export function highlightRe(terms: string[]): RegExp | null {
  const parts = terms.filter(Boolean).map(escapeRe);
  return parts.length ? new RegExp("(" + parts.join("|") + ")", "gi") : null;
}

/** Wraps each match of the search terms in a <mark>. */
export function highlight(text: string, re: RegExp | null, keyPrefix: string): ReactNode[] {
  if (!re) return [text];
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(text))) {
    if (!m[0]) break;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <mark className="hl" key={keyPrefix + "m" + m.index}>
        {m[0]}
      </mark>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}

function withMentions(text: string, re: RegExp | null, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(text))) {
    const name = m[2].replace(TRAILING_NAME_CHARS, "");
    if (!name) continue;
    const start = m.index + m[1].length;
    if (start > last) out.push(...highlight(text.slice(last, start), re, keyPrefix + last + "t"));
    out.push(
      <span className="tg" key={keyPrefix + start + "p"}>
        {highlight("@" + name, re, keyPrefix + start + "ph")}
      </span>,
    );
    last = start + 1 + name.length;
    MENTION_RE.lastIndex = last;
  }
  if (last < text.length) out.push(...highlight(text.slice(last), re, keyPrefix + last + "t"));
  return out;
}

/**
 * Update text as nodes: links, @mention chips and highlighted search terms.
 * Trailing punctuation is kept out of a link so "see http://x." still works.
 */
export function renderUpdateText(text: string, terms: string[] = []): ReactNode[] {
  const re = highlightRe(terms);
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text))) {
    let url = m[0];
    let tail = "";
    const punctuation = url.match(TRAILING_PUNCTUATION);
    if (punctuation) {
      tail = punctuation[0];
      url = url.slice(0, url.length - tail.length);
    }
    if (m.index > last) out.push(...withMentions(text.slice(last, m.index), re, "a" + last));
    out.push(
      <a
        key={"l" + m.index}
        href={/^www\./i.test(url) ? "https://" + url : url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {highlight(url, re, "lh" + m.index)}
      </a>,
    );
    if (tail) out.push(...withMentions(tail, re, "t" + m.index));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...withMentions(text.slice(last), re, "z" + last));
  return out;
}

/** Plain text with search terms highlighted, for task bodies and tag chips. */
export function renderHighlighted(text: string, terms: string[] = []): ReactNode[] {
  return highlight(text, highlightRe(terms), "h");
}

/** jsPDF's built-in fonts are Latin-1 only, so smart punctuation is folded. */
export function pdfSafe(t: string): string {
  return (t || "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7e -ÿ]/g, "?")
    .trim();
}
