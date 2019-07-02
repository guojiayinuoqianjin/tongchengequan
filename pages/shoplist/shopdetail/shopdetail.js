var app = getApp();
var md5 = require('../../../utils/md5.js');
var QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js');
var request = require('../../../utils/request.js');
var login = require('../../../utils/login');
var WxParse = require('../../../wxParse/wxParse.js');

Page({
  data: {
    is_show: false,
    is_height: false,
    showCartDetail: false,
    goods_count: 1
  },

  //分享
  onShareAppMessage: function (res) {
    var userInfo = wx.getStorageSync('userInfo');
    return {
      title: this.data.info.shop_name,
      path: '/pages/activitydetail/activitydetail?send_mid=' + userInfo.mid + '&act_id=' + this.data.act_id,
    }
  },

  //打开页面加载
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    //推荐人用户MID
    if (options.send_mid) {
      this.data.to_mid = options.send_mid
    } else {
      this.data.to_mid = 0
    }

    var userInfo = wx.getStorageSync('userInfo')
    if (!userInfo.id) {
      //如果用户信息为空
      this.getUserLoginInfo(options)
      return false
    }
    this.data.goods_id = options.goods_id;
    this.request(options);

  },

  //请求数据
  request: function (options) {
    var that = this
    var data = { 'shop_id': options.shop_id };
    request.request({
      method: 'getShopDetail', data: data, success(res) {
        wx.hideLoading()
        //that.buildDate(res)
        // that.buildMemberListDate(res)
        that.setData({
          info: res.data.info,
          host: app.globalData.serverHost,
        })
      }
    });
  },

  //登录
  getUserLoginInfo: function (options) {
    var that = this
    var status = login.login({
      globalData: app.globalData, success(result) {
        if (result) {
          if (result.status == 1) {//status=1为新用户
            that.data.is_one = 1 //标识为首次进入的用户
          }
          setTimeout(function () {
            that.onLoad(options)
          }, 1000)

        }
      }
    })
  },

  //拨打电话
  callPhone: function (e) {
    var tel = e.currentTarget.dataset.tel;
    wx.makePhoneCall({
      phoneNumber: tel
    })
  },
  /**
   * 构造时间日期
   */
  buildDate: function (res) {
    var s_now = new Date(res.data.info.start_time * 1000);
    var s_y = s_now.getFullYear(),
      s_m = s_now.getMonth() + 1,
      s_d = s_now.getDate();
    res.data.info.start_time = (s_m < 10 ? "0" + s_m : s_m) + "-" + (s_d < 10 ? "0" + s_d : s_d) + " " + s_now.toTimeString().substr(0, 8)

    var e_now = new Date(res.data.info.end_time * 1000);
    var e_y = e_now.getFullYear(),
      e_m = e_now.getMonth() + 1,
      e_d = e_now.getDate();
    res.data.info.end_time = (e_m < 10 ? "0" + e_m : e_m) + "-" + (e_d < 10 ? "0" + e_d : e_d) + " " + e_now.toTimeString().substr(0, 8)
  },
  /**
   * 构造报名用户列表时间
   */
  buildMemberListDate: function (res) {
    for (var i in res.data.memberJoinList) {
      var now = new Date(res.data.memberJoinList[i].created_at * 1000);
      var y = now.getFullYear(),
        m = now.getMonth() + 1,
        d = now.getDate();
      res.data.memberJoinList[i].created_at = y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + now.toTimeString().substr(0, 8)
    }
  },

  /**
  * 报名
  */
  participateActivities: function (e) {
    var that = this
    var act_id = this.data.info.id;
    var formId = e.detail.formId;
    var userInfo = wx.getStorageSync('userInfo');
    if (!userInfo.phone) {
      wx.showToast({
        title: '报名必须先认证手机号',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      setTimeout(function () {
        wx.navigateTo({
          url: '../me/valid/valid',
        })
      }, 2000)
      return false;
    }
    var data = { 'formId': formId, 'act_id': act_id };
    wx.showLoading({
      title: '提交中...',
    })
    request.request({
      method: 'actParticipationAdd', data: data, success(res) {
        wx.hideLoading()
        if (res.data.code != 0) {
          wx.showToast({
            title: res.data.message,
            image: '/images/ha.png',
            duration: 2000
          })
          return false;
        }
        app.globalData.act_apply = 1 //表明参与活动了
        wx.showToast({
          title: res.data.message,
          image: '/images/ha.png',
          duration: 2000
        })
        setTimeout(function () {
          that.onLoad({ 'act_id': act_id, 'act_k': app.globalData.act_k });//从新加载
        }, 2000)

      }
    });
  },

  /**
  * 显示更多
  */
  viewMore: function () {
    this.setData({
      is_show: true
    });
  },

  /**
  * 隐藏内容
  */
  viewLess: function () {
    this.setData({
      is_show: false
    });
  },

  /**
  * 获得评论信息
  */
  comment: function (e) {
    this.data.act_id = e.currentTarget.dataset.act_id;
    this.setData({
      focus: true
    });
  },

  /**
  * 评论
  */
  formSubmit: function (e) {
    var that = this
    var formId = e.detail.formId;
    var content = e.detail.value;
    var userInfo = wx.getStorageSync('userInfo');
    var data = { 'formId': formId, 'content': content.content, 'act_id': this.data.act_id };
    wx.showLoading({
      title: '提交中...',
    })

    request.request({
      method: 'actCommentAdd', data: data, success(res) {
        console.log(res.data.curComment)
        console.log(that.data.comments)
        if (res.data.code == 0) {
          wx.hideLoading()
          res.data.curComment.nickName = userInfo.nickName
          res.data.curComment.avatarUrl = userInfo.avatarUrl
          // that.data.comments = that.data.comments.concat(res.data.curComment)
          var comment = [];
          comment[0] = res.data.curComment;
          that.data.comments = comment.concat(that.data.comments)
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

  unfold: function () {
    this.setData({
      is_height: !this.data.is_height
    })
  },

  //个人中心
  toOtherperson: function (e) {
    var to_mid = e.currentTarget.dataset.mid;
    wx.navigateTo({
      url: '../otherperson/otherperson?to_mid=' + to_mid
    })
  },


  showCartDetail: function () {
    this.setData({
      showCartDetail: !this.data.showCartDetail
    });
  },
  hideCartDetail: function () {
    this.setData({
      showCartDetail: false
    });
  },

  //确认订单
  toOrder: function () {
    var info = this.data.info;
    var order = {
      shop_name: info.shop_name,
      goods_id: info.id,
      shop_id: info.shop_id,
      goods_name: info.title,
      goods_price: info.price,
      goods_count: this.data.goods_count,
      image: info.images[0],
      gold: 0,    //邸现金币
      total_price: (info.price * this.data.goods_count).toFixed(2),
      type: 1
    }
    console.log(order)
    app.globalData.order = order
    wx.navigateTo({
      url: '../payment/payment'
    })
  },

  //加
  addCount: function () {
    var count = this.data.goods_count
    if (count + 1 > this.data.info.stock) {
      wx.showModal({
        showCancel: false,
        content: '库存不足',
        success: function (res) {
          if (res.confirm) {
            console.log('创建订单失败')
          }
        }
      })
      return;
    }
    this.setData({
      goods_count: count + 1
    })
  },

  //减
  delCount: function () {
    if (this.data.goods_count > 1) {
      var count = this.data.goods_count - 1
      this.setData({
        goods_count: count
      })
    }
  },

  //跳转商品详情页
  toGoodsDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../../activitydetail/activitydetail?gb_id=' + id + '&type=groupBuying',
    })
  },


})