var app = getApp();
var request = require('../../../utils/request.js');
Page({
  data: {
    wechatid: '',
    withdrawmoney: '',
  },
  onLoad: function (options) {
    this.setData({
      totalGold: options.totalGold
    })
  },
  request: function (wechatid) {
    var that = this
    request.request({
      method: 'memberGoldWithdraw', data: { 'wechatid': wechatid }, success(res) {
        wx.hideLoading()
        if (res.data.code == 1) {
          wx.showModal({
            title: '提示',
            content: '微信号不能为空',
            showCancel: false
          })
          return false;
        }
        if (res.data.code != 0) {
          wx.showModal({
            title: '提示',
            content: res.data.message,
            showCancel: false
          })
          return false;
        }
        wx.navigateTo({
          url: '../status/status',
        })
      }
    })
  },
  formSubmit: function (e) {
    var wechatid = e.detail.value.wechatid;
    if (wechatid == '' && wechatid.length < 2) {
      wx.showModal({
        title: '提示',
        content: '微信号不能为空',
        showCancel: false
      })
      return false;
    }
    this.request(wechatid);
    wx.showLoading({
      title: '提交中...',
      mask: true
    });

  }
})