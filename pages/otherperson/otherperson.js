// pages/index/detail/detail.js
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
    ctrlshare: true,
    showCheckCard: true,
    showNav:true
  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function (res) {
    return {
      title: this.data.shareInfo,
      path: '/pages/otherperson/otherperson?to_mid=' + this.data.to_mid,
    }
  },

  onShow: function () {
    //主要是判断是否从文章详情页返回的时候，浏览量加1
    if (app.globalData.dataKey) {
      this.data.list[app.globalData.dataKey].click++
      if (app.globalData.praise) {//如果在详情页点赞了，点赞量也加1
        this.data.list[app.globalData.dataKey].praise++
      }
      this.setData({
        list: this.data.list
      })
      app.globalData.dataKey = ''
      app.globalData.praise = ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var num = getCurrentPages();
    console.log(num)
    if (num.length == 4 || num.length == 3) {
      this.setData({
        showCheckCard: false
      })
    }
    if (num.length == 5) {
      this.setData({
        showNav: false
      })
    }

    this.data.to_mid = options.to_mid
    this.requestMemberInfoAndArticleList(options.to_mid)
  },

  /**
    * 请求用户信息及文章列表
    */
  requestMemberInfoAndArticleList: function (to_mid) {
    var that = this;
    var userInfo = wx.getStorageSync('userInfo')
    if (!userInfo.id) {
      //如果用户信息为空
      this.getUserLoginInfo(to_mid)
      return false
    }
  
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    //mid主要判断显示删除按钮的
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({
      mid: userInfo.mid
    })
    var data = { 'to_mid': to_mid };
    request.request({
      method: 'getMemberInfoAndArtList', data: data, success(res) {
        wx.hideLoading()
        that.data.nickName = res.data.memberInfo.nickName //此处用于转发名称
        that.buildTime(res.data.articleList)
        that.data.list = res.data.articleList
        that.setData({
          memberInfo: res.data.memberInfo,
          list: res.data.articleList,
          host: app.globalData.serverHost,
          totalPage: res.data.totalPage,
          shareInfo: res.data.shareInfo,
          isCard: res.data.isCard,
        })
        if (!res.data.articleList[0]) {
          that.setData({
            empty: true
          })
        }
      }
    })
  },

  //登录
  getUserLoginInfo: function (to_mid) {
    var that = this
    var status = login.login({
      globalData: app.globalData, success(result) {
        if (result) {
          that.onLoad({ 'to_mid': to_mid })
        }
      }
    })
  },

  buildTime: function (data) {
    for (var i in data) {
      if (!isNaN(data[i].created_at)) {
        console.log(data[i].created_at);
        var time = new Date(data[i].created_at * 1000);
        var m = time.getMonth() + 1;
        var d = time.getDate();
        data[i].m = m
        data[i].d = d
        data[i].created_at = ''
      }
    }
  },
  //浏览头像
  clickMemberImage: function (e) {
    var current = e.target.dataset.src;
    var imgs = []
    imgs[0] = current
    wx.previewImage({
      current: current,
      urls: imgs
    });
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
        //console.log(res)
        if (res.data.code == 0) {
          wx.hideLoading()
          res.data.curComment[0].nickName = userInfo.nickName
          that.data.list[that.data.artk].comments = that.data.list[that.data.artk].comments.concat(res.data.curComment)
          that.setData({
            list: that.data.list
          })
        } else {
          wx.showToast({
            title: res.data.messges,
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
    this.data.artk = e.currentTarget.dataset.k;
    this.data.cateid = e.currentTarget.dataset.cateid;
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
        //console.log(res)
        if (res.data.code == 0) {
          wx.hideLoading()
          that.data.list[that.data.artk].comments = that.data.list[that.data.artk].comments.concat(res.data.curReply)
          that.setData({
            list: that.data.list
          })
        } else {
          wx.showToast({
            title: '回复失败了',
            icon: 'loading',
            duration: 2000
          })
        }
      }
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

        that.data.list[k].praise += 1;
        that.setData({
          list: that.data.list
        })

      }
    });
  },

  //上拉刷新
  onPullDownRefresh: function () {
    this.data.list = '';
    this.data.current_page = 1
    this.request(1);

  },


  //下拉加载
  onReachBottom: function () {
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

  //请求文章列表
  request: function (currentPage) {
    var that = this
    var data = { 'currentPage': currentPage, 'to_mid': this.data.to_mid };
    request.request({
      method: 'getArticleMemberList', data: data, success(res) {
        that.buildTime(res.data.articleList)
        var list;
        if (that.data.list) {
          list = that.data.list.concat(res.data.articleList)
        } else {
          list = res.data.articleList
        }
        that.setData({
          list: list,
          host: app.globalData.serverHost,
        })
      }
    });
  },

  //文章详情
  artDetail: function (e) {
    var art_id = e.currentTarget.dataset.art_id;
    var dataKey = e.currentTarget.dataset.k;//用来记录数组下标，返回的时候可以浏览量加1
    wx.navigateTo({
      url: '../detail/detail?art_id=' + art_id + '&dataKey=' + dataKey
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
      scale: 28,
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

  //个人中心
  toOtherperson: function (e) {
    var to_mid = e.currentTarget.dataset.mid;
    wx.navigateTo({
      url: '../otherperson/otherperson?to_mid=' + to_mid
    })
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

  hiddenshare: function () {
    this.setData({
      ctrlshare: false
    })
  },

  /**
   * 查看名片
   */
  openCard: function (e) {
    var mid = e.currentTarget.dataset.mid;
    var nickName = e.currentTarget.dataset.nickname;
    wx.navigateTo({
      url: '../me/meCard/meCard?mid=' + mid + '&nickName=' + nickName,
    })
  },

  /**
   * 交换名片
   */
  cardExchange: function (e) {
    var to_mid = e.currentTarget.dataset.to_mid;
    if (this.data.isCard == 3) {//没有创建自己的名片提示
      wx.showToast({
        title: '请创建自己的名片',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })

      setTimeout(function () {
        wx.navigateTo({
          url: '../me/meCard/meCard',
        })
      }, 2000)
      return false
    }
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
   * 聊天
   */
  sendMessage:function (e){
    var to_mid = e.currentTarget.dataset.to_mid;
    var nickName = e.currentTarget.dataset.nickname;
    wx.navigateTo({
      url: '../message/message?to_mid='+to_mid+'&nickName='+nickName,
    })
  }
})