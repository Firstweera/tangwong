// Logo.jsx — TangWong brand: image-based illustration + wordmark with variants.
import illustration from "@/assets/brand/logo-illustration.webp";
import wordmark from "@/assets/brand/logo-wordmark.webp";

/**
 * Logo — brand lockup. Variants:
 *  - 'illustration' — the round emblem only (sized by width)
 *  - 'wordmark'     — the horizontal logotype image (sized by height)
 *  - default        — compact emblem mark + ตั้งวง / TANGWONG text (showWord)
 */
export function Logo({ size = 34, showWord = true, variant }) {
  if (variant === "wordmark") {
    return (
      <img
        src={wordmark}
        alt="TangWong"
        draggable="false"
        style={{
          height: size,
          width: "auto",
          display: "block",
          filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.25))",
        }}
      />
    );
  }
  if (variant === "illustration") {
    return (
      <img
        src={illustration}
        alt="TangWong"
        draggable="false"
        style={{
          width: size,
          height: "auto",
          display: "block",
          filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.3))",
        }}
      />
    );
  }

  const mark = (
    <img
      src={illustration}
      alt="TangWong"
      draggable="false"
      style={{
        height: size * 1.12,
        width: "auto",
        display: "block",
        flexShrink: 0,
        filter: "drop-shadow(0 5px 12px rgba(0,0,0,0.35))",
      }}
    />
  );
  if (!showWord) return mark;
  return (
    <div className="row gap10" style={{ alignItems: "center" }}>
      {mark}
      <div className="col" style={{ lineHeight: 1 }}>
        <span
          className="th"
          style={{
            fontSize: size * 0.5,
            fontWeight: 800,
            letterSpacing: "-0.01em",
          }}
        >
          ตั้งวง
        </span>
        <span
          style={{
            fontSize: size * 0.27,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "var(--muted)",
            marginTop: 2,
          }}
        >
          TANGWONG
        </span>
      </div>
    </div>
  );
}
