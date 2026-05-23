const { checkUsage, getRecords } = require('../../utils/api');
const { getPetType } = require('../../utils/fortune');

Page({
  data: {
    records: [],
    remaining: 5,
    expandedId: null,
  },

  onShow() {
    getApp().loadFont();
    this._loadRecords();
    this._loadUsage();
  },

  async _loadRecords() {
    try {
      const res = await getRecords();
      const records = (res.records || []).map((r) => ({
        ...r,
        petEmoji: getPetType(r.petType)?.emoji || '🐾',
        dateLabel: this._formatDate(r.created_at),
        fortuneType: r.result?.fortune_type || '',
        rarity: r.result?.rarity || 'R',
        data: r.result,
      }));
      this.setData({ records });
    } catch (e) {
      // 云函数未部署时不报错
    }
  },

  async _loadUsage() {
    try {
      const res = await checkUsage();
      this.setData({ remaining: res.remaining ?? 5 });
    } catch (e) {
      // ignore
    }
  },

  onToggleExpand(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ expandedId: this.data.expandedId === id ? null : id });
  },

  onGoFortune() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  _formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },
});
