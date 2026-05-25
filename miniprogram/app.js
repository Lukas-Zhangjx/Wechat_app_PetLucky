const KUAILE_B64 = require('./fonts/kuaile-b64.js');

App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-d1goyubq4d03c7f9e',
      traceUser: true,
    });
    // 首次注册字体
    this.loadFont();
  },

  // 注册字体到当前渲染层，页面 onLoad 可重复调用（多次调用无副作用）
  loadFont(cb) {
    wx.loadFontFace({
      family: 'KuaiLe',
      source: `url("data:font/woff2;charset=utf-8;base64,${KUAILE_B64}")`,
      scopes: ['webview', 'native'],
      success: (r) => {
        console.log('[Font] 加载成功 ✓', r.status);
        cb && cb();
      },
      fail: (e) => {
        console.warn('[Font] 加载失败', JSON.stringify(e));
      },
    });
  },

  globalData: {
    remaining: 5,
    lastResult: null,
    petInfo: null,
    quizAnswers: null,
  },
});
