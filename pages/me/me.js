var app = getApp();
var request = require('../../utils/request.js');
Page({
  data: {

  },
  onShow:function (){
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userinfo: userInfo,
    })
    this.request();
  },
  onLoad: function () {
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userinfo: userInfo,
    })
    this.request();
  },

  request: function () {
    var that = this
    request.request({
      method: 'getUserInfo', data: '', success(res) {
       // console.log(res)
        that.setData({
          info: res.data,
          host: app.globalData.serverHost
        })
      }
    });
  },

  makePhone: function () {
    wx.makePhoneCall({
      phoneNumber: '1340000' //仅为示例，并非真实的电话号码
    })
  },
  toAbout: function () {
    wx.navigateTo({
      url: '../detail/detail?info_id=1&info=about'
    })
  },
  toMefabu: function () {
    var to_mid = this.data.userinfo.mid
    wx.navigateTo({
      url: '../otherperson/otherperson?to_mid=' + to_mid
    })
  },
  toMejinbi: function () {
    wx.navigateTo({
      url: 'mejinbi/mejinbi',
    })
  },
  toLike: function(){
    wx.navigateTo({
      url: 'collect/collect',
    })
  },
  toValid: function(){
    wx.navigateTo({
      url: 'valid/valid',
    })
  },
  toMecard: function(){
    wx.navigateTo({
      url: 'meCard/meCard',
    })
  },
  meNews:function (){
    wx.navigateTo({
      url: 'meNews/meNews',
    })
  },

  shopOrder: function () {
    wx.navigateTo({
      url: 'shopOrder/shopOrder',
    })
  },

  toOrder: function(e){
    var status = e.currentTarget.dataset.status;
    var index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: 'order/order?status='+status+'&index='+index,
    })
  },

  //订单核销
  orderCancel:function (e){
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        wx.navigateTo({
          url: res.path.substring(9)
        })
      }
    })
  }
})