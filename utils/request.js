var app = getApp();
var md5 = require('/md5.js');
function request(options)
{
  var timestamp = Date.parse(new Date()) / 1000;
  var access_token = md5.hexMD5(app.globalData.secret_key + timestamp);
  var userInfo = wx.getStorageSync('userInfo');
  var data = { 'timestamp': timestamp, 'access_token': access_token, 'id': userInfo.id, 'skey': userInfo.skey}
  data = Object.assign(data, options.data);
  wx.request({
    url: app.globalData.serverHost + "/index.php/Api/" + options.method,
    data:data,
    header: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: 'POST',
    success: function (res) {
      options.success(res)
    },
    fail:function (){
      request(options)
    }
  }) 
}
module.exports = {
  request: request,
};