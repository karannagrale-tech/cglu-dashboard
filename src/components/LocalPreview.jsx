import React, { useState, useCallback, useMemo } from 'react';

/* ── Error Boundary ─────────────────────────────────────────── */

class NodeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 8,
          margin: 4,
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 6,
          fontSize: 11,
          color: '#DC2626',
          textAlign: 'center',
        }}>
          Render error: {this.props.nodeId || 'unknown'}
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Type label map ─────────────────────────────────────────── */

const TYPE_LABELS = {
  SCRATCH_CARD_ROOT: 'Background',
  SCRATCH_CARD_ROOT_1: 'Background',
  SPIN_WHEEL_ROOT: 'Background',
  QUIZ_ROOT: 'Background',
  DIRECT_REWARD_ROOT_1: 'Background',
  REWARD_CARD_ROOT_1: 'Background',
  SLOT_MACHINE_ROOT: 'Background',
  MEMORY_GAME_ROOT: 'Background',
  DIRECT_REWARD_ROOT: 'Background',
  REFERRAL_ROOT: 'Background',
  MULTISTEP_ROOT: 'Background',
  STREAK_ROOT: 'Background',
  GAME_CHALLENGE_ROOT: 'Background',
  STAMP_COLLECTION_ROOT: 'Background',
  ACTIVITY_SCRATCH_CARD_ROOT: 'Background',
  FLAPPY_BIRD_ROOT: 'Background',
  WORD_SCRAMBLE_ROOT: 'Background',
  BALLOON_POP_ROOT: 'Background',
  COLOR_MATCH_ROOT: 'Background',
  WHACK_A_MOLE_ROOT: 'Background',
  PICTURE_PUZZLE_ROOT: 'Background',
  TEXT: 'Text',
  IMAGE: 'Image',
  REWARD_BUTTON: 'Button',
  SCRATCH_CARD_GAME_1: 'Scratch Card',
  SPIN_THE_WHEEL_GAME_1: 'Spin Wheel',
  QUIZ_GAME_1: 'Quiz',
  SLOT_MACHINE_GAME_1: 'Slot Machine',
  MEMORY_GAME_1: 'Memory Game',
  REFERRAL_1: 'Referral',
  MULTISTEP_1: 'Multi-Step',
  STREAK_1: 'Streak',
  GAME_CHALLENGE_1: 'Game Challenge',
  STAMP_COLLECTION_1: 'Stamp Collection',
  ACTIVITY_SCRATCH_CARD_1: 'Activity Scratch Card',
  FLAPPY_BIRD_1: 'Flappy Bird',
  WORD_SCRAMBLE_1: 'Word Scramble',
  BALLOON_POP_1: 'Balloon Pop',
  COLOR_MATCH_1: 'Color Match',
  WHACK_A_MOLE_1: 'Whack-a-Mole',
  PICTURE_PUZZLE_1: 'Picture Puzzle',
  CONDITIONAL_WRAPPER: 'Conditional',
  CARD_CODE: 'Coupon Code',
  REWARD_BODY: 'Reward Text',
  REWARD_TNC: 'Terms & Conditions',
  COUNT_DOWN: 'Countdown',
  EXPIRY_DATE: 'Expiry Date',
  ANIMATION_CONTAINER: 'Animation',
  PLANE_BANNER: 'Banner',
  REWARD_CARD_1: 'Reward Card',
};

function getLabel(typeId) {
  return TYPE_LABELS[typeId] || typeId;
}

/* ── Root type detection ────────────────────────────────────── */

const ROOT_TYPES = new Set([
  'SCRATCH_CARD_ROOT', 'SCRATCH_CARD_ROOT_1',
  'SPIN_WHEEL_ROOT',
  'QUIZ_ROOT',
  'DIRECT_REWARD_ROOT_1',
  'REWARD_CARD_ROOT_1',
  'SLOT_MACHINE_ROOT',
  'MEMORY_GAME_ROOT',
  'DIRECT_REWARD_ROOT',
  'REFERRAL_ROOT',
  'MULTISTEP_ROOT',
  'STREAK_ROOT',
  'GAME_CHALLENGE_ROOT',
  'STAMP_COLLECTION_ROOT',
  'ACTIVITY_SCRATCH_CARD_ROOT',
  'FLAPPY_BIRD_ROOT',
  'WORD_SCRAMBLE_ROOT',
  'BALLOON_POP_ROOT',
  'COLOR_MATCH_ROOT',
  'WHACK_A_MOLE_ROOT',
  'PICTURE_PUZZLE_ROOT',
]);

/* ── Node Renderers ─────────────────────────────────────────── */

function RenderText({ node }) {
  const css = node.ui?.css?.text || {};
  const text = node.ui?.content?.text || '';
  return <p style={{ margin: 0, ...css }}>{text}</p>;
}

