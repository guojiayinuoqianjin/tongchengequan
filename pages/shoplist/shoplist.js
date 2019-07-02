var app = getApp();
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var login = require('../../utils/login');
var request = require('../../utils/request.js');
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
    //如果经纬度为空，说明是分享出去的页面，所以必须得登录
    if (!app.globalData.lng) {
      this.getLocation(options)
      return false
    }
    this.request(options.shop_cateid,'',1);
  },

  //请求数据
  request: function (shop_cateid, son_cateid, currentPage) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    var that = this
    var lng = app.globalData.lng;
    var lat = app.globalData.lat;
    var data = { 'shop_cateid': shop_cateid, 'son_cateid': son_cateid, 'currentPage': currentPage, 'lng': lng, 'lat': lat };
    request.request({
      method: 'shopGroupBuyingList', data: data, success(res) {
        wx.hideLoading()
        that.setData({
          shop_cateid: shop_cateid,
          son_cateid: son_cateid,
          list: res.data.list,
          category: res.data.category,
          host: app.globalData.serverHost,
        })
      }
    });
  },

  getShopList: function (e) {
    var son_cateid = e.currentTarget.dataset.son_cateid;
    this.request(this.data.shop_cateid,son_cateid,1)
  },
  //获得经纬度
  getLocation: function (options) {

    wx.showLoading({
      title: '定位中...',
      mask: true
    });
    var that = this
    //获取到当前用户的经纬度
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        console.log(1111)
        app.globalData.artLinkType = 1;//标明是经过分享链接或者通知链接进入的
        app.globalData.lat = res.latitude;
        app.globalData.lng = res.longitude;
        var qqmapsdk = new QQMapWX({
          key: 'BJFBZ-ZFTHW-Y2HRO-RL2UZ-M6EC3-GMF4U'
        });
        qqmapsdk.reverseGeocoder({
          poi_options: 'policy=2',
          get_poi: 1,
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function (res) {
            //当前区域，主要获得市
            app.globalData.city = res.result.address_component.city
          },
          fail: function (res) {
            console.log('失败')
            // wx.showModal({title:info.errMsg})
          }
        })
        wx.hideLoading()
        that.onLoad(options)
      }
    })
  },
  
  //跳转商品详情页
   toGoodsDetail:function (e){
     var id = e.currentTarget.dataset.id;
     wx.navigateTo({
       url: '../activitydetail/activitydetail?gb_id=' + id ,
     })
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

  //  //跳转商家详情页
   toShopDetail: function (e) {
     var shop_id = e.currentTarget.dataset.id;
     wx.navigateTo({
       url: '../shoplist/shopdetail/shopdetail?shop_id=' + shop_id,
     })
   },


 
})