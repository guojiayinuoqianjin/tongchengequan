// pages/cardLibrary/cardLibrary.js
var app = getApp();
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var login = require('../../utils/login');
var request = require('../../utils/request.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholder: '姓名，职务，公司，主营业务',
    searchkeyword: '',
    current_page: 1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    var userInfo = wx.getStorageSync('userInfo');
    var to_mid = options.to_mid ? options.to_mid : 0;
    this.data.to_mid = to_mid
    var title = to_mid ? 'Ta的人脉' : '同城人脉'
    if (to_mid == userInfo.mid) {
      title="我的人脉"
    }
    wx.setNavigationBarTitle({
      title: title
    })
   
    this.request(1);
  },

  /**
   * 请求
   */
  request: function (currentPage) {
    var that = this
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    var method = this.data.searchkeyword ? 'getCardSearchList' : 'getCardList'
    var data = { to_mid: this.data.to_mid, currentPage: currentPage, keywords: this.data.searchkeyword }
    request.request({
      method: method, data: data, success(res) {
        wx.hideLoading()
        wx.stopPullDownRefresh()
        var list;
        if (that.data.list) {
          list = that.data.list.concat(res.data.list)
        } else {
          list = res.data.list
        }
        that.setData({
          list: list,
          totalPage: res.data.totalPage,
        })
        if (!list[0]) {
          if (that.data.searchkeyword){
            that.setData({
              search: true
            })
          }else{
            that.setData({
              more: true
            })
          }
        }
      }
    });
  },

  /**
     * 查看名片
     */
  openCard: function (e) {
    var mid = e.currentTarget.dataset.mid;
    var num = getCurrentPages();
    console.log(num)
    if(num.length == 3){
      wx.redirectTo({
        url: '../me/meCard/meCard?mid=' + mid,
      })
    }else{
      wx.navigateTo({
        url: '../me/meCard/meCard?mid=' + mid,
      })
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.data.list = '';
    this.data.current_page = 1
    //下拉刷新隐藏没有更多了
    this.setData({
      more: false
    })
    this.request(1);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
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

 
  inputSearch: function (e) {
    var that = this
    // 键盘不断录入绑定取值
    var keyword = e.detail.value;
    
    this.setData({
      searchkeyword: keyword
    });
    this.setData({//搜索提示字
      search: false
    })

    this.setData({//隐藏提示 没有更多
      more: false
    })
    //如果搜索词为空，但前面已经搜索过一次的话，就重新加载此分类数据
    if (!keyword) {
      this.data.list = ''
      this.request(1)
    }
  },

  /**
   * 搜索
   */
  search: function (e) {
    this.data.list = ''
    wx.showLoading({
      title: '搜索中...',
    })

    this.request(1); 
  },
})