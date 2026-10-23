import { highlightParts } from "../lib/search";

export default function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="s-mark">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}
