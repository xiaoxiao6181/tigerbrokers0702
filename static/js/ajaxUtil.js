/**
 * jQuery AJAX 封装（对接 ThinkPHP 接口 code=1 成功）
 */
(function enforceAccessOrder() {
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var publicPages = ['pass.html', 'login.html', 'reg.html'];
  var isPublicPage = publicPages.indexOf(page) !== -1;
  var code = localStorage.getItem('code');
  var token = localStorage.getItem('token');

  if (!code) {
    if (page !== 'pass.html') {
      location.href = './pass.html';
    }
    return;
  }

  if (page === 'pass.html') {
    location.href = './login.html';
    return;
  }

  if (!token && !isPublicPage) {
    location.href = './login.html';
    return;
  }

  if (token && (page === 'login.html' || page === 'pass.html')) {
    location.href = './user.html';
    return;
  }
})();

var baseConfig = window.baseConfig || {};
// 优先 Cloudflare 域名；微软静态托管必须用绝对后端地址
baseConfig.baseUrl = (window.__API_BASE__ || baseConfig.baseUrl || 'https://admin.tig66.cyou').replace(/\/$/, '');
baseConfig.timeout = baseConfig.timeout || 15000;
baseConfig.headers = baseConfig.headers || {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  token: window.localStorage.getItem('token') || ''
};
window.baseConfig = baseConfig;

var mediaUrl = window.mediaUrl;
var normalizeUploadHtml = window.normalizeUploadHtml;

function isApiSuccess(res) {
  if (!res || res.code === undefined || res.code === null) return true;
  return res.code === 1 || res.code === 200 || res.code === '1' || res.code === '200';
}

/**
 * jQuery 1.9：.then() 返回的新 promise 没有 .catch()，包装后支持 .then().catch() 链式调用
 */
function makeChainable(promise) {
  if (!promise || typeof promise.then !== 'function') {
    return promise;
  }
  return {
    then: function (onFulfilled, onRejected) {
      return makeChainable(promise.then(onFulfilled, onRejected));
    },
    catch: function (onRejected) {
      return makeChainable(promise.then(null, onRejected));
    },
    finally: function (onFinally) {
      return makeChainable(promise.always(function () {
        if (onFinally) {
          onFinally();
        }
      }));
    },
    fail: function (onRejected) {
      return makeChainable(promise.fail(onRejected));
    },
    always: function (fn) {
      return makeChainable(promise.always(fn));
    },
    done: function (fn) {
      return makeChainable(promise.done(fn));
    }
  };
}

