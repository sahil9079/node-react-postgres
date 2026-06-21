import '@testing-library/jest-dom';

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () {},
  };
};

const localStorageMock = {
  store: {},
  getItem: function (key) { return this.store[key] || null; },
  setItem: function (key, value) { this.store[key] = value; },
  removeItem: function (key) { delete this.store[key]; },
  clear: function () { this.store = {}; },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
