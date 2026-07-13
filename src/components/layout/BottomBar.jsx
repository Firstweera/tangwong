// BottomBar.jsx — sticky gradient-faded action area at screen bottom
// Used by LobbyScreen and ResultScreen.

export function BottomBar({ children, paddingBottom = 26 }) {
  return (
    <div
      className="pad-x"
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        zIndex: 20,
        paddingTop: 12, paddingBottom,
        background: 'linear-gradient(transparent, var(--bg) 32%)',
      }}
    >
      {children}
    </div>
  );
}
