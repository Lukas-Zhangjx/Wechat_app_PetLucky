const BUBBLE_LINES = [
  '本仙从业三千年，头一次……没算出来？！',
  '不可能！本仙的水晶球从没出过错！',
  '哼，肯定是宇宙在故意捣乱！',
  '这命格太深了，普通算法镇不住！',
  '本仙不服，再给本仙一次机会！',
];

const HINT_TEXTS = [
  '再试一次说不定就成了～',
  '宇宙信号不稳定，多试几次准行的',
  '本仙状态来了谁也挡不住 ✨',
];

Page({
  data: {
    currentLine: BUBBLE_LINES[0],
    hintText: HINT_TEXTS[0],
    lineIndex: 0,
  },

  onLoad() {
    getApp().loadFont?.();
    // 随机选一条提示
    const hint = HINT_TEXTS[Math.floor(Math.random() * HINT_TEXTS.length)];
    this.setData({ hintText: hint });
    // 台词每 2.5 秒换一条
    this._timer = setInterval(() => {
      const next = (this.data.lineIndex + 1) % BUBBLE_LINES.length;
      this.setData({ lineIndex: next, currentLine: BUBBLE_LINES[next] });
    }, 2500);
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer);
  },

  onRetry() {
    // 返回上一页（upload-photo），表单数据还在
    wx.navigateBack();
  },

  onBack() {
    // 返回到首页
    wx.reLaunch({ url: '/pages/index/index' });
  },
});
