/**
 * 持仓&历史明细
 */
var resorderlist = [];
var proprice = {};

/** 将分页 data（对象或数组）规范为数组，避免 $.each + splice 产生 undefined */
function normalizeOrderList(data) {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.filter(function (item) {
            return item && typeof item === 'object';
        });
    }
    if (typeof data === 'object') {
        return Object.keys(data).map(function (k) {
            return data[k];
        }).filter(function (item) {
            return item && typeof item === 'object';
        });
    }
    return [];
}
var page = 1;
var ispage = 1;
var is_ajax_list = 0;
var timer_get_price = '';
var timer_orderlist = '';
var listionhajax = '';

//hold_order_list();
// change_category(0);
var _sell_time = 0;
var _ftime = 0;
var html_type = 1;

/**
 * 订单列表
 * @author lukui  2017-07-01
 * @return {[type]} [description]
 */
function hold_order_list() {
    var url = "/index/user/orderlist?page=1&status=0";
	
	AjaxUtil.get(url).then(res=>{
		if(res.code==1){
			resorderlist = normalizeOrderList(res.data && res.data.list && res.data.list.data);
			console.log(resorderlist)
			var timestamp = Date.parse(new Date());
			_ftime = timestamp / 1000;
			// if (resorderlist.length >= 1) {
			//     _ftime = resorderlist[0]['time'];
			// } else {
			//     var timestamp = Date.parse(new Date());
			//     _ftime = timestamp / 1000;
			// }
			//show_order_list();
			timer_get_price = setInterval("get_price()", 1000);
			timer_orderlist = setInterval("show_order_list()", 1000);
		}
	})
    // $.get(url, function(resdata) {
    //     if (resdata) {
    //         resdata = jQuery.parseJSON(Base64.decode(resdata));
    //     }
    //     resorderlist = resdata;
    //     if (resorderlist) {
    //         if (resorderlist.length >= 1) {
    //             _ftime = resorderlist[0]['time'];
    //         } else {
    //             var timestamp = Date.parse(new Date());
    //             _ftime = timestamp / 1000;
    //         }
    //         //show_order_list();
    //         timer_get_price = setInterval("get_price()", 1000);
    //         timer_orderlist = setInterval("show_order_list()", 1000);
    //     }
    // })
}

function get_price() {
	//$.get('/index/index/product');
	
    var url = baseConfig.baseUrl+"/index/user/get_price";
	// AjaxUtil.get(url).then(res=>{
		
	// })
    $.get(url, function(resdata) {
        if (!resdata) {
            proprice = '';
        } else {
            proprice = jQuery.parseJSON(Base64.decode(resdata));
        }
    })
}
/**
 * 订单列表
 * @return {[type]} [description]
 */
