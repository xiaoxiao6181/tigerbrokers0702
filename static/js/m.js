$(document).ready(function(e) {


});
var ctype = "k";
var ccout;


function getkl() {
    if ($(".trade-chart-type.stock").hasClass("active")) {
        ctype = "k";
    }
    if ($(".trade-chart-type.line").hasClass("active")) {
        ctype = "l";
    }
}
function startPricePolling() {
    clearTimeout(ccout);
    ccout = setTimeout(getonedata, 1000);
}

$(function() {
    autoHeight();
    getMaindata(ctype);
})
setInterval(function() {
    getklines();
}, 1000);

function getklines() {
    var nowdate = new Date();
    var s = nowdate.getSeconds();

    if (s === 0) {
        getMaindata(ctype);
    }
}
//cc=function(){
//  ccout=setTimeout("getonedata()",1000);
//}
var obj = {
    start: 0,
    end: 100
}
var minQiya, maxQiya;
$(window).resize(function(e) {
    autoHeight();
})
$(window).load(function(e) {
    // autoHeight();
});

//时间戳转成时：分：00形式   1700以来的秒数（非毫秒）
function getDateHM(tm) {
    NWh = new Date(parseInt(tm) * 1000).getHours(tm);
    NWm = new Date(parseInt(tm) * 1000).getMinutes(tm);
    if (NWh < 10) {
        NWh = "0" + NWh;
    }
    if (NWm < 10) {
        NWm = "0" + NWm;
    }
    var tt = NWh + ":" + NWm
    return tt;
}
//alert(getDateHM('1499096200'))

//自动高度
function autoHeight() {
    var headerbarH = $(".headerbar").height();
    var headerH = $("header").height();
    var NavH = $("nav").height();
    var tradebarH = $(".trade_bar").height();
    var ecBarH = $("#ecBar").height();
    var WinHss = $(window).height();
    $("footer").height(WinHss - headerbarH - headerH - NavH - tradebarH - ecBarH);
    $("#ecKx").height(WinHss - headerbarH - headerH - NavH - tradebarH - ecBarH);
}

function change_chart_period(type) {
    $(".trade-chart-period").each(function(i, e) {
        if ($(this).hasClass(type)) {
            $(this).siblings(".trade-chart-period").removeClass("active");
            $(this).addClass("active");
        }
    })

    getMaindata(ctype);
}
//点击切换K先跟走势
function change_chart_type(type) {
    if (type == "stock") {
        ctype = "k";
    } else {
        ctype = "l";
    }
    getMaindata(ctype);
}



function splitData(rawData) {
    var categoryData = [];
    var values = [];
    for (var i = 0; i < rawData.length; i++) {
        categoryData.push(getDateHM(rawData[i][0]));
        values.push(rawData[i].slice(1));
    }
    return {
        categoryData: categoryData,
        values: values
    };
}

function calculateMA(dayCount) {
    var result = [];
    for (var i = 0, len = data0.values.length; i < len; i++) {
        if (i < dayCount) {
            result.push('-');
            continue;
        }
        var sum = 0;
        for (var j = 0; j < dayCount; j++) {
            sum += Number(data0.values[i - j][1]);
        }
        result.push(sum / dayCount);
    }
    //alert(result)
    return result;
}

function kTl(KDS) {
    K2line = new Array();
    for (p = 0; p < KDS.length; p++) {
        K2line.push(KDS[p][3])
        if (p == KDS.length - 1) {
            K2line[p] = KDS[p][1];
        }
    }
    //alert(JSON.stringify(K2line))
    return K2line;
}

function calculateMA2(numb, dts) {
    var result2 = [];
    for (var y = 0, len = dts.length; y < len; y++) {
        if (y < numb) {
            result2.push('-');
            continue;
        }
        var sum = 0;
        for (var jj = 0; jj < numb; jj++) {
            sum += Number(dts[y - jj]);
        }
        result2.push(sum / numb);
    }
    //alert(result)
    return result2;
}

