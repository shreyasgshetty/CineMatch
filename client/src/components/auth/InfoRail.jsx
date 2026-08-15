import React, { useEffect, useState } from 'react';

const RAIL_ITEMS = [
  { label: '25,000+ Titles', detail: 'Movies & Series Ingested' },
  { label: '14+ Languages', detail: 'Sandalwood to Hollywood' },
  { label: 'Personalized AI', detail: 'TF-IDF & Cosine Similarity' },
  { label: 'Learns From Taste', detail: 'Real-time rating feedback' }
];

export default function InfoRail() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % RAIL_ITEMS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="info-rail-container">
      <div className="info-rail-track">
        {RAIL_ITEMS.map((item, idx) => {
          const isActive = idx === activeIndex;
          const isLast = idx === RAIL_ITEMS.length - 1;

          return (
            <div key={idx} className={`info-rail-node ${isActive ? 'active' : ''}`}>
              <div className="node-marker-wrapper">
                <span className={`node-dot ${isActive ? 'dot-active' : ''}`} />
                {!isLast && <span className="node-line" />}
              </div>

              <div className="node-text">
                <div className="node-label">{item.label}</div>
                <div className="node-detail">{item.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .info-rail-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }

        .info-rail-track {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .info-rail-node {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          opacity: 0.6;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .info-rail-node.active {
          opacity: 1;
          transform: translateX(6px);
        }

        .node-marker-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding-top: 4px;
        }

        .node-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(212, 168, 67, 0.4);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .node-dot.dot-active {
          background: var(--gold);
          box-shadow: 0 0 12px var(--gold), 0 0 24px rgba(212, 168, 67, 0.6);
          transform: scale(1.4);
        }

        .node-line {
          width: 1px;
          height: 28px;
          background: linear-gradient(180deg, rgba(212, 168, 67, 0.3) 0%, transparent 100%);
          margin-top: 4px;
        }

        .node-text {
          display: flex;
          flex-direction: column;
        }

        .node-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.88rem;
          color: var(--text-primary);
          letter-spacing: 0.02em;
        }

        .info-rail-node.active .node-label {
          color: var(--gold);
        }

        .node-detail {
          font-size: 0.73rem;
          color: var(--text-muted);
          margin-top: 1px;
        }

        @media (max-width: 992px) {
          .info-rail-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