window.AjaxUtil = (function ($) {
  const loading = {
    show(text) {
      if (!document.querySelector('#ajax-loading')) {
        const div = document.createElement('div');
        div.id = 'ajax-loading';
        div.style.cssText =
          'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
          'padding:10px 20px;background:rgba(0,0,0,0.7);color:#fff;border-radius:4px;z-index:9999';
        div.innerHTML = text || '加载中...';
        document.body.appendChild(div);
      }
    },
    hide() {
      const el = document.querySelector('#ajax-loading');
      if (el) el.remove();
    }
  };

  function requestInterceptor(config) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Token = token;
      config.headers.token = token;
    }
    config.url = baseConfig.baseUrl + config.url;
    return config;
  }

  function parseBusinessResponse(data) {
    // jQuery 已解析 JSON：{ code, info, data }
    var res = data;
    if (res && (res.code === 5001 || res.code === '5001')) {
      localStorage.removeItem('token');
      location.href = './login.html';
      throw res;
    }
    if (!isApiSuccess(res)) {
      console.warn('业务错误：', res && (res.info || res.msg || res));
      throw res;
    }
    return res;
  }

  function errorHandler(jqXHR, textStatus) {
    var error = jqXHR || {};
    var message = '请求失败，请稍后重试';
    var status = error.status;
    if (status) {
      switch (status) {
        case 401:
          message = '未登录或登录已过期';
          localStorage.removeItem('token');
          location.href = './login.html';
          break;
        case 403:
          message = '没有权限访问';
          break;
        case 404:
          message = '接口不存在，请检查 config.js 中 API 地址';
          break;
        case 500:
          message = '服务器内部错误';
          break;
      }
    } else if (textStatus === 'timeout') {
      message = '请求超时';
    } else if (textStatus === 'abort') {
      message = '请求已取消';
    } else if (!status) {
      message = '无法连接接口（跨域或网络），请检查 API 域名与 CORS';
    }
    console.error(message, error);
  }

  function request(options) {
    const config = {
      ...baseConfig,
      ...options,
      headers: { ...baseConfig.headers, ...(options.headers || {}) }
    };
    const processedConfig = requestInterceptor(config);
    const data = processedConfig.data || {};
    const method = (processedConfig.method || processedConfig.type || 'GET').toUpperCase();
    const showLoading = data.loadingShow || (method !== 'GET' && !data.loadingHide);
    if (showLoading) {
      loading.show();
    }

    var deferred = $.Deferred();
    $.ajax(processedConfig)
      .done(function (data) {
        try {
          deferred.resolve(parseBusinessResponse(data));
        } catch (err) {
          deferred.reject(err);
        }
      })
      .fail(function (jqXHR, textStatus) {
        errorHandler(jqXHR, textStatus);
        deferred.reject(jqXHR);
      })
      .always(function () {
        if (showLoading) {
          loading.hide();
        }
      });

    return makeChainable(deferred.promise());
  }

  return {
    get(url, params = {}, options = {}) {
      return request({ url, method: 'GET', data: params, ...options });
    },
    post(url, data = {}, options = {}) {
      return request({
        url,
        method: 'POST',
        data: JSON.stringify(data),
        ...options
      });
    },
    postForm(url, data = {}, options = {}) {
      const formData = new FormData();
      Object.keys(data).forEach((key) => formData.append(key, data[key]));
      return request({
        url,
        method: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        ...options
      });
    },
    abort(xhr) {
      if (xhr && xhr.abort) xhr.abort();
    },
    loading,
    mediaUrl,
    normalizeUploadHtml,
    preloadImage: window.preloadImage,
    preloadImages: window.preloadImages,
    setImgSrc: window.setImgSrc,
    applySiteConfig: window.applySiteConfig
  };
})(jQuery);

$.ajaxSetup({
  headers: {
    Token: localStorage.getItem('token') || ''
  }
});

function loadSiteConfig(res) {
  if (!res || !res.data) return;
  try {
    localStorage.setItem('config', JSON.stringify(res.data));
  } catch (e) {}
  if (typeof applySiteConfig === 'function') {
    applySiteConfig(res.data);
  }
}

// 启动时探测可用 API（国内优先 Cloudflare，失败自动切换）
if (typeof probeApiBase === 'function') {
  probeApiBase()
    .then(function (res) {
      if (window.baseConfig) {
        window.baseConfig.baseUrl = window.__API_BASE__;
      }
      loadSiteConfig(res);
    })
    .catch(function (err) {
      console.error('probeApiBase failed', err);
      // 兜底再请求一次当前 base
      AjaxUtil.get('/index/index/getConfigInfo', { loadingHide: true }).then(loadSiteConfig, function (e) {
        console.error('getConfigInfo failed', e);
      });
    });
} else {
  AjaxUtil.get('/index/index/getConfigInfo', { loadingHide: true })
    .then(loadSiteConfig, function (err) {
      console.error('getConfigInfo failed', err);
    });
}

try {
  var cachedConfig = JSON.parse(localStorage.getItem('config') || 'null');
  var cachedRaw = localStorage.getItem('config') || '';
  if (
    cachedRaw.indexOf(':801') >= 0 ||
    cachedRaw.indexOf('azurestaticapps.net') >= 0 ||
    cachedRaw.indexOf('web.core.windows.net') >= 0 ||
    cachedRaw.indexOf('tig78.shop') >= 0
  ) {
    localStorage.removeItem('config');
    cachedConfig = null;
  }
  if (cachedConfig && typeof applySiteConfig === 'function') {
    applySiteConfig(cachedConfig);
  }
} catch (e) {}

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    $(document).trigger('pageRestored');
  }
});

function isValidAlphanumeric(str) {
  return /^[0-9a-zA-Z]+$/.test(str);
}
