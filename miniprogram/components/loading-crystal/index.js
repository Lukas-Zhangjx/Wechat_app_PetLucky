const { getLoadingTexts } = require('../../utils/prompts');

Component({
  properties: {
    visible: { type: Boolean, value: false },
    petType: { type: String, value: '' },
  },

  data: {
    currentText: '喵仙道人正在观星中...✨',
    textIndex: 0,
  },

  observers: {
    visible(val) {
      if (val) {
        this._startLoop();
      } else {
        this._stopLoop();
      }
    },
  },

  lifetimes: {
    detached() {
      this._stopLoop();
    },
  },

  methods: {
    _startLoop() {
      const texts = getLoadingTexts(this.properties.petType);
      this.setData({ currentText: texts[0], textIndex: 0 });
      this._timer = setInterval(() => {
        const next = (this.data.textIndex + 1) % texts.length;
        this.setData({ textIndex: next, currentText: texts[next] });
      }, 2000);
    },

    _stopLoop() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    },
  },
});
