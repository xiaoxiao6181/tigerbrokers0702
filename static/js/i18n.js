const I18n = {
  currentLang: 'zh-CN',
  translations: {},
  _fallbackTranslations: {},
  defaultLang:'zh-CN',
  // 初始化
  init: function(lang = 'zh-CN') {
    this.currentLang = lang;
    return this.loadLanguage(lang);
  },
  
  // 加载语言文件
  loadLanguage: function(lang='zh-CN') {
    const self = this;
    const cacheKey = 'i18n_cache_' + lang;
    const fallbackCacheKey = 'i18n_cache_' + this.defaultLang;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        self.translations = JSON.parse(cached);
        self.applyTranslations();
      }
      if (lang !== this.defaultLang) {
        const fallbackCached = localStorage.getItem(fallbackCacheKey);
        if (fallbackCached) {
          self._fallbackTranslations = JSON.parse(fallbackCached);
        }
      }
    } catch (e) {}

    const loadFallback = lang !== this.defaultLang
      ? $.getJSON(`./lang/${this.defaultLang}.json`).then(function(translations) {
          self._fallbackTranslations = translations;
          try {
            localStorage.setItem(fallbackCacheKey, JSON.stringify(translations));
          } catch (e) {}
        })
      : $.Deferred().resolve().promise();

    return loadFallback.then(function() {
      return $.getJSON(`./lang/${lang}.json`);
    }).then(function(translations) {
      self.translations = translations;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(translations));
      } catch (e) {}
      self.applyTranslations();
      return translations;
    }).fail(function(error) {
      console.error(`Failed to load language: ${lang}`, error);
      if (lang !== self.defaultLang) {
        return self.loadLanguage(self.defaultLang);
      }
    });
  },
  
  // 获取翻译 - 支持嵌套对象访问
  t: function(key, params = {}) {
    const keys = key.split('.');
    let text = keys.reduce((obj, k) => {
      return obj && typeof obj === 'object' ? obj[k] : undefined;
    }, this.translations);

    if (text === undefined && this.currentLang !== this.defaultLang) {
      text = keys.reduce((obj, k) => {
        return obj && typeof obj === 'object' ? obj[k] : undefined;
      }, this._fallbackTranslations || {});
    }
    
    if (text === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    if (typeof text === 'string') {
      Object.keys(params).forEach(param => {
        const placeholder = new RegExp(`\\{${param}\\}`, 'g');
        text = text.replace(placeholder, params[param]);
      });
    }
    
    return text;
  },
  
  // 应用翻译到页面
  applyTranslations: function() {
    console.log('Applying translations to index page...');
    
    // 翻译所有带有 data-i18n 属性的元素
    $('[data-i18n]').each((index, element) => {
      const $element = $(element);
      const key = $element.data('i18n');
      const params = $element.data('i18n-params') ? JSON.parse($element.data('i18n-params')) : {};
      $element.text(this.t(key, params));
    });
    
    // 翻译所有带有 data-i18n-placeholder 属性的输入框
    $('[data-i18n-placeholder]').each((index, element) => {
      const $element = $(element);
      const key = $element.data('i18n-placeholder');
      $element.attr('placeholder', this.t(key));
    });
    
    // 翻译所有带有 data-i18n-title 属性的元素
    $('[data-i18n-title]').each((index, element) => {
      const $element = $(element);
      const key = $element.data('i18n-title');
      $element.attr('title', this.t(key));
    });
    
    // 修复按钮翻译 - 使用 text() 而不是 val()
    $('[data-i18n-value]').each((index, element) => {
      const $element = $(element);
      const key = $element.data('i18n-value');
      const translation = this.t(key);
      
      // 对于按钮元素，使用 text()
      if (element.tagName === 'BUTTON') {
        $element.text(translation);
      } else {
        // 对于输入框，使用 val()
        $element.val(translation);
      }
    });
    
    // 翻译所有带有 data-i18n-html 属性的元素
    $('[data-i18n-html]').each((index, element) => {
      const $element = $(element);
      const key = $element.data('i18n-html');
      $element.html(this.t(key));
    });
  },
  
  // 切换语言（首页不需要切换器，但保留方法）
  changeLanguage: function(lang) {
    if (this.currentLang === lang) return;
    
    this.loadLanguage(lang).then(() => {
      this.currentLang = lang;
      localStorage.setItem('preferredLanguage', lang);
      $(document).trigger('languageChanged', [lang]);
    });
  },
  
  // 获取当前语言
  getCurrentLanguage: function() {
    return this.currentLang;
  }
};