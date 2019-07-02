var QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js');
var md5 = require('../../../utils/md5.js');
var request = require('../../../utils/request.js');

var app = getApp();
Page({
  data: {
    textareaValue: '',

  },

  onLoad: function (options) {
    if (!options) {
      wx.showModal({
        showCancel: false,
        content: '非法操作',
        success: function (res) {
          if (res.confirm) {
            wx.navigateBack({
              delta: 2
            })
          }
        }
      })
    }
    this.setData({
      numbers: options.numbers,
      shop_id: options.shop_id
    })

  },

  //提交表单
  formSubmit: function (e) {
    var formId = e.detail.formId;//发送模板消息
    var refund_info = e.detail.value.content;
    //数据验证
    if (!refund_info) {
      wx.showModal({
        showCancel: false,
        content: '请填写退款原因',
        success: function (res) {
          if (res.confirm) { }
        }
      })
      return;
    }

    if (refund_info.length < 10) {
      wx.showModal({
        showCancel: false,
        content: '退款原因不低于10个字',
        success: function (res) {
          if (res.confirm) { }
        }
      })
      return;
    }

    var data = { numbers: this.data.numbers, shop_id: this.data.shop_id, refund_info: refund_info, formId: formId };
    request.request({
      method: 'refund', data: data, success(res) {
        console.log(res)
        if (res.data.code == 4) {
          wx.showModal({
            showCancel: false,
            content: res.data.message,
            success: function (res) {
              if (res.confirm) {
                console.log('退款失败,请及时联系客服')
              }
            }
          })
          return;
        }
        wx.showModal({
          showCancel: false,
          content: res.data.message,
          success: function (res) {
            if (res.confirm) {
              wx.redirectTo({
                url: '../order/order?status=2&index=1',
              });
            }
          }
        })

      }
    })
  },

})