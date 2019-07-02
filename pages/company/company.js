// pages/me/company/company.js
var app = getApp();
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var request = require('../../utils/request.js');
var login = require('../../utils/login');
var WxParse = require('../../wxParse/wxParse.js');
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
    var that = this
    this.data.title = options.companyName ? options.companyName : '我的企业'
    wx.setNavigationBarTitle({
      title: this.data.title
    })
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    var userInfo = wx.getStorageSync('userInfo');
    var data = { to_mid: options.to_mid ? options.to_mid : 0 }
    request.request({
      method: 'getCompanyInfo', data: data, success(res) {
        wx.hideLoading()
        that.setData({
          mid: userInfo.mid,
          info: res.data.info,
          host: app.globalData.serverHost,
        })
        app.globalData.companyInfo = res.data.info //用于编辑名片数据
      }
    });
  },

  //浏览图片
  clickImage: function (e) {
    var current = e.target.dataset.src;
    var imgs = e.target.dataset.imgs;
    for (var i in imgs) {
      imgs[i] = app.globalData.serverHost + imgs[i]
    }
    wx.previewImage({
      current: current,
      urls: imgs
    });
  },

  /**
     * 用户点击右上角分享
     */
  onShareAppMessage: function (res) {
    var userInfo = wx.getStorageSync('userInfo');
    return {
      title: this.data.title,
      path: 'pages/company/company?to_mid=' + this.data.info.mid,
    }
  },

  /**
   * 编辑名片
   */
  companyEdit: function () {
    wx.redirectTo({
      url: '../companyEdit/companyEdit?companyEdit=1'
    })
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


})