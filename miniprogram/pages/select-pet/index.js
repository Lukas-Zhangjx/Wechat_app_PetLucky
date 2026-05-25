const { PET_TYPES } = require('../../utils/fortune');

Page({
  data: {
    petTypes: PET_TYPES,
    selectedId: '',
  },

  onLoad() {
    getApp().loadFont();
  },

  onSelectPet(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ selectedId: id });
    setTimeout(() => {
      wx.navigateTo({ url: `/pages/pet-quiz/index?type=${id}&mode=destiny` });
    }, 180);
  },
});
