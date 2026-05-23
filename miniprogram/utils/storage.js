const STORAGE_KEY_RECORDS = 'fortune_records';
const MAX_RECORDS = 30;

/**
 * @param {{ petType: string, petName: string, data: object }} record
 */
function saveFortuneRecord(record) {
  let records = [];
  try {
    records = wx.getStorageSync(STORAGE_KEY_RECORDS) || [];
  } catch (e) {
    records = [];
  }

  records.unshift({
    id: Date.now(),
    petType: record.petType,
    petName: record.petName,
    fortuneType: record.data.fortune_type,
    rarity: record.data.rarity,
    dailyFortune: record.data.daily_fortune,
    createdAt: new Date().toISOString(),
    data: record.data,
  });

  if (records.length > MAX_RECORDS) {
    records = records.slice(0, MAX_RECORDS);
  }

  try {
    wx.setStorageSync(STORAGE_KEY_RECORDS, records);
  } catch (e) {
    console.error('Failed to save fortune record:', e);
  }
}

/**
 * @returns {Array}
 */
function getFortuneRecords() {
  try {
    return wx.getStorageSync(STORAGE_KEY_RECORDS) || [];
  } catch (e) {
    return [];
  }
}

module.exports = { saveFortuneRecord, getFortuneRecords };
