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
      wx.navigateTo({ url: `/pages/upload-photo/index?type=${id}` });
    }, 180);
  },
});
