/**
 * API 根地址 + 图片 URL 工具（须在 ajaxUtil.js 之前加载）
 *
 * 微软静态托管没有后端；国内部分网络访问海外直连 IP（tig78.shop）会失败。
 * 优先使用 Cloudflare 域名 admin.tig66.cyou，并支持多地址自动切换。
 */
(function (global) {
  // Cloudflare 域名（国内可达性更好）
  var PRIMARY_API_BASE = 'https://admin.tig66.cyou';
  // 备用：前台同源代理 / 海外直连
  var API_CANDIDATES = [
    'https://admin.tig66.cyou',
    'https://qt.tig66.cyou',
    'https://tig78.shop'
  ];

  function stripSlash(url) {
    return String(url || '').replace(/\/$/, '');
  }

  function isFrontendOnlyHost(host) {
    if (!host) return false;
    host = String(host).toLowerCase();
    return (
      /azurestaticapps\.net$/i.test(host) ||
      /web\.core\.windows\.net$/i.test(host) ||
      /blob\.core\.windows\.net$/i.test(host) ||
      /azureedge\.net$/i.test(host) ||
      /cloudapp\.azure\.com$/i.test(host) ||
      /github\.io$/i.test(host) ||
      /pages\.dev$/i.test(host) ||
      /netlify\.app$/i.test(host) ||
      /vercel\.app$/i.test(host)
    );
  }

  function isKnownApiHost(host) {
    if (!host) return false;
    host = String(host).toLowerCase().replace(/:\d+$/, '');
    return (
      host === 'admin.tig66.cyou' ||
      host === 'qt.tig66.cyou' ||
      host === 'tig78.shop'
    );
  }

  function currentPageOrigin() {
    try {
      if (typeof location !== 'undefined' && location.protocol && location.host) {
        return stripSlash(location.protocol + '//' + location.host);
      }
    } catch (e) {}
    return '';
  }

  function normalizeApiBase(url) {
    if (!url) return '';
    url = stripSlash(String(url).trim());
    if (!url) return '';

    // 旧地址统一
    url = url.replace(/^https?:\/\/tig78\.shop:\d+/i, 'https://tig78.shop');
    url = url.replace(/^http:\/\/tig78\.shop$/i, 'https://tig78.shop');
    url = url.replace(/^http:\/\/admin\.tig66\.cyou/i, 'https://admin.tig66.cyou');
    url = url.replace(/^http:\/\/qt\.tig66\.cyou/i, 'https://qt.tig66.cyou');

    if (url.charAt(0) === '/') {
      return PRIMARY_API_BASE;
    }

    try {
      var parsed = new URL(url);
      if (isFrontendOnlyHost(parsed.hostname)) {
        return PRIMARY_API_BASE;
      }
      var page = currentPageOrigin();
      if (page && stripSlash(url) === page && !isKnownApiHost(parsed.hostname)) {
        return PRIMARY_API_BASE;
      }
      if (!isKnownApiHost(parsed.hostname)) {
        return PRIMARY_API_BASE;
      }
    } catch (e) {
      return PRIMARY_API_BASE;
    }

    return url;
  }

  function isBadCachedApiBase(url) {
    if (!url) return true;
    if (/:801\b/i.test(url)) return true;
    if (isFrontendOnlyHost((url.match(/https?:\/\/([^/:]+)/i) || [])[1] || '')) return true;
    var n = normalizeApiBase(url);
    if (!n) return true;
    try {
      var host = new URL(n).hostname;
      var page = currentPageOrigin();
      if (page && n === page && !isKnownApiHost(host)) return true;
      // 海外直连对国内不稳定：若缓存是 tig78.shop，优先清掉改走 Cloudflare
      if (host === 'tig78.shop') return true;
    } catch (e) {
      return true;
    }
    return false;
  }

  var fromStorage = '';
  try {
    fromStorage = global.localStorage.getItem('apiBaseUrl') || '';
    if (isBadCachedApiBase(fromStorage)) {
      fromStorage = '';
      global.localStorage.removeItem('apiBaseUrl');
    } else {
      fromStorage = normalizeApiBase(fromStorage);
    }
  } catch (e) {}

  var base = normalizeApiBase(fromStorage || global.__API_BASE__ || PRIMARY_API_BASE) || PRIMARY_API_BASE;
  if (isBadCachedApiBase(base)) {
    base = PRIMARY_API_BASE;
  }

  function setApiBase(next) {
    base = stripSlash(normalizeApiBase(next) || PRIMARY_API_BASE);
    global.__API_BASE__ = base;
    global.baseConfig = global.baseConfig || {};
    global.baseConfig.baseUrl = base;
    try {
      global.localStorage.setItem('apiBaseUrl', base);
    } catch (e) {}
    return base;
  }

  setApiBase(base);

  function mediaUrl(path) {
    if (!path) return '';
    var p = String(path).trim();
    if (!p || p === '#') return '';

    // 图片也统一走当前可用 API 域名，避免 logo 仍指向海外直连域名
    p = p.replace(/^https?:\/\/tig78\.shop(?::\d+)?/i, base);
    p = p.replace(/^https?:\/\/admin\.tig66\.cyou(?::\d+)?/i, base);
    p = p.replace(/^https?:\/\/qt\.tig66\.cyou(?::\d+)?/i, base);

    var idx = p.lastIndexOf('/upload/');
    if (idx >= 0) {
      return base + p.substring(idx).split(/[\s'"?#]/)[0];
    }

    if (/^https?:\/\//i.test(p)) {
      if (base.indexOf('https://') === 0 && /^http:\/\//i.test(p)) {
        return 'https://' + p.substring(7);
      }
      return p;
    }

    if (p.indexOf('//') === 0) {
      return (base.indexOf('https://') === 0 ? 'https:' : 'http:') + p;
    }

    if (p.charAt(0) !== '/') p = '/' + p;
    return base + p;
  }

  function normalizeUploadHtml(html) {
    if (!html) return '';
    var s = String(html);
    s = s.replace(/https?:\/\/[^/]+\/upload\//gi, base + '/upload/');
    s = s.replace(/(["'(])\/upload\//gi, '$1' + base + '/upload/');
    return s;
  }

  function preloadImage(url) {
    return new Promise(function (resolve) {
      if (!url) {
        resolve('');
        return;
      }
      var img = new Image();
      var done = function () { resolve(url); };
      img.onload = done;
      img.onerror = done;
      img.src = url;
    });
  }

  function preloadImages(urls) {
    var list = [];
    if (!urls) return Promise.resolve([]);
    if (typeof urls === 'string') {
      list = [urls];
    } else if (urls.length !== undefined) {
      for (var i = 0; i < urls.length; i++) {
        if (urls[i]) list.push(urls[i]);
      }
    }
    if (!list.length) return Promise.resolve([]);
    return Promise.all(list.map(preloadImage));
  }

  function resolveElement(target) {
    if (!target) return null;
    if (target.jquery) return target[0];
    if (typeof target === 'string') return document.querySelector(target);
    return target.nodeType ? target : null;
  }

  function setImgSrc(target, path) {
    var url = mediaUrl(path);
    var el = resolveElement(target);
    if (!url || !el) {
      return Promise.resolve();
    }
    el.classList.add('img-loading');
    return preloadImage(url).then(function () {
      el.src = url;
      el.classList.remove('img-loading');
      el.classList.add('img-loaded');
    });
  }

  function applySiteConfig(data) {
    if (!data || typeof data !== 'object') return;
    if (data.service) {
      var links = document.querySelectorAll('.t_span.four, .kefu, #service');
      for (var i = 0; i < links.length; i++) {
        links[i].setAttribute('href', data.service);
      }
    }
    var noticeEl = document.getElementById('notice');
    if (noticeEl && data.notice) {
      noticeEl.textContent = data.notice;
    }
    var logo = data.login_img || data.logo_img || data.app_img || '';
    if (logo) {
      setImgSrc('.t_logo img', logo);
      setImgSrc('.f_mine_header', logo);
    }
  }

  /**
   * 探测可用 API：国内优先 Cloudflare，失败再换备用
   */
  function probeApiBase(candidates) {
    var list = (candidates && candidates.length ? candidates : API_CANDIDATES).slice();
    // 当前已选地址放到最前
    if (base && list.indexOf(base) === -1) {
      list.unshift(base);
    } else if (base) {
      list = [base].concat(list.filter(function (x) { return x !== base; }));
    }

    function tryOne(i) {
      if (i >= list.length) {
        return Promise.reject(new Error('all api endpoints failed'));
      }
      var candidate = stripSlash(list[i]);
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        var timer = setTimeout(function () {
          try { xhr.abort(); } catch (e) {}
          reject(new Error('timeout'));
        }, 6000);
        xhr.open('GET', candidate + '/index/index/getConfigInfo', true);
        xhr.timeout = 6000;
        xhr.onreadystatechange = function () {
          if (xhr.readyState !== 4) return;
          clearTimeout(timer);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var json = JSON.parse(xhr.responseText || '{}');
              if (json && (json.code === 1 || json.code === 200 || json.code === '1')) {
                setApiBase(candidate);
                resolve(json);
                return;
              }
            } catch (e) {}
          }
          reject(new Error('bad status ' + xhr.status));
        };
        xhr.onerror = function () {
          clearTimeout(timer);
          reject(new Error('network'));
        };
        xhr.send();
      }).catch(function () {
        return tryOne(i + 1);
      });
    }

    return tryOne(0);
  }

  (function injectImageStyles() {
    if (document.getElementById('page-media-style')) return;
    var style = document.createElement('style');
    style.id = 'page-media-style';
    style.textContent = 'img.img-loading{opacity:0;transition:opacity .25s ease}img.img-loaded,img:not(.img-loading){opacity:1}';
    document.head.appendChild(style);
  })();

  global.__API_BASE__ = base;
  global.API_CANDIDATES = API_CANDIDATES;
  global.setApiBase = setApiBase;
  global.probeApiBase = probeApiBase;
  global.mediaUrl = mediaUrl;
  global.normalizeUploadHtml = normalizeUploadHtml;
  global.preloadImage = preloadImage;
  global.preloadImages = preloadImages;
  global.setImgSrc = setImgSrc;
  global.applySiteConfig = applySiteConfig;
})(window);
