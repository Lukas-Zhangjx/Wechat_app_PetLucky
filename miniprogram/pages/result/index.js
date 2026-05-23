/** 稀有度 → badge class 映射 */
const RARITY_CLASS = { SSR: 'badge--ssr', SR: 'badge--sr', R: 'badge--r' };
/** 稀有度 → hero 卡片背景 class 映射 */
const HERO_CLASS = { SSR: 'fortune-hero--ssr', SR: 'fortune-hero--sr', R: 'fortune-hero--r' };

const FALLBACK_RESULT = {
  rarity: 'R',
  fortune_type: '神秘未知型',
  description: '本仙的占卜水晶球短暂失去了连接……但你的命格，必定与众不同。',
  daily_fortune: 3,
  lucky_snack: '神秘零食',
  lucky_color: '米白',
  lucky_color_hex: '#FFF8EE',
  do_list: ['静心等待', '保持好奇', '信任直觉'],
  dont_list: ['过于急躁', '胡乱猜测', '错过当下'],
  fortune_sign: '水晶球暂时沉默，但宇宙从未停止运转。',
};

Page({
  data: {
    result: null,
    petType: '',
    petName: '',
    petEmoji: '🐾',
    rarityClass: 'badge--r',
    heroClass: 'fortune-hero--r',  // 命格主卡背景 class
  },

  onLoad() {
    getApp().loadFont();
    const app = getApp();
    const payload = app.globalData.lastResult;
    if (!payload) {
      wx.navigateBack();
      return;
    }

    const result = payload.result || FALLBACK_RESULT;
    this.setData({
      result,
      petType: payload.petType || '',
      petName: payload.petName || '',
      petEmoji: payload.petEmoji || '🐾',
      rarityClass: RARITY_CLASS[result.rarity] || 'badge--r',
      heroClass: HERO_CLASS[result.rarity] || 'fortune-hero--r',
    });
  },

  onRetry() {
    wx.navigateBack();
  },

  onShareResult() {
    wx.showToast({ title: '长按截图即可分享 📸', icon: 'none', duration: 2500 });
  },

  onShareAppMessage() {
    const { result, petName } = this.data;
    return {
      title: `${petName}是【${result?.fortune_type}】命格！快来测测你的毛孩子～`,
      path: '/pages/index/index',
    };
  },
});
