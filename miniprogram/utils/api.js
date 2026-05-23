/**
 * @param {object} params
 * @returns {Promise<object>}
 */
async function callFortune(params) {
  const res = await wx.cloud.callFunction({
    name: 'aiProxy',
    data: { action: 'fortune', ...params },
  });
  if (res.result.error) throw new Error(res.result.error);
  return res.result;
}

/**
 * @returns {Promise<{ remaining: number }>}
 */
async function checkUsage() {
  const res = await wx.cloud.callFunction({
    name: 'aiProxy',
    data: { action: 'checkUsage' },
  });
  return res.result;
}

/**
 * @returns {Promise<{ records: Array }>}
 */
async function getRecords() {
  const res = await wx.cloud.callFunction({
    name: 'aiProxy',
    data: { action: 'getRecords' },
  });
  return res.result;
}

module.exports = { callFortune, checkUsage, getRecords };
