// pages/activitylist/activitylist.js
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
    stv: {
      windowWidth: 0,
      lineWidth: 0,
      offset: 0,
      tStart: false
    },
    activeTab: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    if(options.cateid == 24){
      var title = '限时优惠'
    }
    if (options.cateid == 43) {
      var title = 'e圈邀你来旅游'
    }
    wx.setNavigationBarTitle({
      title: title
    })
    var userInfo = wx.getStorageSync('userInfo')
    if (!userInfo.id) {
      //如果用户信息为空
      this.getUserLoginInfo(options)
      return false
    }
    var data = {
      cate_id: options.cateid
    }
    this.setData({
      cate_id :options.cateid
    })
    this.request(data);
  },

  request:function (data){
    var that = this
    request.request({
      method: 'getActList', data: data, success(res) {
        wx.hideLoading()
        that.setData({
          host: app.globalData.serverHost,
          list: res.data.list,
          cateList: res.data.cateList,
        })
        that.setData({ //显示没有更多了
          more: true
        })
      }
    });
  },

  //活动链接
  toActivity: function (e) {
    var gb_id = e.currentTarget.dataset.id;
    var gb_k = e.currentTarget.dataset.k;
    wx.navigateTo({
      url: '../activitydetail/activitydetail?gb_id=' + gb_id + '&gb_k=' + gb_k,
    })
  },

  //上拉刷新
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
  },

  //下拉加载
  onReachBottom: function () {

  },
  //登录
  getUserLoginInfo: function (options) {
    var that = this
    var status = login.login({
      globalData: app.globalData, success(result) {
        if (result) {
          setTimeout(function () {
            that.onLoad(options)
          }, 1000)

        }
      }
    })
  },

  _updateSelectedPage(page) {
  
    this.setData({
      offset: page*140 
       })
   
  },
  handlerTabTap(e) { 
    console.log(e.currentTarget.dataset.index)
    var cateid = e.currentTarget.dataset.cateid
    this._updateSelectedPage(e.currentTarget.dataset.index);
    this.request({cate_id:this.data.cate_id,son_cateid:cateid})
  }
})