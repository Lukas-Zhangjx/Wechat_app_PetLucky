const { getPetType } = require('../../utils/fortune');
const { callFortune, checkUsage } = require('../../utils/api');
const { saveFortuneRecord } = require('../../utils/storage');

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
    petColor: '',
    ageOptions: AGE_OPTIONS,
    ageIndex: 0,
    loading: false,
    remaining: 5,
    submitDisabled: false,
    fortuneMode: 'daily',
  },

  onLoad(options) {
    getApp().loadFont();
    const petType = getPetType(options.type || 'dog');
    const mode = options.mode || 'daily';
    const modeLabel = mode === 'destiny' ? '命格解读' : '今日求签';
    wx.setNavigationBarTitle({ title: `${petType.name} · ${modeLabel}` });

    // 从上一步（性格测试页）读取已填写的宠物信息
    const petInfo = getApp().globalData.petInfo || {};
    const ageIdx = AGE_OPTIONS.indexOf(petInfo.petAge || '');
    // 如果档案里有照片，自动预填
    const savedPhoto = petInfo.petPhoto || '';
    this.setData({
      petType,
      fortuneMode: mode,
      petName:      petInfo.petName   || '',
      petGender:    petInfo.petGender || '',
      petBreed:     petInfo.petBreed  || '',
      petColor:     petInfo.petColor  || '',
      petAge:       petInfo.petAge    || '',
      ageIndex:     ageIdx >= 0 ? ageIdx : 0,
      imagePreview: savedPhoto,
    });
    this._checkUsage();

    // 从测试完成页点「不传照片直接算」过来，自动跳过上传
    if (options.skipPhoto === '1') {
      setTimeout(() => this.onSkipPhoto(), 300);
    }
  },

  async _checkUsage() {
    try {
      const res = await checkUsage();
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

  // 迭代压缩：最多3轮，每轮降质量，保证 base64 ≤ 200KB
  async _compressToLimit(filePath) {
    const MAX_B64 = 200 * 1024; // 200KB
    let src = filePath;
    for (const quality of [70, 50, 30]) {
      const res = await wx.compressImage({ src, quality });
      const base64 = wx.getFileSystemManager().readFileSync(res.tempFilePath, 'base64');
      console.log(`[Compress] quality=${quality} base64=${(base64.length / 1024).toFixed(1)}KB`);
      if (base64.length <= MAX_B64 || quality === 30) {
        return { base64, tempFilePath: res.tempFilePath };
      }
      src = res.tempFilePath; // 用压缩后的文件继续压
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
      const { base64, tempFilePath } = await this._compressToLimit(filePath);
      if (base64.length < 5000) {
        wx.showToast({ title: '图片分辨率太低，换一张吧～', icon: 'none' });
        return;
      }
      this.setData({ imagePreview: tempFilePath, imageBase64: base64 });
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

  onColorInput(e) { this.setData({ petColor: e.detail.value }); },

  onSkipPhoto() {
    this.setData({ imagePreview: '', imageBase64: '' });
    this.onSubmit();
  },

  async onSubmit() {
    const { imageBase64, petName, petGender, petBreed, petColor, petAge, petType, submitDisabled, loading, fortuneMode } = this.data;
    if (submitDisabled || loading) return;

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
    console.log('[Submit] 开始调用，petType:', petType.id);
    try {
      const quizAnswers = getApp().globalData.quizAnswers || null;
      const result = await callFortune({
        petType: petType.id,
        petName: petName.trim(),
        petAge,
        petGender,
        petBreed: petBreed.trim(),
        petColor: petColor.trim(),
        mode: fortuneMode,
        quizAnswers,
      });
      console.log('[Submit] 调用成功', result);

      saveFortuneRecord({ petType: petType.id, petName, data: result });

      const app = getApp();
      app.globalData.lastResult = {
        result,
        petType: petType.id,
        petName,
        petEmoji: petType.emoji,
        petImg: petType.img,
        mode: fortuneMode,
        userPhoto: this.data.imagePreview,   // 用户上传的真实照片
      };

      wx.redirectTo({ url: '/pages/result/index' });
    } catch (e) {
      console.error('Fortune error:', e.message || e.errMsg || JSON.stringify(e));
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
