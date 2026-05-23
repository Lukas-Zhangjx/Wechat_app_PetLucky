const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const router = express.Router();

// 简单内存存储（生产环境替换为 CloudBase / MongoDB）
const usageStore = new Map();
const FREE_LIMIT = 5;

/**
 * 计算本次计费周期的起始时间（每日12:00）
 */
function getPeriodStart() {
  const now = new Date();
  const today12 = new Date(now);
  today12.setHours(12, 0, 0, 0);
  if (now < today12) today12.setDate(today12.getDate() - 1);
  return today12.getTime();
}

// POST /api/login
router.post('/login', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: '缺少 code' });

  try {
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code',
      },
      timeout: 5000,
    });

    const { openid, errmsg } = wxRes.data;
    if (!openid) {
      console.error('wx login error:', errmsg);
      return res.status(401).json({ error: '微信登录失败' });
    }

    const token = jwt.sign({ openid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    console.error('login error:', e.message);
    res.status(500).json({ error: '登录服务异常' });
  }
});

// POST /api/check-usage
router.post('/check-usage', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ remaining: FREE_LIMIT });

  try {
    const token = authHeader.slice(7);
    const { openid } = jwt.verify(token, process.env.JWT_SECRET);
    const periodStart = getPeriodStart();
    const key = `${openid}:${periodStart}`;
    const count = usageStore.get(key) || 0;
    res.json({ remaining: Math.max(0, FREE_LIMIT - count) });
  } catch (e) {
    res.json({ remaining: FREE_LIMIT });
  }
});

/**
 * @param {string} openid
 * @returns {{ allowed: boolean, remaining: number }}
 */
function checkAndDeduct(openid) {
  const periodStart = getPeriodStart();
  const key = `${openid}:${periodStart}`;
  const count = usageStore.get(key) || 0;
  if (count >= FREE_LIMIT) return { allowed: false, remaining: 0 };
  usageStore.set(key, count + 1);
  return { allowed: true, remaining: FREE_LIMIT - count - 1 };
}

module.exports = { router, checkAndDeduct };