function funPoor(ds) {
    fPoor = new Array();
    for (x = 0; x < ds.length; x++) {
        fPoor.push(ds[x][1])
    }
    return fPoor;
}
//求数的差
function getPoor(d) {
    nPoor = new Array();
    nPoor.push("-");
    for (i = 0; i < d.length; i++) {
        if (i > 0) {
            nPoor.push((d[i] - d[i - 1]).toString())
        }
    }
    return nPoor;
}

var cldata;

//AJAX请求
function getMaindata(ctype) {

    if (ctype == "k") {
        $(".trade-chart-type.stock").addClass("active");
        $(".trade-chart-type.line").removeClass("active");
    }
    if (ctype == "l") {
        $(".trade-chart-type.stock").removeClass("active");
        $(".trade-chart-type.line").addClass("active");
    }
    Vtype = $(".trade-chart-period.active").text().trim();
	console.log(Vtype)
    switch (Vtype) {
        case "1M":
            interval = "1";
            break;
        case "5M":
            interval = "5";
            break;
        case "15M":
            interval = "15";
            break;
        case "30M":
            interval = "30";
            break;
        case "1H":
            interval = "60";
            break;
        case "1D":
            interval = "d";
            break;
    }
    //ajax    
    clearTimeout(ccout);
	const options={
		"pid": order_pid,
		"num": 60,
		"interval": interval
	}
	console.log(AjaxUtil)
	AjaxUtil.get('/index/index/getkdata',options).then(res => {
		if (!res || res.code != 1 || !res.data || !res.data.items || !res.data.items.length) {
			return;
		}
		let jdatadata = res.data;
		localStorage.setItem("data", JSON.stringify(jdatadata));
		gotoecharts(jdatadata, true);
		startPricePolling();
		getonedata();
		const lastItem = jdatadata.items[jdatadata.items.length - 1];
		minQiya = Math.min(parseFloat(lastItem[3]), parseFloat(lastItem[2]));
		maxQiya = Math.max(parseFloat(lastItem[4]), parseFloat(lastItem[2]));
	}).catch(function(err) {
		console.error('getkdata failed', err);
	});
    // $.ajax({
    //     url: "/index/index/getkdata",
    //     type: "get",
    //     dataType: "json",
    //     async: true,
    //     contentType: "application/json",
    //     data: {
    //         "pid": order_pid,
    //         "num": 60,
    //         "interval": interval
    //     },
    //     success: function(_jdatadata) {

    //         var jdatadata = jQuery.parseJSON(Base64.decode(_jdatadata));

    //         localStorage.setItem("data", '');
    //         localStorage.setItem("data", JSON.stringify(jdatadata));
    //         gotoecharts(jdatadata)
    //         ccout = setTimeout("getonedata()", 1000);
    //         getonedata();
    //         minQiya = jdatadata.items[jdatadata.items.length - 1][2];
    //         maxQiya = jdatadata.items[jdatadata.items.length - 1][3];
    //     },
    //     error: function(data) {

    //     }
    // })

}
/*
 */

build_diff_data = function(m_short, m_long, data) {
    var result = [];
    var pre_emashort = 0;
    var pre_emalong = 0;
    for (var i = 0, len = data.length; i < len; i++) {
        var ema_short = data[i][1];
        var ema_long = data[i][1];

        if (i != 0) {
            ema_short = (1.0 / m_short) * data[i][1] + (1 - 1.0 / m_short) * pre_emashort;
            ema_long = (1.0 / m_long) * data[i][1] + (1 - 1.0 / m_long) * pre_emalong;
        }

        pre_emashort = ema_short;
        pre_emalong = ema_long;
        var diff = ema_short - ema_long;

        result.push(diff);
    }

    return result;
}

build_dea_data = function(m, diff) {
    var result = [];
    var pre_ema_diff = 0;
    for (var i = 0, len = diff.length; i < len; i++) {
        var ema_diff = diff[i];

        if (i != 0) {
            ema_diff = (1.0 / m) * diff[i] + (1 - 1.0 / m) * pre_ema_diff;
        }
        pre_ema_diff = ema_diff;

        result.push(ema_diff);
    }

    return result;
}

