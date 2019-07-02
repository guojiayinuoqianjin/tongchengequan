var app = getApp();
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var login = require('../../utils/login');
var request = require('../../utils/request.js');
var md5 = require('../../utils/md5.js');

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
    var order = app.globalData.order
    if (order.type == 1) {
      order = {
        order: [order],
        total_price: order.total_price,
        gold: order.gold,
        shop_price: order.total_price,
        type: order.type
      }
    }
    console.log(order)
    this.setData({
      order: order,
      host: app.globalData.serverHost,
      type: order.type
    })
    this.getMemberGoldNum();

  },
  /**
   * 获得金币数量
   */
  getMemberGoldNum: function () {
    var that = this;
    request.request({
      method: 'getMemberGoldNum', data: '', success(res) {
        that.setData({
          memberGold: res.data.num,
        })
      }
    });
  },

  minusGold: function () {
    var gold = this.data.order.gold
    if (gold == 0) {
      return;
    }
    if (gold - 100 == 0) {
      gold = 0
      this.data.order.gold = 0
      this.data.order.total_price += 1
    } else {
      this.data.order.total_price += 1
      this.data.order.gold -= 100
      gold -= 100
    }
    this.setData({
      order: this.data.order,
      reduced: gold/100
    })
  },

  addGold: function () {
    var gold = this.data.order.gold
    if (gold + 100 > this.data.memberGold) {
      wx.showModal({
        showCancel: false,
        content: '金币不足',
        success: function (res) {
          if (res.confirm) { }
        }
      })
      return;
    }
    if ((gold + 100) / 100 > this.data.order.shop_price / 2) {
      wx.showModal({
        showCancel: false,
        content: '此商品只能邸现这么多了',
        success: function (res) {
          if (res.confirm) { }
        }
      })
      return;
    }
    this.data.order.gold += 100
    this.data.order.total_price = parseFloat((this.data.order.total_price -= 1).toFixed(2))
    this.setData({
      order: this.data.order,
      reduced: this.data.order.gold ? this.data.order.gold / 100 : 0
    })
    console.log(this.data.order)
  },

  //支付
  requestPayment: function () {
    if (this.data.type == 1) {
      var order = app.globalData.order
      order.gold = this.data.order.gold
      order.total_price = this.data.order.total_price
    }
    request.request({
      method: 'payment', data: order, success(res) {
        if (res.data.code == 4) {
          wx.showModal({
            showCancel: false,
            content: res.data.message,
            success: function (res) {
              if (res.confirm) {
                console.log('创建订单失败')
              }
            }
          })
          return;
        }
        var timeStamp = (Date.parse(new Date()) / 1000).toString();
        var numbers = res.data.info.numbers
        var nonceStr = res.data.info.nonce_str
        var packages = 'prepay_id=' + res.data.info.prepay_id
        var paySign = 'appId=' + res.data.info.appid + '&nonceStr=' + nonceStr + '&package=' + packages + '&signType=MD5&timeStamp=' + timeStamp + '&key=' + res.data.info.key
        var paySign = md5.hexMD5(paySign).toUpperCase()

        wx.requestPayment({
          'timeStamp': timeStamp,
          'nonceStr': nonceStr,
          'package': packages,
          'signType': 'MD5',
          'paySign': paySign,
          'success': function (res) {
            wx.redirectTo({
              url: '../me/order/order?status=2&index=1',
            });
            
          },
          'fail': function (res) {
            wx.redirectTo({
              url: '../me/order/order?status=1&index=0',
            });
          }
        })
      }
    });
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})