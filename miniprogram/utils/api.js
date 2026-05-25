const env = require('./env');
const { buildPrompts } = require('./prompts');

// ============================================================
//  callFortune — 直接从客户端调 DeepSeek，绕过云函数 3s 限制
// ============================================================
async function callFortune(params) {
  const { petType, petName, petAge, petGender, petBreed, petColor, mode, quizAnswers } = params;

  const { system, user } = buildPrompts(
    petType,
    { petName, petAge, petGender, petBreed, petColor, quizAnswers },
    mode || 'daily'
  );

  console.log('[DeepSeek] 开始调用，user prompt 前100字:', user.slice(0, 100));

  const res = await new Promise((resolve, reject) => {
    wx.request({
      url: 'https://api.deepseek.com/chat/completions',
      method: 'POST',
      timeout: 30000,
      header: {
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: 'deepseek-chat',
        max_tokens: 2500,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user   },
        ],
      },
      success: resolve,
      fail:    reject,
    });
  });

  console.log('[DeepSeek] statusCode:', res.statusCode);

  if (res.statusCode !== 200) {
    const msg = res.data?.error?.message || `HTTP ${res.statusCode}`;
    throw new Error(msg);
  }

  const raw = res.data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('DeepSeek 返回内容为空');

  console.log('[DeepSeek] 返回成功，内容长度:', raw.length);
  console.log('[DeepSeek] 原始内容前200字:', raw.slice(0, 200));

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('返回内容中找不到 JSON：' + raw.slice(0, 100));
  const fortuneData = JSON.parse(match[0]);

  // 异步存档（不阻塞 UI，失败也无所谓）
  wx.cloud.callFunction({
    name: 'aiProxy',
    data: {
      action: 'saveRecord',
      petType, petName, petBreed, petGender,
      mode: mode || 'daily',
      result: fortuneData,
    },
  }).catch(e => console.warn('[DB] saveRecord failed:', e.message));

  return fortuneData;
}

// ============================================================
//  checkUsage — 查剩余次数（云函数，快）
// ============================================================
async function checkUsage() {
  const res = await wx.cloud.callFunction({
    name: 'aiProxy',
    data: { action: 'checkUsage' },
  });
  return res.result;
}

// ============================================================
//  getRecords — 历史记录
// ============================================================
async function getRecords() {
  const res = await wx.cloud.callFunction({
    name: 'aiProxy',
    data: { action: 'getRecords' },
  });
  return res.result;
}

module.exports = { callFortune, checkUsage, getRecords };
