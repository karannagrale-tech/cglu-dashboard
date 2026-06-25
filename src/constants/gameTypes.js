export const GAME_TYPES = [
  { id: 'scratchcard', label: 'Scratch Card', icon: '🎴', description: 'Users scratch to reveal rewards', category: 'Games' },
  { id: 'spinthewheel', label: 'Spin the Wheel', icon: '🎡', description: 'Spin to win random prizes', category: 'Games' },
  { id: 'quiz', label: 'Quiz', icon: '❓', description: 'Answer questions to earn rewards', category: 'Games' },
  { id: 'slotmachine', label: 'Slot Machine', icon: '🎰', description: 'Match symbols to win', category: 'Games' },
  { id: 'memorygame', label: 'Memory Game', icon: '🧠', description: 'Match card pairs to win', category: 'Games' },
  { id: 'direct', label: 'Direct Reward', icon: '🎁', description: 'Show reward directly', category: 'Rewards' },
  { id: 'referral', label: 'Referral', icon: '🤝', description: 'Invite friends for rewards', category: 'Growth' },
  { id: 'multistep', label: 'Multi-Step', icon: '📊', description: 'Complete activities in steps', category: 'Engagement' },
  { id: 'streak', label: 'Streak', icon: '🔥', description: 'Consecutive daily activities', category: 'Engagement' },
  { id: 'gamechallenge', label: 'Game Challenge', icon: '🏆', description: 'Multi-activity challenge', category: 'Engagement' },
  { id: 'collectthestamps', label: 'Collect Stamps', icon: '📬', description: 'Collect stamps for rewards', category: 'Engagement' },
  { id: 'activity-scratchcard', label: 'Activity Scratch Card', icon: '🎯', description: 'Complete activity → scratch card', category: 'Games' },
  { id: 'flappy-bird', label: 'Flappy Bird', icon: '🐦', description: 'Tap to fly, avoid obstacles', category: 'Mini Games' },
  { id: 'word-scramble', label: 'Word Scramble', icon: '🔤', description: 'Unscramble words to win', category: 'Mini Games' },
  { id: 'balloon-pop', label: 'Balloon Pop', icon: '🎈', description: 'Pop balloons for prizes', category: 'Mini Games' },
  { id: 'color-match', label: 'Color Match', icon: '🎨', description: 'Match colors to win', category: 'Mini Games' },
  { id: 'whack-a-mole', label: 'Whack-a-Mole', icon: '🔨', description: 'Hit targets for points', category: 'Mini Games' },
  { id: 'picture-puzzle', label: 'Picture Puzzle', icon: '🧩', description: 'Solve puzzles for rewards', category: 'Mini Games' },
];

export const GAME_CATEGORIES = ['Games', 'Rewards', 'Engagement', 'Growth', 'Mini Games'];

export const REWARD_STATES = [
  { id: 'redeemable-unseen', label: 'Redeemable Unseen', color: '#F59E0B' },
  { id: 'redeemable-seen', label: 'Redeemable Seen', color: '#10B981' },
  { id: 'redeemed', label: 'Redeemed', color: '#6B7280' },
  { id: 'expired', label: 'Expired', color: '#EF4444' },
];

// Node types in the structure tree
export const NODE_LABELS = {
  ROOT: 'Root Container',
  CONDITIONAL: 'Conditional',
  CONDITIONAL_1: 'Conditional 1',
  CONDITIONAL_2: 'Conditional 2',
  SC: 'Scratch Card',
  STW: 'Spin The Wheel',
  QUIZ: 'Quiz',
  TEXT_1: 'Title Text',
  TEXT_2: 'Subtitle Text',
  TEXT_HELPER: 'Helper Text',
  TEXT_HINT: 'Hint Text',
  TEXT_NO_REWARD: 'No Reward Text',
  TEXT_HELP: 'Help Text',
  CC: 'Coupon Code',
  RC: 'Reward Container',
  IMG_1: 'Image',
  IMG0: 'Image 1',
  IMG1: 'Image 2',
  CTA: 'CTA Button',
  TNC: 'Terms & Conditions',
  EXPIRY: 'Expiry',
  EXPIRY_DATE: 'Expiry Date',
  ANIME_BLOCK: 'Animation Block',
  REWARD_BODY: 'Reward Body',
  STREAK_ICONS: 'Streak Icons',
};
