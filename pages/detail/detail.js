var app = getApp();
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var request = require('../../utils/request.js');
var login = require('../../utils/login');
var WxParse = require('../../wxParse/wxParse.js');

Page({
  data: {
  },

  onShareAppMessage: function (res) {
    return {
      title: this.data.shareInfo,
      path: '/pages/detail/detail?art_id=' + this.data.art_id,
    }
  },

  
  //打开页面加载
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    if (options.dataKey) {
      app.globalData.dataKey = options.dataKey //用来记录数组下标，返回的时候可以浏览量加1
    }

    if (options.info) { //获取到企业信息，一个页面当两个用
      this.getInfo(options.info_id)
      var title = options.info=='gold' ? '金币规则':'关于我们'
      wx.setNavigationBarTitle({
        title: title
      })
      return ;
    }

    this.data.art_id = options.art_id;
    this.request(options.art_id);
  },

  request: function (art_id) {
    var that = this
    var userInfo = wx.getStorageSync('userInfo')
    if (!userInfo.id) {
      //如果用户信息为空
      this.getUserLoginInfo(art_id)
      return false
    }
    //如果经纬度为空，说明是分享出去的页面，所以必须得登录
    if (!app.globalData.lng) {
      this.getLocation(art_id)
      return false
    }
    var lng = app.globalData.lng;
    var lat = app.globalData.lat;
    var data = { 'art_id': art_id, 'lng': lng, 'lat': lat };
    request.request({
      method: 'getArticleDetail', data: data, success(res) {
        wx.hideLoading()
        that.setData({
          info: res.data.info,
          comments: res.data.comments,
          host: app.globalData.serverHost,
          mid: userInfo.mid,
          shareInfo: res.data.shareInfo
        })
      }
    });
  },

//获得企业信息
  getInfo:function (info_id){
    var that = this
    request.request({
      method: 'getInfo', data: {info_id:info_id}, success(res) {
        wx.hideLoading()
        that.setData({
          info: res.data.info,
        })
        var content = res.data.info
        WxParse.wxParse('content', 'html', content, that, 10)
      }
    });
  },

  //登录
  getUserLoginInfo: function (art_id) {
    var that = this
    var status = login.login({
      globalData: app.globalData, success(result) {
        if (result) {
          that.onLoad({ 'art_id': art_id })
        }
      }
    })
  },
  //获得经纬度
  getLocation: function (art_id) {
    wx.showLoading({
      title: '定位中...',
      //mask: true
    });
    var that = this
    //获取到当前用户的经纬度
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
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
          }
        })
        that.onLoad({ 'art_id': art_id })
      }
    })
  },

  toMap: function () {
    wx.navigateTo({
      url: '../../map/map'
    })
  },
  //拨打电话
  makePhoneCall: function (e) {
    var phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone
    })
  },
  noPhone: function () {
    wx.showToast({
      title: '这个人比较懒，没有留下手机号哦',
      image: '/images/ha.png',
      icon: 'success',
      duration: 2000
    })
  },
  //点赞
  praiseAdd: function (e) {
    var that = this
    var nickName = e.currentTarget.dataset.nickname;
    var art_id = e.currentTarget.dataset.art_id;
    var cateid = e.currentTarget.dataset.cateid;
    var k = e.currentTarget.dataset.k;
    var data = { 'art_id': art_id, 'cateid': cateid };
    request.request({
      method: 'goldRandGive', data: data, success(res) {

        if (res.data.code == 7) {
          wx.showToast({
            title: res.data.message,
            image: '/images/ha.png',
            icon: 'success',
            duration: 2000
          })
          return false;
        }

        if (res.data.code == 8) {
          wx.showToast({
            title: '谢谢您为' + nickName + ' 点出来' + res.data.message + '个金币',
            icon: 'success',
            image: '/images/money.png',
            duration: 2000
          })
        }

        if (res.data.code == 0) {
          wx.showToast({
            title: nickName + '：么么，谢谢您的赞',
            image: '/images/hua.png',
            icon: 'success',
            duration: 2000
          })
        }

        that.data.info.praise += 1;
        that.setData({
          info: that.data.info
        })
        app.globalData.praise = true
      }
    });
  },

  //获得评论信息
  comment: function (e) {
    this.data.art_id = e.currentTarget.dataset.art_id;
    this.data.cateid = e.currentTarget.dataset.cateid;
    //this.data.artk = e.currentTarget.dataset.k;
    this.setData({
      focus: true
    });
  },

  //评论
  formSubmit: function (e) {
    var that = this
    var formId = e.detail.formId;
    var content = e.detail.value;
    var userInfo = wx.getStorageSync('userInfo');
    var data = { 'formId': formId, 'content': content.content, 'art_id': this.data.art_id, 'cateid': this.data.cateid };
    wx.showLoading({
      title: '提交中...',
    })
    
    request.request({
      method: 'articleCommentAdd', data: data, success(res) {
        console.log(res)
        if (res.data.code == 0) {
          wx.hideLoading()
          res.data.curComment[0].nickName = userInfo.nickName
          that.data.comments = that.data.comments.concat(res.data.curComment)
          that.setData({
            comments: that.data.comments
          })
        } else {
          wx.showToast({
            title: res.data.message,
            icon: 'loading',
            duration: 2000
          })
        }
      }
    });
  },

  //获得评论的回复信息
  replyInfo: function (e) {
    this.data.art_id = e.currentTarget.dataset.art_id;
    this.data.to_mid = e.currentTarget.dataset.from_mid;
    this.data.to_name = e.currentTarget.dataset.from_name;
    this.data.cateid = e.currentTarget.dataset.cateid;
    //console.log(app.globalData.currentMid)
    //console.log(this.data.to_mid)
    //禁止自己回复自己
    if (app.globalData.currentMid != this.data.to_mid) {
      this.setData({
        focus: true,
        hint: "回复" + this.data.to_name + '：'
      });
    } else {
      this.setData({
        focus: false,
      });
    }
  },

  //发送评论回复请求
  replyInfoRequest: function (e) {
    var that = this
    var formId = e.detail.formId;
    var content = e.detail.value;
    var userInfo = wx.getStorageSync('userInfo');
    wx.showLoading({
      title: '提交中...',
    })
    var data = { 'formId': formId, 'content': content.content, 'art_id': this.data.art_id, 'cateid': this.data.cateid, 'to_mid': this.data.to_mid, 'to_name': this.data.to_name };
    request.request({
      method: 'commentReplyAdd', data: data, success(res) {
        if (res.data.code == 0) {
          wx.hideLoading()
          that.data.comments = that.data.comments.concat(res.data.curReply)
          that.setData({
            comments: that.data.comments
          })
        } else {
          wx.showToast({
            title: res.data.message,
            icon: 'loading',
            duration: 2000
          })
        }
      }
    })
  },

  //个人中心
  toOtherperson: function (e) {
    var to_mid = e.currentTarget.dataset.mid;
    wx.navigateTo({
      url: '../otherperson/otherperson?to_mid=' + to_mid
    })
  },

  //收藏
  collectAdd: function (e) {
    var that = this
    var cateid = e.currentTarget.dataset.cateid;
    var art_id = e.currentTarget.dataset.art_id;
    var data = { 'art_id': art_id, 'cateid': cateid };
    request.request({
      method: 'collectAdd', data: data, success(res) {
        if (res.data.code == 0){
          that.data.info.collect = true
          that.setData({
            info: that.data.info
          })
        }
      }
    });
  },
  
  onfocus: function () {
    this.setData({
      focus: true
    });
  },
  bindblur: function () {
    this.setData({
      focus: false,
      hint: false
    });
  },
})