// 注：图片生成已改为直接使用用户上传照片，无需轮询

/** 稀有度 → badge class 映射 */
const RARITY_CLASS = { SSR: 'badge--ssr', SR: 'badge--sr', R: 'badge--r' };
/** 稀有度 → hero 卡片背景 class 映射 */
const HERO_CLASS = { SSR: 'fortune-hero--ssr', SR: 'fortune-hero--sr', R: 'fortune-hero--r' };

const FALLBACK_RESULT = {
  daily: {
    rarity: 'R',
    fortune_type: '水晶球信号丢失·本仙正在重启中型',
    description: '本仙掐指一算，符纸被风吹跑了……但你的宠物今日命格必定与众不同，本仙感觉到了（真的）。',
    morning: '早上起来先别急，今日属于"慢热启动型"——慢慢来，喝点水，伸个懒腰，好运在等你完全清醒。',
    afternoon: '下午是今日最旺时段！"要零食"这件事成功率比平时高300%，务必把握此黄金时机。',
    evening: '晚上适合和主人深度情感交流，也就是黏着TA不放。今晚月亮能量加持，多卖萌必有收获。',
    daily_fortune: 3,
    lucky_snack: '神秘零食（本仙也不知道是啥，反正很好吃）',
    lucky_color: '米白',
    lucky_color_hex: '#FFF8EE',
    lucky_timing: '主人刚吃完饭犯困的那15分钟',
    pop_culture_ref: '今日命格相当于《哈利波特》预言课老师——说了很多，没人全听懂，但其实都对了',
    do_list: ['撒娇（今日成功率翻倍）', '找阳光角落发呆充电', '用眼神感化一切'],
    dont_list: ['在重要时刻搞破坏', '对着空气狂叫', '假装听不见主人叫名字'],
    fortune_sign: '命运之轮今日暂停，但零食之轮永不停歇。',
  },
  destiny: {
    rarity: 'R',
    fortune_type: '天机未泄·本仙水晶球暂时罢工但TA命格必定不凡型',
    character_reading: '此子命格深藏，本仙感受到一股"我就是与众不同"的气场扑面而来。天机不可泄露太多，但有一点可以确定——TA绝对不是普通宠物。',
    life_stages: [
      { stage: '幼年期（0-1岁）', title: '懵懂萌新·舔舔一切就是我', reading: '刚来到这个世界，对所有事物充满好奇。见什么咬什么，嗅什么都是宝。与主人的缘分在此阶段迅速升温，主人被萌得失去理智，成为终身铲屎官。' },
      { stage: '青年期（1-3岁）', title: '热血青春·我是宇宙中心', reading: '命格进入全面爆发期，精力无限，探索欲达到顶峰。会经历第一道坎，但凭借天生魅力总能转危为安。主人对你的爱在此阶段经受考验并得到升华。' },
      { stage: '壮年期（3-7岁）', title: '人生巅峰·威望如日中天', reading: '命格最稳定的时期。已深谙与主人相处之道，该撒娇时撒娇，该装酷时装酷，把主人拿捏得死死的。社会地位达到顶峰。' },
      { stage: '晚年期（7岁+）', title: '功成名就·岁月静好型', reading: '命格进入收获期，享受多年积累的宠爱与信任。任务是：好好休息，多晒太阳，偶尔卖个惨让主人心疼。与主人的情感在岁月中愈发深厚。' },
    ],
    pop_culture_ref: '整体命格相当于《狮子王》辛巴——天生王者，经历波折，最终走向属于自己的荣耀之巅',
    obstacles: ['第一坎：幼年期可能经历短暂环境变化，需适应新家', '第二坎：中年期会遇到一次健康小挑战，多注意饮食', '第三坎：晚年需要更多关爱，与主人相处模式会迎来新变化'],
    strengths: ['天生亲和力爆表，见谁都能迅速拿下', '感知能力超强，主人情绪一变立刻感应', '治愈系光环，存在本身就是一种幸福'],
    bond_with_owner: '此生与主人缘分天注定，两者相遇是宇宙级别的安排。主人治愈你的孤独，你治愈主人的世界。',
    fortune_sign: '命途虽未全明，缘分已深种；此生无需问天意，安心做自己便是最好的命格。',
  },
};

Page({
  data: {
    result: null,
    petType: '',
    petName: '',
    petEmoji: '🐾',
    petImg: '',
    generatedImg: '',   // 用户上传的真实照片
    mode: 'daily',
    rarityClass: 'badge--r',
    heroClass: 'fortune-hero--r',
  },

  onLoad() {
    getApp().loadFont();
    const app = getApp();
    const payload = app.globalData.lastResult;
    if (!payload) {
      wx.navigateBack();
      return;
    }

    const mode = payload.mode || 'daily';
    const result = payload.result || FALLBACK_RESULT[mode];
    this.setData({
      result,
      petType: payload.petType || '',
      petName: payload.petName || '',
      petEmoji: payload.petEmoji || '🐾',
      petImg: payload.petImg || '/images/pet_dog.png',
      generatedImg: payload.userPhoto || '',  // 用户上传的真实照片
      mode,
      rarityClass: RARITY_CLASS[result.rarity] || 'badge--r',
      heroClass: HERO_CLASS[result.rarity] || 'fortune-hero--r',
    });
  },

  onRetry() {
    wx.navigateBack();
  },

  onShareResult() {
    wx.showToast({ title: '长按截图即可分享 📸', icon: 'none', duration: 2500 });
  },

  onShareAppMessage() {
    const { result, petName } = this.data;
    return {
      title: `${petName}是【${result?.fortune_type}】命格！快来测测你的毛孩子～`,
      path: '/pages/index/index',
    };
  },
});