function RenderImage({ node }) {
  const css = node.ui?.css?.image || node.ui?.css?.container || {};
  const src = node.ui?.content?.src || node.ui?.content?.url || '';
  const alt = node.ui?.content?.alt || 'image';
  return (
    <img
      src={src}
      alt={alt}
      style={{
        maxWidth: '100%',
        display: 'block',
        ...css,
      }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
}

function RenderButton({ node }) {
  const css = node.ui?.css?.button || {};
  const text = node.ui?.content?.text || 'Redeem Now';
  return (
    <button
      style={{
        cursor: 'pointer',
        border: 'none',
        ...css,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {text}
    </button>
  );
}

function RenderScratchCard({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const coverColor = content.coverColor || '#9333EA';
  const coverText = content.coverText || 'Scratch Here!';
  const coverImage = content.coverImage || '';

  return (
    <div style={{
      width: 280,
      height: 200,
      margin: '0 auto 24px',
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
      ...css,
    }}>
      {/* Card background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: coverImage
          ? `url("${coverImage}") center/cover no-repeat`
          : coverColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Scratch texture overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(255,255,255,0.05) 8px,
            rgba(255,255,255,0.05) 16px
          )`,
        }} />
        {/* Cover text */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          color: '#FFFFFF',
          fontSize: 20,
          fontWeight: 700,
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          textAlign: 'center',
          padding: '0 16px',
        }}>
          {coverText}
        </div>
        {/* Scratch hint */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l-7-7 3-3 4 4 8-8 3 3z" />
          </svg>
          Swipe to scratch
        </div>
        {/* Sparkle decorations */}
        <div style={{
          position: 'absolute',
          top: 16,
          right: 20,
          fontSize: 18,
          opacity: 0.6,
          color: '#FDE68A',
        }}>&#10022;</div>
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 16,
          fontSize: 14,
          opacity: 0.4,
          color: '#FDE68A',
        }}>&#10022;</div>
      </div>
    </div>
  );
}

function RenderSpinWheel({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const slices = content.slices || [];
  const spinText = content.spinButtonText || 'SPIN';
  const pointerColor = content.pointerColor || '#FFD700';
  const sliceCount = slices.length || 6;
  const sliceAngle = 360 / sliceCount;

  // Build conic-gradient
  const gradientParts = slices.map((s, i) => {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    return `${s.backgroundColor || '#6366F1'} ${start}deg ${end}deg`;
  });
  const gradient = gradientParts.length > 0
    ? `conic-gradient(${gradientParts.join(', ')})`
    : 'conic-gradient(#EF4444 0deg 60deg, #F59E0B 60deg 120deg, #10B981 120deg 180deg, #6366F1 180deg 240deg, #EC4899 240deg 300deg, #8B5CF6 300deg 360deg)';

  const wheelSize = 240;

  return (
    <div style={{ position: 'relative', margin: '0 auto 24px', ...css }}>
      {/* Pointer triangle at top */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: 0,
        height: 0,
        margin: '0 auto -8px',
        borderLeft: '12px solid transparent',
        borderRight: '12px solid transparent',
        borderTop: `20px solid ${pointerColor}`,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      }} />

      {/* Wheel */}
      <div style={{
        width: wheelSize,
        height: wheelSize,
        borderRadius: '50%',
        background: gradient,
        margin: '0 auto',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 0 0 4px rgba(255,255,255,0.2)',
        border: '4px solid rgba(255,255,255,0.3)',
      }}>
        {/* Slice labels */}
        {slices.map((s, i) => {
          const angle = (i * sliceAngle) + (sliceAngle / 2) - 90;
          const rad = (angle * Math.PI) / 180;
          const labelRadius = wheelSize * 0.35;
          const x = wheelSize / 2 + labelRadius * Math.cos(rad);
          const y = wheelSize / 2 + labelRadius * Math.sin(rad);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                color: s.textColor || '#FFFFFF',
                fontSize: 10,
                fontWeight: 700,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                maxWidth: wheelSize * 0.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
              }}
            >
              {s.label}
            </div>
          );
        })}

        {/* Center button */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
          color: '#1F2937',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          border: '3px solid #FFD700',
          letterSpacing: 1,
        }}>
          {spinText}
        </div>

        {/* Segment divider lines */}
        {slices.map((_, i) => {
          const angle = i * sliceAngle;
          return (
            <div
              key={`line-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: wheelSize / 2 - 4,
                height: 1,
                background: 'rgba(255,255,255,0.3)',
                transformOrigin: '0 0',
                transform: `rotate(${angle - 90}deg)`,
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function RenderQuiz({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css || {};
  const questions = content.questions || [];
  const q = questions[0] || { question: 'Sample question?', options: ['A', 'B', 'C', 'D'] };
  const showTimer = content.showTimer !== false;
  const timeLimit = q.time || content.defaultTimeLimit || 15;

  const containerCss = css.container || {};
  const cardCss = css.questionCard || { background: '#374151', borderRadius: 12, padding: 20 };
  const optionCss = css.optionButton || { background: '#4B5563', color: '#FFFFFF', borderRadius: 8, padding: 12 };

  return (
    <div style={{ margin: '0 auto', maxWidth: 340, ...containerCss }}>
      <div style={{ ...cardCss, position: 'relative' }}>
        {/* Question counter */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <span style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 600,
          }}>
            Question 1/{questions.length || 1}
          </span>
          {showTimer && (
            <span style={{
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {timeLimit}s
            </span>
          )}
        </div>

        {/* Question text */}
        <div style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#FFFFFF',
          marginBottom: 16,
          lineHeight: 1.4,
        }}>
          {q.question}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(q.options || []).map((opt, i) => (
            <div
              key={i}
              style={{
                ...optionCss,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Slot Machine ──────────────────────────────────────────── */

function RenderSlotMachine({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const reels = content.reels || [
    ['🍒', '🍋', '🔔', '💎', '7️⃣'],
    ['🍒', '🍋', '🔔', '💎', '7️⃣'],
    ['🍒', '🍋', '🔔', '💎', '7️⃣'],
  ];
  const pullText = content.pullText || 'PULL';

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      textAlign: 'center',
      ...css,
    }}>
      {/* Machine frame */}
      <div style={{
        background: 'linear-gradient(180deg, #B91C1C 0%, #991B1B 100%)',
        borderRadius: 16,
        padding: '20px 16px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)',
        border: '3px solid #FDE68A',
      }}>
        {/* Title bar */}
        <div style={{
          fontSize: 14,
          fontWeight: 800,
          color: '#FDE68A',
          letterSpacing: 3,
          marginBottom: 12,
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}>
          ★ JACKPOT ★
        </div>
        {/* Reel window */}
        <div style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'center',
          background: '#1F2937',
          borderRadius: 10,
          padding: 12,
          border: '2px solid #374151',
        }}>
          {reels.map((reel, i) => {
            const symbols = Array.isArray(reel) ? reel : ['🍒', '🍋', '🔔'];
            const visibleIdx = Math.floor(symbols.length / 2);
            return (
              <div key={i} style={{
                width: 64,
                background: '#FFFFFF',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #D1D5DB',
              }}>
                {/* Above symbol (dimmed) */}
                <div style={{ fontSize: 22, padding: '6px 0', opacity: 0.3, borderBottom: '1px solid #E5E7EB' }}>
                  {symbols[(visibleIdx - 1 + symbols.length) % symbols.length]}
                </div>
                {/* Active symbol */}
                <div style={{
                  fontSize: 32,
                  padding: '8px 0',
                  background: 'linear-gradient(180deg, #FEF9C3 0%, #FFFFFF 50%, #FEF9C3 100%)',
                  fontWeight: 700,
                }}>
                  {symbols[visibleIdx]}
                </div>
                {/* Below symbol (dimmed) */}
                <div style={{ fontSize: 22, padding: '6px 0', opacity: 0.3, borderTop: '1px solid #E5E7EB' }}>
                  {symbols[(visibleIdx + 1) % symbols.length]}
                </div>
              </div>
            );
          })}
        </div>
        {/* Win line indicator */}
        <div style={{
          height: 2,
          background: '#EF4444',
          margin: '-52px 8px 40px',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 0 6px rgba(239,68,68,0.6)',
        }} />
        {/* Pull lever button */}
        <button style={{
          marginTop: 8,
          padding: '10px 40px',
          fontSize: 16,
          fontWeight: 800,
          color: '#FFFFFF',
          background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
          border: '2px solid #B45309',
          borderRadius: 24,
          cursor: 'pointer',
          letterSpacing: 2,
          boxShadow: '0 3px 0 #92400E, 0 4px 8px rgba(0,0,0,0.3)',
        }}>
          {pullText}
        </button>
      </div>
    </div>
  );
}

/* ── Memory Game ───────────────────────────────────────────── */

function RenderMemoryGame({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const gridSize = content.gridSize || 4;
  const timeLimit = content.timeLimit || 60;
  const symbols = content.symbols || ['🌟', '🎯', '🎲', '🎪', '🎨', '🎭', '🎵', '🎸'];
  const revealedIndices = new Set(content.revealedIndices || [0, 5]);

  const totalCards = gridSize * gridSize;
  const cardSymbols = [];
  for (let i = 0; i < totalCards; i++) {
    cardSymbols.push(symbols[i % symbols.length]);
  }

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      ...css,
    }}>
      {/* Timer and score bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        padding: '0 4px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(239,68,68,0.2)',
          padding: '4px 10px',
          borderRadius: 12,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>{timeLimit}s</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          Matches: 0/{totalCards / 2}
        </div>
      </div>
      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 6,
      }}>
        {cardSymbols.map((symbol, i) => {
          const isRevealed = revealedIndices.has(i);
          return (
            <div key={i} style={{
              aspectRatio: '1',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: gridSize <= 4 ? 22 : 16,
              cursor: 'pointer',
              transition: 'transform 0.3s',
              background: isRevealed
                ? 'linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)'
                : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              border: isRevealed ? '2px solid #A5B4FC' : '2px solid #4338CA',
              boxShadow: isRevealed
                ? '0 2px 8px rgba(99,102,241,0.3)'
                : '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              {isRevealed ? symbol : (
                <span style={{ fontSize: gridSize <= 4 ? 18 : 14, opacity: 0.8 }}>❓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Referral ──────────────────────────────────────────────── */

function RenderReferral({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const steps = content.steps || [
    { label: 'Share Link', done: true },
    { label: 'Friend Joins', done: false },
    { label: 'Both Rewarded', done: false },
  ];
  const referralCode = content.referralCode || 'REF-ABCD1234';
  const shareText = content.shareText || 'Share & Earn';

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      textAlign: 'center',
      ...css,
    }}>
      {/* Progress steps */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        padding: '0 12px',
      }}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: step.done
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'rgba(255,255,255,0.15)',
                border: step.done ? '2px solid #059669' : '2px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
              }}>
                {step.done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: step.done ? '#10B981' : 'rgba(255,255,255,0.6)',
                maxWidth: 70,
                lineHeight: 1.2,
              }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: step.done ? '#10B981' : 'rgba(255,255,255,0.2)',
                margin: '0 4px',
                marginBottom: 20,
                borderRadius: 1,
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Referral code box */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 12,
        margin: '0 12px 12px',
        border: '1.5px dashed rgba(255,255,255,0.3)',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 500 }}>
          Your Referral Code
        </div>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: 2,
          fontFamily: 'monospace',
        }}>
          {referralCode}
        </div>
      </div>
      {/* Share button */}
      <button style={{
        padding: '10px 32px',
        fontSize: 14,
        fontWeight: 700,
        color: '#FFFFFF',
        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        border: 'none',
        borderRadius: 24,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 3px 12px rgba(37,99,235,0.4)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {shareText}
      </button>
    </div>
  );
}

/* ── Multi-Step Challenge ──────────────────────────────────── */

function RenderMultiStep({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const steps = content.steps || [
    { title: 'Sign Up', description: 'Create your account', done: true },
    { title: 'First Purchase', description: 'Make your first order', done: true },
    { title: 'Share with Friends', description: 'Invite 3 friends', done: false },
    { title: 'Claim Reward', description: 'Get your bonus', done: false },
  ];

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 280,
      padding: '0 16px',
      ...css,
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, position: 'relative' }}>
          {/* Timeline line and circle */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: step.done
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'rgba(255,255,255,0.15)',
              border: step.done ? '2px solid #059669' : '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#FFFFFF',
              zIndex: 2,
            }}>
              {step.done ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 2,
                flex: 1,
                minHeight: 24,
                background: step.done ? '#10B981' : 'rgba(255,255,255,0.15)',
              }} />
            )}
          </div>
          {/* Content */}
          <div style={{ paddingBottom: 16, paddingTop: 2 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: step.done ? '#10B981' : '#FFFFFF',
              marginBottom: 2,
            }}>
              {step.title}
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.3,
            }}>
              {step.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Streak / Daily Check-in ───────────────────────────────── */

function RenderStreak({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const days = content.days || [
    { label: 'Day 1', reward: '5pts', done: true },
    { label: 'Day 2', reward: '10pts', done: true },
    { label: 'Day 3', reward: '15pts', done: true },
    { label: 'Day 4', reward: '20pts', done: false },
    { label: 'Day 5', reward: '30pts', done: false },
    { label: 'Day 6', reward: '40pts', done: false },
    { label: 'Day 7', reward: '🎁', done: false },
  ];
  const currentDay = content.currentDay || days.filter(d => d.done).length + 1;

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 320,
      padding: '0 8px',
      ...css,
    }}>
      {/* Streak counter */}
      <div style={{
        textAlign: 'center',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 2 }}>
          CURRENT STREAK
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#F59E0B',
          textShadow: '0 2px 8px rgba(245,158,11,0.3)',
        }}>
          🔥 {currentDay - 1}
        </div>
      </div>
      {/* Day circles row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 4,
        overflowX: 'auto',
      }}>
        {days.map((day, i) => {
          const isCurrent = i + 1 === currentDay;
          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              flex: '0 0 auto',
              minWidth: 36,
            }}>
              {/* Circle */}
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: day.done
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : isCurrent
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(255,255,255,0.08)',
                border: isCurrent
                  ? '2px solid #F59E0B'
                  : day.done
                    ? '2px solid #D97706'
                    : '2px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: day.done ? 14 : 12,
                color: day.done ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                boxShadow: day.done ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
              }}>
                {day.done ? '✓' : i + 1}
              </div>
              {/* Label */}
              <span style={{
                fontSize: 8,
                fontWeight: 600,
                color: day.done ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap',
              }}>
                {day.label}
              </span>
              {/* Reward */}
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: day.done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
              }}>
                {day.reward}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Game Challenge ────────────────────────────────────────── */

function RenderGameChallenge({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const activities = content.activities || [
    { icon: '🏃', label: 'Run 5km', progress: 80, target: '5km' },
    { icon: '🛒', label: 'Shop 3 times', progress: 66, target: '3x' },
    { icon: '⭐', label: 'Rate 2 products', progress: 50, target: '2x' },
    { icon: '📱', label: 'Daily login', progress: 100, target: '1x' },
  ];
  const totalProgress = content.totalProgress || 65;

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      ...css,
    }}>
      {/* Overall progress */}
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6 }}>
          OVERALL PROGRESS
        </div>
        <div style={{
          height: 8,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 4,
        }}>
          <div style={{
            height: '100%',
            width: `${totalProgress}%`,
            background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
            borderRadius: 4,
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6' }}>{totalProgress}%</div>
      </div>
      {/* Activity list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activities.map((act, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: '10px 12px',
            border: act.progress >= 100 ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{act.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>{act.label}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: act.progress >= 100 ? '#10B981' : 'rgba(255,255,255,0.5)',
                }}>
                  {act.target}
                </span>
              </div>
              <div style={{
                height: 4,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(act.progress, 100)}%`,
                  background: act.progress >= 100 ? '#10B981' : '#6366F1',
                  borderRadius: 2,
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Stamp Collection ──────────────────────────────────────── */

function RenderStampCollection({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const totalStamps = content.totalStamps || 9;
  const collectedCount = content.collectedCount || 4;
  const cols = content.columns || 3;
  const rewardLabel = content.rewardLabel || 'Collect all to win!';

  const stamps = [];
  for (let i = 0; i < totalStamps; i++) {
    stamps.push(i < collectedCount);
  }

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 280,
      textAlign: 'center',
      ...css,
    }}>
      {/* Progress text */}
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 12,
      }}>
        {collectedCount}/{totalStamps} stamps collected
      </div>
      {/* Stamp grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
        padding: '0 8px',
        marginBottom: 12,
      }}>
        {stamps.map((collected, i) => (
          <div key={i} style={{
            aspectRatio: '1',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collected ? 28 : 20,
            background: collected
              ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
              : 'rgba(255,255,255,0.06)',
            border: collected
              ? '2px solid #F59E0B'
              : '2px dashed rgba(255,255,255,0.2)',
            boxShadow: collected
              ? '0 2px 8px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
              : 'none',
            transition: 'all 0.3s',
          }}>
            {collected ? '⭐' : (
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>○</span>
            )}
          </div>
        ))}
      </div>
      {/* Reward label */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#F59E0B',
        opacity: 0.8,
      }}>
        {rewardLabel}
      </div>
    </div>
  );
}

/* ── Activity + Scratch Card ───────────────────────────────── */

function RenderActivityScratchCard({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const activityPrompt = content.activityPrompt || 'Complete the activity to unlock your scratch card!';
  const activityLabel = content.activityLabel || 'Make a purchase of $50+';
  const activityDone = content.activityDone || false;
  const coverColor = content.coverColor || '#9333EA';
  const coverText = content.coverText || 'Scratch Here!';

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      ...css,
    }}>
      {/* Activity prompt */}
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, lineHeight: 1.4 }}>
          {activityPrompt}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '8px 12px',
          background: activityDone ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          borderRadius: 8,
          border: activityDone ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
        }}>
          <span style={{ fontSize: 16 }}>{activityDone ? '✅' : '⏳'}</span>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: activityDone ? '#10B981' : '#F59E0B',
          }}>
            {activityLabel}
          </span>
        </div>
      </div>
      {/* Scratch card (reuse pattern) */}
      <div style={{
        width: 260,
        height: 160,
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        opacity: activityDone ? 1 : 0.5,
        filter: activityDone ? 'none' : 'grayscale(0.5)',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: coverColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)`,
          }} />
          <div style={{
            position: 'relative',
            zIndex: 2,
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {activityDone ? coverText : '🔒 Locked'}
          </div>
          <div style={{
            position: 'relative',
            zIndex: 2,
            marginTop: 8,
            color: 'rgba(255,255,255,0.6)',
            fontSize: 11,
          }}>
            {activityDone ? 'Swipe to scratch' : 'Complete activity first'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Flappy Bird ───────────────────────────────────────────── */

function RenderFlappyBird({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const birdEmoji = content.birdEmoji || '🐦';
  const score = content.score || 0;
  const playText = content.playText || 'TAP TO PLAY';

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      ...css,
    }}>
      <div style={{
        width: 280,
        height: 220,
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(180deg, #38BDF8 0%, #7DD3FC 40%, #BAE6FD 70%, #86EFAC 70%, #22C55E 100%)',
        border: '3px solid #0EA5E9',
      }}>
        {/* Clouds */}
        <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 20, opacity: 0.7 }}>☁️</div>
        <div style={{ position: 'absolute', top: 40, right: 30, fontSize: 16, opacity: 0.5 }}>☁️</div>
        <div style={{ position: 'absolute', top: 15, right: 80, fontSize: 12, opacity: 0.4 }}>☁️</div>

        {/* Left pipe */}
        <div style={{ position: 'absolute', top: 0, left: 60, width: 36 }}>
          <div style={{
            height: 60,
            background: 'linear-gradient(90deg, #16A34A 0%, #22C55E 50%, #16A34A 100%)',
            border: '2px solid #15803D',
            borderRadius: '0 0 4px 4px',
          }} />
          <div style={{
            height: 14,
            background: '#15803D',
            borderRadius: 3,
            margin: '0 -4px',
            border: '2px solid #166534',
          }} />
        </div>
        {/* Left pipe bottom */}
        <div style={{ position: 'absolute', bottom: 36, left: 60, width: 36 }}>
          <div style={{
            height: 14,
            background: '#15803D',
            borderRadius: 3,
            margin: '0 -4px',
            border: '2px solid #166534',
          }} />
          <div style={{
            height: 60,
            background: 'linear-gradient(90deg, #16A34A 0%, #22C55E 50%, #16A34A 100%)',
            border: '2px solid #15803D',
            borderRadius: '4px 4px 0 0',
          }} />
        </div>

        {/* Right pipe */}
        <div style={{ position: 'absolute', top: 0, right: 50, width: 36 }}>
          <div style={{
            height: 80,
            background: 'linear-gradient(90deg, #16A34A 0%, #22C55E 50%, #16A34A 100%)',
            border: '2px solid #15803D',
            borderRadius: '0 0 4px 4px',
          }} />
          <div style={{
            height: 14,
            background: '#15803D',
            borderRadius: 3,
            margin: '0 -4px',
            border: '2px solid #166534',
          }} />
        </div>
        <div style={{ position: 'absolute', bottom: 36, right: 50, width: 36 }}>
          <div style={{
            height: 14,
            background: '#15803D',
            borderRadius: 3,
            margin: '0 -4px',
            border: '2px solid #166534',
          }} />
          <div style={{
            height: 40,
            background: 'linear-gradient(90deg, #16A34A 0%, #22C55E 50%, #16A34A 100%)',
            border: '2px solid #15803D',
            borderRadius: '4px 4px 0 0',
          }} />
        </div>

        {/* Bird */}
        <div style={{
          position: 'absolute',
          top: '42%',
          left: '45%',
          transform: 'translate(-50%, -50%) rotate(-10deg)',
          fontSize: 32,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          zIndex: 5,
        }}>
          {birdEmoji}
        </div>

        {/* Ground */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 36,
          background: 'repeating-linear-gradient(90deg, #A16207 0px, #CA8A04 10px, #A16207 20px)',
          borderTop: '3px solid #854D0E',
        }} />

        {/* Score */}
        <div style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 24,
          fontWeight: 900,
          color: '#FFFFFF',
          textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 0 #000, 1px 1px 0 #000',
          zIndex: 10,
        }}>
          {score}
        </div>

        {/* Play overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.15)',
          zIndex: 8,
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            color: '#FFFFFF',
            padding: '8px 20px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
          }}>
            {playText}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Word Scramble ─────────────────────────────────────────── */

function RenderWordScramble({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const scrambledLetters = content.scrambledLetters || ['R', 'A', 'D', 'W', 'E'];
  const hint = content.hint || 'Unscramble the letters to find the word!';
  const answerSlots = content.answerLength || scrambledLetters.length;

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      textAlign: 'center',
      ...css,
    }}>
      {/* Hint */}
      <div style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 16,
        lineHeight: 1.4,
      }}>
        {hint}
      </div>
      {/* Scrambled letter tiles */}
      <div style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: 20,
      }}>
        {scrambledLetters.map((letter, i) => (
          <div key={i} style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 800,
            color: '#FFFFFF',
            cursor: 'pointer',
            boxShadow: '0 3px 0 #92400E, 0 4px 8px rgba(0,0,0,0.2)',
            border: '1px solid #B45309',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s',
          }}>
            {letter}
          </div>
        ))}
      </div>
      {/* Answer slots */}
      <div style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        {Array.from({ length: answerSlots }).map((_, i) => (
          <div key={i} style={{
            width: 40,
            height: 44,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            borderBottom: '3px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.2)',
          }}>
            _
          </div>
        ))}
      </div>
      {/* Submit button */}
      <button style={{
        padding: '8px 28px',
        fontSize: 13,
        fontWeight: 700,
        color: '#FFFFFF',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        border: 'none',
        borderRadius: 20,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(5,150,105,0.4)',
      }}>
        Submit
      </button>
    </div>
  );
}

/* ── Balloon Pop ───────────────────────────────────────────── */

function RenderBalloonPop({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const balloons = content.balloons || [
    { color: '#EF4444', x: 15, y: 20 },
    { color: '#F59E0B', x: 40, y: 35 },
    { color: '#10B981', x: 65, y: 15 },
    { color: '#6366F1', x: 80, y: 40 },
    { color: '#EC4899', x: 25, y: 55 },
    { color: '#8B5CF6', x: 55, y: 50 },
    { color: '#14B8A6', x: 75, y: 60 },
  ];
  const popText = content.popText || 'Pop a balloon to win!';

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      ...css,
    }}>
      <div style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: 600,
      }}>
        {popText}
      </div>
      <div style={{
        width: 280,
        height: 200,
        margin: '0 auto',
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #1E3A5F 0%, #2D1B69 100%)',
        border: '2px solid rgba(255,255,255,0.1)',
      }}>
        {/* Stars */}
        {[
          { x: 10, y: 10 }, { x: 30, y: 60 }, { x: 50, y: 20 },
          { x: 70, y: 70 }, { x: 85, y: 30 }, { x: 15, y: 80 },
        ].map((star, i) => (
          <div key={`star-${i}`} style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: 0.4 + (i % 3) * 0.2,
          }} />
        ))}
        {/* Balloons */}
        {balloons.map((b, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
          }}>
            {/* String */}
            <div style={{
              position: 'absolute',
              bottom: -16,
              left: '50%',
              width: 1,
              height: 16,
              background: 'rgba(255,255,255,0.3)',
              transform: 'translateX(-50%)',
            }} />
            {/* Balloon body */}
            <div style={{
              width: 30,
              height: 38,
              borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
              background: `radial-gradient(circle at 35% 30%, ${b.color}88, ${b.color})`,
              boxShadow: `inset -4px -4px 8px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.3)`,
              position: 'relative',
            }}>
              {/* Shine */}
              <div style={{
                position: 'absolute',
                top: 6,
                left: 8,
                width: 8,
                height: 10,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.4)',
                transform: 'rotate(-30deg)',
              }} />
            </div>
            {/* Knot */}
            <div style={{
              width: 6,
              height: 6,
              background: b.color,
              margin: '-2px auto 0',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Color Match ───────────────────────────────────────────── */

function RenderColorMatch({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const targetColor = content.targetColor || '#6366F1';
  const targetLabel = content.targetLabel || 'Match this color!';
  const options = content.options || [
    { color: '#EF4444', label: 'Red' },
    { color: '#6366F1', label: 'Indigo' },
    { color: '#10B981', label: 'Green' },
    { color: '#F59E0B', label: 'Amber' },
    { color: '#EC4899', label: 'Pink' },
    { color: '#8B5CF6', label: 'Purple' },
  ];
  const round = content.round || 1;
  const totalRounds = content.totalRounds || 5;

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      textAlign: 'center',
      ...css,
    }}>
      {/* Round indicator */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 12,
      }}>
        Round {round}/{totalRounds}
      </div>
      {/* Target color */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 8,
          fontWeight: 600,
        }}>
          {targetLabel}
        </div>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 16,
          background: targetColor,
          margin: '0 auto',
          boxShadow: `0 4px 20px ${targetColor}66, inset 0 2px 0 rgba(255,255,255,0.2)`,
          border: '3px solid rgba(255,255,255,0.2)',
        }} />
      </div>
      {/* Color options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        padding: '0 16px',
      }}>
        {options.map((opt, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: opt.color,
              boxShadow: `0 2px 8px ${opt.color}44`,
              border: '2px solid rgba(255,255,255,0.15)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }} />
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
            }}>
              {opt.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Whack-a-Mole ──────────────────────────────────────────── */

function RenderWhackAMole({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const gridCols = content.gridCols || 3;
  const gridRows = content.gridRows || 3;
  const activeMole = content.activeMole ?? 4;
  const score = content.score || 0;
  const timeLeft = content.timeLeft || 30;

  const totalHoles = gridCols * gridRows;

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      ...css,
    }}>
      {/* Score and timer bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        padding: '0 8px',
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#FFFFFF',
          background: 'rgba(255,255,255,0.1)',
          padding: '4px 10px',
          borderRadius: 8,
        }}>
          Score: {score}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 700,
          color: '#EF4444',
          background: 'rgba(239,68,68,0.15)',
          padding: '4px 10px',
          borderRadius: 8,
        }}>
          ⏱ {timeLeft}s
        </div>
      </div>
      {/* Game field */}
      <div style={{
        background: 'linear-gradient(180deg, #65A30D 0%, #4D7C0F 100%)',
        borderRadius: 16,
        padding: 16,
        border: '3px solid #3F6212',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: 10,
        }}>
          {Array.from({ length: totalHoles }).map((_, i) => {
            const hasMole = i === activeMole;
            return (
              <div key={i} style={{
                aspectRatio: '1',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}>
                {/* Hole */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  height: '45%',
                  background: 'radial-gradient(ellipse at center, #1C1917 0%, #44403C 100%)',
                  borderRadius: '50%',
                  zIndex: 1,
                }} />
                {/* Mole */}
                {hasMole && (
                  <div style={{
                    position: 'relative',
                    zIndex: 2,
                    fontSize: 28,
                    marginBottom: 8,
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    animation: 'none',
                  }}>
                    🐹
                  </div>
                )}
                {/* Empty hole shadow */}
                {!hasMole && (
                  <div style={{
                    position: 'relative',
                    zIndex: 0,
                    width: '60%',
                    height: 4,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '50%',
                    marginBottom: 6,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Instruction */}
      <div style={{
        textAlign: 'center',
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 8,
        fontWeight: 600,
      }}>
        Tap the mole!
      </div>
    </div>
  );
}

/* ── Picture Puzzle ─────────────────────────────────────────── */

function RenderPicturePuzzle({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const gridSize = content.gridSize || 3;
  const emptySlot = content.emptySlot ?? (gridSize * gridSize - 1);
  const moves = content.moves || 0;
  const imageUrl = content.imageUrl || '';

  const totalPieces = gridSize * gridSize;
  const pieces = [];
  for (let i = 0; i < totalPieces; i++) {
    pieces.push(i);
  }
  // Simulate a shuffled state: swap a couple pieces
  const displaced = new Set(content.displacedPieces || [1, 3, 5, 7]);

  return (
    <div style={{
      margin: '0 auto 24px',
      maxWidth: 300,
      textAlign: 'center',
      ...css,
    }}>
      {/* Moves counter */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 12,
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          background: 'rgba(255,255,255,0.08)',
          padding: '4px 12px',
          borderRadius: 8,
        }}>
          Moves: {moves}
        </div>
      </div>
      {/* Puzzle grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 3,
        width: 240,
        height: 240,
        margin: '0 auto',
        background: '#1F2937',
        borderRadius: 12,
        padding: 4,
        border: '2px solid #374151',
      }}>
        {pieces.map((piece, i) => {
          const isEmpty = i === emptySlot;
          const isDisplaced = displaced.has(i);
          if (isEmpty) {
            return (
              <div key={i} style={{
                borderRadius: 6,
                background: 'rgba(255,255,255,0.03)',
              }} />
            );
          }
          const hue = (piece * 360) / totalPieces;
          return (
            <div key={i} style={{
              borderRadius: 6,
              background: imageUrl
                ? `url("${imageUrl}")`
                : `linear-gradient(135deg, hsl(${hue}, 60%, 50%) 0%, hsl(${hue + 30}, 60%, 40%) 100%)`,
              backgroundSize: imageUrl ? `${gridSize * 100}% ${gridSize * 100}%` : undefined,
              backgroundPosition: imageUrl
                ? `${(piece % gridSize) * (100 / (gridSize - 1))}% ${Math.floor(piece / gridSize) * (100 / (gridSize - 1))}%`
                : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: isDisplaced ? '2px solid rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              transition: 'transform 0.15s',
            }}>
              <span style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                opacity: 0.7,
              }}>
                {piece + 1}
              </span>
              {isDisplaced && (
                <div style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#F59E0B',
                }} />
              )}
            </div>
          );
        })}
      </div>
      {/* Instruction */}
      <div style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 10,
        fontWeight: 600,
      }}>
        Slide tiles to solve the puzzle
      </div>
    </div>
  );
}

function RenderCardCode({ node }) {
  const content = node.ui?.content || {};
  const css = node.ui?.css?.container || {};
  const label = content.label || 'Your Code';
  const placeholder = content.placeholder || 'COUPON CODE';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.15)',
      borderRadius: 8,
      padding: 12,
      margin: '12px auto',
      maxWidth: 280,
      ...css,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1.5px dashed rgba(255,255,255,0.4)',
        borderRadius: 6,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: 2,
          fontFamily: 'monospace',
        }}>
          {placeholder}
        </span>
        {/* Copy icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          style={{ flexShrink: 0, marginLeft: 8 }}
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      </div>
    </div>
  );
}

function RenderRewardBody({ node }) {
  const css = node.ui?.css?.text || {};
  const text = node.ui?.content?.text || 'You won a reward!';
  return (
    <div style={{ margin: 0, ...css }}>
      {text}
    </div>
  );
}

function RenderRewardTnc({ node }) {
  const css = node.ui?.css?.text || {};
  const items = node.ui?.content?.items || [];
  return (
    <div style={{ ...css }}>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: 2 }}>
          {item}
        </div>
      ))}
    </div>
  );
}

function RenderCountDown({ node }) {
  const css = node.ui?.css?.container || node.ui?.css?.text || {};
  const text = node.ui?.content?.text || 'Expires in';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '8px 16px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.1)',
      margin: '8px auto',
      maxWidth: 280,
      ...css,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#F59E0B' }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{text}</span>
      <span style={{
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: 700,
        color: '#F59E0B',
        letterSpacing: 1,
      }}>
        23:59:59
      </span>
    </div>
  );
}

function RenderExpiryDate({ node }) {
  const css = node.ui?.css?.container || node.ui?.css?.text || {};
  const text = node.ui?.content?.text || 'Expires on';
  return (
    <div style={{
      fontSize: 12,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      margin: '8px 0',
      ...css,
    }}>
      {text} <span style={{ fontWeight: 600 }}>31 Dec 2026</span>
    </div>
  );
}

function RenderUnknown({ node, nodeId }) {
  const typeId = node.type_id || nodeId;
  return (
    <div style={{
      padding: 12,
      margin: 4,
      background: 'rgba(156,163,175,0.2)',
      border: '1px dashed rgba(156,163,175,0.4)',
      borderRadius: 6,
      fontSize: 11,
      color: '#9CA3AF',
      textAlign: 'center',
      fontFamily: 'monospace',
    }}>
      {typeId}
    </div>
  );
}

/* ── Main Node Renderer ─────────────────────────────────────── */

function NodeRenderer({
  nodeId,
  byId,
  rewardState,
  selectedNodeId,
  onSelectNode,
  hoveredNodeId,
  onHoverNode,
}) {
  const node = byId[nodeId];
  if (!node) return null;

  const typeId = node.type_id || nodeId;
  const isSelected = selectedNodeId === nodeId;
  const isHovered = hoveredNodeId === nodeId;

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (onSelectNode) onSelectNode(nodeId);
  }, [nodeId, onSelectNode]);

  const handleMouseEnter = useCallback((e) => {
    e.stopPropagation();
    if (onHoverNode) onHoverNode(nodeId);
  }, [nodeId, onHoverNode]);

  const handleMouseLeave = useCallback((e) => {
    e.stopPropagation();
    if (onHoverNode) onHoverNode(null);
  }, [onHoverNode]);

  // Determine outline/overlay styles
  const interactionStyle = {
    position: 'relative',
    cursor: 'pointer',
    outline: isSelected ? '2px solid #3B82F6' : 'none',
    outlineOffset: isSelected ? -1 : 0,
    transition: 'outline 0.1s ease',
  };

  // Render children recursively
  const renderChildren = (childIds) => {
    if (!childIds || childIds.length === 0) return null;
    return childIds.map((childId) => (
      <NodeErrorBoundary key={childId} nodeId={childId}>
        <NodeRenderer
          nodeId={childId}
          byId={byId}
          rewardState={rewardState}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          hoveredNodeId={hoveredNodeId}
          onHoverNode={onHoverNode}
        />
      </NodeErrorBoundary>
    ));
  };

  // Determine what to render based on type_id
  let inner = null;
  let wrapperStyle = {};

  if (ROOT_TYPES.has(typeId)) {
    const containerCss = node.ui?.css?.container || {};
    wrapperStyle = {
      ...containerCss,
      minHeight: '100%',
    };
    inner = renderChildren(node.ui?.content?.children);
  } else if (typeId === 'TEXT') {
    inner = <RenderText node={node} />;
  } else if (typeId === 'IMAGE') {
    inner = <RenderImage node={node} />;
  } else if (typeId === 'REWARD_BUTTON' || typeId === 'BUTTON') {
    inner = <RenderButton node={node} />;
  } else if (typeId === 'SCRATCH_CARD_GAME_1') {
    inner = <RenderScratchCard node={node} />;
  } else if (typeId === 'SPIN_THE_WHEEL_GAME_1') {
    inner = <RenderSpinWheel node={node} />;
  } else if (typeId === 'QUIZ_GAME_1') {
    inner = <RenderQuiz node={node} />;
  } else if (typeId === 'SLOT_MACHINE_GAME_1') {
    inner = <RenderSlotMachine node={node} />;
  } else if (typeId === 'MEMORY_GAME_1') {
    inner = <RenderMemoryGame node={node} />;
  } else if (typeId === 'REFERRAL_1') {
    inner = <RenderReferral node={node} />;
  } else if (typeId === 'MULTISTEP_1') {
    inner = <RenderMultiStep node={node} />;
  } else if (typeId === 'STREAK_1') {
    inner = <RenderStreak node={node} />;
  } else if (typeId === 'GAME_CHALLENGE_1') {
    inner = <RenderGameChallenge node={node} />;
  } else if (typeId === 'STAMP_COLLECTION_1') {
    inner = <RenderStampCollection node={node} />;
  } else if (typeId === 'ACTIVITY_SCRATCH_CARD_1') {
    inner = <RenderActivityScratchCard node={node} />;
  } else if (typeId === 'FLAPPY_BIRD_1') {
    inner = <RenderFlappyBird node={node} />;
  } else if (typeId === 'WORD_SCRAMBLE_1') {
    inner = <RenderWordScramble node={node} />;
  } else if (typeId === 'BALLOON_POP_1') {
    inner = <RenderBalloonPop node={node} />;
  } else if (typeId === 'COLOR_MATCH_1') {
    inner = <RenderColorMatch node={node} />;
  } else if (typeId === 'WHACK_A_MOLE_1') {
    inner = <RenderWhackAMole node={node} />;
  } else if (typeId === 'PICTURE_PUZZLE_1') {
    inner = <RenderPicturePuzzle node={node} />;
  } else if (typeId === 'CONDITIONAL_WRAPPER') {
    const children = node.ui?.content?.children || [];
    if (rewardState === 'redeemable-seen') {
      // Show reward children (true branch) — user has played the game, show reward
      inner = renderChildren(children);
    } else {
      // redeemable-unseen: HIDE the reward section entirely — user hasn't played yet
      inner = null;
    }
  } else if (typeId === 'CARD_CODE') {
    inner = <RenderCardCode node={node} />;
  } else if (typeId === 'REWARD_BODY') {
    inner = <RenderRewardBody node={node} />;
  } else if (typeId === 'REWARD_TNC') {
    inner = <RenderRewardTnc node={node} />;
  } else if (typeId === 'COUNT_DOWN') {
    inner = <RenderCountDown node={node} />;
  } else if (typeId === 'EXPIRY_DATE') {
    inner = <RenderExpiryDate node={node} />;
  } else if (typeId === 'ANIMATION_CONTAINER') {
    const children = node.ui?.content?.children || [];
    inner = renderChildren(children);
  } else if (typeId === 'PLANE_BANNER') {
    const containerCss = node.ui?.css?.container || {};
    const children = node.ui?.content?.children || [];
    wrapperStyle = { ...containerCss };
    inner = children.length > 0
      ? renderChildren(children)
      : (
        <div style={{
          padding: 16,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 8,
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(255,255,255,0.6)',
        }}>
          Banner
        </div>
      );
  } else if (typeId === 'REWARD_CARD_ROOT_1' || typeId === 'REWARD_CARD_1') {
    const containerCss = node.ui?.css?.container || {};
    const children = node.ui?.content?.children || [];
    wrapperStyle = { ...containerCss };
    inner = renderChildren(children);
  } else if (typeId === 'DIVIDER' || typeId === 'SEPARATOR') {
    const css = node.ui?.css?.divider || {};
    inner = (
      <hr style={{ border: 'none', height: css.height || '1px', background: css.color || 'rgba(255,255,255,0.2)', margin: css.margin || '12px 0', width: css.width || '80%', marginLeft: 'auto', marginRight: 'auto' }} />
    );
  } else {
    inner = <RenderUnknown node={node} nodeId={nodeId} />;
  }

  return (
    <div
      style={{ ...interactionStyle, ...wrapperStyle }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-node-id={nodeId}
      data-type-id={typeId}
    >
      {/* Hover overlay with label */}
      {isHovered && !isSelected && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(59,130,246,0.08)',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          zIndex: 50,
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: '#3B82F6',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderBottomRightRadius: 4,
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}>
            {getLabel(typeId)} ({nodeId})
          </div>
        </div>
      )}
      {/* Selected label */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: -1,
          left: -1,
          background: '#3B82F6',
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 6px',
          borderBottomRightRadius: 4,
          zIndex: 51,
          whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}>
          {getLabel(typeId)} ({nodeId})
        </div>
      )}
      {inner}
    </div>
  );
}

/* ── LocalPreview Component ─────────────────────────────────── */

function LocalPreview({
  byId,
  rootId = 'ROOT',
  rewardState = 'redeemable-unseen',
  selectedNodeId,
  onSelectNode,
  deviceWidth = 320,
}) {
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Validate byId
  const hasData = byId && typeof byId === 'object' && Object.keys(byId).length > 0;
  const rootNode = hasData ? byId[rootId] : null;

  if (!hasData || !rootNode) {
    return (
      <div style={{
        width: deviceWidth,
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F9FAFB',
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>&#9888;</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>
          No layout data
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          {!hasData ? 'byId is empty or not provided' : `Root node "${rootId}" not found`}
        </div>
      </div>
    );
  }

  return (
    <div
      className="local-preview-container"
      style={{
        width: deviceWidth,
        minHeight: 480,
        overflow: 'auto',
        background: '#FFFFFF',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <NodeErrorBoundary nodeId={rootId}>
        <NodeRenderer
          nodeId={rootId}
          byId={byId}
          rewardState={rewardState}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          hoveredNodeId={hoveredNodeId}
          onHoverNode={setHoveredNodeId}
        />
      </NodeErrorBoundary>
    </div>
  );
}

export default LocalPreview;
