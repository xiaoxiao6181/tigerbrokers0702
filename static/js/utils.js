function maskString(str) {
    if (typeof str !== 'string') return str;
    
    if (str.length <= 8) {
        return str; // 如果字符串长度小于等于8，直接返回原字符串
    }
    
    const firstFour = str.substring(0, 4);
    const lastFour = str.substring(str.length - 4);
    const middleStars = '*'.repeat(str.length - 8);
    
    return firstFour + middleStars + lastFour;
}

async function  getUserInfo () {
    let res = await AjaxUtil.get('/index/user/getUserInfo', { loadingHide: true })
	if(res.code==1) {
	  userInfo  =  res.data.user
	  window.localStorage.setItem('userInfo', JSON.stringify(userInfo))
	  return userInfo
	} else {
	  console.log(res.info)
	  window.location.href = './login.html'
	}

}

function getPreferredLang() {
	return localStorage.getItem('preferredLanguage') || 'zh-CN';
}

function getCachedUserInfo() {
	try {
		return JSON.parse(localStorage.getItem('userInfo') || 'null');
	} catch (e) {
		return null;
	}
}

function initPageWithData(fetchFn, renderFn) {
	var lang = getPreferredLang();
	var i18nTask = typeof I18n !== 'undefined' ? I18n.init(lang) : Promise.resolve();
	var dataTask = typeof fetchFn === 'function' ? fetchFn() : fetchFn;
	return Promise.all([i18nTask, dataTask]).then(function(results) {
		if (typeof renderFn === 'function') {
			renderFn(results[1]);
		}
	});
}

async function loadSiteConfig() {
	const cached = localStorage.getItem('config');
	if (cached) {
		try {
			return JSON.parse(cached);
		} catch (e) {}
	}
	const res = await AjaxUtil.get('/index/index/getConfigInfo', { loadingHide: true });
	if (res && res.code == 1 && res.data) {
		localStorage.setItem('config', JSON.stringify(res.data));
		return res.data;
	}
	return {};
}

function parseCashTimeToMs(timeStr) {
	if (!timeStr) return null;
	const parts = String(timeStr).trim().split(':');
	if (parts.length < 2) return null;
	const hours = parseInt(parts[0], 10);
	const minutes = parseInt(parts[1], 10);
	if (isNaN(hours) || isNaN(minutes)) return null;
	const now = new Date();
	return new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		hours,
		minutes,
		0,
		0
	).getTime();
}

function isWithinCashTime(cashStart, cashEnd) {
	if (!cashStart || !cashEnd) return true;
	const start = parseCashTimeToMs(cashStart);
	const end = parseCashTimeToMs(cashEnd);
	if (start === null || end === null) return true;
	const now = Date.now();
	return now >= start && now <= end;
}

function getCashTimeLimitMessage(cashStart, cashEnd) {
	return '提现时间为 ' + cashStart + ' 到 ' + cashEnd;
}

function showCashTimeLimitTip(cashStart, cashEnd) {
	msg('温馨提示', getCashTimeLimitMessage(cashStart, cashEnd), 1);
}

function getTodayCashCount(cashList) {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const day = now.getDate();
	if (!Array.isArray(cashList)) {
		return 0;
	}
	return cashList.filter(function(item) {
		if (!item || !item.time) {
			return false;
		}
		const recordTime = new Date(String(item.time).replace(/-/g, '/'));
		if (isNaN(recordTime.getTime())) {
			return String(item.time).slice(0, 10) === (
				year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day
			);
		}
		return recordTime.getFullYear() === year &&
			recordTime.getMonth() + 1 === month &&
			recordTime.getDate() === day;
	}).length;
}

function getCashMaxNumMessage(maxNum) {
	if (typeof I18n !== 'undefined' && I18n.t) {
		return I18n.t('cash.dailyLimitMessage', { count: maxNum });
	}
	return '每日提现限' + maxNum + '次！';
}

function showCashMaxNumTip(maxNum) {
	msg('温馨提示', getCashMaxNumMessage(maxNum), 1);
}

function isCashCountExceeded(todayCount, maxNum) {
	const limit = parseInt(maxNum, 10);
	if (!limit || limit <= 0) {
		return false;
	}
	return parseInt(todayCount, 10) >= limit;
}

function msg(title, content, type, url) {
	$(".tipMask .title").text(title || '温馨提示');
	$(".contents").html(content);
	if (type == 1) {
		var btn = '<div class="confirm guanbi" onclick="$(\'.tipMask\').hide();">确定</div>';
	} else {
		var btn = '<div class="confirm guanbi" onclick="window.location.href=\'' + url + '\'">确定</div>';
	}
	$("#msgBtn").html(btn);
	$(".tipMask").show();
}

function getStatusText(status){
	  if(status==0){
		  return '审核中'
	  }
	  if(status==1){
			return '申请成功'
	  }
	  if(status==2){
			return '申请失败'
	  }
}

