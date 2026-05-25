const { getTodaySign } = require('../../utils/fortune');

const PET_SHORTCUTS = [
  { id: 'dog',    name: '狗狗', method: '鼻纹算命', emoji: '🐶' },
  { id: 'cat',    name: '猫咪', method: '肉垫占卜', emoji: '🐱' },
  { id: 'rabbit', name: '兔子', method: '耳朵运势', emoji: '🐰' },
  { id: 'small',  name: '小宠', method: '综合测算', emoji: '🐹' },
];

Page({
  data: {
    todaySign: '',
    petShortcuts: PET_SHORTCUTS,
    showWelcome: true,
  },

  onLoad() {
    this.setData({ todaySign: getTodaySign() });
    setTimeout(() => this.setData({ showWelcome: false }), 1800);

    // 热重载后字体注册会丢失，页面级重新注册一次
    getApp().loadFont();
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
