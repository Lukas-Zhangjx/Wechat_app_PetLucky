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
    savingImage: false,
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

  // ───── 生成分享图并保存到相册 ─────
  async onSaveShareImage() {
    if (this.data.savingImage) return;
    this.setData({ savingImage: true });
    try {
      const tempPath = await this._drawShareCard();
      await wx.saveImageToPhotosAlbum({ filePath: tempPath });
      wx.showToast({ title: '已保存到相册 🎉', icon: 'success', duration: 2000 });
    } catch (e) {
      if (e && (e.errMsg || '').includes('auth')) {
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册写入权限',
          confirmText: '去设置',
          success: (r) => { if (r.confirm) wx.openSetting(); },
        });
      } else {
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
      }
    } finally {
      this.setData({ savingImage: false });
    }
  },

  /** 用 2D Canvas 画分享卡片，返回临时文件路径 */
  _drawShareCard() {
    return new Promise((resolve, reject) => {
      const { result, petName, petEmoji, generatedImg, petImg } = this.data;
      const rarity  = result?.rarity || 'R';
      const fType   = result?.fortune_type || '';
      const desc    = result?.description  || '';
      const photoSrc = generatedImg || petImg || '/images/pet_dog.png';

      // 卡片尺寸（px，2 倍清晰度）
      const W = 750, H = 1120;
      const dpr = 2;

      const query = wx.createSelectorQuery();
      query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0] || !res[0].node) { reject(new Error('canvas not found')); return; }
        const canvas = res[0].node;
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // ── 背景渐变 ──
        const RARITY_BG = {
          SSR: ['#FFF9E0', '#FFE080'],
          SR:  ['#F8F0FF', '#DFC8FF'],
          R:   ['#FFF5E4', '#FFDDB8'],
        };
        const [c1, c2] = RARITY_BG[rarity] || RARITY_BG.R;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.roundRect ? ctx.roundRect(0, 0, W, H, 32) : ctx.fillRect(0, 0, W, H);
        ctx.fill();

        // ── 顶部 App 名 ──
        ctx.fillStyle = '#8B6030';
        ctx.font = `bold 38px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🐾 爪爪运', W / 2, 80);
        ctx.font = `26px sans-serif`;
        ctx.fillStyle = '#B08050';
        ctx.fillText('宠物玄学命格解读', W / 2, 122);

        // ── 稀有度 badge ──
        const BADGE_BG = { SSR: '#F5A623', SR: '#9B72D4', R: '#8B9DAF' };
        ctx.fillStyle = BADGE_BG[rarity] || '#8B9DAF';
        const bw = 110, bh = 46, bx = (W - bw) / 2, by = 148;
        this._roundRect(ctx, bx, by, bw, bh, 23);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold 28px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(rarity, W / 2, by + 32);

        const drawTextAndQR = () => {
          // ── 宠物名 ──
          ctx.fillStyle = '#3A2A1A';
          ctx.font = `bold 52px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`${petEmoji} ${petName}`, W / 2, 460);

          // ── 命格名 ──
          ctx.fillStyle = '#5A3A0A';
          ctx.font = `bold 40px sans-serif`;
          this._fillWrappedText(ctx, fType, W / 2, 530, 640, 52);

          // ── 一句描述 ──
          ctx.fillStyle = '#7A5A30';
          ctx.font = `30px sans-serif`;
          const descLine = desc.length > 40 ? desc.slice(0, 40) + '…' : desc;
          this._fillWrappedText(ctx, descLine, W / 2, 650, 660, 42);

          // ── 分割线 ──
          ctx.strokeStyle = 'rgba(180,120,40,0.25)';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(80, 740); ctx.lineTo(W - 80, 740); ctx.stroke();

          // ── 底部 QR 码区域 ──
          ctx.fillStyle = '#9A7040';
          ctx.font = `26px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('扫码给你的宠物算命 👇', W / 2, 800);

          // 尝试加载 QR 码
          const qrImg = canvas.createImage();
          qrImg.onload = () => {
            const qrSize = 200;
            ctx.drawImage(qrImg, (W - qrSize) / 2, 830, qrSize, qrSize);
            ctx.fillStyle = '#B08050';
            ctx.font = `24px sans-serif`;
            ctx.fillText('爪爪运 · 仅供娱乐', W / 2, 1070);
            _toFile();
          };
          qrImg.onerror = () => {
            // 没有 qrcode.png 时跳过
            ctx.fillStyle = '#C8B090';
            ctx.font = `24px sans-serif`;
            ctx.fillText('爪爪运 · 仅供娱乐', W / 2, 880);
            _toFile();
          };
          qrImg.src = '/images/qrcode.png';
        };

        const _toFile = () => {
          wx.canvasToTempFilePath({
            canvas,
            x: 0, y: 0, width: W, height: H,
            destWidth: W, destHeight: H,
            fileType: 'jpg',
            quality: 0.92,
            success: (r) => resolve(r.tempFilePath),
            fail: reject,
          });
        };

        // ── 宠物照片（圆形） ──
        const img = canvas.createImage();
        img.onload = () => {
          const r = 140, cx = W / 2, cy = 310;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
          ctx.restore();
          // 圆形描边
          ctx.strokeStyle = 'rgba(180,120,40,0.4)';
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          drawTextAndQR();
        };
        img.onerror = () => drawTextAndQR(); // 没照片就跳过
        img.src = photoSrc;
      });
    });
  },

  /** 辅助：画圆角矩形路径 */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
    ctx.closePath();
  },

  /** 辅助：自动换行文字 */
  _fillWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';
    let curY = y;
    chars.forEach(ch => {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, curY);
        line = ch;
        curY += lineHeight;
      } else {
        line = test;
      }
    });
    if (line) ctx.fillText(line, x, curY);
  },

  onShareAppMessage() {
    const { result, petName, petEmoji } = this.data;
    const rarity = result?.rarity || '';
    const fortuneType = result?.fortune_type || '神秘命格';
    return {
      title: `${petEmoji}${petName} 测出了${rarity ? '【' + rarity + '】' : ''}命格：${fortuneType}！快来测测你的毛孩子～`,
      path: '/pages/index/index',
      imageUrl: '/images/banner.png',  // 分享卡片封面图
    };
  },
});