function show_order_list() {
    var html = '';
    var list = normalizeOrderList(resorderlist);
    resorderlist = list;

    if (list.length === 0) {
        $('.trade_history_list ul').html(' ');
        return false;
    }
    _ftime++;

    var stillOpen = [];
    $.each(list, function(k, v) {
        if (!v || typeof v !== 'object') return;
        if (typeof v.selltime === 'undefined' || v.selltime === null) {
            v.selltime = 0;
        }
        var _end_time = (v.selltime * 1 - _ftime * 1);
        var endprofit = v.endprofit * 1 || 1;
        var baifenbi = (_end_time / endprofit) * 100;
        var newprice = proprice[v.pid];
        if (newprice === undefined || newprice === null || newprice === '') {
            newprice = v.buyprice;
        }
        if (!_end_time) {
            _end_time = 0;
        }

        if (_end_time >= 0) {
            stillOpen.push(v);
            var chaprice = newprice - v.buyprice;
            var closeprice = 0;
            var closeprice_class = '';
           // console.log(v);
            if (v.ostyle == 0) {
                var ostyle_class = "buytop";
                var ostyle_class2 = 'in_money';
                var ostyle_name = "买涨";
                var endloss=0;
                if (chaprice > 0) {
                	//买涨，赚钱中。
                   // closeprice = v.fee*(100*10+v.endloss*10)/1000;
                   //console.log(v.fee+"++"+endloss);
                   closeprice = v.fee * v.endloss / 100;
                    closeprice_class = 'in_money';
                } else if (chaprice < 0) {
                    // closeprice = v.fee*(-1);
                    closeprice = -(v.fee * v.lossrate)/ 100;
                    closeprice_class = 'out_money';
                } else {
                    closeprice = 0;
                    closeprice_class = '';
                }
            } else {
                var ostyle_class = "buydown";
                var ostyle_name = "买跌";
                var ostyle_class2 = 'out_money';

                if (chaprice < 0) {
                    closeprice =v.fee * v.endloss / 100;
                    closeprice_class = 'in_money';
                } else if (chaprice > 0) {
                    // closeprice = v.fee*(-1);
                    closeprice = -(v.fee * v.lossrate)/ 100;
                    closeprice_class = 'out_money';
                } else {
                    closeprice = 0;
                    closeprice_class = '';
                }

            }

            html += '<li ng-repeat="o" class="">\
                        <section>\
                            <p style="margin: 0">\
                                <span class="ng-binding">' + v.ptitle + '</span>\
                                <span class="ng-binding ' + ostyle_class2 + '"><i class="' + ostyle_class + '"></i>' + ostyle_name + '（￥' + v.fee + '）</span>\
                            </p>\
                            <p style="margin: 0" class="ng-binding">\
                                ' + v.buyprice + '-<span  class="ng-binding ' + closeprice_class + '">' + newprice + '</span>\
                            </p>\
                            <p style="margin: 0" class="ng-binding">' + getLocalTime(v.buytime) + '</p>\
                        </section><section>\
                            <p style="margin: 0px;" class="ng-binding ' + closeprice_class + '">' + closeprice + '</p>\
                            <p style="margin: 0" class="ng-binding">' + formatSeconds2(_end_time) + '</p>\
                        </section>\
                        <article class="">\
                        <span class="move_width" style="width: ' + baifenbi + '%; transition-duration: 1s;">\
                        </span>\
                        <i>\
                            <em></em>\
                        </i>\
                        </article>\
                    </li>';

        }
    });
    resorderlist = stillOpen;
    $('.trade_history_list .slider-left ul').html(html || ' ');
}

/**
 * 切换按钮
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
function change_category(type) {

    $('.slider-right').css('transition-duration', '300ms');
    $('.slider-left').css('transition-duration', '300ms');
    if (type == 0) {
        page = 1;
        get_price();
        hold_order_list()
        $('.uls').html(' ');
        $('.slider-left').css('transform', 'translate(0px, 0px) translateZ(0px)');
        $('.slider-right').css('transform', 'translate(100%, 0px) translateZ(0px)');
        $('.left-table').addClass('active');
        $('.right-table').removeClass('active');
    }

    if (type == 1) {

        clearInterval(timer_get_price);
        clearInterval(timer_orderlist);
        listionhajax = setInterval("listionh()", 1000);
        is_ajax_list = 0;
        orderedlist();
        $('.slider-left').css('transform', 'translate(-100%, 0px) translateZ(0px)');
        $('.slider-right').css('transform', 'translate(0px, 0px) translateZ(0px)');
        $('.right-table').addClass('active');
        $('.left-table').removeClass('active');
    }
}

function orderedlist() {
    if (ispage != 1) {
        return;
    }

    setolist(html_type);
    html_type = 1;
}

function setolist(types) {
    var url = "/index/user/orderlist?status=1&page=" + page;
    var html = '';
    if (is_ajax_list == 1) {
        return;
    }
    is_ajax_list = 1;
	AjaxUtil.get(url).then(res=>{
		if(res.code==1){
			let res_list = normalizeOrderList(res.data && res.data.list && res.data.list.data);
			if (res_list.length == 0) {
			    clearInterval(listionhajax);
			    is_ajax_list = 1;
			    return;
			}
			$.each(res_list, function(k, v) {
			    var closeprice = 0;
			    var closeprice_class = '';
			
			    if (v.ostyle == 0) {
			        var ostyle_class = "buytop";
			        var ostyle_name = "买涨";
			    } else {
			        var ostyle_class = "buydown";
			        var ostyle_name = "买跌";
			    }
			
			    if (v.is_win == 1) {
			        //closeprice = +(v.fee * v.endloss) / 100;
			        closeprice="+"+v.ploss.toFixed(3);
			        closeprice_class = 'in_money';
			    } else if (v.is_win == 2) {
			        // closeprice = v.fee*(-1);
			        closeprice=v.ploss.toFixed(3);
			        //closeprice = -(v.fee * v.lossrate)/ 100;
			        
			        closeprice_class = 'out_money';
			    } else {
			        closeprice = 0;
			        closeprice_class = '';
			    }
			     var cc=closeprice;
			    html += '<li ng-repeat="o" onclick="get_hold_order(' + v.id + ')" >\
			                <section>\
			                    <p>\
			                        <span class="ng-binding">' + v.ptitle + '</span>\
			                        <span  class="ng-binding ' + closeprice_class + '">\
			                        <i  class="' + ostyle_class + '"></i>' + ostyle_name + '（￥' + v.fee + '）</span>\
			                    </p>\
			                    <p class="ng-binding">\
			                        ' + v.buyprice + '-<span  class="ng-binding ' + closeprice_class + '">' + v.sellprice + '</span>\
			                    </p>\
			                    <p class="ng-binding">' + getLocalTime(v.buytime) + '</p>\
			                </section><section>\
			                    <p class="ng-binding ' + closeprice_class + '">' + cc + '</p>\
			                    <p class="ng-binding">' + getLocalTime(v.selltime) + '</p>\
			                </section>\
			            </li>';
			
			})
			if (types == 0) {
			    $('.trade_history_list .slider-right .uls').html(html);
			} else {
			    $('.trade_history_list .slider-right .uls').append(html);
			}
			html = '';
			page++;
			is_ajax_list = 0;
		}
	})
    
}

listionhajax = setInterval("listionh()", 1000);

/**
 * 监听高度
 * @author lukui  2017-07-05
 * @return {[type]} [description]
 */
