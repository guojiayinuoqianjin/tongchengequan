// pages/me/meNews/meNews.js
var app = getApp();
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
    this.request();
  },

  /**
  * 请求
  */
  request: function () {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    var that = this
    var userInfo = wx.getStorageSync('userInfo');
    request.request({
      method: 'getInformMessage', data: '', success(res) {
        wx.hideLoading()
        that.setData({
          list: res.data.list,
          mid: userInfo.mid
        })
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.request();
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

  },
  /**
    * 拒绝或者同意
    */
  action: function (e) {
    var that = this
    var type = e.currentTarget.dataset.type;
    var msgid = e.currentTarget.dataset.id;
    var from_mid = e.currentTarget.dataset.from_mid;
    var k = e.currentTarget.dataset.k;
    var data = { type: type, msgid: msgid, from_mid: from_mid };
    request.request({
      method: 'cardExchangeAction', data: data, success(res) {
        if (res.data.code == 0) {
          that.data.list[k].type = type
          that.setData({
            list: that.data.list
          })
        } else {
          wx.showModal({
            title: '提示',
            content: res.data.message,
            showCancel: false
          })
        }
      }
    });
  },
  /**
   * 查看名片
   */
  openCard: function (e) {
    var mid = e.currentTarget.dataset.mid;
    var type = e.currentTarget.dataset.type;
    var nickName = e.currentTarget.dataset.nickname;
    if (type == 4) {
      wx.navigateTo({
        url: '/pages/message/message?to_mid=' + mid + '&nickName=' + nickName,
      })
    } else {
      wx.navigateTo({
        url: '../meCard/meCard?mid=' + mid + '&nickName=' + nickName,
      })
    }
  },
})