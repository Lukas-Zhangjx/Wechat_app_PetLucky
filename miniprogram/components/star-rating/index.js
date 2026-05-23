Component({
  properties: {
    value: { type: Number, value: 0 },
    max: { type: Number, value: 5 },
    size: { type: String, value: 'normal' },
  },

  data: {
    stars: [],
  },

  observers: {
    'value, max'(value, max) {
      const stars = Array.from({ length: max }, (_, i) => ({
        filled: i < value,
        index: i,
      }));
      this.setData({ stars });
    },
  },
});
