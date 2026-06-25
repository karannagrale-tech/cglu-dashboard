import { useState } from 'react';

/**
 * GameSettingsPanel — Configure game mechanics that affect preview/player experience.
 *
 * These settings live on the Campaign (slots.reward.rewardTemplateConfig) not the fragmentMap.
 * They control: timer, intro screen, game difficulty, attempts, scoring.
 *
 * A marketer should be able to toggle/adjust these without "playing" the game.
 */

const SECTION_STYLE = {
  marginBottom: 16,
  padding: '12px 14px',
  background: '#f8fafc',
  borderRadius: 8,
  border: '1px solid #f1f5f9',
};

const LABEL = {
  fontSize: 12, fontWeight: 600, color: '#64748b',
  marginBottom: 6, display: 'block',
};

const INPUT = {
  width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0',
  borderRadius: 6, fontSize: 13, outline: 'none', background: 'white',
};

const TOGGLE_TRACK = (on) => ({
  width: 40, height: 22, borderRadius: 11, position: 'relative',
  background: on ? '#6366f1' : '#cbd5e1', cursor: 'pointer',
  transition: 'background 0.2s', display: 'inline-block', flexShrink: 0,
});

const TOGGLE_DOT = (on) => ({
  position: 'absolute', top: 2, left: on ? 20 : 2,
  width: 18, height: 18, borderRadius: '50%', background: 'white',
  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
});

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: '#334155' }}>{label}</span>
      <div style={TOGGLE_TRACK(value)} onClick={() => onChange(!value)}>
        <div style={TOGGLE_DOT(value)} />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, unit, helpText }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={LABEL}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          value={value ?? ''}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ...INPUT, width: 80, flex: 'none' }}
        />
        {unit && <span style={{ fontSize: 12, color: '#94a3b8' }}>{unit}</span>}
      </div>
      {helpText && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{helpText}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={LABEL}>{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={INPUT}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Game-specific settings ────────────────── */

function QuizSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        ❓ Quiz Settings
      </div>

      <Toggle label="Show Timer" value={s.showTimer !== false} onChange={(v) => update('showTimer', v)} />

      {s.showTimer !== false && (
        <NumberField
          label="Time per Question"
          value={s.timePerQuestion || 15}
          onChange={(v) => update('timePerQuestion', v)}
          min={5} max={120} unit="seconds"
          helpText="How long users have to answer each question"
        />
      )}

      <NumberField
        label="Minimum Score to Win"
        value={s.minWinScore || 1}
        onChange={(v) => update('minWinScore', v)}
        min={0} max={100}
        helpText="Correct answers needed to earn reward"
      />

      <Toggle label="Show Intro Screen" value={s.hasIntro || false} onChange={(v) => update('hasIntro', v)} />

      {s.hasIntro && (
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Start Button Text</label>
          <input
            type="text"
            value={s.startButtonText || 'Play Quiz'}
            onChange={(e) => update('startButtonText', e.target.value)}
            style={INPUT}
          />
        </div>
      )}

      <Toggle label="Show Correct Answer After Attempt" value={s.showCorrectAnswer || false} onChange={(v) => update('showCorrectAnswer', v)} />
      <Toggle label="Allow Retry" value={s.allowRetry || false} onChange={(v) => update('allowRetry', v)} />

      {s.allowRetry && (
        <NumberField
          label="Max Retries"
          value={s.maxRetries || 3}
          onChange={(v) => update('maxRetries', v)}
          min={1} max={10}
        />
      )}

      <SelectField
        label="Question Order"
        value={s.questionOrder || 'sequential'}
        onChange={(v) => update('questionOrder', v)}
        options={[
          { value: 'sequential', label: 'Sequential (in order)' },
          { value: 'random', label: 'Random (shuffle)' },
        ]}
      />
    </>
  );
}

function SpinWheelSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🎡 Spin the Wheel Settings
      </div>

      <Toggle label="Show Intro Screen" value={s.hasIntro || false} onChange={(v) => update('hasIntro', v)} />

      {s.hasIntro && (
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Start Button Text</label>
          <input
            type="text"
            value={s.startButtonText || 'Spin Now!'}
            onChange={(e) => update('startButtonText', e.target.value)}
            style={INPUT}
          />
        </div>
      )}

      <NumberField
        label="Spin Duration"
        value={s.spinDuration || 4}
        onChange={(v) => update('spinDuration', v)}
        min={1} max={15} unit="seconds"
        helpText="How long the wheel spins before stopping"
      />

      <Toggle label="Allow Multiple Spins" value={s.allowMultipleSpins || false} onChange={(v) => update('allowMultipleSpins', v)} />

      {s.allowMultipleSpins && (
        <NumberField
          label="Max Spins"
          value={s.maxSpins || 1}
          onChange={(v) => update('maxSpins', v)}
          min={1} max={10}
        />
      )}

      <Toggle label="Show Slice Labels" value={s.showSliceLabels !== false} onChange={(v) => update('showSliceLabels', v)} />
      <Toggle label="Enable Sound Effects" value={s.enableSound || false} onChange={(v) => update('enableSound', v)} />

      <SelectField
        label="Win Animation"
        value={s.winAnimation || 'confetti'}
        onChange={(v) => update('winAnimation', v)}
        options={[
          { value: 'confetti', label: 'Confetti 🎉' },
          { value: 'fireworks', label: 'Fireworks 🎆' },
          { value: 'none', label: 'None' },
        ]}
      />
    </>
  );
}

function ScratchCardSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🎴 Scratch Card Settings
      </div>

      <Toggle label="Show Intro Screen" value={s.hasIntro || false} onChange={(v) => update('hasIntro', v)} />

      {s.hasIntro && (
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Start Button Text</label>
          <input
            type="text"
            value={s.startButtonText || 'Scratch Now!'}
            onChange={(e) => update('startButtonText', e.target.value)}
            style={INPUT}
          />
        </div>
      )}

      <NumberField
        label="Scratch Threshold"
        value={s.scratchThreshold || 50}
        onChange={(v) => update('scratchThreshold', v)}
        min={10} max={100} unit="%"
        helpText="How much of the card must be scratched to reveal (10-100%)"
      />

      <Toggle label="Auto-Reveal After Threshold" value={s.autoReveal !== false} onChange={(v) => update('autoReveal', v)} />

      <SelectField
        label="Scratch Effect"
        value={s.scratchEffect || 'standard'}
        onChange={(v) => update('scratchEffect', v)}
        options={[
          { value: 'standard', label: 'Standard (erase)' },
          { value: 'sparkle', label: 'Sparkle ✨' },
          { value: 'holographic', label: 'Holographic 🌈' },
        ]}
      />

      <Toggle label="Enable Sound Effects" value={s.enableSound || false} onChange={(v) => update('enableSound', v)} />

      <SelectField
        label="Reveal Animation"
        value={s.revealAnimation || 'confetti'}
        onChange={(v) => update('revealAnimation', v)}
        options={[
          { value: 'confetti', label: 'Confetti 🎉' },
          { value: 'glow', label: 'Glow ✨' },
          { value: 'none', label: 'None' },
        ]}
      />
    </>
  );
}

function SlotMachineSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🎰 Slot Machine Settings
      </div>

      <Toggle label="Show Intro Screen" value={s.hasIntro || false} onChange={(v) => update('hasIntro', v)} />

      {s.hasIntro && (
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Start Button Text</label>
          <input
            type="text"
            value={s.startButtonText || 'Pull the Lever!'}
            onChange={(e) => update('startButtonText', e.target.value)}
            style={INPUT}
          />
        </div>
      )}

      <NumberField
        label="Reel Count"
        value={s.reelCount || 3}
        onChange={(v) => update('reelCount', v)}
        min={2} max={5}
        helpText="Number of spinning reels (2-5)"
      />

      <NumberField
        label="Spin Duration"
        value={s.spinDuration || 3}
        onChange={(v) => update('spinDuration', v)}
        min={1} max={10} unit="seconds"
        helpText="How long the reels spin before stopping"
      />

      <SelectField
        label="Symbol Set"
        value={s.symbolSet || 'fruits'}
        onChange={(v) => update('symbolSet', v)}
        options={[
          { value: 'fruits', label: 'Fruits 🍒🍋🍊' },
          { value: 'gems', label: 'Gems 💎💠🔶' },
          { value: 'cards', label: 'Cards ♠♥♦♣' },
          { value: 'emojis', label: 'Emojis ⭐🎈🎁' },
          { value: 'custom', label: 'Custom images' },
        ]}
      />

      <Toggle label="Enable Sound Effects" value={s.enableSound || false} onChange={(v) => update('enableSound', v)} />
      <Toggle label="Allow Multiple Spins" value={s.allowMultipleSpins || false} onChange={(v) => update('allowMultipleSpins', v)} />

      {s.allowMultipleSpins && (
        <NumberField
          label="Max Spins"
          value={s.maxSpins || 1}
          onChange={(v) => update('maxSpins', v)}
          min={1} max={10}
        />
      )}

      <SelectField
        label="Win Animation"
        value={s.winAnimation || 'confetti'}
        onChange={(v) => update('winAnimation', v)}
        options={[
          { value: 'confetti', label: 'Confetti 🎉' },
          { value: 'fireworks', label: 'Fireworks 🎆' },
          { value: 'jackpot', label: 'Jackpot 💰' },
          { value: 'none', label: 'None' },
        ]}
      />
    </>
  );
}

function MemoryGameSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🧠 Memory Game Settings
      </div>

      <Toggle label="Show Intro Screen" value={s.hasIntro || false} onChange={(v) => update('hasIntro', v)} />

      <NumberField
        label="Grid Rows"
        value={s.gridRows || 3}
        onChange={(v) => update('gridRows', v)}
        min={2} max={6}
        helpText="Number of rows in the card grid"
      />

      <NumberField
        label="Grid Columns"
        value={s.gridCols || 4}
        onChange={(v) => update('gridCols', v)}
        min={2} max={6}
        helpText="Number of columns in the card grid"
      />

      <NumberField
        label="Time Limit"
        value={s.timeLimit || 60}
        onChange={(v) => update('timeLimit', v)}
        min={15} max={300} unit="seconds"
        helpText="Time allowed to find all matches"
      />

      <SelectField
        label="Card Symbols"
        value={s.symbolSet || 'emojis'}
        onChange={(v) => update('symbolSet', v)}
        options={[
          { value: 'emojis', label: 'Emojis' },
          { value: 'shapes', label: 'Shapes' },
          { value: 'animals', label: 'Animals' },
          { value: 'foods', label: 'Foods' },
          { value: 'custom', label: 'Custom images' },
        ]}
      />

      <SelectField
        label="Difficulty"
        value={s.difficulty || 'medium'}
        onChange={(v) => update('difficulty', v)}
        options={[
          { value: 'easy', label: 'Easy (cards stay flipped longer)' },
          { value: 'medium', label: 'Medium' },
          { value: 'hard', label: 'Hard (cards flip back quickly)' },
        ]}
      />

      <Toggle label="Show Match Counter" value={s.showMatchCount !== false} onChange={(v) => update('showMatchCount', v)} />
      <Toggle label="Enable Sound Effects" value={s.enableSound || false} onChange={(v) => update('enableSound', v)} />
    </>
  );
}

function DirectRewardSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🎁 Direct Reward Settings
      </div>

      <Toggle label="Show Reward Animation" value={s.showAnimation !== false} onChange={(v) => update('showAnimation', v)} />

      {s.showAnimation !== false && (
        <SelectField
          label="Animation Type"
          value={s.animationType || 'confetti'}
          onChange={(v) => update('animationType', v)}
          options={[
            { value: 'confetti', label: 'Confetti 🎉' },
            { value: 'fireworks', label: 'Fireworks 🎆' },
            { value: 'glow', label: 'Glow ✨' },
            { value: 'none', label: 'None' },
          ]}
        />
      )}

      <NumberField
        label="Auto-dismiss Timer"
        value={s.autoDismissTime || 0}
        onChange={(v) => update('autoDismissTime', v)}
        min={0} max={60} unit="seconds"
        helpText="0 = no auto-dismiss (user must tap CTA)"
      />

      <Toggle label="Show Confetti on Load" value={s.showConfettiOnLoad || false} onChange={(v) => update('showConfettiOnLoad', v)} />
    </>
  );
}

function ReferralSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  const platformOptions = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'copy_link', label: 'Copy Link' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter / X' },
    { value: 'telegram', label: 'Telegram' },
  ];

  const currentPlatforms = s.sharePlatforms || ['whatsapp', 'email', 'copy_link'];

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🤝 Referral Program Settings
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={LABEL}>Share Platforms</label>
        {platformOptions.map(p => (
          <Toggle
            key={p.value}
            label={p.label}
            value={currentPlatforms.includes(p.value)}
            onChange={(v) => {
              const updated = v
                ? [...currentPlatforms, p.value]
                : currentPlatforms.filter(x => x !== p.value);
              update('sharePlatforms', updated);
            }}
          />
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={LABEL}>Referral Message</label>
        <textarea
          value={s.referralMessage || 'Hey! Use my referral code to get a special discount!'}
          onChange={(e) => update('referralMessage', e.target.value)}
          style={{ ...INPUT, minHeight: 60, resize: 'vertical' }}
          rows={3}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={LABEL}>Referrer Reward Text</label>
        <input
          type="text"
          value={s.referrerRewardText || 'You get 10% off'}
          onChange={(e) => update('referrerRewardText', e.target.value)}
          style={INPUT}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={LABEL}>Referee Reward Text</label>
        <input
          type="text"
          value={s.refereeRewardText || 'Your friend gets 10% off'}
          onChange={(e) => update('refereeRewardText', e.target.value)}
          style={INPUT}
        />
      </div>

      <Toggle label="Show Referral Count" value={s.showReferralCount || false} onChange={(v) => update('showReferralCount', v)} />
      <Toggle label="Allow Self-Referral" value={s.allowSelfReferral || false} onChange={(v) => update('allowSelfReferral', v)} />
    </>
  );
}

function MultistepSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        📊 Multi-Step Challenge Settings
      </div>

      <NumberField
        label="Number of Steps"
        value={s.stepCount || 3}
        onChange={(v) => update('stepCount', v)}
        min={2} max={10}
        helpText="Total steps in the challenge"
      />

      <SelectField
        label="Step Type"
        value={s.stepTypes || 'action'}
        onChange={(v) => update('stepTypes', v)}
        options={[
          { value: 'action', label: 'Action-based' },
          { value: 'quiz', label: 'Quiz questions' },
          { value: 'purchase', label: 'Purchase milestones' },
          { value: 'social', label: 'Social actions' },
          { value: 'mixed', label: 'Mixed types' },
        ]}
      />

      <SelectField
        label="Completion Criteria"
        value={s.completionCriteria || 'all'}
        onChange={(v) => update('completionCriteria', v)}
        options={[
          { value: 'all', label: 'Complete all steps' },
          { value: 'any', label: 'Complete any step' },
          { value: 'minimum', label: 'Complete minimum steps' },
        ]}
      />

      {s.completionCriteria === 'minimum' && (
        <NumberField
          label="Minimum Steps Required"
          value={s.minimumSteps || 2}
          onChange={(v) => update('minimumSteps', v)}
          min={1} max={s.stepCount || 10}
        />
      )}

      <Toggle label="Show Progress Bar" value={s.showProgress !== false} onChange={(v) => update('showProgress', v)} />
      <Toggle label="Show Step Labels" value={s.showStepLabels !== false} onChange={(v) => update('showStepLabels', v)} />
      <Toggle label="Allow Step Skipping" value={s.allowSkipping || false} onChange={(v) => update('allowSkipping', v)} />
    </>
  );
}

function StreakSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🔥 Streak / Daily Check-in Settings
      </div>

      <NumberField
        label="Streak Length"
        value={s.streakLength || 7}
        onChange={(v) => update('streakLength', v)}
        min={2} max={30} unit="days"
        helpText="Number of consecutive days for full streak"
      />

      <NumberField
        label="Grace Period"
        value={s.gracePeriod || 0}
        onChange={(v) => update('gracePeriod', v)}
        min={0} max={48} unit="hours"
        helpText="Extra time allowed before streak breaks (0 = strict)"
      />

      <SelectField
        label="Reset Policy"
        value={s.resetPolicy || 'reset'}
        onChange={(v) => update('resetPolicy', v)}
        options={[
          { value: 'reset', label: 'Full reset (back to day 1)' },
          { value: 'continue', label: 'Continue (keep progress)' },
          { value: 'penalty', label: 'Penalty (lose 1 day)' },
        ]}
      />

      <Toggle label="Allow Skip Days" value={s.allowSkipDays || false} onChange={(v) => update('allowSkipDays', v)} />

      {s.allowSkipDays && (
        <NumberField
          label="Max Skips Allowed"
          value={s.maxSkips || 1}
          onChange={(v) => update('maxSkips', v)}
          min={0} max={5}
          helpText="How many days can be skipped without breaking streak"
        />
      )}

      <Toggle label="Show Calendar View" value={s.showCalendar !== false} onChange={(v) => update('showCalendar', v)} />
      <Toggle label="Show Streak Counter" value={s.showStreakCounter !== false} onChange={(v) => update('showStreakCounter', v)} />
      <Toggle label="Milestone Rewards" value={s.milestoneRewards || false} onChange={(v) => update('milestoneRewards', v)} />

      {s.milestoneRewards && (
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Milestone Days (comma-separated)</label>
          <input
            type="text"
            value={s.milestoneDays || '3,5,7'}
            onChange={(e) => update('milestoneDays', e.target.value)}
            style={INPUT}
            placeholder="e.g. 3,5,7"
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Days that give bonus rewards</div>
        </div>
      )}
    </>
  );
}

function GameChallengeSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🏆 Game Challenge Settings
      </div>

      <NumberField
        label="Activities Required"
        value={s.activityCount || 5}
        onChange={(v) => update('activityCount', v)}
        min={1} max={50}
        helpText="Number of activities to complete the challenge"
      />

      <NumberField
        label="Time Limit"
        value={s.timeLimit || 24}
        onChange={(v) => update('timeLimit', v)}
        min={1} max={720} unit="hours"
        helpText="Time allowed to complete all activities"
      />

      <SelectField
        label="Scoring Type"
        value={s.scoringType || 'count'}
        onChange={(v) => update('scoringType', v)}
        options={[
          { value: 'count', label: 'Count-based (complete N activities)' },
          { value: 'points', label: 'Points-based (earn N points)' },
          { value: 'time', label: 'Time-based (fastest completion)' },
          { value: 'accuracy', label: 'Accuracy-based (% correct)' },
        ]}
      />

      {(s.scoringType === 'points' || s.scoringType === 'accuracy') && (
        <NumberField
          label="Target Score"
          value={s.targetScore || 100}
          onChange={(v) => update('targetScore', v)}
          min={1} max={10000}
        />
      )}

      <Toggle label="Show Leaderboard" value={s.showLeaderboard || false} onChange={(v) => update('showLeaderboard', v)} />
      <Toggle label="Show Progress" value={s.showProgress !== false} onChange={(v) => update('showProgress', v)} />
      <Toggle label="Allow Retry" value={s.allowRetry || false} onChange={(v) => update('allowRetry', v)} />
    </>
  );
}

function StampCollectionSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        📬 Stamp Collection Settings
      </div>

      <NumberField
        label="Total Stamps"
        value={s.totalStamps || 10}
        onChange={(v) => update('totalStamps', v)}
        min={2} max={30}
        helpText="Stamps needed to complete the card"
      />

      <NumberField
        label="Stamps per Activity"
        value={s.stampsPerActivity || 1}
        onChange={(v) => update('stampsPerActivity', v)}
        min={1} max={5}
        helpText="Stamps earned per qualifying activity"
      />

      <NumberField
        label="Card Expiry"
        value={s.expiryDays || 30}
        onChange={(v) => update('expiryDays', v)}
        min={0} max={365} unit="days"
        helpText="0 = no expiry"
      />

      <Toggle label="Show Stamp Count" value={s.showCount !== false} onChange={(v) => update('showCount', v)} />
      <Toggle label="Show Progress Fraction" value={s.showFraction || false} onChange={(v) => update('showFraction', v)} />
      <Toggle label="Stamp Animation" value={s.stampAnimation !== false} onChange={(v) => update('stampAnimation', v)} />

      <SelectField
        label="Stamp Layout"
        value={s.stampLayout || 'grid'}
        onChange={(v) => update('stampLayout', v)}
        options={[
          { value: 'grid', label: 'Grid' },
          { value: 'row', label: 'Single Row' },
          { value: 'circular', label: 'Circular' },
        ]}
      />
    </>
  );
}

function ActivityScratchCardSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        🎴 Activity + Scratch Card Settings
      </div>

      <SelectField
        label="Activity Type"
        value={s.activityType || 'purchase'}
        onChange={(v) => update('activityType', v)}
        options={[
          { value: 'purchase', label: 'Purchase' },
          { value: 'visit', label: 'Store Visit' },
          { value: 'social', label: 'Social Action' },
          { value: 'survey', label: 'Survey Completion' },
          { value: 'custom', label: 'Custom Activity' },
        ]}
      />

      <NumberField
        label="Activities Required"
        value={s.activityTarget || 1}
        onChange={(v) => update('activityTarget', v)}
        min={1} max={10}
        helpText="Activities needed to unlock the scratch card"
      />

      <NumberField
        label="Scratch Threshold"
        value={s.scratchThreshold || 50}
        onChange={(v) => update('scratchThreshold', v)}
        min={10} max={100} unit="%"
        helpText="How much of the card must be scratched to reveal"
      />

      <Toggle label="Auto-Reveal After Threshold" value={s.autoReveal !== false} onChange={(v) => update('autoReveal', v)} />
      <Toggle label="Enable Sound Effects" value={s.enableSound || false} onChange={(v) => update('enableSound', v)} />

      <SelectField
        label="Reveal Animation"
        value={s.revealAnimation || 'confetti'}
        onChange={(v) => update('revealAnimation', v)}
        options={[
          { value: 'confetti', label: 'Confetti 🎉' },
          { value: 'glow', label: 'Glow ✨' },
          { value: 'none', label: 'None' },
        ]}
      />
    </>
  );
}

function MiniGameSettings({ settings, onChange, gameType, gameLabel, gameIcon }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  // Game-specific extra settings
  const extraSettings = {
    'flappy-bird': (
      <>
        <NumberField
          label="Pipe Gap"
          value={s.pipeGap || 150}
          onChange={(v) => update('pipeGap', v)}
          min={80} max={300}
          helpText="Gap between pipes (smaller = harder)"
        />
        <NumberField
          label="Pipe Speed"
          value={s.pipeSpeed || 3}
          onChange={(v) => update('pipeSpeed', v)}
          min={1} max={10}
          helpText="Speed of pipe movement"
        />
      </>
    ),
    'word-scramble': (
      <>
        <Toggle label="Enable Hints" value={s.hintEnabled !== false} onChange={(v) => update('hintEnabled', v)} />
        {s.hintEnabled !== false && (
          <NumberField
            label="Max Hints"
            value={s.maxHints || 2}
            onChange={(v) => update('maxHints', v)}
            min={0} max={5}
          />
        )}
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Custom Word List (comma-separated)</label>
          <textarea
            value={s.wordList || ''}
            onChange={(e) => update('wordList', e.target.value)}
            style={{ ...INPUT, minHeight: 50, resize: 'vertical' }}
            placeholder="e.g. REWARD, BONUS, PRIZE"
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Leave empty for default word list</div>
        </div>
      </>
    ),
    'balloon-pop': (
      <>
        <SelectField
          label="Balloon Speed"
          value={s.balloonSpeed || 'medium'}
          onChange={(v) => update('balloonSpeed', v)}
          options={[
            { value: 'slow', label: 'Slow' },
            { value: 'medium', label: 'Medium' },
            { value: 'fast', label: 'Fast' },
          ]}
        />
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Balloon Colors (comma-separated hex)</label>
          <input
            type="text"
            value={s.balloonColors || '#EF4444,#F59E0B,#10B981,#6366F1,#EC4899'}
            onChange={(e) => update('balloonColors', e.target.value)}
            style={INPUT}
          />
        </div>
      </>
    ),
    'color-match': (
      <NumberField
        label="Number of Colors"
        value={s.colorCount || 4}
        onChange={(v) => update('colorCount', v)}
        min={2} max={8}
        helpText="More colors = harder"
      />
    ),
    'whack-a-mole': (
      <>
        <SelectField
          label="Grid Size"
          value={s.gridSize || '3x3'}
          onChange={(v) => update('gridSize', v)}
          options={[
            { value: '2x2', label: '2x2 (easy)' },
            { value: '3x3', label: '3x3 (medium)' },
            { value: '4x3', label: '4x3 (hard)' },
            { value: '4x4', label: '4x4 (expert)' },
          ]}
        />
        <SelectField
          label="Mole Speed"
          value={s.moleSpeed || 'medium'}
          onChange={(v) => update('moleSpeed', v)}
          options={[
            { value: 'slow', label: 'Slow' },
            { value: 'medium', label: 'Medium' },
            { value: 'fast', label: 'Fast' },
          ]}
        />
      </>
    ),
    'picture-puzzle': (
      <>
        <SelectField
          label="Grid Size"
          value={s.gridSize || '3x3'}
          onChange={(v) => update('gridSize', v)}
          options={[
            { value: '2x2', label: '2x2 (easy)' },
            { value: '3x3', label: '3x3 (medium)' },
            { value: '4x4', label: '4x4 (hard)' },
            { value: '5x5', label: '5x5 (expert)' },
          ]}
        />
        <Toggle label="Show Preview Image" value={s.showPreview !== false} onChange={(v) => update('showPreview', v)} />
      </>
    ),
  };

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        {gameIcon} {gameLabel} Settings
      </div>

      <Toggle label="Show Intro Screen" value={s.hasIntro || false} onChange={(v) => update('hasIntro', v)} />

      {s.hasIntro && (
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Start Button Text</label>
          <input
            type="text"
            value={s.startButtonText || 'Play Now!'}
            onChange={(e) => update('startButtonText', e.target.value)}
            style={INPUT}
          />
        </div>
      )}

      <SelectField
        label="Difficulty"
        value={s.difficulty || 'medium'}
        onChange={(v) => update('difficulty', v)}
        options={[
          { value: 'easy', label: 'Easy' },
          { value: 'medium', label: 'Medium' },
          { value: 'hard', label: 'Hard' },
        ]}
      />

      <NumberField
        label="Time Limit"
        value={s.timeLimit || 30}
        onChange={(v) => update('timeLimit', v)}
        min={10} max={300} unit="seconds"
        helpText="Time allowed to complete the game"
      />

      <NumberField
        label="Target Score"
        value={s.targetScore || 10}
        onChange={(v) => update('targetScore', v)}
        min={1} max={100}
        helpText="Score needed to win a reward"
      />

      <NumberField
        label="Lives"
        value={s.lives || 3}
        onChange={(v) => update('lives', v)}
        min={1} max={5}
        helpText="Number of lives / attempts"
      />

      {extraSettings[gameType] || null}

      <Toggle label="Enable Sound Effects" value={s.enableSound || false} onChange={(v) => update('enableSound', v)} />
      <Toggle label="Allow Retry" value={s.allowRetry || false} onChange={(v) => update('allowRetry', v)} />

      {s.allowRetry && (
        <NumberField
          label="Max Retries"
          value={s.maxRetries || 3}
          onChange={(v) => update('maxRetries', v)}
          min={1} max={10}
        />
      )}

      <SelectField
        label="Win Animation"
        value={s.winAnimation || 'confetti'}
        onChange={(v) => update('winAnimation', v)}
        options={[
          { value: 'confetti', label: 'Confetti 🎉' },
          { value: 'fireworks', label: 'Fireworks 🎆' },
          { value: 'none', label: 'None' },
        ]}
      />
    </>
  );
}

