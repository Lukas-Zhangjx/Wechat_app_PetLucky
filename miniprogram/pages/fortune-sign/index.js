const { FORTUNE_SIGNS, getTodaySign } = require('../../utils/fortune');

Page({
  data: {
    todaySign: '',
    allSigns: [],
    todayIndex: 0,
    shakeAnim: false,
  },

  onLoad() {
    getApp().loadFont();
    const todaySign = getTodaySign();
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const todayIndex = dayOfYear % FORTUNE_SIGNS.length;

    this.setData({
      todaySign,
      todayIndex,
      allSigns: FORTUNE_SIGNS.map((text, i) => ({ text, index: i, isToday: i === todayIndex })),
    });
  },

  onShake() {
    this.setData({ shakeAnim: true });
    setTimeout(() => this.setData({ shakeAnim: false }), 800);
  },
});
