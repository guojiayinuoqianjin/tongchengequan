var app = getApp();
var request = require('../../../utils/request.js');
var login = require('../../../utils/login');
Page({
  data: {
    visible: true,
  },

  onShow:function () {
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userInfo: userInfo,
    })
  },

  onLoad: function (options) {
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userInfo: userInfo,
    })
    //修改名片的数据
    if (app.globalData.meCard){
      this.setData({
        info: app.globalData.meCard,
        status: app.globalData.meCard.status,
      })
    }
  },

  //创建及修改名片
  formSubmit: function (e) {
    var that = this
    var name = e.detail.value.name;
    var company = e.detail.value.company;
    var position = e.detail.value.position;
    var formId = e.detail.formId;
    var city = e.detail.value.city;
    var email = e.detail.value.email;
    var business = e.detail.value.business;
    var status = e.detail.value.status ? 1 : 0;
    var type = app.globalData.cardType ? 1 :0
    if (!this.data.userInfo.phone) {
      wx.showToast({
        title: '必须先认证手机号',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }
    if (!name) {
      wx.showToast({
        title: '必须填写姓名',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }

    if (name.length > 4) {
      wx.showToast({
        title: '姓名最多4个字符',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }

    if (!company) {
      wx.showToast({
        title: '必须填写公司',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }

    if (!position) {
      wx.showToast({
        title: '必须填写职务',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }
    if (!city) {
      wx.showToast({
        title: '必须填写城市',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }
    if (email) {
      var myreg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
      if (!myreg.test(email)) {
        wx.showToast({
          title: '请填写正确的邮箱',
          image: '/images/ha.png',
          icon: 'success',
          duration: 2000
        })
        return false
      }
    }

    var data = {
      'formId': formId, 'name': name, 'company': company, 'position': position, 'city': city, 'email': email, 'status': status, 'type': type, 'business': business
    };
    wx.showLoading({
      title: '提交中...',
    })

    request.request({
      method: 'createCard', data: data, success(res) {
        wx.hideLoading()
        if(res.data.code == 0){
          wx.showToast({
            title: type ? '编辑成功':'名片创建成功',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function () {
            wx.redirectTo({
              url: '../meCard/meCard',
            })
          }, 2000)
        }else{
          wx.showToast({
            title: type ? '编辑失败':'名片创建失败',
            image: '/images/ha.png',
            icon: 'success',
            duration: 2000
          })
        }
      }
    });
  },

  request: function () {
    var that = this
    request.request({
      method: 'getUserInfo', data: '', success(res) {
        console.log(res)
        that.setData({
          info: res.data,
          host: app.globalData.serverHost
        })
      }
    });
  },

  toValid: function () {
    wx.navigateTo({
      url: '../valid/valid',
    })
  },

  // toMecard: function () {
  //   wx.navigateTo({
  //     url: '../meCard/meCard',
  //   })
  // },

  allDisplay: function (e) {
    this.setData({
      status: false
    })
  },

  partDisplay: function (e) {
    this.setData({
      status: true
    })
  }
})

