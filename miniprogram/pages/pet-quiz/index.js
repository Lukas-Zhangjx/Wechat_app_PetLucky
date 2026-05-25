const { getRandomQuestions } = require('./questions');
const { getPets } = require('../../utils/petProfile');

const AGE_OPTIONS = ['不填写', '< 1岁', '1岁', '2岁', '3岁', '4岁', '5岁', '6岁', '7岁以上'];

Page({
  data: {
    petType: 'dog',
    mode: 'daily',

    // ===== Step 0：基本信息 =====
    showForm: true,
    petName: '',
    petGender: '',
    petBreed: '',
    petColor: '',
    petAge: '',
    ageOptions: AGE_OPTIONS,
    ageIndex: 0,

    // 已保存的同类宠物（快速加载档案）
    savedPets: [],

    // ===== Step 1：答题 =====
    questions: [],
    current: 0,
    answers: [],
    selected: -1,
    animating: false,
    finished: false,
  },

  onLoad(options) {
    getApp().loadFont?.();
    const petType = options.type || 'dog';
    const mode = options.mode || 'daily';
    const questions = getRandomQuestions(petType, 10);

    // 检查同类已保存宠物，用于快速加载
    const savedPets = getPets().filter(p => p.type === petType);

    if (options.skipForm === '1') {
      // 从「我的」页直接进入：petInfo 已在 globalData，跳过表单
      const info = getApp().globalData.petInfo || {};
      const ageIdx = AGE_OPTIONS.indexOf(info.petAge || '');
      this.setData({
        petType, mode, questions, savedPets,
        showForm: false,
        petName:   info.petName   || '',
        petGender: info.petGender || '',
        petBreed:  info.petBreed  || '',
        petColor:  info.petColor  || '',
        petAge:    info.petAge    || '',
        ageIndex:  ageIdx >= 0 ? ageIdx : 0,
      });
    } else {
      this.setData({ petType, mode, questions, savedPets });
    }
  },

  // ===== 快速加载已保存档案 =====
  onUseSavedPet(e) {
    const { id } = e.currentTarget.dataset;
    const pet = getPets().find(p => p.id == id);
    if (!pet) return;
    const ageIdx = AGE_OPTIONS.indexOf(pet.petAge || '');
    this.setData({
      petName:   pet.petName   || '',
      petGender: pet.petGender || '',
      petBreed:  pet.petBreed  || '',
      petColor:  pet.petColor  || '',
      petAge:    pet.petAge    || '',
      ageIndex:  ageIdx >= 0 ? ageIdx : 0,
    });
    wx.showToast({ title: `已加载 ${pet.petName} 的档案`, icon: 'success', duration: 1200 });
  },

  // ===== 表单处理 =====
  onNameInput(e)   { this.setData({ petName: e.detail.value }); },
  onGenderSelect(e){ this.setData({ petGender: e.currentTarget.dataset.gender }); },
  onBreedInput(e)  { this.setData({ petBreed: e.detail.value }); },
  onColorInput(e)  { this.setData({ petColor: e.detail.value }); },
  onAgeChange(e) {
    const idx = e.detail.value;
    this.setData({ ageIndex: idx, petAge: idx === 0 ? '' : AGE_OPTIONS[idx] });
  },

  onInfoSubmit() {
    const { petName, petGender } = this.data;
    if (!petName || !petName.trim()) {
      wx.showToast({ title: '请填写宠物名字', icon: 'none' });
      return;
    }
    if (!petGender) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return;
    }
    this.setData({ showForm: false });
  },

  // ===== 答题处理 =====
  onSelectOption(e) {
    if (this.data.animating) return;
    const idx = e.currentTarget.dataset.idx;
    this.setData({ selected: idx, animating: true });

    setTimeout(() => {
      const { current, questions, answers } = this.data;
      const q = questions[current];
      const newAnswers = [...answers, {
        q: q.q,
        answer: q.opts[idx].text,
        trait: q.opts[idx].trait,
      }];

      if (current + 1 >= questions.length) {
        this.setData({ answers: newAnswers, finished: true, animating: false });
      } else {
        this.setData({
          answers: newAnswers,
          current: current + 1,
          selected: -1,
          animating: false,
        });
      }
    }, 550);
  },

  // 把填好的基本信息存到全局，上传页直接用
  // 注意：保留已有的 petPhoto，不能覆盖（从档案进来时由 my 页设置）
  _savePetInfo() {
    const { petName, petGender, petBreed, petColor, petAge } = this.data;
    const existing = getApp().globalData.petInfo || {};
    getApp().globalData.petInfo = {
      petName: petName.trim(),
      petGender,
      petBreed: petBreed.trim(),
      petColor: petColor.trim(),
      petAge,
      petPhoto: existing.petPhoto || '',
    };
  },

  onStartFortune() {
    const { petType, mode, petName, answers } = this.data;
    this._savePetInfo();
    getApp().globalData.quizAnswers = answers;
    wx.navigateTo({
      url: `/pages/upload-photo/index?type=${petType}&mode=${mode}&petName=${encodeURIComponent(petName.trim())}`,
    });
  },

  // 测试中途跳过 → 不带答案，正常上传照片
  onSkip() {
    const { petType, mode, petName } = this.data;
    this._savePetInfo();
    getApp().globalData.quizAnswers = null;
    wx.navigateTo({
      url: `/pages/upload-photo/index?type=${petType}&mode=${mode}&petName=${encodeURIComponent(petName.trim())}`,
    });
  },

  // 测试完成后跳过照片 → 带着答案，自动跳过上传直接算
  onSkipPhoto() {
    const { petType, mode, petName, answers } = this.data;
    this._savePetInfo();
    getApp().globalData.quizAnswers = answers;
    wx.navigateTo({
      url: `/pages/upload-photo/index?type=${petType}&mode=${mode}&petName=${encodeURIComponent(petName.trim())}&skipPhoto=1`,
    });
  },
});
