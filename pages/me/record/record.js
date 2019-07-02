// pages/me/mejinbi/mejinbi.js
var app = getApp();
var request = require('../../../utils/request.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    current_page: 1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.request(1)
  },

  /**
   * 请求数据
   */
  request: function (currentPage) {
    var that = this
    request.request({
      method: 'getMemberGoldWithdrawList', data: { 'currentPage': currentPage }, success(res) {
        that.buildDate(res);
        var goldList;
        if (that.data.goldList) {
          goldList = that.data.goldList.concat(res.data.goldList)
        } else {
          goldList = res.data.goldList
        }
        that.setData({
          goldList: goldList,
          totalGold: res.data.totalGold,
          totalPage: res.data.totalPage
        })
        wx.hideLoading()

        if (!goldList[0]){
          that.setData({
            empty: true
          })
        }
      }
    })
  },

  /**
  * 构造时间日期
  */
  buildDate: function (res) {
    for (var i in res.data.goldList) {
      var now = new Date(res.data.goldList[i].created_at * 1000);
      var y = now.getFullYear(),
        m = now.getMonth() + 1,
        d = now.getDate();
      res.data.goldList[i].created_at = y + "." + (m < 10 ? "0" + m : m) + "." + (d < 10 ? "0" + d : d) 
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.data.current_page += 1;//当前页默认为1，每次请求前加1
    var totalPage = this.data.totalPage
    if (this.data.current_page <= totalPage) {
      this.request(this.data.current_page);
    } else {
      this.setData({
        more: true
      })
    }
  }
})