/* ── Common settings ───────────────────────── */

function CommonSettings({ settings, onChange }) {
  const s = settings || {};
  const update = (key, val) => onChange({ ...s, [key]: val });

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        ⚙️ General Settings
      </div>

      <SelectField
        label="Reward Expiry"
        value={s.rewardExpiry || 'never'}
        onChange={(v) => update('rewardExpiry', v)}
        options={[
          { value: 'never', label: 'Never expires' },
          { value: '24h', label: '24 hours' },
          { value: '48h', label: '48 hours' },
          { value: '7d', label: '7 days' },
          { value: '30d', label: '30 days' },
          { value: 'custom', label: 'Custom...' },
        ]}
      />

      {s.rewardExpiry === 'custom' && (
        <NumberField
          label="Custom Expiry"
          value={s.customExpiryHours || 72}
          onChange={(v) => update('customExpiryHours', v)}
          min={1} max={8760} unit="hours"
        />
      )}

      <Toggle label="Show Expiry Countdown" value={s.showExpiryCountdown || false} onChange={(v) => update('showExpiryCountdown', v)} />
      <Toggle label="Show Terms & Conditions" value={s.showTnc !== false} onChange={(v) => update('showTnc', v)} />
      <Toggle label="Show Coupon Code" value={s.showCouponCode !== false} onChange={(v) => update('showCouponCode', v)} />

      <SelectField
        label="CTA Action"
        value={s.ctaAction || 'redirect'}
        onChange={(v) => update('ctaAction', v)}
        options={[
          { value: 'redirect', label: 'Redirect to URL' },
          { value: 'deeplink', label: 'Deep link (app)' },
          { value: 'dismiss', label: 'Dismiss / Close' },
          { value: 'copy', label: 'Copy code to clipboard' },
        ]}
      />

      {(s.ctaAction === 'redirect' || s.ctaAction === 'deeplink') && (
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>CTA URL / Deep Link</label>
          <input
            type="text"
            value={s.ctaUrl || ''}
            placeholder={s.ctaAction === 'deeplink' ? 'myapp://screen/rewards' : 'https://example.com/shop'}
            onChange={(e) => update('ctaUrl', e.target.value)}
            style={INPUT}
          />
        </div>
      )}
    </>
  );
}

