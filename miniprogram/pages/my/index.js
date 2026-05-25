const { checkUsage, getRecords } = require('../../utils/api');
const { getPetType, PET_TYPES } = require('../../utils/fortune');
const { getPets, savePet, deletePet } = require('../../utils/petProfile');

const AGE_OPTIONS = ['不填写', '< 1岁', '1岁', '2岁', '3岁', '4岁', '5岁', '6岁', '7岁以上'];

Page({
  data: {
    // ===== 宠物档案 =====
    pets: [],
    showPetForm: false,
    editingPetId: null,
    // 表单字段
    formName: '',
    formGender: '',
    formBreed: '',
    formColor: '',
    formAge: '',
    formAgeIndex: 0,
    formType: 'dog',
    formTypeIndex: 0,
    ageOptions: AGE_OPTIONS,
    petTypeOptions: [],

    // ===== 算命记录 =====
    records: [],
    remaining: 5,
    expandedId: null,
  },

  onShow() {
    getApp().loadFont();
    this._loadPets();
    this._loadRecords();
    this._loadUsage();
  },

  // ──────── 宠物档案 ────────

  _loadPets() {
    const pets = getPets();
    const petsWithMeta = pets.map(p => ({
      ...p,
      emoji: PET_TYPES.find(t => t.id === p.type)?.emoji || '🐾',
      typeName: PET_TYPES.find(t => t.id === p.type)?.name || '宠物',
    }));
    const petTypeOptions = PET_TYPES.map(t => `${t.emoji} ${t.name}`);
    this.setData({ pets: petsWithMeta, petTypeOptions });
  },

  onAddPet() {
    this.setData({
      showPetForm: true,
      editingPetId: null,
      formName: '',
      formGender: '',
      formBreed: '',
      formColor: '',
      formAge: '',
      formAgeIndex: 0,
      formType: PET_TYPES[0].id,
      formTypeIndex: 0,
    });
  },

  onEditPet(e) {
    const { id } = e.currentTarget.dataset;
    // id stored as number (Date.now())
    const pet = this.data.pets.find(p => p.id == id);
    if (!pet) return;
    const typeIdx = PET_TYPES.findIndex(t => t.id === pet.type);
    const ageIdx = AGE_OPTIONS.indexOf(pet.petAge || '');
    this.setData({
      showPetForm: true,
      editingPetId: pet.id,
      formName: pet.petName || '',
      formGender: pet.petGender || '',
      formBreed: pet.petBreed || '',
      formColor: pet.petColor || '',
      formAge: pet.petAge || '',
      formAgeIndex: ageIdx >= 0 ? ageIdx : 0,
      formType: pet.type || 'dog',
      formTypeIndex: typeIdx >= 0 ? typeIdx : 0,
    });
  },

  onClosePetForm() {
    this.setData({ showPetForm: false });
  },

  // 表单字段处理
  onFormNameInput(e)    { this.setData({ formName: e.detail.value }); },
  onFormGenderSelect(e) { this.setData({ formGender: e.currentTarget.dataset.gender }); },
  onFormBreedInput(e)   { this.setData({ formBreed: e.detail.value }); },
  onFormColorInput(e)   { this.setData({ formColor: e.detail.value }); },
  onFormAgeChange(e) {
    const idx = +e.detail.value;
    this.setData({ formAgeIndex: idx, formAge: idx === 0 ? '' : AGE_OPTIONS[idx] });
  },
  onFormTypeChange(e) {
    const idx = +e.detail.value;
    this.setData({ formTypeIndex: idx, formType: PET_TYPES[idx].id });
  },

  onSavePet() {
    const { formName, formGender, formBreed, formColor, formAge, formType, editingPetId } = this.data;
    if (!formName.trim()) {
      wx.showToast({ title: '请填写宠物名字', icon: 'none' }); return;
    }
    if (!formGender) {
      wx.showToast({ title: '请选择性别', icon: 'none' }); return;
    }
    const pet = {
      ...(editingPetId != null ? { id: editingPetId } : {}),
      petName: formName.trim(),
      petGender: formGender,
      petBreed: formBreed.trim(),
      petColor: formColor.trim(),
      petAge: formAge,
      type: formType,
    };
    savePet(pet);
    this.setData({ showPetForm: false });
    this._loadPets();
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  onDeletePet(e) {
    const { id } = e.currentTarget.dataset;
    const pet = this.data.pets.find(p => p.id == id);
    wx.showModal({
      title: '删除宠物',
      content: `确认删除「${pet?.petName || '该宠物'}」的档案？`,
      confirmText: '删除',
      confirmColor: '#E05050',
      success: (res) => {
        if (res.confirm) {
          deletePet(id);
          this._loadPets();
        }
      },
    });
  },

  // 从档案直接进入算命（跳过填写表单）
  onStartFortuneFromPet(e) {
    const { id } = e.currentTarget.dataset;
    const pet = this.data.pets.find(p => p.id == id);
    if (!pet) return;
    getApp().globalData.petInfo = {
      petName: pet.petName,
      petGender: pet.petGender,
      petBreed: pet.petBreed || '',
      petColor: pet.petColor || '',
      petAge: pet.petAge || '',
    };
    wx.navigateTo({
      url: `/pages/pet-quiz/index?type=${pet.type}&mode=destiny&skipForm=1`,
    });
  },

  // ──────── 算命记录 ────────

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
