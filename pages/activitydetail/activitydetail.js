var app = getApp();
var md5 = require('../../utils/md5.js');
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var request = require('../../utils/request.js');
var login = require('../../utils/login');
var WxParse = require('../../wxParse/wxParse.js');

Page({
  data: {
    is_show: false,
    is_height: false,
    showCartDetail: false,
    goods_count: 1,
    images: [],
  },

  //分享
  onShareAppMessage: function (res) {
    var userInfo = wx.getStorageSync('userInfo');
    var path = '/pages/activitydetail/activitydetail?type=groupBuying&send_mid=' + userInfo.mid + '&gb_id=' + this.data.gb_id
    return {
      title: this.data.info.shop_name,
      path: path,
    }
  },

  //打开页面加载
  onLoad: function (options) {

    app.globalData.gd_k = options.gd_k;//活动在首页的下标，用于感兴趣的人数加1
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    //扫码进入
    if (options.scene) {
      var scene = decodeURIComponent(options.scene)
      scene = scene.split("&")
      options = {
        gb_id: scene[0],
        send_mid: scene[1]
      }
    }

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

    //团购
    this.getGroupBuyingDetail(options);
  },

  //获得团购商品详情
  getGroupBuyingDetail: function (options) {
    var that = this
    var userInfo = wx.getStorageSync('userInfo');
    var data = { 'gb_id': options.gb_id };
    request.request({
      method: 'getGroupBuyingDetail', data: data, success(res) {
        wx.hideLoading()
        that.setData({
          gb_id: options.gb_id,
          info: res.data.info,
          comments: res.data.comments,
          host: app.globalData.serverHost,
          userInfo: userInfo,
          sales_gold: Math.floor(res.data.info.price * res.data.info.sales * 100),
          type: options.type,
          give_gold: res.data.info.price > 1 ? Math.round(res.data.info.price):0
        })

        var content = res.data.info.intro
        WxParse.wxParse('content', 'html', content, that, 10)
      }
    });
  },

  /**
   * 生成分销码
   */
  fcanvasPic: function () {
    var that = this
    var data = {
      shop_id: this.data.info.shop_id,
      goods_id: this.data.info.id
    }
    wx.showLoading({
      title: '正在生成分销码',
    })
    request.request({
      method: 'createGroupBuyingCode', data: data, success(res) {
        var img = [
          that.data.userInfo.avatarUrl,
          app.globalData.serverHost + '/' + that.data.info.cover_images,
          app.globalData.serverHost + res.data.path,
          app.globalData.serverHost + '/' + that.data.info.shop_ico
        ];
        that.download(img);
      }
    });
  },
  /**
   * 下载图片
   */
  download: function (img) {
    var that = this
    const downloadTask = wx.downloadFile({
      url: img[0], //仅为示例，并非真实的资源
      success: function (res) {
        if (res.tempFilePath) {
          var images = [res.tempFilePath]
          if (that.data.images.length != 4) {
            that.data.images = that.data.images.concat(images)
            if (that.data.images.length == 4) {
              that.createCanvas(that.data.images);
              return false
            }
          } else {
            this.createCanvas(this.data.images);
            return false
          }
          img.shift()
          if (img.length) {
            that.download(img)
          }
        }
      }
    })
  },
  //生成图片
  createCanvas: function (images) {
    var res = wx.getSystemInfoSync();
    var context = wx.createCanvasContext('fCanvas');
    var left = ((res.windowWidth - 360) / 2);
    context.setFillStyle('#efefef');
    context.fillRect(0, 0, res.windowWidth, res.windowHeight);
    context.drawImage('/images/kexiao_bg.png', left, 0, 360, 532);
    context.drawImage(images[1], left, 0, 360, 200);

    context.setFillStyle('#000000');
    context.drawImage(images[3], left+25, 220, 40, 40);
    context.setFontSize(14);
    context.fillText(this.data.info.shop_name, left + 80, 236);
    context.setFontSize(12);
    context.fillText(this.data.info.title, left + 80, 255);

    context.setFillStyle('#c10815');
    context.setFontSize(34);
    context.fillText(this.data.info.price, left + 25, 310);
    context.setFontSize(12);
    context.fillText('元', left + 100, 310);

    context.setFillStyle('#000000'); 
    context.fillText('原价' + this.data.info.original_price, left + 130, 310);
    context.fillText('已售' + this.data.info.sold_count + '份', left + 280, 310);
    context.drawImage(images[2], left+30, 350, 100, 100);


    context.draw();

    setTimeout(function () {
      wx.hideLoading()
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: res.windowWidth,
        height: res.windowHeight,
        destWidth: res.windowWidth * 2,
        destHeight: res.windowHeight * 2,
        canvasId: 'fCanvas',
        success: function (res) {
          wx.previewImage({
            current: res.tempFilePath, // 当前显示图片的http链接
            urls: [res.tempFilePath] // 需要预览的图片http链接列表
          })
        }
      })
      this.data.images = [];
    }, 2000)
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

  //打开地图
  toMap: function (e) {
    var address = e.currentTarget.dataset.address;
    var lat = parseFloat(e.currentTarget.dataset.lat);
    var lng = parseFloat(e.currentTarget.dataset.lng);
    wx.openLocation({
      latitude: lat,
      longitude: lng,
      scale: 18,
      name: address
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
    if (this.data.info.stock < 1) {
      wx.showModal({
        showCancel: false,
        content: '库存不足',
        success: function (res) {
          if (res.confirm) { }
        }
      })
      return;
    }
    var info = this.data.info;
    var order = {
      shop_name: info.shop_name,
      goods_id: info.id,
      shop_id: info.shop_id,
      goods_name: info.title,
      goods_price: parseFloat(info.price),
      goods_count: this.data.goods_count,
      image: info.images[0],
      gold: 0,    //邸现金币
      total_price: parseFloat((info.price * this.data.goods_count).toFixed(2)),
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

  //获得金币规则
  getInfo: function (e) {
    wx.navigateTo({
      url: '../detail/detail?info_id=2&info=gold'
    })
  },
  //浏览图片
  clickImage: function (e) {
    var current = e.target.dataset.src;
    var imgs = e.target.dataset.imgs;
    for (var i in imgs) {
      imgs[i] = app.globalData.serverHost + imgs[i]
    }
    wx.previewImage({
      current: current,
      urls: imgs
    });
  },
})