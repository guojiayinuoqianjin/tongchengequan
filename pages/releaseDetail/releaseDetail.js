var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var md5 = require('../../utils/md5.js');
var request = require('../../utils/request.js');
var amapFile = require('../../utils/amap-wx.js');


var app = getApp();
Page({
  data: {
    textareaValue: '',
    inputValue: '',
    images: [],
    dataInfo: {}
  },

  onLoad: function (option) {
    var that = this;
    var userInfo = wx.getStorageSync('userInfo');
    //分类ID
    this.setData({
      cateid: option.cateid,
      detail: option.detail,
      catename: option.catename,
      phone: userInfo.phone,
    })
    var bmapKey = app.globalData.bmapKey
    var myAmapFun = new amapFile.AMapWX({ key: bmapKey });
    myAmapFun.getRegeo({
      iconPath: "../../img/marker.png",
      iconWidth: 22,
      iconHeight: 32,
      success: function (data) {
        console.log(data)
        var datas = {
          city: data[0].regeocodeData.addressComponent.city,
          district: data[0].regeocodeData.addressComponent.district,
          address: data[0].regeocodeData.pois[0].name,
          latitude: data[0].latitude,
          longitude: data[0].longitude,
        }
        app.globalData.currentRegion = datas;
        that.setData({
          address: data[0].regeocodeData.pois[0].name
        })
      }
    })
  },

  //上传图片
  getUploadFile: function () {
    var that = this;

    //限制图片每次上传的数量，一共不能超过6张
    var imgCount;
    if (app.globalData.imglist) {
      imgCount = app.globalData.imglist.tempFilePaths.length;
    } else {
      imgCount = 0;
    }
    var counts = 6 - imgCount;

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
          res.tempFilePaths = res.tempFilePaths.concat(app.globalData.imglist.tempFilePaths)
          res.tempFiles = res.tempFiles.concat(app.globalData.imglist.tempFiles)

          //放到公共数据
          app.globalData.imglist = res;
        } else {
          app.globalData.imglist = res;
        }

        //图片数量不能超过6张
        if (app.globalData.imglist.tempFilePaths.length >= 6) {
          that.setData({
            satisfy: 1
          })
        }

        that.setData({
          tempFilePaths: res.tempFilePaths
        })

      }
    })
  },

  //上传图片
  uploadFile: function () {
    wx.showLoading({
      title: '图片上传中...',
      mask: true
    });
    var that = this;
    var imgList = app.globalData.imglist;
    var timestamp = Date.parse(new Date()) / 1000;
    var access_token = md5.hexMD5(app.globalData.secret_key + timestamp);
    var userInfo = wx.getStorageSync('userInfo');
    var data;
    data = { 'timestamp': timestamp, 'access_token': access_token, 'id': userInfo.id, 'skey': userInfo.skey };

    if (imgList) {
      var v = 0;
      for (var i in imgList.tempFilePaths) {
        wx.uploadFile({
          url: app.globalData.serverHost + "/index.php/Api/uploadImg",
          filePath: imgList.tempFilePaths[i],
          name: 'myfile',
          formData: data,
          success: function (res) {
            var files = app.globalData.imglist.tempFilePaths.length
            that.data.images[v] = res.data
            if (files == that.data.images.length) {
              wx.hideLoading()
              that.request(that.data.images)
              that.data.images = []
            }
            v++
          }
        })
      }
    } else {
      that.request()
    }
  },

  //浏览图片
  clickImage: function (e) {
    var current = e.target.dataset.src;
    wx.previewImage({
      current: current,
      urls: app.globalData.imglist.tempFilePaths
    });
  },

  //提交表单
  formSubmit: function (e) {
    this.data.formId = e.detail.formId;//发送模板消息
    this.data.dataInfo = e.detail.value;
    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
    if (this.data.dataInfo.phone){
      if (!myreg.test(this.data.dataInfo.phone)) {
        wx.showModal({
          title: '提示',
          content: '请输入有效的手机号码！',
          showCancel: false
        })
        return false;
      }
    }
    this.uploadFile();
  },

  //发送请求
  request: function (imgPath) {
    wx.showLoading({
      title: '数据提交中...',
      mask: true
    });
    var data = this.data.dataInfo
    data.images = imgPath ? imgPath : ''
    data.formid = this.data.formId
    data.address = app.globalData.currentRegion.address
    data.lat = app.globalData.currentRegion.latitude
    data.lng = app.globalData.currentRegion.longitude
    data.city = app.globalData.currentRegion.city
    data.district = app.globalData.currentRegion.district
    request.request({
      method: 'createData', data: data, success(res) {
        console.log(res)
        wx.hideLoading()
        wx.hideLoading()
        if (res.data.code == 0) {
          app.globalData.skip = 1
          if (res.data.empirical != true){
            wx.showToast({
              title: '发布成功 经验 +'+res.data.empirical,
              icon: 'success',
              duration: 2000
            })
          }else{
            wx.showToast({
              title: '发布成功',
              icon: 'success',
              duration: 2000
            })
          }
          setTimeout(function () {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 2000)
        }else{
          wx.showModal({
            title: '提示',
            content: res.data.message,
            showCancel: false
          })
         }
      }
    });

  },

  //删除图片
  deletePic: function (e) {
    var that = this;
    var k = e.currentTarget.dataset.k;
    wx.showModal({
      title: '提示',
      content: '是否要删除这张图片',
      success: function (res) {
        if (res.confirm) {
          app.globalData.imglist.tempFilePaths.splice(k, 1);
          app.globalData.imglist.tempFiles.splice(k, 1);
          that.setData({
            tempFilePaths: app.globalData.imglist.tempFilePaths,
            satisfy: ''
          })
        } else if (res.cancel) {
          // console.log('用户点击取消')
        }
      }
    })

  },

  //关闭页面删除全局里的图片列表
  onUnload: function () {
    app.globalData.imglist = '';
  },

  //判断是否有内容
  textareaValue: function (e) {
    this.setData({
      textareaValue: e.detail.value
    })
   
    //只有同城朋友和婚恋 才不判断手机号就可以提交
    if (this.data.cateid == 9 || this.data.cateid == 10) {
      this.setData({
        inputValue: 'true'
      })
    }
  
    //如果默认有手机号就可以提交
    if (this.data.phone){
      this.setData({
        inputValue: 'true'
      })
    }
  },

  //判断手机号长度
  inputValue: function (e) {
    this.data.phone = e.detail.value
    if (e.detail.value.length == 11) {
      this.setData({
        inputValue: e.detail.value,
      })
    } else {
      //只有同城朋友和婚恋 才不判断手机号就可以提交
      if (this.data.cateid == 9 || this.data.cateid == 10) {
        //如果手机为空，或者为11位，可以提交，否则不能提交
        if (!e.detail.value.length || e.detail.value.length == 11){
          this.setData({
            inputValue: 'true'
          })
        }else{
          this.setData({
            inputValue: ''
          })
        }
        
      }else{
        this.setData({
          inputValue: ''
        })
      }
      
    }
  },

  //获取选择地址
  chooseLocation: function () {
    var that = this;
    wx.chooseLocation({
      success: function (res) {
        app.globalData.currentRegion.address = res.address;
        app.globalData.currentRegion.latitude = res.latitude;
        app.globalData.currentRegion.longitude = res.longitude;
        that.setData({
          address: res.address
        })
      }
    })
  }

})