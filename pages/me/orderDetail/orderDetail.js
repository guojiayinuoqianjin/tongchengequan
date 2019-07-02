var app = getApp();
var QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js');
var login = require('../../../utils/login');
var request = require('../../../utils/request.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.scene) {
      var scene = decodeURIComponent(options.scene)
      scene = scene.split(",")
      options = {
        shop_id: scene[0],
        numbers: scene[1],
        shop_administrator: 1
      }
    }
    this.request(options);
  },

  request: function (data) {
    console.log(data)
    var that = this
    request.request({
      method: 'orderDetail', data: data, success(res) {
        console.log(res)
        if (res.data.code == 4) {
          that.setData({
            error: true,
          })
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
        
        that.setData({
          order: res.data.order,
          order_detail: res.data.order_detail,
          host: app.globalData.serverHost,
          shop_administrator: res.data.shop_administrator,
          paymentStatus: data.paymentStatus
        })
      }
    });
  },

  /**
   * 核销
   */
  verification:function (e){
    var that = this
    var order = this.data.order
      request.request({
        method: 'verification', data: {shop_id:order.shop_id,numbers:order.numbers}, success(res) {
          if (res.data.code == 4) {
            wx.showModal({
              showCancel: false,
              content: res.data.message,
              success: function (res) {
                if (res.confirm) {
                  wx.switchTab({
                    url: '/pages/index/index'
                  })
                }
              }
            })
            return;
          }

          wx.showModal({
            showCancel: false,
            content: res.data.message,
            success: function (res) {
              if (res.confirm) {
                wx.switchTab({
                  url: '/pages/me/me'
                })
              }
            }
          })
        }
      });
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  

})