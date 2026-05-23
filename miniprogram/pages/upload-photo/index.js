const { getPetType } = require('../../utils/fortune');
const { callFortune, checkUsage } = require('../../utils/api');
const { saveFortuneRecord } = require('../../utils/storage');

// 本地测试用 mock，联调后端时删除
function _mockFortune(petType, petName) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        rarity: ['SSR', 'SR', 'R'][Math.floor(Math.random() * 3)],
        fortune_type: { dog: '摇尾撒娇型', cat: '月华公主命', rabbit: '月兔使者型', small: '宇宙流浪者' }[petType] || '神秘命格',
        description: `本仙仔细端详了${petName}的照片……唉，就这样吧，命格勉强说得过去，但不得不承认，TA身上有一种独特的灵气。`,
        daily_fortune: Math.ceil(Math.random() * 5),
        lucky_snack: { dog: '鸡胸肉', cat: '金枪鱼罐头', rabbit: '提摩西草', small: '葵花籽' }[petType] || '神秘零食',
        lucky_color: '薰衣草紫',
        lucky_color_hex: '#C8A2D4',
        do_list: ['嗮太阳', '玩耍撒欢', '亲亲抱抱'],
        dont_list: ['独自发呆', '错过零食', '假装听不见'],
        fortune_sign: `今日有小惊喜降临，${petName}记得留意主人口袋里的神秘礼物～`,
      });
    }, 3000); // 模拟 3 秒加载，能看到黄纸动画
  });
}

const AGE_OPTIONS = ['不填写', '< 1岁', '1岁', '2岁', '3岁', '4岁', '5岁', '6岁', '7岁以上'];

Page({
  data: {
    petType: null,
    imagePreview: '',
    imageBase64: '',
    petName: '',
    petAge: '',
    petGender: '',
    petBreed: '',
    ageOptions: AGE_OPTIONS,
    ageIndex: 0,
    loading: false,
    remaining: 5,
    submitDisabled: false,
  },

  onLoad(options) {
    getApp().loadFont();
    const petType = getPetType(options.type || 'dog');
    this.setData({ petType });
    wx.setNavigationBarTitle({ title: `${petType.name}${petType.method}` });
    this._checkUsage();
  },

  async _checkUsage() {
    try {
      // TODO: 联调后端时取消注释
      // const res = await checkUsage();
      const res = { remaining: 5 };
      const remaining = res.remaining ?? 5;
      this.setData({ remaining });
      if (remaining <= 0) {
        this.setData({ submitDisabled: true });
        wx.showModal({
          title: '今日次数已用完 🌙',
          content: '喵仙道人今日已卸甲，明日12:00再来吧～',
          showCancel: false,
          confirmText: '好的',
        });
      } else if (remaining === 1) {
        wx.showToast({ title: `今日仅剩 ${remaining} 次，好好珍惜哦～`, icon: 'none', duration: 2000 });
      }
    } catch (e) {
      // 网络异常不阻断上传流程
    }
  },

  async onChoosePhoto() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        camera: 'back',
        sizeType: ['compressed'],
      });
      const filePath = res.tempFiles[0].tempFilePath;
      const compressRes = await wx.compressImage({ src: filePath, quality: 75 });
      const base64 = wx.getFileSystemManager().readFileSync(compressRes.tempFilePath, 'base64');
      if (base64.length < 5000) {
        wx.showToast({ title: '图片分辨率太低，换一张吧～', icon: 'none' });
        return;
      }
      this.setData({ imagePreview: compressRes.tempFilePath, imageBase64: base64 });
    } catch (e) {
      if (e.errMsg && (e.errMsg.includes('auth') || e.errMsg.includes('authorize'))) {
        wx.showModal({
          title: '需要相册/相机权限',
          content: '请在设置中开启权限',
          confirmText: '去设置',
          success: (r) => { if (r.confirm) wx.openSetting(); },
        });
      }
    }
  },

  onRemovePhoto() {
    this.setData({ imagePreview: '', imageBase64: '' });
  },

  onNameInput(e) { this.setData({ petName: e.detail.value }); },

  onAgeChange(e) {
    const idx = e.detail.value;
    this.setData({ ageIndex: idx, petAge: idx === 0 ? '' : AGE_OPTIONS[idx] });
  },

  onGenderSelect(e) { this.setData({ petGender: e.currentTarget.dataset.gender }); },

  onBreedInput(e) { this.setData({ petBreed: e.detail.value }); },

  async onSubmit() {
    const { imageBase64, petName, petGender, petBreed, petAge, petType, submitDisabled, loading } = this.data;
    if (submitDisabled || loading) return;

    if (!imageBase64) {
      wx.showToast({ title: '请先上传宠物照片 📸', icon: 'none', duration: 2500 });
      return;
    }
    if (!petName || !petName.trim()) {
      wx.showToast({ title: '请填写宠物名字', icon: 'none', duration: 2000 });
      return;
    }
    if (!petGender) {
      wx.showToast({ title: '请选择宠物性别', icon: 'none', duration: 2000 });
      return;
    }

    if (!petBreed) {
      const { confirm } = await wx.showModal({
        title: '喵仙道人有话说',
        content: '填写品种可以让喵仙道人给出更精准的毒舌评价哦 😏\n\n现在继续也可以，但效果可能没那么准～',
        confirmText: '继续算',
        cancelText: '去填一下',
      });
      if (!confirm) return;
    }

    this.setData({ loading: true });
    try {
      // TODO: 联调后端时删掉这段 mock，取消注释 callFortune
      const result = await _mockFortune(petType.id, petName.trim());
      // const result = await callFortune({
      //   petType: petType.id,
      //   petName: petName.trim(),
      //   petAge,
      //   petGender,
      //   petBreed: petBreed.trim(),
      //   imageBase64,
      // });

      saveFortuneRecord({ petType: petType.id, petName, data: result });

      const app = getApp();
      app.globalData.lastResult = {
        result,
        petType: petType.id,
        petName,
        petEmoji: petType.emoji,
      };

      wx.redirectTo({ url: '/pages/result/index' });
    } catch (e) {
      this.setData({ loading: false });
      wx.showModal({
        title: '出了点问题',
        content: '喵仙道人打盹了，再试一次？',
        confirmText: '再试一次',
        cancelText: '算了',
        success: (r) => { if (r.confirm) this.onSubmit(); },
      });
    }
  },
});
