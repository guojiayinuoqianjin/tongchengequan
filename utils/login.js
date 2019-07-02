var md5 = require('../utils/md5.js');
var getUserInfo = function getUserInfo(callback) {

  wx.login({
    success: function (code) {
      wx.getUserInfo({
        success: function (res) {
          callback({
            code: code.code,
            encryptedData: res.encryptedData,
            iv: res.iv,
            userInfo: res.userInfo
          })
        },
        fail:function (res){
          callback({
            code: 0,
          })
        }
      })
    }
  });
};

var login = function login(options) {
  var info = getUserInfo(function (wxLoginResult) {

    //如果用户取消授权
    if (wxLoginResult.code == 0){
      options.success(0);
    }

    // 构造请求头，包含 code、encryptedData 和 iv
    var code = wxLoginResult.code;
    var encryptedData = wxLoginResult.encryptedData;
    var iv = wxLoginResult.iv;
    var header = {};
    header['X-WX-Code'] = code;
    header['X-WX-Encrypted-Data'] = encryptedData;
    header['X-WX-IV'] = iv;
    var timestamp = Date.parse(new Date()) / 1000;
    var access_token = md5.hexMD5(options.globalData.secret_key + timestamp);
    // 请求服务器登录地址，获得会话信息
    wx.request({
      url: options.globalData.serverHost + '/index.php/Api/login',
      header: header,
      method: 'post',
      data: { 'timestamp': timestamp, 'access_token': access_token, 'send_mid': options.send_mid },
      success: function (result) {
        var status =2
        var data = result.data.session;
        data.nickName = wxLoginResult.userInfo.nickName;
        data.avatarUrl = wxLoginResult.userInfo.avatarUrl;
        wx.setStorage({
          key: "userInfo",
          data: data
        });
        options.success(data);
        //app.globalData.loginStatus = 1;
      },

      // 响应错误
      fail: function (result) {
        console.log(1111)
      },
    });
  });

};



module.exports = {
  login: login,
};