// Screen.jsx — scroll container used by every screen
// Applies screen-anim entrance, hides scrollbar, reserves space for tab bar.

export function Screen({ children, style, scrollStyle }) {
  return (
    <div className="screen screen-anim" style={style}>
      <div className="scroll" style={scrollStyle}>
        {children}
      </div>
    </div>
  );
}

// ScrollScreen — full-height scrollable screen (no fixed children)
export function ScrollScreen({ children, bottomPad = 112, style }) {
  return (
    <div className="scroll screen-anim" style={{ paddingBottom: bottomPad, ...style }}>
      {children}
    </div>
  );
}
