// pages/companyEdit/companyEdit.js
var app = getApp();
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var request = require('../../utils/request.js');
var login = require('../../utils/login');
var WxParse = require('../../wxParse/wxParse.js');
var md5 = require('../../utils/md5.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    logoTempFilePaths: [],
    bannerTempFilePaths: [],
    productTempFilePaths: [],
    toLogoTempFilePaths: [],
    toBannerTempFilePaths: [],
    toProductTempFilePaths: [],

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.companyEdit) {
      this.buildImgPath(app.globalData.companyInfo.logoImages, 'logo')
      this.buildImgPath(app.globalData.companyInfo.bannerImages, 'banner')
      this.buildImgPath(app.globalData.companyInfo.productImages, 'product')
      this.setData({
        companyEdit: options.companyEdit,
        intro: app.globalData.companyInfo.intro,
      })
    }
  },

  /**
   * 构建图片路径
   */
  buildImgPath: function (imgList, types) {
    for (var i in imgList) {
      imgList[i] = app.globalData.serverHost + imgList[i]
    }
    if (types == 'logo') {
      this.setData({
        logoTempFilePaths: imgList,
      })
    }
    if (types == 'banner') {
      this.setData({
        bannerTempFilePaths: imgList,
      })
    }
    if (types == 'product') {
      this.setData({
        productTempFilePaths: imgList,
      })
    }
  },

  /**
   * 上传图片
   */
  getUploadFile: function (e) {
    var that = this;
    var count = e.currentTarget.dataset.count; //总数量
    var types = e.currentTarget.dataset.types;
    if (types == 'logo') {
      this.data.imgList = this.data.logoTempFilePaths ? this.data.logoTempFilePaths : {}
    }

    if (types == 'banner') {
      this.data.imgList = this.data.bannerTempFilePaths ? this.data.bannerTempFilePaths : {}
    }

    if (types == 'product') {
      this.data.imgList = this.data.productTempFilePaths ? this.data.productTempFilePaths : {}
    }

    //限制图片每次上传的数量
    var imgCount; //已经上传过的数量
    if (this.data.imgList.length) {
      imgCount = this.data.imgList.length;
    } else {
      imgCount = 0;
    }
    var counts = count - imgCount;
    //打开像册
    wx.chooseImage({
      count: counts,
      sizeType: ['compressed'],
      success: function (res) {
        var length = res.tempFilePaths.length
        var imgid = [];
        var k = 0;

        //判断单个图片不能超过 500K
        if (length > 1) {
          for (var i in res.tempFiles) {
            if (res.tempFiles[i].size > 512000) {
              imgid[i] = i;
              delete res.tempFilePaths[i]
              delete res.tempFiles[i]
              k++
            }
          }
        } else {
          if (res.tempFiles[0].size > 512000) {
            imgid[i] = 0;
            delete res.tempFilePaths[0]
            delete res.tempFiles[0]
            k++
          }
        }

        //删除下标
        if (imgid.length != 0) {
          for (var i = 0; i < res.tempFilePaths.length; i++) {
            if (!res.tempFilePaths[i]) {
              res.tempFilePaths.splice(imgid[i], 1);
              res.tempFiles.splice(imgid[i], 1);
              i--
            }
          }

          wx.showModal({
            title: '提示',
            content: '有' + k + '张图片太大了，无法上传',
            success: function (res) {
              if (res.confirm) {

              }
            }
          })
        }

        if (imgCount != 0) {
          res.tempFilePaths = res.tempFilePaths.concat(that.data.imgList)
          // res.tempFiles = res.tempFiles.concat(that.data.imgList)
          //放到公共数据
          that.data.imgList = res.tempFilePaths;

        } else {
          that.data.imgList = res.tempFilePaths;
        }
        //logo图片
        if (types == 'logo') {
          that.setData({
            logoTempFilePaths: res.tempFilePaths,
            logoTempFiles: res.tempFiles
          })
        }

        //banner图片
        if (types == 'banner') {
          that.setData({
            bannerTempFilePaths: res.tempFilePaths,
            bannerTempFiles: res.tempFiles
          })
        }

        if (types == 'product') {
          that.setData({
            productTempFilePaths: res.tempFilePaths,
            productTempFiles: res.tempFiles
          })
        }
      }
    })
  },


  /**
   * 删除图片
   */
  deletePic: function (e) {
    var that = this;
    var k = e.currentTarget.dataset.k;
    var types = e.currentTarget.dataset.types;
    wx.showModal({
      title: '提示',
      content: '是否要删除这张图片',
      success: function (res) {
        if (res.confirm) {
          if (types == 'logo') {
            var imgPath = that.data.logoTempFilePaths[k]
            that.data.logoTempFilePaths.splice(k, 1);
            if (that.data.logoTempFiles) {
              that.data.logoTempFiles.splice(k, 1);
            }
            that.setData({
              logoTempFilePaths: that.data.logoTempFilePaths,
            })
          }

          if (types == 'banner') {
            var imgPath = that.data.bannerTempFilePaths[k]
            that.data.bannerTempFilePaths.splice(k, 1);
            if (that.data.bannerTempFiles) {
              that.data.bannerTempFiles.splice(k, 1);
            }
            that.setData({
              bannerTempFilePaths: that.data.bannerTempFilePaths,
            })
          }

          if (types == 'product') {
            var imgPath = that.data.productTempFilePaths[k]
            that.data.productTempFilePaths.splice(k, 1);
            if (that.data.productTempFiles) {
              that.data.productTempFiles.splice(k, 1);
            }
            that.setData({
              productTempFilePaths: that.data.productTempFilePaths,
            })
          }
          if (that.data.companyEdit == 1) {
            that.deleteRequest(types, imgPath, k)
          }
        } else if (res.cancel) {
          // console.log('用户点击取消')
        }
      }
    })
  },

  /**
    * 删除数据库图片
    */
  deleteRequest: function (types, imgPath, k) {
    console.log(k)
    console.log(types)
    console.log(imgPath.substring(28))
    var data = { types: types, imgPath: imgPath.substring(28), key: k }
    request.request({
      method: 'deleteCompanyImg', data: data, success(res) {

      }
    });

  },

  /**
    * 提交表单
    */
  formSubmit: function (e) {
    this.data.formId = e.detail.formId;//发送模板消息
    this.data.dataInfo = e.detail.value;
    if (!this.data.dataInfo.intro) {
      wx.showToast({
        title: '必须填写公司介绍',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }

    if (this.data.dataInfo.intro.length < 10) {
      wx.showToast({
        title: '简介最少10个字符',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }

    if (!this.data.bannerTempFilePaths.length) {
      wx.showToast({
        title: '请上传banner图',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }

    if (!this.data.productTempFilePaths.length) {
      wx.showToast({
        title: '请上传产品图',
        image: '/images/ha.png',
        icon: 'success',
        duration: 2000
      })
      return false
    }

    this.uploadFile('logo', this.data.logoTempFilePaths);

  },

  /**
   * 上传图片
   */
  uploadFile: function (types, imgList) {
    //console.log(imgList)
    wx.showLoading({
      title: '图片上传中...',
      mask: true
    });
  
    var that = this;
    var timestamp = Date.parse(new Date()) / 1000;
    var access_token = md5.hexMD5(app.globalData.secret_key + timestamp);
    var userInfo = wx.getStorageSync('userInfo');
    var count = imgList.length
    var data;

    data = { 'timestamp': timestamp, 'access_token': access_token, 'id': userInfo.id, 'skey': userInfo.skey };
    if (imgList.length) {
      var v = 0;
      for (var i = 0; i < count; i++) {
        if (imgList[i].substring(0, 5) == 'https' && types == 'logo') {
          that.data.toLogoTempFilePaths[i] = imgList[i].substring(28)
          that.uploadFile('banner', that.data.bannerTempFilePaths);
          return false
        }

        if (imgList[i].substring(0, 5) == 'https' && types == 'banner') {
          that.data.toBannerTempFilePaths[i] = imgList[i].substring(28)
          if (that.data.toBannerTempFilePaths.length == count) {
            that.uploadFile('product', that.data.productTempFilePaths);
            return false
          }else{
            continue
          }
        }

        if (imgList[i].substring(0, 5) == 'https' && types == 'product') {
          that.data.toProductTempFilePaths[i] = imgList[i].substring(28)
          if (that.data.toProductTempFilePaths.length == count) {
            setTimeout(function () {
              that.request()
            }, 1000)
            return false
          }else{
            continue
          }
        }
     
        wx.uploadFile({
          url: app.globalData.serverHost + "/index.php/Api/companyUploadImg",
          filePath: imgList[i],
          name: 'myfile',
          formData: data,
          success: function (res) {
            if (types == 'logo') {
              that.data.toLogoTempFilePaths[v] = res.data
              if (that.data.toLogoTempFilePaths.length == count) {
                that.uploadFile('banner', that.data.bannerTempFilePaths);
                return false
              }
            }

            if (types == 'banner') {
              that.data.toBannerTempFilePaths[v] = res.data
              if (that.data.toBannerTempFilePaths.length == count && v == count-1) {
                that.uploadFile('product', that.data.productTempFilePaths);
                return false
              }
            }

            if (types == 'product') {
              that.data.toProductTempFilePaths[v] = res.data
              if (that.data.toProductTempFilePaths.length == count && v == count - 1) {
                setTimeout(function () {
                  that.request()
                }, 1000)
                return false
              }
            }
            v++
          }
        })
      }
    } else {
      that.uploadFile('banner', that.data.bannerTempFilePaths);
    }
  },

  //发送请求
  request: function () {
    wx.showLoading({
      title: '数据提交中...',
      mask: true
    });
    var userInfo = wx.getStorageSync('userInfo')
    var data = this.data.dataInfo
    data.logoImages = this.data.toLogoTempFilePaths ? this.data.toLogoTempFilePaths : ''
    data.bannerImages = this.data.toBannerTempFilePaths ? this.data.toBannerTempFilePaths : ''
    data.productImages = this.data.toProductTempFilePaths ? this.data.toProductTempFilePaths : ''
    data.formid = this.data.formId
   
    request.request({
      method: 'createCompany', data: data, success(res) {
        wx.hideLoading()
        if (res.data.code == 0) {
          wx.showToast({
            title: '发布成功',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function () {
            wx.redirectTo({
              url: '../company/company?to_mid=' + userInfo.mid
            })
          }, 2000)
        } else {
          wx.showModal({
            title: '提示',
            content: res.data.message,
            showCancel: false
          })
        }
      }
    });

  },

  /**
   * 浏览图片
   */
  clickImage: function (e) {
    var current = e.target.dataset.src;
    wx.previewImage({
      current: current,
      urls: this.data.imglist
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})