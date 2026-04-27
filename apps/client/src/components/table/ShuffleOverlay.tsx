const SHUFFLE_CARDS = 12;

export default function ShuffleOverlay() {
  return (
    <div className="shuffle-overlay" aria-live="polite" aria-label="Shuffling cards">
      <ul className="shuffle-cards">
        {Array.from({ length: SHUFFLE_CARDS }).map((_, index) => (
          <li key={index} className="shuffle-card" />
        ))}
      </ul>
      <div className="shuffle-label">Shuffling...</div>
    </div>
  );
}
