var app = getApp();
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
// var WxNotificationCenter = require('../../utils/WxNotificationCenter.js');
var that;
var qqmapsdk;
Page({
  data: {
    placeholder: '请输入城市',
    searchkeyword: ''
  },

  onLoad: function (options) {
    // 生命周期函数--监听页面加载
    that = this;
    qqmapsdk = new QQMapWX({
      key: 'BJFBZ-ZFTHW-Y2HRO-RL2UZ-M6EC3-GMF4U'
    });
    that.reloadCurrent();
  },

  inputSearch: function (e) {
    var that = this
    // 键盘不断录入绑定取值
    var keyword = e.detail.value;
    this.setData({
      searchkeyword: keyword
    });
    // 向腾讯地图接口发送请求
    qqmapsdk.getSuggestion({
      keyword: keyword,
      policy: 0,
      region: that.data.city,
      success: function (res) {
        that.unique(res.data)
      },
      fail: function (res) {
        // console.log(res);
      },
      complete: function (res) {
        // console.log(res);
      }
    });
  },


  // 最简单数组去重法 
  unique: function (arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      var n = 0;
      for (var v = 0; v < result.length; v++) {
        if(result[v].city == arr[i].city){
          n=1
        }
      }
      if(!n){
        result.push(arr[i]);
      }
    }
    // // 保存搜索地址列表数组
    that.setData({
      result: result
    });
  },


  //搜索地址-选择地址触发事件
  addressTapped: function (e) {
    //在返回到首页的时候刷新首页，根据当前经纬度获取到最近的商店
    app.globalData.city = e.currentTarget.dataset.city;
    app.globalData.district = e.currentTarget.dataset.district;
    app.globalData.lat = e.currentTarget.dataset.lat;
    app.globalData.lng = e.currentTarget.dataset.lng;
    app.pages = 'address';//标示是通过选择收货地址返回的首页，用于返回首页判断
    wx.navigateBack();
  },

  //点击当前位置地址触发事件
  geoTapped: function (e) {
    //地址加入全局变量
    app.globalData.city = e.currentTarget.dataset.city;
    app.globalData.district = e.currentTarget.dataset.district;
    //把当前位置的经纬度加入到全局变量里
    app.pages = 'address';//标示是通过选择收货地址返回的首页，用于返回首页判断
    app.globalData.lat = e.currentTarget.dataset.lat;
    app.globalData.lng = e.currentTarget.dataset.lng;
    wx.navigateBack();
  },

  //获取到当前位置
  reloadCurrent: function () {
    that.setData({
      address: '正在定位中...',
    });
    // 调用接口
    qqmapsdk.reverseGeocoder({
      poi_options: 'policy=2',
      get_poi: 1,
      success: function (res) {
        // 把当前位置渲染给页面
        that.setData({
          address: res.result.address_component.city,
          district: res.result.address_component.district,
          location: [res.result.location.lat, res.result.location.lng]
        });
      }
    });
  },
  addAddress: function () {
    wx.navigateTo({
      url: 'addaddress/addaddress',
    })
  }
})