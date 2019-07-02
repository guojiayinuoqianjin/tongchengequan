// pages/me/mejinbi/mejinbi.js
var app = getApp();
var request = require('../../../utils/request.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    current_page: 1,
    type:0
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.request(1,this.data.type)
  },

  /**
   * 请求数据
   */
  request: function (currentPage,type) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    var that = this
    request.request({
      method: 'getMemberGoldList', data: { 'currentPage': currentPage,type:type }, success(res) {
        wx.hideLoading()
        that.buildDate(res);
        if (that.data.currentPage == res.data.totalPage ){
          that.setData({
            more:true
          })
        }
        var goldList;
        if (that.data.goldList) {
          goldList = that.data.goldList.concat(res.data.goldList)
        } else {
          goldList = res.data.goldList
        }
        that.setData({
          goldList: goldList,
          totalGold: res.data.totalGold,
          yesterdayGold: res.data.yesterdayGold,
          totalPage: res.data.totalPage,
          fans:res.data.fans
        })
        wx.hideLoading()
      }
    })
  },

//获得粉丝列表
  getFans:function (){
    this.data.type=5
    this.data.goldList=''
    this.data.current_page = 1
    this.setData({
      more: false
    })
    this.request(this.data.current_page,this.data.type);
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
      res.data.goldList[i].created_at = y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + now.toTimeString().substr(0, 8)
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.data.current_page += 1;//当前页默认为1，每次请求前加1
    var totalPage = this.data.totalPage
    console.log(this.data.current_page)
    if (this.data.current_page <= totalPage) {
      this.request(this.data.current_page,this.data.type);
    } else {
      this.setData({
        more: true
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.data.goldList = ''
    this.data.current_page = 1;
  },

  toWithdraw: function (e) {
    var totalGold = e.currentTarget.dataset.total;
    var userInfo = wx.getStorageSync('userInfo');
    if (!userInfo.phone) {
      wx.showToast({
        title: '金币提现必须先认证手机号',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      setTimeout(function () {
        wx.navigateTo({
          url: '../valid/valid',
        })
      }, 2000)
      return false;
    }
    //跳转到金币提现页
    wx.navigateTo({
      url: '../widthdraw/widthdraw?totalGold=' + totalGold,
    })
  },

  reCord: function () {
    wx.navigateTo({
      url: '../record/record',
    })
  }

})