var app = getApp();
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var login = require('../../utils/login');
var request = require('../../utils/request.js');
var amapFile = require('../../utils/amap-wx.js');

Page({
  data: {
    focus: false,
    isShow: false,
    total: 0,
    current_page: 1,
    //address: '定位中...',
    categoryList: [],
    animationData: {},
    ctrlshare: false,
    flag: 2
  },

  //分享
  onShareAppMessage: function (res) {
    var that = this
    var userInfo = wx.getStorageSync('userInfo');
    return {
      title: this.data.shareInfo,
      path: '/pages/index/index?send_mid=' + userInfo.mid,
      success: function (res) {
        // 转发成功
        that.setData({
          ctrlshare: false
        })
      },
    }
  },

  onShow: function () {

    //修改城市后，首页刷新
    if (app.pages == 'address') {
      this.data.list = ''
      this.data.current_page = 1
      this.request(1)
      app.globalData.skip = ''
      app.pages = ""
    }

    this.setData({
      'address': app.globalData.city
    })
    //参加活动后，返回首页报名加1
    if (app.globalData.act_apply) {
      this.data.list[app.globalData.act_k].participation_num++
    }

    //参加活动后，返回首页感兴趣加1
    if (app.globalData.act_member_insert) {
      this.data.list[app.globalData.act_k].click++
    }

    app.globalData.act_apply = ''
    app.globalData.act_member_insert = ''
    this.setData({
      list: this.data.list,
    })
  },

  onLoad: function (options) {
    //推荐人用户MID
    if (options.send_mid) {
      app.globalData.send_mid = options.send_mid
    } else {
      app.globalData.send_mid = 0
    }

    //调用API从本地缓存中获取数据
    var userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      this.getUserLoginInfo(options);
    } else {
      app.globalData.currentMid = userInfo.mid //用户ID
      this.request(1);
    }
  },

  getUserLoginInfo: function (cb) {
    var that = this
    var status = login.login({
      globalData: app.globalData, success(result) {
        if (result) {
          that.getLocation(cb); //获得经纬度
        } else {
          wx.showModal({
            title: 'e圈提示',
            content: '此小程序必须获得您的微信用户昵称',
            confirmText: '开启授权',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting({
                  success: (res) => {
                    that.onLoad(cb)
                  }
                })
              } else if (res.cancel) {
                that.onLoad(cb)
              }
            }
          })
        }
      }, send_mid: app.globalData.send_mid//分享者的ID
    })
  },

  getLocation: function (cb) {
    var that = this
    var bmapKey = app.globalData.bmapKey
    var myAmapFun = new amapFile.AMapWX({ key: bmapKey });
    myAmapFun.getRegeo({
      iconPath: "../../img/marker.png",
      iconWidth: 22,
      iconHeight: 32,
      success: function (data) {
        console.log(data)
        app.globalData.lat = data[0].latitude;
        app.globalData.lng = data[0].longitude;
        app.globalData.city = data[0].regeocodeData.addressComponent.city
        app.globalData.district = data[0].regeocodeData.addressComponent.district
        console.log(app.globalData)
        that.setData({
          address: data[0].regeocodeData.addressComponent.city
        })
        that.onLoad(cb)
      },
      fail: function (info) {
        wx.showModal({
          title: 'e圈提示',
          content: '此小程序必须获得您的地理位置',
          confirmText: '开启授权',
          success: function (res) {
            if (res.confirm) {
              wx.openSetting({
                success: (res) => {
                  that.getLocation(cb)
                }
              })
            } else if (res.cancel) {
              that.getLocation(cb)
            }
          }
        })
      }
    })
  },
  //上拉刷新
  onPullDownRefresh: function () {
    this.data.noShow = true;//上拉的时候不显示加载提示框
    this.data.list = '';
    this.data.current_page = 1
    this.setData({ //上拉刷新隐藏没有更多了
      more: false
    })
    this.request(1);
  },

  //发送请求,获得文章列表
  request: function (currentPage) {
    if (!this.data.noShow && !app.globalData.skip) {//上拉或者下拉的时候不显示加载提示框
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }
    //mid主要判断显示删除按钮的
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({
      mid: userInfo.mid
    })
    var that = this;
    var lng = app.globalData.lng;
    var lat = app.globalData.lat;
    var city = app.globalData.city;
    var data = { 'currentPage': currentPage, 'lng': lng, 'lat': lat, 'city': city };
    request.request({
      method: 'indexList', data: data, success(res) {
        wx.hideLoading()
        wx.stopPullDownRefresh()
        that.setData({
          list: res.data.list,
          host: app.globalData.serverHost,
          totalPage: res.data.totalPage,
          categoryList: res.data.categoryList,
          advList: res.data.advList,
          shareInfo: res.data.shareInfo
        })
      }
    });
  },



  //打开地图
  toMap: function (e) {
    var address = e.currentTarget.dataset.address;
    var lat = parseFloat(e.currentTarget.dataset.lat);
    var lng = parseFloat(e.currentTarget.dataset.lng);
    console.log(lat)
    console.log(lng)
    console.log(address)
    wx.openLocation({
      latitude: lat,
      longitude: lng,
      scale: 18,
      name: address
    })
  },

  // 定位
  tapAddress: function () {
    wx.navigateTo({
      url: '../address/address',
    })
  },

  //活动链接
  toActivity: function (e) {
    var act_id = e.currentTarget.dataset.id;
    var act_k = e.currentTarget.dataset.k;
    wx.navigateTo({
      url: '../activitydetail/activitydetail?act_id=' + act_id + '&act_k=' + act_k,
    })
  },




  //跳转商品详情页
  toGoodsDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../activitydetail/activitydetail?gb_id=' + id + '&type=groupBuying',
    })
  },

  //跳转商家详情页
  toShopDetail: function (e) {
    var shop_id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../shoplist/shopdetail/shopdetail?shop_id=' + shop_id,
    })
  },



})