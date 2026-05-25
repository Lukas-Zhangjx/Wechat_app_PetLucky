const { getPetType } = require('../../utils/fortune');

Page({
  data: {
    petType: null,
    petEmoji: '🐾',
    petName: '',
  },

  onLoad(options) {
    getApp().loadFont();
    const petType = getPetType(options.type || 'dog');
    wx.setNavigationBarTitle({ title: `给${petType.name}算命` });
    this.setData({
      petType,
      petEmoji: petType.emoji,
      petName: petType.name,
    });
  },

  onChooseDaily() {
    const { petType } = this.data;
    wx.navigateTo({
      url: `/pages/pet-quiz/index?type=${petType.id}&mode=daily`,
    });
  },

  onChooseDestiny() {
    const { petType } = this.data;
    wx.navigateTo({
      url: `/pages/pet-quiz/index?type=${petType.id}&mode=destiny`,
    });
  },
});