build_macd_data = function(data, diff, dea) {
    var result = [];

    for (var i = 0, len = data.length; i < len; i++) {
        var macd = 2 * (diff[i] - dea[i]);
        result.push(macd);
    }

    return result;
}


/*
 */

function gotoecharts(data, fullReload) {
    if (!data || !data.items || !data.items.length) {
        return;
    }

    var ecKxId = document.getElementById("ecKx");
    if (!ecKxId) {
        return;
    }
    var ecKx = echarts.getInstanceByDom(ecKxId);
    if (ecKx === undefined) {
        ecKx = echarts.init(ecKxId);
    }


    //$(".header-item").text(JSON.stringify(data.items[data.items.length-1]))
    $("header .now").text(data.topdata.now);

    cldata = data.topdata.now;

    $("footer").data("nowk", cldata);

    $("header .open").text(data.topdata.open);
    $("header .lowest").text(data.topdata.lowest);
    $("header .highest").text(data.topdata.highest);
    $("#container .txt1 span.a").text(getDateHM(data.topdata.topdata) + ":00");
    $("#container .txt1 span.b").text(data.topdata.now);
    $("#container .txt1 span.c").text(data.topdata.open);
    $("#container .txt1 span.d").text(data.topdata.lowest);
    $("#container .txt1 span.e").text(data.topdata.highest);



    var diff = build_diff_data(12, 26, data.items);
    var dea = build_dea_data(9, diff);
    var macd = build_macd_data(data.items, diff, dea);
    diffL = diff.length - 1;
    deaL = dea.length - 1;
    macdL = macd.length - 1;
    $("#container .txt2 span.a i").text(diff[diffL].toFixed(4));
    $("#container .txt2 span.b i").text(dea[deaL].toFixed(4));
    $("#container .txt2 span.c i").text(macd[macdL].toFixed(4));


    if (data.topdata.state == "up") {
        $("header .ng-binding").removeClass("fall").addClass("rise")
    }
    if (data.topdata.state == "down") {
        $("header .ng-binding").addClass("fall").removeClass("rise")
    }
    data0 = splitData(data.items);
    var ecKdata = {
        //animation: false,
        backgroundColor: 'rgb(25, 25, 26)',
        legend: {
            show: false,
        },
        tooltip: {
            show: false,
        },
        grid: [{
                top: 5 + '%',
                bottom: 30 + '%',
                left: 4 + '%',
                right: 0 + '%',
                height: 55 + '%',
                containLabel: true,
            },
            {
                top: 75 + '%',
                bottom: 0 + '%',
                left: 2 + '%',
                right: 0 + '%',
                height: 25 + '%',
                containLabel: true,
            },
        ],
        xAxis: [{
                gridIndex: 0,
                type: 'category',
                data: data0.categoryData,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                /*axisLabel: {
                    textStyle: { color: 'rgb(100, 100, 100)' },
                    formatter: function (value, index) {
                        if (value>0) {
                            var time = value.split(" ")[0];
                            var split = time.split("-");
                            return split[1] + "/" + split[2];
                        }
                        else {
                            var time = value.split(" ")[1];
                            var split = time.split(":");
                            return split[0] + ":" + split[1];
                        }
                    }   
                },*/

            },
            {
                gridIndex: 1,
                type: 'category',
                data: data0.categoryData,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    show: false,
                },
            },
        ],
        yAxis: [{
                gridIndex: 0,
                position: "right",
                scale: true,
                axisLabel: {
                    textStyle: { color: 'rgb(100, 100, 100)' },
                    formatter: function(value, index) {
                        return value.toFixed(5);
                    }
                },
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: 'rgb(35, 34, 38)',
                    }
                }
            },
            {
                gridIndex: 1,
                position: "right",
                scale: true,

                axisLabel: {
                    textStyle: { color: 'rgb(100, 100, 100)' },
                    formatter: function(value, index) {
                        if (value >= 0) {
                            return "+" + value.toFixed(4);
                        }
                        return value.toFixed(4);
                    }
                },
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                splitLine: { show: false }
            },
        ],
        dataZoom: [{
            xAxisIndex: [0, 1],
            type: 'inside'
        }, ],
        series: [{
                name: 'line',
                type: 'line',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: data0.categoryData,
                showSymbol: false,
                lineStyle: {
                    normal: {
                        width: 1,
                        color: 'rgb(253, 209, 42)',
                    }
                },
                animationDuration: 0,


                markPoint: {
                    symbol: "rect",
                    animation: false,
                    symbolSize: [60, 18],
                    symbolOffset: [-20, 0],
                    animationDuration: 0,
                    data: [{
                        name: '最新价',
                        x: '100%',
                        yAxis: data.topdata.now,
                        value: data.topdata.now,
                        label: {
                            normal: {
                                show: true,
                                position: [0, 1],
                                textStyle: {
                                    color: "#FFFFFF",
                                }
                            }
                        },
                        formatter: function(value, index) {
                            return value.toFixed(5);
                        },
                    }]
                },
                markLine: {
                    symbolSize: 0,
                    animationDuration: 0,
                    symbol: '',
                    label: {
                        normal: {
                            show: false,
                        }
                    },
                    lineStyle: {
                        normal: {
                            type: 'dashed',
                            width: 1,
                        },
                    },
                    data: [{ yAxis: data.topdata.now }, ]
                },
            },
            {
                name: 'stick',
                xAxisIndex: 0,
                yAxisIndex: 0,
                type: 'candlestick',
                data: data0.values,
                animationDuration: 0,
                itemStyle: {
                    normal: {
                        color: 'rgb(25, 25, 26)',
                        color0: 'rgb(19, 233, 236)',
                        borderColor: 'rgb(250, 46, 66)',
                        borderColor0: 'rgb(19, 233, 236)',
                        barGap: '100%',
                    }
                }
            },
            {
                name: 'ma5',
                type: 'line',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: calculateMA(5),
                smooth: true,
                showSymbol: false,
                animationDuration: 0,
                lineStyle: {
                    normal: {
                        width: 1
                    }
                }
            },
            {
                name: 'ma10',
                type: 'line',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: calculateMA(10),
                smooth: true,
                showSymbol: false,
                animationDuration: 0,
                lineStyle: {
                    normal: {
                        width: 1,
                        color: '#86da2b'
                    }
                }
            },
            {
                name: 'ma20',
                type: 'line',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: calculateMA(20),
                smooth: true,
                showSymbol: false,
                animationDuration: 0,
                lineStyle: {
                    normal: {
                        width: 1,
                        color: '#ff5382'
                    }
                }
            },
            {
                name: 'ma30',
                type: 'line',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: calculateMA(30),
                smooth: true,
                showSymbol: false,
                animationDuration: 0,
                lineStyle: {
                    normal: {
                        width: 1,
                        color: '#3d8ef6'
                    }
                }
            },
            {
                name: 'diff',
                type: 'line',
                data: diff,
                smooth: true,
                showSymbol: false,
                xAxisIndex: 1,
                yAxisIndex: 1,
                animationDuration: 0,
                lineStyle: {
                    normal: {
                        width: 1,
                        color: '#00ffff'
                    }
                }
            },
            {
                name: 'dea',
                type: 'line',
                data: dea,
                smooth: true,
                showSymbol: false,
                xAxisIndex: 1,
                yAxisIndex: 1,
                animationDuration: 0,
                lineStyle: {
                    normal: {
                        width: 1,
                        color: '#fe337f'
                    }
                }
            },
            {
                name: 'macd',
                type: 'bar',
                xAxisIndex: 1,
                yAxisIndex: 1,
                animationDuration: 0,
                itemStyle: {
                    normal: {
                        color: 'rgb(31, 198, 91)',
                        borderColor: 'black',
                    }
                },
                data: macd,
            },
        ]
    };
    var ecKdata2 = {
        legend: {
            //data: ['日K', 'MA5', 'MA10', 'MA20', 'MA30']
        },
        /*
            tooltip: {
                trigger: 'axis'
            },
*/
        grid: [{
                left: 20,
                right: 70,
                top: '5%',
                bottom: 180
            },
            {
                left: 20,
                right: 70,
                bottom: 60,
                height: 60
            }
        ],
        xAxis: [{
                type: 'category',
                data: data0.categoryData,
                scale: true,
                boundaryGap: true,
                splitLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLine: {
                    show: false,
                    lineStyle: {
                        color: '#5f5f5f'
                    }
                },
                min: 'dataMin',
                max: 'dataMax',
                //show:false
            },
            {
                gridIndex: 1,
                type: 'category',
                data: data0.categoryData,
                scale: true,
                boundaryGap: true,
                //axisLine: {onZero: false},
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                min: 'dataMin',
                max: 'dataMax',
                show: false
            }
        ],
        yAxis: [{
                type: 'value',
                position: "right",
                scale: true,
                splitNumber: 5,
                boundaryGap: false,
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#292929'
                    }
                },
                axisLine: {
                    show: false,
                    lineStyle: {
                        color: '#5f5f5f'
                    }
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    show: true,
                    formatter: function(value, index) {
                        return value.toFixed(5)
                    }
                },
                max: 'dataMax',
                min: 'dataMin'

            },
            {
                gridIndex: 1,
                position: "right",
                scale: true,
                splitNumber: 3,
                boundaryGap: false,
                splitLine: { show: false },
                axisLine: {
                    show: false,
                    onZero: true,
                    lineStyle: {
                        color: '#5f5f5f'
                    }
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    show: true,
                    formatter: function(value, index) {

                        if (value > 0) {
                            return "+" + value.toFixed(5)
                        }
                        if (value < 0) {
                            return value.toFixed(5)
                        }
                        if (value == 0) {
                            return '-' + value.toFixed(5)
                        }
                    }
                },
                max: 'dataMax',
                min: 'dataMin'
            }
        ],
        dataZoom: [{
                type: 'inside',
                xAxisIndex: [0, 1],
                start: obj.start,
                end: obj.end
            },
            {
                show: false,
                xAxisIndex: [0, 1],
                type: 'slider',
                top: '1%',
                start: 30,
                end: 50
            }
        ],
        series: [{
                name: '日K',
                type: 'line',
                data: kTl(data.items),
                markLine: {
                    data: [
                        { yAxis: data.topdata.now }
                    ],
                    symbol: '',
                    lineStyle: {
                        normal: {
                            color: '#c23531',
                        }

                    },
                    label: {
                        normal: {
                            formatter: '{c}'
                        }
                    },
                    animationDuration: 0
                },
                smooth: false,
                symbol: 'none',
                sampling: 'average',
                itemStyle: {
                    normal: {
                        color: 'rgb(255, 70, 131)'
                    }
                },
                lineStyle: {
                    normal: {
                        width: 2,
                        color: "#d2c01e"
                    }
                },
                areaStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#474019'
                        }, {
                            offset: 1,
                            color: '#262922'
                        }])
                    }
                },
                animationDuration: 0

            },
            {
                xAxisIndex: 1,
                yAxisIndex: 1,
                name: 'MACD',
                type: 'bar',
                data: macd, //
                smooth: true,
                symbolSize: 1,
                animationDuration: 0,
                itemStyle: {
                    normal: {
                        color: 'rgba(31,198,98,1)'
                    }
                }
            },
            {
                xAxisIndex: 1,
                yAxisIndex: 1,
                name: 'diff', //快
                type: 'line',
                data: diff,
                smooth: true,
                animationDuration: 0,
                symbolSize: 1,
                lineStyle: {
                    normal: {
                        color: "#13E9EC"
                    }
                }
            },
            {
                xAxisIndex: 1,
                yAxisIndex: 1,
                name: 'dea',
                type: 'line',
                data: dea, //慢
                smooth: true,
                animationDuration: 0,
                symbolSize: 1,
                lineStyle: {
                    normal: {
                        color: "#FA2E42"
                    }
                }
            }

        ]
    };
    if (fullReload) {
        ecKx.clear();
    }
    if (ctype == "k") {
        ecKx.setOption(ecKdata, !fullReload);
    } else {
        ecKx.setOption(ecKdata2, !fullReload);
    }

    ecKx.on("datazoom", function(param) {
        obj = param.batch[0];
        // ecKx.setOption(ecKdata);
    })
    ecKxId = null;


}
//calculateMA2(5,)
//
function getonedata() {
    clearTimeout(ccout);

    var dataStr = localStorage.getItem("data");
    if (!dataStr) {
        startPricePolling();
        return;
    }

    var data;
    try {
        data = JSON.parse(dataStr);
    } catch (e) {
        startPricePolling();
        return;
    }

    if (!data || !data.items || !data.items.length) {
        startPricePolling();
        return;
    }

	AjaxUtil.get('/index/index/getProductPrice', { pid: order_pid, loadingHide: true }).then(res => {
        if (!res || res.code != 1 || !res.data) {
            return;
        }
		var onedata = {
			close: res.data.Close,
			highest: res.data.High,
			lowest: res.data.Low,
			now: res.data.Price,
			open: res.data.Open,
			topdata: Math.floor(new Date().getTime() / 1000)
		};
		$('#jk').html(res.data.Price);
		$('#Close').text(res.data.Close);
		$('#High').text(res.data.High);
		$('#Low').text(res.data.Low);
		$('#Open').text(res.data.Open);
		tempmy(onedata, data);
	}).catch(function(err) {
        console.error('getProductPrice failed', err);
    }).always(function() {
        startPricePolling();
    });
}

