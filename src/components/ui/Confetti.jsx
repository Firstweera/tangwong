// Confetti.jsx — celebration particle burst
import { useRef } from 'react';

export function Confetti({ count = 46, colors = ['#6D5EF9', '#00D4FF', '#FF9F43', '#34D17E', '#FF5C6C', '#fff'] }) {
  const pieces = useRef([...Array(count)].map(() => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.6 + Math.random() * 1.6,
    color: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * 360,
    w: 6 + Math.random() * 6,
  }))).current;
  return (
    <div className="confetti">
      {pieces.map((p, i) => (
        <i key={i} style={{ left: p.left + '%', background: p.color, animationDelay: p.delay + 's',
             animationDuration: p.dur + 's', width: p.w, height: p.w * 1.5, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}
