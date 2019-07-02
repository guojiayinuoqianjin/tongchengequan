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
    icons: [],
    animationData: {},
    ctrlshare: false
  },

  //分享
  onShareAppMessage: function (res) {
    var that = this
    var userInfo = wx.getStorageSync('userInfo');
    return {
      title: this.data.shareInfo,
      imageUrl: '/images/index.png',
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
    //获得未读消息
    this.getUnreadInfoCount();
    //主要是判断是否从文章详情页返回的时候，浏览量加1
    if (app.globalData.dataKey) {
      this.data.list[app.globalData.dataKey].click++
      if (app.globalData.praise) {//如果在详情页点赞了，点赞量也加1
        this.data.list[app.globalData.dataKey].praise++
      }
      this.setData({
        list: this.data.list,
      })
      app.globalData.dataKey = ''
      app.globalData.praise = ''
    }

    //新发布信息 返回首页刷新
    if (app.globalData.skip) {
      this.data.list = ''
      this.data.current_page = 1
      this.request(1)
      app.globalData.skip = ''
    }

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

    //红包动画效果
    var animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease',
    })

    this.animation = animation

    animation.scale(0.4, 0.4).step()

    this.setData({
      animationData: animation.export()
    })

    setTimeout(function () {
      animation.scale(1, 1).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 1000)
  },

  //首页分享引导图
  rotateAndScale: function () {
    // 旋转同时放大
    this.animation.rotate(45).scale(2, 2).step()
    this.setData({
      animationData: this.animation.export()
    })
  },

  onLoad: function (options) {
    this.getAdvList(9);
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
 

  //获得分类广告
  getAdvList: function (cateid) {
    var that = this
    var city = app.globalData.city
    var district = app.globalData.district
    var data = { 'cateid': cateid, 'city': city, 'district': district }
    request.request({
      method: 'getAdvList', data: data, success(res) {
        if (res.data.advList[0]) {
          that.setData({
            advList: res.data.advList,
            host: app.globalData.serverHost,
          })
        }
      }
    });

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
      method: 'getArtAndActList', data: data, success(res) {
        wx.hideLoading()
        wx.hideLoading()
        wx.hideLoading()
        wx.stopPullDownRefresh()
        var list;
        if (that.data.list) {
          list = that.data.list.concat(res.data.articleList)
        } else {
          list = res.data.articleList
        }
        that.setData({
          list: list,
          host: app.globalData.serverHost,
          totalPage: res.data.totalPage,
          unreadCount: res.data.unreadCount,
          icons: res.data.categoryList,
          shareInfo: res.data.shareInfo,
          is_hongbao: res.data.is_hongbao
        })
      }
    });
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


  //下拉加载
  onReachBottom: function () {
    this.data.noShow = true;//下拉的时候不显示加载提示框
    this.data.current_page += 1;//当前页默认为1，每次请求前加1
    var totalPage = this.data.totalPage
    if (this.data.current_page <= totalPage) {
      this.request(this.data.current_page);
    } else {
      this.setData({
        more: true
      })
    }
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

  //获得评论信息
  comment: function (e) {
    this.data.art_id = e.currentTarget.dataset.art_id;
    this.data.cateid = e.currentTarget.dataset.cateid;
    this.data.artk = e.currentTarget.dataset.k;
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
        if (res.data.code == 0) {
          wx.hideLoading()
          res.data.curComment[0].nickName = userInfo.nickName
          that.data.list[that.data.artk].comments = that.data.list[that.data.artk].comments.concat(res.data.curComment)
          that.setData({
            list: that.data.list
          })
        } else {
          wx.showToast({
            title: res.data.message,
            icon: 'loading',
            duration: 2002000
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
    this.data.artk = e.currentTarget.dataset.k;
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
          that.data.list[that.data.artk].comments = that.data.list[that.data.artk].comments.concat(res.data.curReply)
          that.setData({
            list: that.data.list
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

  toReleaseDetail: function () {
    wx.navigateTo({
      url: '../releaseinfo/releaseDetail/releaseDetail'
    })
  },

  //打开地图
  toMap: function (e) {
    var address = e.currentTarget.dataset.address;
    var lat = e.currentTarget.dataset.lat;
    var lng = e.currentTarget.dataset.lng;
    wx.openLocation({
      latitude: lat,
      longitude: lng,
      scale: 18,
      name: address
    })
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

  toAll: function () {
    wx.navigateTo({
      url: '../all/all'
    })
  },

  //个人中心
  toOtherperson: function (e) {
    var to_mid = e.currentTarget.dataset.mid;
    wx.navigateTo({
      url: '../otherperson/otherperson?to_mid=' + to_mid
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
          wx.playBackgroundAudio({
            dataUrl: app.globalData.serverHost + '/music/gold.wav',
          })
          wx.showToast({
            title: res.data.message + '个金币',
            icon: 'success',
            image: '/images/money.png',
            duration: 2000
          })
        }
        if (res.data.code == 0) {
          wx.showToast({
            title:'谢谢您的赞',
            image: '/images/hua.png',
            icon: 'success',
            duration: 2000
          })
        }

        that.data.list[k].praise += 1;
        that.setData({
          list: that.data.list
        })

      }
    });
  },

  //删除文章
  delart: function (e) {
    var that = this
    var art_id = e.currentTarget.dataset.art_id;
    var cateid = e.currentTarget.dataset.cateid;
    var k = e.currentTarget.dataset.k;
    wx.showModal({
      title: 'e圈提示',
      content: '您确定要删除此动态',
      success: function (res) {
        if (res.confirm) {
          var data = { art_id: art_id, cateid: cateid };
          request.request({
            method: 'articleDel', data: data, success(res) {
              if (res.data.code == 0) {
                that.data.list.splice(k, 1)
                that.setData({
                  list: that.data.list
                })
              } else {
                wx.showToast({
                  title: res.data.message,
                  image: '/images/ha.png',
                  icon: 'success',
                  duration: 2000
                })
              }
            }
          })
        } else if (res.cancel) {
          //console.log('用户点击取消')
        }
      }
    })

  },

  //文章详情
  artDetail: function (e) {
    var art_id = e.currentTarget.dataset.art_id;
    var dataKey = e.currentTarget.dataset.k;//用来记录数组下标，返回的时候可以浏览量加1
    wx.navigateTo({
      url: '../detail/detail?art_id=' + art_id + '&dataKey=' + dataKey
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
    var gb_id = e.currentTarget.dataset.id;
    var gb_k = e.currentTarget.dataset.k;
    wx.navigateTo({
      url: '../activitydetail/activitydetail?gb_id=' + gb_id + '&gb_k=' + gb_k,
    })
  },

  blockshare: function () {
    this.setData({
      ctrlshare: true
    })
  },

  hiddenshare: function () {
    this.setData({
      ctrlshare: false
    })
  },

  /**
   * 页面的初始数据
   */
  getUnreadInfoCount: function () {
    var that = this
    request.request({
      method: 'getUnreadInfoCount', data: {}, success(res) {
        that.setData({
          'unreadCount': res.data.unreadCount
        })
      }
    })
  },

 /**
   * 查看企业
   */
  openCompany: function (e) {
    var mid = e.currentTarget.dataset.mid;
    var company = e.currentTarget.dataset.company;
    wx.navigateTo({
      url: '../company/company?to_mid=' + mid + "&companyName=" + company
    })
  },

  //发布动态
  toReleaseDetail: function (e) {
    wx.navigateTo({
      url: '../releaseDetail/releaseDetail?cateid=' + 9 + '&detail=发布信息，评论和回复都可以获得经验，被赞可随机获取金币哦！请在指定分类发布相关信息！&catename=同城生活' 
    })
  }

})