function tempmy(onedata, data) {
    if (!data || !data.items || !data.items.length || !onedata) {
        return;
    }

    var lastIndex = data.items.length - 1;
    var lastItem = data.items[lastIndex];
    var nowPrice = parseFloat(onedata.now);
    if (isNaN(nowPrice)) {
        return;
    }

    if (!data.topdata) {
        data.topdata = {};
    }

    var prevNow = parseFloat(data.topdata.now);
    data.topdata.now = nowPrice;
    data.topdata.open = onedata.open;
    data.topdata.close = onedata.close;
    data.topdata.lowest = onedata.lowest;
    data.topdata.highest = onedata.highest;
    data.topdata.topdata = onedata.topdata;

    if (!isNaN(prevNow)) {
        if (nowPrice > prevNow) {
            data.topdata.state = "up";
        } else if (nowPrice < prevNow) {
            data.topdata.state = "down";
        }
    }

    lastItem[2] = nowPrice;
    minQiya = Math.min(isNaN(minQiya) ? nowPrice : minQiya, nowPrice, parseFloat(lastItem[3]));
    maxQiya = Math.max(isNaN(maxQiya) ? nowPrice : maxQiya, nowPrice, parseFloat(lastItem[4]));
    lastItem[3] = minQiya;
    lastItem[4] = maxQiya;

    if (ctype == "l") {
        if (!window.K2line || !window.K2line.length) {
            window.K2line = kTl(data.items);
        }
        window.K2line[lastIndex] = nowPrice;
    }

    localStorage.setItem("data", JSON.stringify(data));
    gotoecharts(data, false);

    newprice = nowPrice;
    var old_price = $('.data-price').html();
    if (old_price * 10 < newprice * 10) {
        $('.data-price').removeClass('fall');
        $('.data-price').addClass('rise');
    } else if (old_price * 10 > newprice * 10) {
        $('.data-price').addClass('fall');
        $('.data-price').removeClass('rise');
    }
    $('.data-price').html(newprice);
    $('.col-nowprice').html(newprice);
    $('.newprice').html(newprice);
}


setInterval(function() {
    getMaindata(ctype);
}, 60000);