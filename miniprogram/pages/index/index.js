const PET_SHORTCUTS = [
  { id: 'dog',    name: '狗狗', method: '鼻纹算命', emoji: '🐶' },
  { id: 'cat',    name: '猫咪', method: '肉垫占卜', emoji: '🐱' },
  { id: 'rabbit', name: '兔子', method: '耳朵运势', emoji: '🐰' },
  { id: 'small',  name: '小宠', method: '综合测算', emoji: '🐹' },
];

Page({
  data: {
    signDrawn: false,       // 今日是否已求签
    todaySign: '',          // 签文
    todaySignGrade: '',     // 等级：大吉 / 吉 / 小吉
    gradeClass: '',         // badge class
    petShortcuts: PET_SHORTCUTS,
    showWelcome: true,
  },

  onLoad() {
    setTimeout(() => this.setData({ showWelcome: false }), 1800);
    getApp().loadFont();
  },

  // onShow 每次切回首页都刷新签文状态（含从灵签页抽完签返回的情况）
  onShow() {
    this._loadTodaySign();
  },

  /** 读取今日签文（与 fortune-sign 页共享同一 localStorage key） */
  _loadTodaySign() {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    try {
      const saved = wx.getStorageSync('daily_sign');
      if (saved && saved.date === dateStr && saved.text) {
        const grade = saved.grade || '吉';
        const gradeClass = grade === '大吉' ? 'grade--daji' : grade === '吉' ? 'grade--ji' : 'grade--xiaoji';
        this.setData({ signDrawn: true, todaySign: saved.text, todaySignGrade: grade, gradeClass });
        return;
      }
    } catch (e) { /* ignore */ }
    this.setData({ signDrawn: false, todaySign: '', todaySignGrade: '', gradeClass: '' });
  },

  onStartFortune() {
    wx.navigateTo({ url: '/pages/select-pet/index' });
  },

  onShortcutTap(e) {
    const { type } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/pet-quiz/index?type=${type}&mode=destiny` });
  },

  onViewSign() {
    wx.switchTab({ url: '/pages/fortune-sign/index' });
  },
});
