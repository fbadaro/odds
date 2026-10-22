export type Severity = "error" | "warning" | "info";

/** The severity glyph of DESIGN.md: circled X, triangle with !, circled i. Inherits the text color. */
export function SeverityIcon({ severity }: { severity: Severity }) {
  return (
    <svg
      data-icon={severity}
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {severity === "error" && (
        <>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
        </>
      )}
      {severity === "warning" && (
        <>
          <path d="M8 1.8L14.6 13.5H1.4z" />
          <path d="M8 6.5v3.2" />
          <circle cx="8" cy="11.6" r=".6" fill="currentColor" />
        </>
      )}
      {severity === "info" && (
        <>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7.2v4" />
          <circle cx="8" cy="4.9" r=".6" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
