// 宠物档案本地存储工具
const KEY = 'bound_pets';

function getPets() {
  try { return wx.getStorageSync(KEY) || []; } catch(e) { return []; }
}

function savePet(pet) {
  const pets = getPets();
  const idx = pets.findIndex(p => p.id === pet.id);
  if (idx >= 0) {
    pets[idx] = { ...pet };
  } else {
    pets.unshift({ ...pet, id: Date.now() });
  }
  wx.setStorageSync(KEY, pets);
  return pets;
}

function deletePet(id) {
  // eslint-disable-next-line eqeqeq — id can be string (from dataset) or number
  const pets = getPets().filter(p => p.id != id);
  wx.setStorageSync(KEY, pets);
  return pets;
}

module.exports = { getPets, savePet, deletePet };
