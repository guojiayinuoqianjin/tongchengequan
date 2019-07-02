var app = getApp();
var request = require('../../../utils/request.js');

Page({
  data: {
    second: 60,
    selected_re: false,
    selected_get: true,
  },

  getValid: function (e) {
    var phone = e.currentTarget.dataset.phone;
    var status = this.verifyPhone(phone);
    if (status == false) {
      return false
    }
    this.data.codeStatus = 1;//证明获取过验证码了
    this.setData({
      selected_re: true,
      selected_get: false,
    });
    countdown(this);
    this.request('getPhoneCode', { phone: phone });
  },

  //输入手机号
  inputValue: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },

  //验证手机号码
  verifyPhone: function (phone) {
    if (!phone) {
      wx.showToast({
        title: '请填写手机号',
        image: '/images/ha.png',
        duration: 2000
      })
      return false;
    }
    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
    if (phone) {
      if (!myreg.test(phone)) {
        wx.showToast({
          title: '请填写有效的手机号',
          image: '/images/ha.png',
          duration: 2000
        })
        return false;
      }
    }
    return true
  },

  //表单提交
  formSubmit: function (e) {
    var info = e.detail.value;
    var status = this.verifyPhone(info.phone);
    if (status == false) {
      return false
    }
    if (!this.data.codeStatus) {
      wx.showToast({
        title: '您还没有获取验证码',
        image: '/images/ha.png',
        duration: 2000
      })
      return false;
    }

    if (!info.code) {
      wx.showToast({
        title: '请输入验证码',
        image: '/images/ha.png',
        duration: 2000
      })
      return false;
    }
    if (info.code.length != 6) {
      wx.showToast({
        title: '验证码必须是6位',
        image: '/images/ha.png',
        duration: 2000
      })
      return false;
    }
    this.request('memberPhoneVerify', { phone: info.phone, code: info.code });

  },

  //请求
  request: function (method, data) {
    request.request({
      method: method, data: data, success(res) {
        if (res.data.code != 0) {
          wx.showModal({
            title: '提示',
            content: res.data.message,
            showCancel: false
          })
          return false;
        }
        if (method == 'memberPhoneVerify') {
          var userInfo = wx.getStorageSync('userInfo');
          userInfo.phone = data.phone;
          wx.setStorage({
            key: "userInfo",
            data: userInfo
          });
          wx.showToast({
            title: '您的手机已认证成功',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function () {
            wx.navigateBack()//回退到上一页
          }, 2000)
        }
      }
    });
  }

});

function countdown(that) {
  var second = that.data.second;
  if (second == 0) {
    that.setData({
      selected_re: false,
      selected_get: true,
      second: 60,
    });
    return;
  }

  var time = setTimeout(function () {
    that.setData({
      second: second - 1
    });
    countdown(that);
  }, 1000)
}