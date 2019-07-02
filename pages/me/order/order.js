var app = getApp();
var QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js');
var login = require('../../../utils/login');
var request = require('../../../utils/request.js');
var md5 = require('../../../utils/md5.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabs: [
      { title: '待付款', status: 1 },
      { title: '待发货/未核销', status: 2 },
      { title: '待收货', status: 5 },
      { title: '已完成/已核销', status: 6 },
    ],
    stv: {
      windowWidth: 0,
      lineWidth: 0,
      offset: 0,
      tStart: false
    },
    activeTab: 0,
    current_page: 1,
    windowHeight: 0,
  },
  /**
     * 生命周期函数--监听页面加载
     */
  onShow: function () {
    if (app.globalData.commentSucceed==1){
      this.request(6,1);
      app.globalData.commentSucceed =0
   }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    try {
      let { tabs } = this.data;
      var res = wx.getSystemInfoSync();
      this.windowWidth = res.windowWidth;
      this.data.stv.lineWidth = this.windowWidth / this.data.tabs.length;
      this.data.stv.windowWidth = res.windowWidth;
      this.setData({ stv: this.data.stv })
      this.tabsCount = tabs.length;
    } catch (e) {
    }
    this.request(options.status, 1)
    this._updateSelectedPage(options.index)
    var res = wx.getSystemInfoSync();
    this.setData({ windowHeight: res.windowHeight})
  },

  //请求数据
  request: function (status, current_page) {
    var that = this
    request.request({
      method: 'orderList', data: { status: status, current_page: current_page }, success(res) {
        that.buildPaymentStatus(res.data.list);
        that.setData({
          list: res.data.list,
          host: app.globalData.serverHost,
          status: status,
        })
      }
    });
  },

  //构造支付状态
  buildPaymentStatus: function (list) {
    var timeStamp = (Date.parse(new Date()) / 1000).toString();
    for (var i in list) {
      var now = new Date(list[i].created_at * 1000);
      var y = now.getFullYear(),m = now.getMonth() + 1,d = now.getDate();
      var time = parseInt(timeStamp) - parseInt(list[i].created_at)
      console.log(time)
      if (time > 5400) {
        list[i].paymentStatus = 0
      } else {
        list[i].paymentStatus = 1
      }
      
      list[i].created_at = y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + now.toTimeString().substr(0, 8)
    }
    console.log(list)
    this.setData({
      list: list
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function (e) {
    console.log(134234)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function (e) {
    console.log(134234)
  },

  _updateSelectedPage(page) {
    let { tabs, stv, activeTab } = this.data;
    activeTab = page;
    this.setData({ activeTab: activeTab })
    stv.offset = stv.windowWidth * activeTab;
    this.setData({ stv: this.data.stv })
  },
  //tiao
  handlerTabTap(e) {
    this._updateSelectedPage(e.currentTarget.dataset.index);
    this.request(e.currentTarget.dataset.status, 1);
  },

  toOrderDetail: function (e) {
    var numbers = e.currentTarget.dataset.numbers
    var shop_id = e.currentTarget.dataset.shopid
    var paymentStatus = e.currentTarget.dataset.paymentstatus
  
    wx.navigateTo({
      url: '../orderDetail/orderDetail?numbers=' + numbers + '&shop_id=' + shop_id + '&paymentStatus=' + paymentStatus,
    })
  },

  //取消订单
  removeOrder: function (e) {
    var that = this;
    var numbers = e.currentTarget.dataset.numbers
    var shop_id = e.currentTarget.dataset.shopid
    wx.showModal({
      title: '提示',
      content: '你确定要取消此订单吗？',
      success: function (res) {
        if (res.confirm) {
          request.request({
            method: 'orderCancel', data: { numbers: numbers, shop_id: shop_id }, success(res) {
              console.log(res.data)
              if (res.data.code != 0) {
                wx.showModal({
                  content: res.data.message,
                  showCancel: false
                })
                return;
              }
              that.request(1, 1)
            }
          });

        } else if (res.cancel) {
          console.log('用户点击取消')
        }

      }
    });

  },

  //退款
  refund:function (e){
    var numbers = e.currentTarget.dataset.numbers
    var shop_id = e.currentTarget.dataset.shopid
    wx.redirectTo({
      url: '../refund/refund?numbers=' + numbers + '&shop_id=' + shop_id,
    })
  },


  //确认收货
  recOrder: function (e) {
    var that = this;
    var numbers = e.currentTarget.dataset.numbers
    var shop_id = e.currentTarget.dataset.shopid
    wx.showModal({
      title: '提示',
      content: '你确定已收到宝贝吗？',
      success: function (res) {
        if (res.confirm) {
          request.request({
            method: 'notarizeTakeGoods', data: { numbers: numbers, shop_id: shop_id }, success(res) {
              console.log(res.data)
              if (res.data.code != 0) {
                wx.showModal({
                  content: res.data.message,
                  showCancel: false
                })
                return;
              }
              that.onLoad({ status: 6, index: 3 });
            }
          });

        } else if (res.cancel) {
          console.log('用户点击取消')
        }

      }
    });
  },

  //订单支付
  requestPayment: function (e) {
    var that = this
    var numbers = e.currentTarget.dataset.numbers
    var shop_id = e.currentTarget.dataset.shopid
    request.request({
      method: 'orderPayment', data: { numbers: numbers, shop_id: shop_id }, success(res) {
        console.log(res.data)
        if (res.data.code == 4) {
          wx.showModal({
            showCancel: false,
            content: res.data.message,
            success: function (res) {
              if (res.confirm) {
              }
            }
          })
          return;
        }

        var timeStamp = (Date.parse(new Date()) / 1000).toString();
        var numbers = res.data.numbers
        var nonceStr = res.data.nonce_str
        var packages = 'prepay_id=' + res.data.prepay_id
        var paySign = 'appId=' + res.data.appid + '&nonceStr=' + nonceStr + '&package=' + packages + '&signType=MD5&timeStamp=' + timeStamp + '&key=' + res.data.key
        var paySign = md5.hexMD5(paySign).toUpperCase()
        var payData = {
          timeStamp: timeStamp,
          nonceStr: nonceStr,
          packages: packages,
          paySign: paySign,
          numbers: numbers
        }
        that.sendRequestPayment(payData)
      }
    });
  },

  //付款
  sendRequestPayment: function (data) {
    var that = this
    wx.requestPayment({
      'timeStamp': data.timeStamp,
      'nonceStr': data.nonceStr,
      'package': data.packages,
      'signType': 'MD5',
      'paySign': data.paySign,
      'success': function (res) {
        that.onLoad({ status: 2, index: 1 });
      },
      'fail': function (res) {
        that.onLoad({ status: 1, index: 0 });
      }
    })
  },

  //商品评价
  goodsComment:function(e){
    var numbers = e.currentTarget.dataset.numbers
    var shop_id = e.currentTarget.dataset.shopid
    var goods_id = e.currentTarget.dataset.goodsid
    console.log(goods_id)
    wx.navigateTo({
      url: '../../goodsComment/goodsComment?numbers=' + numbers + '&shop_id=' + shop_id + '&goods_id=' + goods_id,
    })
  }
})