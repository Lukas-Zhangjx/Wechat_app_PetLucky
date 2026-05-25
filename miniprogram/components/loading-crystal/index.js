const STAGE_TEXTS = {
  1: {
    dog: [
      '喵仙道人皱眉审视中…… 📜',
      '本仙勉为其难，鼻纹解码中……',
      '唉，又一条狗……命格推演中……',
      '本仙正在查阅犬族命理古籍 📖',
      '星象运算中，这条狗的命还挺复杂……',
    ],
    cat: [
      '喵仙道人正在认真审阅同族命格…… ✨',
      '肉垫纹路解码中，颇为有趣…… 🐾',
      '本仙凝神观星，命格即将揭晓…… 🌙',
      '猫族命理推演中，稍待片刻…… ⭐',
      '感应宇宙波动中……此猫颇具灵气……',
    ],
    rabbit: [
      '喵仙道人侧耳倾听耳朵的秘密…… 🌿',
      '耳朵运势解读中，林间之风已感应……',
      '本仙翻阅兔族古籍…… 🌙',
      '月光运势推算中，请稍候……',
      '清风命格即将揭晓……',
    ],
    small: [
      '喵仙道人正在扩展命理数据库…… 📜',
      '本仙第一次见到如此……独特的物种……',
      '神秘命格推演中，越算越惊奇…… ✨',
      '宇宙小生灵的命格解码中…… ⭐',
      '本仙凝神感应中……此物种颇为有趣……',
    ],
    default: [
      '喵仙道人正在掐指一算…… 📜',
      '命理古籍翻阅中……',
      '星象推演中，宇宙正在计算…… 🌙',
      '命格数据库连接中…… ⭐',
      '毛孩子的秘密即将揭晓…… 🐾',
    ],
  },
  2: [
    '命格初现！本仙颇感惊喜…… 🔮',
    '好一个命格！本仙已心中有数……',
    '此子命格，果然不凡…… ✨',
    '算完了！喵仙道人满意点头……',
    '命运已定，宇宙正在确认中…… 🌙',
  ],
  3: [
    'AI画师正在挥毫泼墨…… 🎨',
    '颜料备好，笔触正在运行中……',
    '插画品控中，本仙盯着画师…… 👁',
    '画师：我在认真画！别催！',
    '精细描绘中，细节决定命格…… ✨',
    '快好了快好了……再等一下…… 🖌️',
    '宇宙级别的画师不好催，再稍等…… 🌙',
    '你的宠物太可爱，画师画了又改…… 😅',
    '本仙保证：马上就好，绝不跑路…… ⭐',
  ],
};

const PAINT_EMOJIS = ['🖼️', '✏️', '🎨', '🖌️', '⭐'];

const STAGE_TITLES = ['命格推演中', '命格已定！', '专属插画绘制中'];

Component({
  properties: {
    visible: { type: Boolean, value: false },
    petType: { type: String, value: '' },
  },

  data: {
    stage: 1,
    stageTitle: '命格推演中',
    currentText: '喵仙道人掐指一算中……',
    textIndex: 0,
    elapsedSec: 0,
    paintProgress: 5,
    paintEmoji: '🖼️',
    paintEmojiIdx: 0,
  },

  observers: {
    visible(val) {
      if (val) {
        this._reset();
        this._startAll();
      } else {
        this._stopAll();
      }
    },
  },

  lifetimes: {
    detached() { this._stopAll(); },
  },

  methods: {
    _reset() {
      this.setData({
        stage: 1,
        stageTitle: STAGE_TITLES[0],
        textIndex: 0,
        elapsedSec: 0,
        paintProgress: 5,
        paintEmojiIdx: 0,
        paintEmoji: PAINT_EMOJIS[0],
      });
      this._startedAt = Date.now();
    },

    _startAll() {
      const pet = this.properties.petType || 'default';
      const s1Texts = STAGE_TEXTS[1][pet] || STAGE_TEXTS[1].default;

      // 初始文案
      this.setData({ currentText: s1Texts[0] });

      // 每秒计时器（更新 elapsedSec + 推进阶段 + 更新文案）
      this._secTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this._startedAt) / 1000);
        const updates = { elapsedSec: elapsed };

        // 阶段推进
        let newStage = this.data.stage;
        if (elapsed >= 20 && newStage < 3) {
          newStage = 3;
          updates.stage = 3;
          updates.stageTitle = STAGE_TITLES[2];
        } else if (elapsed >= 8 && newStage < 2) {
          newStage = 2;
          updates.stage = 2;
          updates.stageTitle = STAGE_TITLES[1];
        }

        // 文案轮换（每 3 秒换一条）
        if (elapsed % 3 === 0) {
          let pool;
          if (newStage === 1) pool = s1Texts;
          else if (newStage === 2) pool = STAGE_TEXTS[2];
          else pool = STAGE_TEXTS[3];

          const nextIdx = (this.data.textIndex + 1) % pool.length;
          updates.textIndex = nextIdx;
          updates.currentText = pool[nextIdx];
        }

        // 画框进度（阶段3时，每2秒涨一点，最多 92%）
        if (newStage === 3 && elapsed % 2 === 0) {
          const progress = Math.min(92, this.data.paintProgress + 3);
          updates.paintProgress = progress;
        }

        // 画框 emoji 轮换（每5秒）
        if (newStage === 3 && elapsed % 5 === 0) {
          const nextEmojiIdx = (this.data.paintEmojiIdx + 1) % PAINT_EMOJIS.length;
          updates.paintEmojiIdx = nextEmojiIdx;
          updates.paintEmoji = PAINT_EMOJIS[nextEmojiIdx];
        }

        this.setData(updates);
      }, 1000);
    },

    _stopAll() {
      if (this._secTimer) {
        clearInterval(this._secTimer);
        this._secTimer = null;
      }
    },
  },
});