function listionh() {
    if ($(".uls li:last").attr('ng-repeat')) {
        var ScrollTop = $(".uls li:last").offset().top;

        if (ScrollTop < 1000) {
            setolist(1);
        }
    }

}
function accSubtr(arg1,arg2){
var r1,r2,m,n;
try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0}
try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0}
m=Math.pow(10,Math.max(r1,r2));
//动态控制精度长度
n=(r1>=r2)?r1:r2;
return ((arg1*m-arg2*m)/m).toFixed(n);
} 
//给Number类型增加一个subtr 方法，调用起来更加方便。 
Number.prototype.subtr = function (arg){ 
return accSubtr(arg,this); 
} 
function get_hold_order(oid) {

    var url = "/index/user/get_hold_order?oid=" + oid;
    $.get(url, function(data) {
        data = jQuery.parseJSON(Base64.decode(data));

        $('.order-modal-content .ptitle').html(data.ptitle);
        
        $('.order-modal-content .fangxiang').html(data.ostyle?'买跌/'+data.endprofit+'秒':'买涨/'+data.endprofit+'秒');
        $('.order-modal-content .buyprice').html(data.buyprice);
        $('.order-modal-content .sellprice').html(data.sellprice);
        if(data.sellprice > data.buyprice){
            $('.order-modal-content .fdds').html(accSubtr(data.sellprice,data.buyprice));  
        }else{
            $('.order-modal-content .fdds').html(accSubtr(data.buyprice,data.sellprice));
        }
         $('.order-modal-content .ykbl').html(data.endloss/data.fee*100+'%');
        $('.order-modal-content .ploss').html(data.ploss);
        $('.order-modal-content .buytime').html(getLocalTime(data.buytime));
        $('.order-modal-content .selltime').html(getLocalTime(data.selltime));
        if (data.ploss < 0) {
            $('.order-modal-content .ploss').addClass('fall');
            $('.order-modal-content .ploss').removeClass('rise');
        } else {
            $('.order-modal-content .ploss').removeClass('fall');
            $('.order-modal-content .ploss').addClass('rise');
        }
        $('.modal-backdrop').removeClass('ng-hide');
        $('.modal-backdrop').addClass('active');
        $('.tab-nav').hide();

    })
}

function close_order_modal() {
    $('.modal-backdrop').addClass('ng-hide');
    $('.modal-backdrop').removeClass('active');
    $('.tab-nav').show();
}

function name(params) {
let newpar = parseFloat(params);

let reg = /^[0-9]+.?[0-9]*$/;

if(reg.test(newpar)){
let newNum = newpar.toFixed(3);

return newNum;

}else{
//alert('请输入数字');

return;

}

}
 