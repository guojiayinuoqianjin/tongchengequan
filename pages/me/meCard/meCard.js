// pages/me/meCard/meCard.js
var app = getApp();
var login = require('../../../utils/login');
var request = require('../../../utils/request.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    status: true,
    images: [],
    start: false
  },

  onShow: function () {
    if (!this.data.onStart) {
      this.onLoad({mid:this.data.to_mid,onStart:2})
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    this.data.onStart = options.onStart ? 2 : 1;
    wx.setNavigationBarTitle({
      title: options.nickName ? options.nickName + '的名片' : '名片信息'
    })
    var userInfo = wx.getStorageSync('userInfo');
    if (!userInfo.id) {
      //如果用户信息为空
      this.getUserLoginInfo(options)
      return false
    }
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    var scene = decodeURIComponent(options.scene) //小程序码扫描进来的
    scene = scene == 'undefined' ? 0 : scene
    var to_mid = options.mid ? options.mid : scene
    this.data.to_mid = !to_mid ? 0 : to_mid
  
    var data = { to_mid: this.data.to_mid }
    request.request({
      method: 'getMemberCard', data: data, success(res) {
        wx.hideLoading()
        if (res.data.code == 4) {
          that.setData({
            status: false
          })
          return false
        }
        that.setData({
          status: true,
          info: res.data.info,
          clickList: res.data.clickList,
          mid: userInfo.mid,
          avatarUrl: res.data.info.avatarUrl,
          cardStatus: res.data.cardStatus,
          card_img: app.globalData.serverHost + '/' + res.data.info.card_img,
        })
        app.globalData.meCard = res.data.info //用于编辑名片数据
        if (that.data.onStart == 1) { //从onShow加载的，不执行生成图片
          that.download([res.data.info.avatarUrl, app.globalData.serverHost + '/' + res.data.info.card_img], res.data.info);
        }
      }
    });
   
  },
  /**
   * 用户登录
   */
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
          if (that.data.images.length != 2) {
            that.data.images = that.data.images.concat(images)
            if (that.data.images.length == 2) {
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  createCanvas: function (images) {
    var context = wx.createCanvasContext('myCanvas');
    //背景颜色
    // context.setFillStyle('#f3f3f5');
    // context.fillRect(0, 0, 375, 667);
    context.drawImage('/images/canvasbg.png', 0, 0, 360, 580);

    context.drawImage('/images/logo.png', 35, 35, 35, 35);
    context.setFillStyle('#999999');
    context.setFontSize(16);
    context.fillText('同城e圈', 80, 60);
    context.setFillStyle('#000000');
    context.setFontSize(20);
    context.fillText('您好，这是我的名片，望惠存', 35, 98);

    //卡片背景
    context.setFillStyle('#f1f1f1');
    context.fillRect(38, 120, 300, 160);
    context.setFillStyle('#ffffff');
    context.fillRect(48, 130, 280, 140);

    //信息
    context.setFillStyle('#000000');
    context.setFontSize(20);
    context.fillText(this.data.info.name, 60, 165);
    context.setFontSize(14);
    context.fillText('电话:', 60, 195);
    context.fillText('公司:', 60, 225);
    context.fillText('Email:', 60, 255);
    context.fillText(this.data.info.phone, 100, 195);
    context.fillText(this.data.info.company, 100, 225);
    context.fillText(this.data.info.email, 100, 255);
    context.setFontSize(12);
    context.setFillStyle('#8a8a8a');
    context.fillText(this.data.info.position, 150, 165);
    context.drawImage(images[0], 252, 140, 65, 65);

    //三个正方形
    context.setFillStyle('#ede5ce');
    context.fillRect(38, 293, 100, 40);
    context.setFillStyle('#cee0ed');
    context.fillRect(138, 293, 100, 40);
    context.setFillStyle('#edced2');
    context.fillRect(238, 293, 100, 40);
    //Ta
    context.setFillStyle('#000000');
    context.setFontSize(14);
    context.fillText('Ta的动态', 68, 318);
    context.fillText('Ta的人脉', 168, 318);
    context.fillText('Ta的企业', 268, 318);
    context.drawImage('/images/dongtai.png', 45, 301, 22, 22);
    context.drawImage('/images/renmai.png', 145, 301, 22, 22);
    context.drawImage('/images/dianpu.png', 245, 301, 22, 22);

    //二维码
    context.setFillStyle('#f1f1f1');
    context.fillRect(38, 345, 300, 180);
    context.setFillStyle('#ffffff');
    context.fillRect(38, 355, 300, 160);

    context.drawImage(images[1], 48, 370, 125, 125); //二维码图片
    context.setFillStyle('#8a8a8a');
    context.setFontSize(16);
    context.fillText('长按或扫一扫识别', 188, 383);
    context.setFillStyle('#000000');
    context.fillText('同步名片至通讯录', 188, 410);

    context.beginPath();
    context.setStrokeStyle('#eaeaea')
    context.setLineWidth(1);
    context.moveTo(188, 420);
    context.lineTo(393, 420);
    context.stroke();

    context.setFillStyle('#8a8a8a');
    context.setFontSize(12);
    context.fillText('发现-小程序-搜索', 188, 445);
    context.fillText('和我一起', 263, 470);
    context.fillText('节约用纸，珍惜资源吧！', 188, 495);

    context.setFillStyle('#000000');
    context.setFontSize(16);
    context.fillText('“同城e圈”', 188, 470);
    context.setFillStyle('#8a8a8a');
    context.setFontSize(12);
    context.drawImage('/images/wx.png', 35, 530, 20, 20);
    context.fillText('由小程序“同城e圈”生成', 60, 545);
    //this.data.context = context
    context.draw();

  },

  canvasPic: function () {
    wx.showLoading({
      title: '正在生成名片码',
    })
    setTimeout(function () {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: 360,
        height: 580,
        destWidth: 720,
        destHeight: 1160,
        canvasId: 'myCanvas',
        success: function (res) {
          wx.hideLoading()
          wx.previewImage({
            current: res.tempFilePath, // 当前显示图片的http链接
            urls: [res.tempFilePath] // 需要预览的图片http链接列表
          })
        }
      })
    }, 2000)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    var userInfo = wx.getStorageSync('userInfo');
    return {
      title: '您好，这是我的名片，请惠存',
      path: 'pages/me/meCard/meCard?mid=' + this.data.info.mid,
    }
  },
  /**
     * 修改名片
     */
  toPersonalcard: function () {
    app.globalData.cardType = 1 //type=1是修改名片
    wx.redirectTo({
      url: '../personalCard/personalCard',
    })
  },

  /**
     * 创建名片
     */
  createCard: function () {
    app.globalData.meCard = ''
    wx.redirectTo({
      url: '../personalCard/personalCard',
    })
  },

  /**
      * 我的企业
      */
  toShop: function (e) {
    if (this.data.info.is_company) {
      wx.navigateTo({
        url: '../../company/company?to_mid=' + this.data.info.mid + "&companyName=" + this.data.info.company
      })
      return false
    }

    if (this.data.info.mid == this.data.mid) {
      wx.navigateTo({
        url: '../../companyEdit/companyEdit'
      })
    }

    // wx.showModal({
    //   content: '程序猿正在加班开发中……',
    //   showCancel:false,
    //   success: function (res) {
    //     if (res.confirm) {
    //       console.log('用户点击确定')
    //     } else if (res.cancel) {
    //       console.log('用户点击取消')
    //     }
    //   }
    // })
  },

  /**
   * 保存到手机通讯录
   */
  savePhone: function () {
    wx.addPhoneContact({
      photoFilePath: this.data.info.avatarUrl,
      nickName: this.data.info.name,
      firstName: this.data.info.name,
      mobilePhoneNumber: this.data.info.phone,
      organization: this.data.info.company,
      title: this.data.info.position,
      success: function (res) {
        // console.log(res)
      },
      fail: function (res) {
        //console.log(res)
      },
    })
  },

  /**
   * 个人中心
   */
  toOtherperson: function (e) {
    var to_mid = e.currentTarget.dataset.mid;
    wx.navigateTo({
      url: '../../otherperson/otherperson?to_mid=' + to_mid
    })
  },
  /**
     * 我的人脉
     */
  toCardLibrary: function (e) {
    var to_mid = e.currentTarget.dataset.mid;
    wx.navigateTo({
      url: '../../cardLibrary/cardLibrary?to_mid=' + to_mid
    })
  },

  /**
 * 交换名片
 */
  cardExchange: function (e) {
    var to_mid = e.currentTarget.dataset.to_mid;
    wx.showModal({
      content: '与Ta交换名片，对方同意后即可看到名片内容',
      confirmText: '交换名片',
      success: function (res) {
        if (res.confirm) {
          request.request({
            method: 'cardExchange', data: { to_mid: to_mid }, success(res) {
              wx.showToast({
                title: res.data.message,
                image: '/images/ha.png',
                icon: 'success',
                duration: 2000
              })
            }
          });
        } else if (res.cancel) {
          //console.log('用户点击取消')
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.data.onStart = 0
  },


})