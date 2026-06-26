/**
 * Default fragmentMap templates for each game type.
 * These are used when a campaign doesn't have a fragmentMap yet.
 * Structure matches the real CustomerGlu fragmentMap format.
 */

const SCRATCH_CARD_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'SCRATCH_CARD_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'SC', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#7B2D8E',
                  backgroundImage: 'url("https://assets.customerglu.com/zalora/backgrounds/Noise-min.png")',
                  backgroundSize: 'cover',
                  textAlign: 'center',
                  padding: '40px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Scratch and Discover' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#FFFFFF',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Scratch the card for surprising rewards!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          SC: {
            type_id: 'SCRATCH_CARD_GAME_1',
            ui: {
              content: {
                coverColor: '#9333EA',
                coverText: 'Scratch Here!',
                coverImage: 'https://assets.customerglu.com/purplle/cards/scratch-card/card5.png',
              },
              css: {
                container: {
                  width: '280px', height: '200px', margin: '0 auto 24px',
                  borderRadius: '16px', overflow: 'hidden',
                },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Congratulations! You won a reward!' },
              css: {
                text: {
                  fontSize: '18px', fontWeight: '600', color: '#FFFFFF',
                  margin: '16px 0 8px',
                },
              },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'COUPON CODE' },
              css: {
                container: {
                  background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
                  padding: '12px', margin: '12px auto', maxWidth: '280px',
                },
              },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Redeem Now' },
              css: {
                button: {
                  backgroundColor: '#EC4899', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '600',
                  margin: '16px auto', display: 'block', border: 'none',
                  cursor: 'pointer', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Valid for 7 days', 'Cannot be combined with other offers'] },
              css: {
                text: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '16px' },
              },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const SPIN_WHEEL_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'SPIN_WHEEL_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'STW_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#1E3A8A',
                  backgroundImage: 'linear-gradient(135deg, #1E3A8A 0%, #7C3AED 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Spin for Surprises and Delight!' },
              css: {
                text: {
                  fontSize: '22px', fontWeight: '700', color: '#FFFFFF',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Spin the wheel and win exciting rewards' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 20px 0',
                },
              },
            },
          },
          STW_1: {
            type_id: 'SPIN_THE_WHEEL_GAME_1',
            ui: {
              content: {
                slices: [
                  { label: '10% Off', backgroundColor: '#EF4444', textColor: '#FFFFFF' },
                  { label: 'Free Shipping', backgroundColor: '#F59E0B', textColor: '#FFFFFF' },
                  { label: '20% Off', backgroundColor: '#10B981', textColor: '#FFFFFF' },
                  { label: 'Try Again', backgroundColor: '#6366F1', textColor: '#FFFFFF' },
                  { label: '₹100 Off', backgroundColor: '#EC4899', textColor: '#FFFFFF' },
                  { label: 'Mystery Gift', backgroundColor: '#8B5CF6', textColor: '#FFFFFF' },
                ],
                spinButtonText: 'SPIN',
                pointerColor: '#FFD700',
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Congratulations! You won!' },
              css: {
                text: { fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: '16px 0 8px' },
              },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'COUPON CODE' },
              css: {
                container: { background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' },
              },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Celebrate & Win' },
              css: {
                button: {
                  backgroundColor: '#10B981', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '600',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Valid for 7 days', 'One spin per user per day'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const QUIZ_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'QUIZ_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'QUIZ_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#1F2937',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Quiz Time!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#F59E0B',
                  margin: '0 0 8px 0',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Answer correctly to win exciting rewards' },
              css: {
                text: { fontSize: '14px', color: '#D1D5DB', margin: '0 0 24px 0' },
              },
            },
          },
          QUIZ_1: {
            type_id: 'QUIZ_GAME_1',
            ui: {
              content: {
                questions: [
                  {
                    question: 'What is the capital of India?',
                    options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
                    answer: 'New Delhi',
                    time: 15,
                  },
                ],
                showTimer: true,
                defaultTimeLimit: 15,
              },
              css: {
                container: { margin: '0 auto', maxWidth: '340px' },
                questionCard: { background: '#374151', borderRadius: '12px', padding: '20px' },
                optionButton: { background: '#4B5563', color: '#FFFFFF', borderRadius: '8px', padding: '12px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Great job! You earned a reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#F59E0B', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'QUIZ-WINNER' },
              css: { container: { background: '#374151', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#F59E0B', color: '#1F2937', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Answer all questions correctly to win', 'Valid for 24 hours'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const SLOT_MACHINE_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'SLOT_MACHINE_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'SLOT_MACHINE_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#1a1a2e',
                  backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Lucky Slots!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#FFD700',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Pull the lever and match symbols to win big!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,215,0,0.7)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          SLOT_MACHINE_1: {
            type_id: 'SLOT_MACHINE_GAME_1',
            ui: {
              content: {
                reelCount: 3,
                symbols: ['🍒', '🍋', '⭐', '💎', '7️⃣'],
                spinText: 'PULL',
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Jackpot! You matched!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#FFD700', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'JACKPOT-CODE' },
              css: { container: { background: 'rgba(255,215,0,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Jackpot' },
              css: {
                button: {
                  backgroundColor: '#FFD700', color: '#1a1a2e', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['One pull per session', 'Prizes valid for 48 hours'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const MEMORY_GAME_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'MEMORY_GAME_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'MEMORY_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#7C3AED',
                  backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Memory Match!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#FFFFFF',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Flip cards and match pairs before time runs out!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          MEMORY_1: {
            type_id: 'MEMORY_GAME_1',
            ui: {
              content: {
                rows: 3,
                cols: 4,
                symbols: ['🎁', '⭐', '💎', '🏆', '🎯', '🎪'],
                timeLimit: 60,
                coverEmoji: '❓',
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Amazing memory! You earned a reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'MEMORY-WIN' },
              css: { container: { background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#FFFFFF', color: '#7C3AED', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Match all pairs within 60 seconds', 'One attempt per day'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const DIRECT_REWARD_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'DIRECT_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'IMG_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#F0F4FF',
                  textAlign: 'center',
                  padding: '40px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'You Got a Reward!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#1E3A8A',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Here is your exclusive reward, just for you!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: '#64748B',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          IMG_1: {
            type_id: 'IMAGE',
            ui: {
              content: {
                src: 'https://assets.customerglu.com/default/reward-gift.png',
                alt: 'Reward illustration',
              },
              css: {
                container: {
                  width: '200px', height: '200px', margin: '0 auto 24px',
                  borderRadius: '16px', overflow: 'hidden',
                },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Your reward is ready to claim!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#1E3A8A', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'REWARD-CODE' },
              css: { container: { background: '#E0E7FF', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Redeem Now' },
              css: {
                button: {
                  backgroundColor: '#3B82F6', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '600',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Valid for 7 days', 'One reward per user'] },
              css: { text: { fontSize: '11px', color: '#94A3B8', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const REFERRAL_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'REFERRAL_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'REFERRAL_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#064E3B',
                  backgroundImage: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Refer & Earn!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#10B981',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Invite your friends and both of you earn rewards!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          REFERRAL_1: {
            type_id: 'REFERRAL_1',
            ui: {
              content: {
                referralText: 'Invite friends & earn rewards!',
                shareText: 'Share link',
                steps: ['Share link', 'Friend signs up', 'Both earn rewards'],
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Your friend joined! Here is your reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#10B981', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'REFER-CODE' },
              css: { container: { background: 'rgba(16,185,129,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Share Now' },
              css: {
                button: {
                  backgroundColor: '#10B981', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '600',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Referral must complete sign-up', 'Rewards credited within 24 hours'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const MULTISTEP_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'MULTISTEP_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'MULTISTEP_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#1E3A5F',
                  backgroundImage: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Complete the Challenge!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#FFFFFF',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Finish all steps to unlock your reward' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          MULTISTEP_1: {
            type_id: 'MULTISTEP_1',
            ui: {
              content: {
                steps: [
                  { title: 'Step 1', desc: 'Complete purchase' },
                  { title: 'Step 2', desc: 'Write review' },
                  { title: 'Step 3', desc: 'Earn reward' },
                ],
                currentStep: 0,
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'All steps complete! Claim your reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'MULTI-WIN' },
              css: { container: { background: 'rgba(59,130,246,0.2)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#3B82F6', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '600',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Complete all steps within 7 days', 'Progress is saved automatically'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const STREAK_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'STREAK_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'STREAK_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#7C2D12',
                  backgroundImage: 'linear-gradient(135deg, #7C2D12 0%, #9A3412 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Daily Streak!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#F97316',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Check in every day to build your streak and earn bigger rewards!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          STREAK_1: {
            type_id: 'STREAK_1',
            ui: {
              content: {
                days: 7,
                currentDay: 0,
                rewards: ['Day 1: 10pts', 'Day 3: 20pts', 'Day 7: 50pts'],
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Streak milestone reached! Bonus unlocked!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#F97316', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'STREAK-BONUS' },
              css: { container: { background: 'rgba(249,115,22,0.2)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Check In Today' },
              css: {
                button: {
                  backgroundColor: '#F97316', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '600',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Missing a day resets your streak', 'Bonus rewards at Day 3 and Day 7'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const GAME_CHALLENGE_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'GAME_CHALLENGE_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'CHALLENGE_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#78350F',
                  backgroundImage: 'linear-gradient(135deg, #78350F 0%, #92400E 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Activity Challenge!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#F59E0B',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Complete activities to earn your trophy reward!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          CHALLENGE_1: {
            type_id: 'GAME_CHALLENGE_1',
            ui: {
              content: {
                activities: [
                  { name: 'Shop', icon: '🛒' },
                  { name: 'Review', icon: '⭐' },
                  { name: 'Share', icon: '📤' },
                ],
                completedCount: 0,
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Challenge complete! You earned a trophy reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#F59E0B', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'CHAMP-CODE' },
              css: { container: { background: 'rgba(245,158,11,0.2)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Start Challenge' },
              css: {
                button: {
                  backgroundColor: '#F59E0B', color: '#78350F', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Complete all activities to unlock reward', 'Challenge expires in 30 days'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const STAMP_COLLECTION_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'STAMP_COLLECTION_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'STAMPS_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#14532D',
                  backgroundImage: 'linear-gradient(135deg, #14532D 0%, #166534 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Collect Your Stamps!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#34D399',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Earn stamps with each purchase and unlock a special reward!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          STAMPS_1: {
            type_id: 'STAMP_COLLECTION_1',
            ui: {
              content: {
                totalStamps: 6,
                collectedStamps: 0,
                stampEmoji: '⭐',
                emptyEmoji: '○',
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'All stamps collected! Here is your reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#34D399', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'STAMP-PRIZE' },
              css: { container: { background: 'rgba(52,211,153,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Redeem Stamps' },
              css: {
                button: {
                  backgroundColor: '#34D399', color: '#14532D', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Earn 1 stamp per purchase', 'Collect all 6 to unlock reward'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const ACTIVITY_SCRATCH_CARD_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'ACTIVITY_SCRATCH_CARD_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'ACTIVITY_INTRO', 'ACTIVITY_SC', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#831843',
                  backgroundImage: 'linear-gradient(135deg, #831843 0%, #9D174D 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Complete & Scratch!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#F9A8D4',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Complete the activity to unlock your scratch card!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          ACTIVITY_INTRO: {
            type_id: 'ACTIVITY_INTRO_SCREEN',
            ui: {
              content: {
                activityTitle: 'Complete an Activity',
                activityDesc: 'Finish the task below to unlock your scratch card',
                buttonText: 'Start Activity',
              },
              css: {
                container: { margin: '0 auto 16px', maxWidth: '320px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' },
              },
            },
          },
          ACTIVITY_SC: {
            type_id: 'SCRATCH_CARD_GAME_1',
            ui: {
              content: {
                coverColor: '#EC4899',
                coverText: 'Scratch Here!',
                coverImage: 'https://assets.customerglu.com/purplle/cards/scratch-card/card5.png',
              },
              css: {
                container: {
                  width: '280px', height: '200px', margin: '0 auto 24px',
                  borderRadius: '16px', overflow: 'hidden',
                },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Activity done! Here is your scratch reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#F9A8D4', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'ACT-SCRATCH' },
              css: { container: { background: 'rgba(236,72,153,0.2)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Redeem Now' },
              css: {
                button: {
                  backgroundColor: '#EC4899', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '600',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Complete the activity first to unlock scratch card', 'Valid for 7 days'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const FLAPPY_BIRD_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'FLAPPY_BIRD_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'FLAPPY_BIRD_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#0EA5E9',
                  backgroundImage: 'linear-gradient(180deg, #0EA5E9 0%, #38BDF8 60%, #86EFAC 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Flappy Bird Challenge!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#FFFFFF',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Tap to fly through the pipes and hit the target score!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.9)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          FLAPPY_BIRD_1: {
            type_id: 'FLAPPY_BIRD_1',
            ui: {
              content: {
                difficulty: 'medium',
                timeLimit: 30,
                targetScore: 100,
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Great flying! You earned a reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'FLAPPY-WIN' },
              css: { container: { background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#FFFFFF', color: '#0EA5E9', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Score 100+ points to win', 'Three attempts per day'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const WORD_SCRAMBLE_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'WORD_SCRAMBLE_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'WORD_SCRAMBLE_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#78350F',
                  backgroundImage: 'linear-gradient(135deg, #78350F 0%, #92400E 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Word Scramble!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#FDE68A',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Unscramble the letters to form the word and win!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          WORD_SCRAMBLE_1: {
            type_id: 'WORD_SCRAMBLE_1',
            ui: {
              content: {
                difficulty: 'medium',
                timeLimit: 30,
                targetScore: 100,
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Word master! You earned a reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#FDE68A', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'WORD-WIN' },
              css: { container: { background: 'rgba(253,230,138,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#FDE68A', color: '#78350F', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Unscramble within 30 seconds', 'One attempt per session'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const BALLOON_POP_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'BALLOON_POP_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'BALLOON_POP_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#4C1D95',
                  backgroundImage: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Balloon Pop Party!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#FFFFFF',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Pop as many balloons as you can before time runs out!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          BALLOON_POP_1: {
            type_id: 'BALLOON_POP_1',
            ui: {
              content: {
                difficulty: 'medium',
                timeLimit: 30,
                targetScore: 100,
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Pop star! You earned a reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'POP-WIN' },
              css: { container: { background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#A78BFA', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Pop 100+ balloons to win', 'Three attempts per day'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const COLOR_MATCH_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'COLOR_MATCH_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'COLOR_MATCH_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#1F2937',
                  backgroundImage: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Color Match!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#F472B6',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Match the colors correctly and beat the clock!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          COLOR_MATCH_1: {
            type_id: 'COLOR_MATCH_1',
            ui: {
              content: {
                difficulty: 'medium',
                timeLimit: 30,
                targetScore: 100,
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Perfect match! You earned a reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#F472B6', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'COLOR-WIN' },
              css: { container: { background: 'rgba(244,114,182,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#F472B6', color: '#FFFFFF', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Match all colors within 30 seconds', 'One attempt per session'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const WHACK_A_MOLE_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'WHACK_A_MOLE_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'WHACK_A_MOLE_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#422006',
                  backgroundImage: 'linear-gradient(135deg, #422006 0%, #713F12 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Whack-a-Mole!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#4ADE80',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Tap the moles as fast as you can to score big!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          WHACK_A_MOLE_1: {
            type_id: 'WHACK_A_MOLE_1',
            ui: {
              content: {
                difficulty: 'medium',
                timeLimit: 30,
                targetScore: 100,
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Whack champion! You earned a reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#4ADE80', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'WHACK-WIN' },
              css: { container: { background: 'rgba(74,222,128,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#4ADE80', color: '#422006', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Whack 100+ moles to win', 'Three attempts per day'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

const PICTURE_PUZZLE_FRAGMENT = {
  fragmentType: 'SINGLE_REWARD',
  fragmentKeys: ['version', 'reward', 'program'],
  fragments: {
    fragmentVersion: '1.0',
    templateVersion: '1.0',
    reward: {
      type_id: 'REWARD',
      game: {
        rootId: 'ROOT',
        byId: {
          ROOT: {
            type_id: 'PICTURE_PUZZLE_ROOT',
            ui: {
              content: { children: ['TEXT_1', 'TEXT_2', 'PICTURE_PUZZLE_1', 'CONDITIONAL'] },
              css: {
                container: {
                  backgroundColor: '#134E4A',
                  backgroundImage: 'linear-gradient(135deg, #134E4A 0%, #115E59 100%)',
                  textAlign: 'center',
                  padding: '32px 16px',
                  minHeight: '100vh',
                },
              },
            },
          },
          TEXT_1: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Picture Puzzle!' },
              css: {
                text: {
                  fontSize: '24px', fontWeight: '700', color: '#5EEAD4',
                  margin: '0 0 8px 0', lineHeight: '1.3',
                },
              },
            },
          },
          TEXT_2: {
            type_id: 'TEXT',
            ui: {
              content: { text: 'Rearrange the pieces to complete the picture!' },
              css: {
                text: {
                  fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 24px 0',
                },
              },
            },
          },
          PICTURE_PUZZLE_1: {
            type_id: 'PICTURE_PUZZLE_1',
            ui: {
              content: {
                difficulty: 'medium',
                timeLimit: 30,
                targetScore: 100,
              },
              css: {
                container: { margin: '0 auto 24px', maxWidth: '320px' },
              },
            },
          },
          CONDITIONAL: {
            type_id: 'CONDITIONAL_WRAPPER',
            ui: {
              content: { children: ['REWARD_BODY', 'CC', 'CTA', 'TNC'] },
              css: {},
            },
          },
          REWARD_BODY: {
            type_id: 'REWARD_BODY',
            ui: {
              content: { text: 'Puzzle solved! You earned a reward!' },
              css: { text: { fontSize: '18px', fontWeight: '600', color: '#5EEAD4', margin: '16px 0 8px' } },
            },
          },
          CC: {
            type_id: 'CARD_CODE',
            ui: {
              content: { label: 'Your Code', placeholder: 'PUZZLE-WIN' },
              css: { container: { background: 'rgba(94,234,212,0.15)', borderRadius: '8px', padding: '12px', margin: '12px auto', maxWidth: '280px' } },
            },
          },
          CTA: {
            type_id: 'REWARD_BUTTON',
            ui: {
              content: { text: 'Claim Reward' },
              css: {
                button: {
                  backgroundColor: '#5EEAD4', color: '#134E4A', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '16px', fontWeight: '700',
                  margin: '16px auto', display: 'block', border: 'none', maxWidth: '280px', width: '100%',
                },
              },
            },
          },
          TNC: {
            type_id: 'REWARD_TNC',
            ui: {
              content: { items: ['Complete the puzzle within 30 seconds', 'One attempt per session'] },
              css: { text: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '16px' } },
            },
          },
        },
      },
    },
  },
  data: { slots: [], activityIdMap: {} },
};

export const DEFAULT_FRAGMENTS = {
  scratchcard: SCRATCH_CARD_FRAGMENT,
  spinthewheel: SPIN_WHEEL_FRAGMENT,
  quiz: QUIZ_FRAGMENT,
  slotmachine: SLOT_MACHINE_FRAGMENT,
  memorygame: MEMORY_GAME_FRAGMENT,
  direct: DIRECT_REWARD_FRAGMENT,
  referral: REFERRAL_FRAGMENT,
  multistep: MULTISTEP_FRAGMENT,
  streak: STREAK_FRAGMENT,
  gamechallenge: GAME_CHALLENGE_FRAGMENT,
  collectthestamps: STAMP_COLLECTION_FRAGMENT,
  'activity-scratchcard': ACTIVITY_SCRATCH_CARD_FRAGMENT,
  'flappy-bird': FLAPPY_BIRD_FRAGMENT,
  'word-scramble': WORD_SCRAMBLE_FRAGMENT,
  'balloon-pop': BALLOON_POP_FRAGMENT,
  'color-match': COLOR_MATCH_FRAGMENT,
  'whack-a-mole': WHACK_A_MOLE_FRAGMENT,
  'picture-puzzle': PICTURE_PUZZLE_FRAGMENT,
};

export function getDefaultFragment(experience) {
  return DEFAULT_FRAGMENTS[experience] || null;
}
