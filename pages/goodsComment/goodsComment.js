var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var md5 = require('../../utils/md5.js');
var request = require('../../utils/request.js');

var app = getApp();
Page({
  data: {
    textareaValue: '',
    inputValue: '',
    images: [],
    dataInfo: {},
    flag: 5
  },

  onLoad: function (option) {
    var userInfo = wx.getStorageSync('userInfo');
    //分类ID
    this.setData({
      catename: option.catename,
      phone: userInfo.phone,
      numbers:option.numbers,
      shop_id:option.shop_id,
      goods_id: option.goods_id
    })
    var that = this;
    //获取当前定位经纬度
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        //调用腾讯地图逆地址解析
        var qqmapsdk = new QQMapWX({
          key: 'BJFBZ-ZFTHW-Y2HRO-RL2UZ-M6EC3-GMF4U'
        });
        qqmapsdk.reverseGeocoder({
          poi_options: 'policy=2',
          get_poi: 1,
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function (res) {
            //当前区域，主要获得市，区
            var data = {
              city: res.result.address_component.city,
              district: res.result.address_component.district,
              address: res.result.formatted_addresses.recommend,
              latitude: res.result.location.lat,
              longitude: res.result.location.lng,
            }
            app.globalData.currentRegion = data;
            var address = res.result.formatted_addresses.recommend;
            that.setData({
              address: address
            })
          }
        });
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
    this.data.info = e.detail.value.info;
    if (this.data.info.length < 10) {
        wx.showModal({
          title: '提示',
          content: '评价不低于10个字',
          showCancel: false
        })
        return false;
    }
    this.uploadFile();
  },

  //发送请求
  request: function (imgPath) {
    wx.showLoading({
      title: '数据提交中...',
      mask: true
    });
    var data = { 'contents': this.data.info, shop_id: this.data.shop_id, numbers: this.data.numbers, goods_id: this.data.goods_id, star_level:this.data.flag}
    data.images = imgPath ? imgPath : ''
    data.formid = this.data.formId
    data.address = app.globalData.currentRegion.address
    console.log(data)
    request.request({
      method: 'goodsComment', data: data, success(res) {
        wx.hideLoading()
        if (res.data.code == 0) {
          wx.showModal({
            title: '提示',
            content: res.data.message,
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                app.globalData.commentSucceed=1
                wx.navigateBack({
                  delta: 1
                })
                // wx.redirectTo({
                //   url: '../refund/refund?numbers=' + numbers + '&shop_id=' + shop_id,
                // })
              }
            }
          })
        
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
    if (this.data.phone) {
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
        if (!e.detail.value.length || e.detail.value.length == 11) {
          this.setData({
            inputValue: 'true'
          })
        } else {
          this.setData({
            inputValue: ''
          })
        }

      } else {
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
  },

  changeColor1:function(){
    var that = this;
    that.setData( {
        flag: 1
    });
  },
  changeColor2:function(){
    var that = this;
    that.setData( {
        flag:2
    });
  },
  changeColor3:function(){
    var that = this;
    that.setData( {
        flag: 3
    });
  },
  changeColor4:function(){
    var that = this;
    that.setData( {
        flag:4
    });
  },
  changeColor5:function(){
    var that = this;
    that.setData( {
        flag: 5
    });
  }

})