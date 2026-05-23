const cloud = require('wx-server-sdk');
const OpenAI = require('openai');
const { buildPrompts } = require('./utils/prompts');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const FREE_LIMIT = 5;

const FALLBACK = {
  rarity: 'R',
  fortune_type: '神秘未知型',
  description: '本仙的水晶球……呃，黄符纸短暂失灵了。但你的命格，必定与众不同。',
  daily_fortune: 3,
  lucky_snack: '神秘零食',
  lucky_color: '米白',
  lucky_color_hex: '#FFF8EE',
  do_list: ['静心等待', '保持好奇', '信任直觉'],
  dont_list: ['过于急躁', '胡乱猜测', '错过当下'],
  fortune_sign: '符纸暂时沉默，但宇宙从未停止运转。',
};

function getPeriodStart() {
  const now = new Date();
  const t12 = new Date(now);
  t12.setHours(12, 0, 0, 0);
  if (now < t12) t12.setDate(t12.getDate() - 1);
  return t12.getTime();
}

async function checkAndDeduct(openid) {
  const periodStart = getPeriodStart();
  const { data } = await db.collection('user_usage')
    .where({ openid, reset_at: db.command.gte(periodStart) })
    .get();

  if (data.length === 0) {
    await db.collection('user_usage').add({
      data: { openid, count: 1, reset_at: periodStart, updated_at: Date.now() },
    });
    return { allowed: true, remaining: FREE_LIMIT - 1 };
  }

  const record = data[0];
  if (record.count >= FREE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  await db.collection('user_usage').doc(record._id).update({
    data: { count: db.command.inc(1), updated_at: Date.now() },
  });
  return { allowed: true, remaining: FREE_LIMIT - record.count - 1 };
}

async function handleFortune(openid, event) {
  const { allowed, remaining } = await checkAndDeduct(openid);
  if (!allowed) {
    return { error: '今日次数已用完，明日12:00恢复', remaining: 0 };
  }

  const { petType, petName, petAge, petGender, petBreed, imageBase64 } = event;
  const { system, user } = buildPrompts(petType, { petName, petAge, petGender, petBreed });

  const client = new OpenAI({
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_API_KEY,
  });

  const userContent = imageBase64
    ? [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: user },
      ]
    : user;

  let fortuneData;
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
    const match = raw.match(/\{[\s\S]*\}/);
    fortuneData = JSON.parse(match ? match[0] : raw);
  } catch (e) {
    console.error('AI or parse error:', e.message);
    fortuneData = FALLBACK;
  }

  // 保存记录
  try {
    await db.collection('fortune_records').add({
      data: {
        openid,
        petType: petType || '',
        petName: petName || '',
        petBreed: petBreed || '',
        petGender: petGender || '',
        result: fortuneData,
        created_at: Date.now(),
      },
    });
  } catch (e) {
    console.error('Save record failed:', e.message);
  }

  return { ...fortuneData, remaining };
}

async function handleCheckUsage(openid) {
  try {
    const periodStart = getPeriodStart();
    const { data } = await db.collection('user_usage')
      .where({ openid, reset_at: db.command.gte(periodStart) })
      .get();
    const count = data[0]?.count || 0;
    return { remaining: Math.max(0, FREE_LIMIT - count) };
  } catch (e) {
    return { remaining: FREE_LIMIT };
  }
}

async function handleGetRecords(openid) {
  try {
    const { data } = await db.collection('fortune_records')
      .where({ openid })
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();
    return { records: data };
  } catch (e) {
    return { records: [] };
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'fortune':     return handleFortune(OPENID, event);
    case 'checkUsage':  return handleCheckUsage(OPENID);
    case 'getRecords':  return handleGetRecords(OPENID);
    default:            return { error: '未知操作' };
  }
};
