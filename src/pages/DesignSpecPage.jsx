// DesignSpecPage.jsx — three visual directions for the TangWong product UI.
import { Icon, Logo } from '../components/ui';

const directions = [
  {
    id: 'command',
    label: 'Recommended',
    title: 'Play Lobby Command Center',
    subtitle: 'Hangout app clarity with tabletop atmosphere.',
    mood: 'Dark command surface, one action color, brass/felt accents.',
    bestFor: 'Home, Lobby, room controls, realtime state.',
    tradeoff: 'Restrained, so tabletop flavor must appear in key moments.',
    notes: [
      'Hero becomes a room console with live state.',
      'Depth comes from contrast, borders, and active glow.',
      'One confident primary action; quiet secondary controls.',
    ],
  },
  {
    id: 'cinematic',
    label: 'Expressive',
    title: 'Cinematic Tabletop',
    subtitle: 'Richer game-night atmosphere.',
    mood: 'Felt table, animated cards, brass light, denser atmospheric texture.',
    bestFor: 'Welcome, game reveal, role reveal, results.',
    tradeoff: 'Memorable, but too much for chat/settings screens.',
    notes: [
      'The table scene becomes the main brand artifact.',
      'Role reveal and game start get tactile motion.',
      'Gameplay stays clearer than the atmosphere.',
    ],
  },
  {
    id: 'utility',
    label: 'Calm',
    title: 'Lean Social Utility',
    subtitle: 'Fast, clear multiplayer utility.',
    mood: 'Neutral dark panels, simple lists, minimal illustration, sharp state badges.',
    bestFor: 'Long matches, host tools, accounts, friends.',
    tradeoff: 'Highly usable, but less ownable without brand moments.',
    notes: [
      'Room code, roster, ready state, and chat lead.',
      'Mascots and game cards carry personality.',
      'Best if speed/accessibility become the main risk.',
    ],
  },
];

function SpecCard({ direction, index }) {
  const recommended = direction.id === 'command';
  return (
    <article className={'design-spec-card' + (recommended ? ' is-recommended' : '')}>
      <div className="col" style={{ alignItems: 'flex-start', gap: 10 }}>
        <div className="spec-number mono">{String(index + 1).padStart(2, '0')}</div>
        <span className="spec-badge th">{direction.label}</span>
      </div>
      <div className="col" style={{ gap: 8, marginTop: 18 }}>
        <h2 className="th">{direction.title}</h2>
        <p>{direction.subtitle}</p>
      </div>
      <div className="spec-meta">
        <div>
          <span className="spec-kicker">Mood</span>
          <strong>{direction.mood}</strong>
        </div>
        <div>
          <span className="spec-kicker">Best for</span>
          <strong>{direction.bestFor}</strong>
        </div>
      </div>
      <ul className="spec-list">
        {direction.notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
      <div className="spec-tradeoff">
        <Icon name="sparkle" size={16} />
        <span>{direction.tradeoff}</span>
      </div>
    </article>
  );
}

export default function DesignSpecPage({ go }) {
  return (
    <div className="scroll screen-anim design-spec-screen">
      <header className="design-spec-hero">
        <div className="row between" style={{ alignItems: 'center' }}>
          <Logo size={34} />
          <button className="btn btn-ghost" style={{ height: 40, borderRadius: 14, padding: '0 14px' }} onClick={() => go('home')}>
            <Icon name="home" size={16} />
            <span className="th">Home</span>
          </button>
        </div>
        <div className="design-spec-title">
          <span className="spec-badge th">Design spec</span>
          <h1 className="th">Modern direction for TangWong</h1>
          <p>Three visual systems for the product. Direction 1 is the target for this pass.</p>
        </div>
      </header>

      <main className="design-spec-grid">
        {directions.map((direction, index) => (
          <SpecCard key={direction.id} direction={direction} index={index} />
        ))}
      </main>

      <section className="design-spec-decision">
        <div>
          <span className="spec-kicker">Chosen path</span>
          <h2 className="th">Implement Direction 1 first</h2>
          <p>
            It fits the roadmap best: polish Home now, then reuse the same
            vocabulary for Lobby and realtime game sync.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => go('home')}>
          <span className="sheen" />
          <Icon name="arrowR" size={19} />
          <span className="th">ดูหน้า Home</span>
        </button>
      </section>
    </div>
  );
}