/* ── Main Panel ────────────────────────────── */

const GAME_TAB_LABELS = {
  quiz:                  '❓ Quiz',
  spinthewheel:          '🎡 Wheel',
  scratchcard:           '🎴 Card',
  slotmachine:           '🎰 Slots',
  memorygame:            '🧠 Memory',
  direct:                '🎁 Direct',
  referral:              '🤝 Referral',
  multistep:             '📊 Multi-Step',
  streak:                '🔥 Streak',
  gamechallenge:         '🏆 Challenge',
  collectthestamps:      '📬 Stamps',
  'activity-scratchcard': '🎴 Activity SC',
  'flappy-bird':         '🐦 Flappy',
  'word-scramble':       '🔤 Words',
  'balloon-pop':         '🎈 Balloon',
  'color-match':         '🎨 Colors',
  'whack-a-mole':        '🔨 Whack',
  'picture-puzzle':      '🧩 Puzzle',
};

const MINI_GAME_TYPES = {
  'flappy-bird':    { label: 'Flappy Bird', icon: '🐦' },
  'word-scramble':  { label: 'Word Scramble', icon: '🔤' },
  'balloon-pop':    { label: 'Balloon Pop', icon: '🎈' },
  'color-match':    { label: 'Color Match', icon: '🎨' },
  'whack-a-mole':   { label: 'Whack-a-Mole', icon: '🔨' },
  'picture-puzzle': { label: 'Picture Puzzle', icon: '🧩' },
};

function GameSettingsPanel({ experience, settings, onChange }) {
  const [activeSection, setActiveSection] = useState('game');

  const gameTabLabel = GAME_TAB_LABELS[experience] || '🎮 Game';

  const sections = [
    { id: 'game', label: gameTabLabel },
    { id: 'general', label: '⚙️ General' },
  ];

  const renderGameSettings = () => {
    // Original 3 game types
    if (experience === 'quiz') return <QuizSettings settings={settings} onChange={onChange} />;
    if (experience === 'spinthewheel') return <SpinWheelSettings settings={settings} onChange={onChange} />;
    if (experience === 'scratchcard') return <ScratchCardSettings settings={settings} onChange={onChange} />;

    // New game types
    if (experience === 'slotmachine') return <SlotMachineSettings settings={settings} onChange={onChange} />;
    if (experience === 'memorygame') return <MemoryGameSettings settings={settings} onChange={onChange} />;
    if (experience === 'direct') return <DirectRewardSettings settings={settings} onChange={onChange} />;
    if (experience === 'referral') return <ReferralSettings settings={settings} onChange={onChange} />;
    if (experience === 'multistep') return <MultistepSettings settings={settings} onChange={onChange} />;
    if (experience === 'streak') return <StreakSettings settings={settings} onChange={onChange} />;
    if (experience === 'gamechallenge') return <GameChallengeSettings settings={settings} onChange={onChange} />;
    if (experience === 'collectthestamps') return <StampCollectionSettings settings={settings} onChange={onChange} />;
    if (experience === 'activity-scratchcard') return <ActivityScratchCardSettings settings={settings} onChange={onChange} />;

    // Mini-games (6 types sharing a common settings component)
    const miniGame = MINI_GAME_TYPES[experience];
    if (miniGame) {
      return (
        <MiniGameSettings
          settings={settings}
          onChange={onChange}
          gameType={experience}
          gameLabel={miniGame.label}
          gameIcon={miniGame.icon}
        />
      );
    }

    return (
      <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 20 }}>
        Game settings not yet available for {experience}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Section tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0',
        padding: '0 12px',
      }}>
        {sections.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              borderBottom: activeSection === sec.id ? '2px solid #6366f1' : '2px solid transparent',
              color: activeSection === sec.id ? '#6366f1' : '#64748b',
              background: 'none',
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px' }}>
        {activeSection === 'game' && (
          <div style={SECTION_STYLE}>
            {renderGameSettings()}
          </div>
        )}

        {activeSection === 'general' && (
          <div style={SECTION_STYLE}>
            <CommonSettings settings={settings} onChange={onChange} />
          </div>
        )}
      </div>
    </div>
  );
}

export default GameSettingsPanel;
