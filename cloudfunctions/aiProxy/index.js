const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const FREE_LIMIT = 5;
const LIMIT_ENABLED = false; // 上线时改为 true

// ---- 工具 ----

function getPeriodStart() {
  const now = new Date();
  const t12 = new Date(now);
  t12.setHours(12, 0, 0, 0);
  if (now < t12) t12.setDate(t12.getDate() - 1);
  return t12.getTime();
}

async function handleCheckUsage(openid) {
  if (!LIMIT_ENABLED) return { remaining: 99 };
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

// 存档 + 扣次数（在 DeepSeek 成功后由客户端调用）
async function handleSaveRecord(openid, event) {
  const { petType, petName, petBreed, petGender, mode, result } = event;

  // 扣次数
  if (LIMIT_ENABLED) {
    const periodStart = getPeriodStart();
    const { data } = await db.collection('user_usage')
      .where({ openid, reset_at: db.command.gte(periodStart) })
      .get();

    if (data.length === 0) {
      await db.collection('user_usage').add({
        data: { openid, count: 1, reset_at: periodStart, updated_at: Date.now() },
      });
    } else {
      const record = data[0];
      if (record.count < FREE_LIMIT) {
        await db.collection('user_usage').doc(record._id).update({
          data: { count: db.command.inc(1), updated_at: Date.now() },
        });
      }
    }
  }

  // 存记录
  await db.collection('fortune_records').add({
    data: {
      openid,
      petType:   petType   || '',
      petName:   petName   || '',
      petBreed:  petBreed  || '',
      petGender: petGender || '',
      mode:      mode      || 'daily',
      result:    result    || {},
      created_at: Date.now(),
    },
  }).catch(e => console.error('Save record failed:', e.message));

  return { ok: true };
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
    case 'saveRecord':  return handleSaveRecord(OPENID, event);
    case 'checkUsage':  return handleCheckUsage(OPENID);
    case 'getRecords':  return handleGetRecords(OPENID);
    default:            return { error: '未知操作' };
  }
};
