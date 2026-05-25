const KUAILE_B64 = require('./fonts/kuaile-b64.js');

App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-d1goyubq4d03c7f9e',
      traceUser: true,
    });

    this._ensureFontFile();
  },

  // 确保字体文件写入本地，供各页面调用 loadFont()
  _ensureFontFile() {
    const fs = wx.getFileSystemManager();
    // DevTools 返回 http://usr，真机返回 wxfile://usr
    const rawBase = wx.env.USER_DATA_PATH;
    const fontPath = rawBase + '/kuaile.woff2';
    console.log('[Font] 字体路径:', fontPath);

    const onFileReady = () => {
      // 存到 globalData，供各页面取用
      this.globalData.fontPath = fontPath;
      this.loadFont(); // 首次加载
    };

    fs.access({
      path: fontPath,
      success: () => { console.log('[Font] 文件已存在'); onFileReady(); },
      fail: () => {
        fs.writeFile({
          filePath: fontPath,
          data: KUAILE_B64,
          encoding: 'base64',
          success: () => { console.log('[Font] 写入成功'); onFileReady(); },
          fail: (e) => console.error('[Font] 写入失败', JSON.stringify(e)),
        });
      },
    });
  },

  // 注册字体到当前渲染层，页面 onLoad / onShow 可重复调用
  loadFont(cb) {
    const fontPath = this.globalData.fontPath;
    if (!fontPath) return;

    // DevTools 虚拟路径 http://usr → 同时尝试 wxfile://usr 兜底
    const tryLoad = (path, fallback) => {
      wx.loadFontFace({
        family: 'KuaiLe',
        source: `url("${path}")`,
        scopes: ['webview', 'native'],
        success: (r) => {
          console.log('[Font] 加载成功 ✓', path, r.status);
          cb && cb();
        },
        fail: (e) => {
          console.warn('[Font] 路径失败:', path, JSON.stringify(e));
          if (fallback) tryLoad(fallback, null);
        },
      });
    };

    const altPath = fontPath.replace('http://usr', 'wxfile://usr');
    tryLoad(fontPath, altPath !== fontPath ? altPath : null);
  },

  globalData: {
    remaining: 5,
    lastResult: null,
    fontPath: null,
  },
});
