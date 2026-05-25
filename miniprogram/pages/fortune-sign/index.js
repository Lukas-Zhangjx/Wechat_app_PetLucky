const { drawFortuneSign } = require('../../utils/fortune');

// 等级 → 卡片class映射
const GRADE_CLASS = { '大吉': 'grade--daji', '吉': 'grade--ji', '小吉': 'grade--xiaoji' };
// 等级 → 卡片背景class映射
const CARD_CLASS  = { '大吉': 'sign-main-card--daji', '吉': 'sign-main-card--ji', '小吉': 'sign-main-card--xiaoji' };

Page({
  data: {
    hasDrawn: false,      // 今日是否已求签
    todaySign: '',        // 签文内容
    signGrade: '',        // 签文等级：大吉 / 吉 / 小吉
    gradeClass: '',       // badge class
    cardClass: '',        // 卡片背景 class
    isDrawing: false,     // 求签动画中
    shakeAnim: false,     // 已求签后的触摸动画
  },

  onLoad() {
    getApp().loadFont();
    this._checkTodaySign();
  },

  /** 返回今日日期字符串，格式 YYYY-MM-DD */
  _getTodayDateStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /** 检查今日是否已求签（从本地存储读取） */
  _checkTodaySign() {
    const dateStr = this._getTodayDateStr();
    try {
      const saved = wx.getStorageSync('daily_sign');
      if (saved && saved.date === dateStr && saved.text) {
        const grade = saved.grade || '吉';
        this.setData({
          hasDrawn: true,
          todaySign: saved.text,
          signGrade: grade,
          gradeClass: GRADE_CLASS[grade] || 'grade--ji',
          cardClass: CARD_CLASS[grade] || 'sign-main-card--ji',
        });
        return;
      }
    } catch (e) { /* ignore */ }
    this.setData({ hasDrawn: false });
  },

  /** 求签：加权随机抽取一签，动画后揭晓并保存 */
  onDrawSign() {
    if (this.data.isDrawing) return;
    this.setData({ isDrawing: true });

    setTimeout(() => {
      const { text, grade } = drawFortuneSign();
      const dateStr = this._getTodayDateStr();

      try {
        wx.setStorageSync('daily_sign', { date: dateStr, text, grade });
      } catch (e) { /* ignore */ }

      this.setData({
        hasDrawn: true,
        todaySign: text,
        signGrade: grade,
        gradeClass: GRADE_CLASS[grade] || 'grade--ji',
        cardClass: CARD_CLASS[grade] || 'sign-main-card--ji',
        isDrawing: false,
      });
    }, 1600);
  },

  /** 已求签时轻触卡片触发抖动动画 */
  onShake() {
    if (!this.data.hasDrawn || this.data.shakeAnim) return;
    this.setData({ shakeAnim: true });
    setTimeout(() => this.setData({ shakeAnim: false }), 800);
  },
});
