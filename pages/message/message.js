// pages/message/message.js
var app = getApp();
var login = require('../../utils/login');
var request = require('../../utils/request.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    current_page: 1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.to_mid = options.to_mid
    wx.setNavigationBarTitle({
      title: options.nickName
    })
    this.request(1);
  },

  /**
   * 获得消息
   */
  request: function (currentPage) {
    var that = this;
    var userInfo = wx.getStorageSync('userInfo');
    var data = { 'to_mid': this.data.to_mid, currentPage: currentPage};
    request.request({
      method: 'getMemberSendMessages', data: data, success(res) {
        wx.stopPullDownRefresh()
       
        var list;
        if (res.data.list) {
          list = res.data.list.reverse()
        } else {
          list = []
        }
        console.log(list)
        if (that.data.list) {
          var newsList = list.reverse();
          list = newsList.concat(that.data.list)
        }

        that.setData({
          list: list,
          totalPage: res.data.totalPage,
          mid: userInfo.mid,
          msg_id: res.data.msg_id
        })
        if (!res.data.list) {
          that.setData({
            empty: 1,
          })
        }
      }
    });
  },

  /**
   * 发送消息
   */
  sendMessage: function (e) {
    var that = this
    var formId = e.detail.formId;
    var content = e.detail.value;
    var userInfo = wx.getStorageSync('userInfo');
    var msg_id = this.data.msg_id ? this.data.msg_id : 0
    var data = { 'formId': formId, 'contents': content.content, 'to_mid': this.data.to_mid, 'msg_id': msg_id };
    request.request({
      method: 'memberSendMessages', data: data, success(res) {
        if (res.data.code == 0) {
          that.setData({
            content: ''
          })
          var info = { mid: userInfo.mid, avatarUrl: userInfo.avatarUrl, from_mid: userInfo.mid, content: content.content }
          if (that.data.list) {
            that.data.list = that.data.list.concat(info)
          } else {
            that.data.list[0] = info
          }
          that.setData({
            list: that.data.list,
            msg_id:res.data.msg_id
          })
          if (that.data.list){
            that.setData({
              empty: 0,
            })
          }

        } else {
          wx.showToast({
            title: res.data.message,
            icon: 'loading',
            duration: 2000
          })
        }

      }
    });
    console.log(e);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

 
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this
    this.data.current_page += 1;//当前页默认为1，每次请求前加1
    var totalPage = this.data.totalPage
    if (this.data.current_page <= totalPage) {
      this.request(this.data.current_page);
    } else {
      wx.stopPullDownRefresh()
      this.setData({
        more: true
      })
      setTimeout(function () {
        that.setData({
          more: false
        })
      }, 1000)
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

 
})