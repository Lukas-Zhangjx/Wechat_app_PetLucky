const express = require('express');
const OpenAI = require('openai');
const jwt = require('jsonwebtoken');
const { buildPrompts } = require('../utils/prompts');
const { checkAndDeduct } = require('./auth');

const router = express.Router();

const client = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.QWEN_API_KEY,
});

const FALLBACK = {
  rarity: 'R',
  fortune_type: '神秘未知型',
  description: '本仙的水晶球短暂失去连接……但你的命格，必定与众不同。',
  daily_fortune: 3,
  lucky_snack: '神秘零食',
  lucky_color: '米白',
  lucky_color_hex: '#FFF8EE',
  do_list: ['静心等待', '保持好奇', '信任直觉'],
  dont_list: ['过于急躁', '胡乱猜测', '错过当下'],
  fortune_sign: '水晶球暂时沉默，但宇宙从未停止运转。',
};

// POST /api/fortune
router.post('/fortune', async (req, res) => {
  const authHeader = req.headers.authorization;
  let openid = 'anonymous';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      openid = payload.openid;
    } catch (e) {
      return res.status(401).json({ error: 'Token 无效' });
    }
  }

  const { allowed, remaining } = checkAndDeduct(openid);
  if (!allowed) {
    return res.status(429).json({ error: '今日次数已用完，明日12:00恢复', remaining: 0 });
  }

  const { petType, petName, petAge, petGender, petBreed, imageBase64 } = req.body;

  if (!petType) return res.status(400).json({ error: '缺少宠物类型' });

  const { system, user } = buildPrompts(petType, { petName, petAge, petGender, petBreed });

  const userContent = imageBase64
    ? [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: user },
      ]
    : user;

  try {
    const response = await client.chat.completions.create({
      model: 'qwen-vl-plus',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
    });

    const raw = response.choices[0].message.content;
    let fortuneData;
    try {
      // 提取 JSON（防止模型多输出文字）
      const match = raw.match(/\{[\s\S]*\}/);
      fortuneData = JSON.parse(match ? match[0] : raw);
    } catch (e) {
      console.error('JSON parse failed, using fallback. Raw:', raw);
      fortuneData = FALLBACK;
    }

    res.json({ ...fortuneData, remaining });
  } catch (e) {
    console.error('AI call failed:', e.message);
    res.json({ ...FALLBACK, remaining });
  }
});

module.exports = router;
