//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    avatarUrl: '',
    isShow: false,
    canvasHeight: 120,
    canvasWidth: 120,
    types: ['热门', '萌妹子', '王者', '情侣', "节日"],
    currentTypeIndex: 0,
    isShow: true,
    newAvatar: '',
    imageList: [],
    tempList: [],
    currentItemIndex: null,
    currentType: "热门"
    // hotList: [{
    //     url: '../../image/1.jpg',
    //     mengUrl: '../../image/meng1.png',
    //     text: '萌妹子'
    //   },
    //   {
    //     url: '../../image/2.jpg',
    //     mengUrl: '../../image/meng2.png',
    //     text: '呆萌'
    //   },
    //   {
    //     url: '../../image/3.jpg',
    //     mengUrl: '../../image/meng3.png',
    //     text: '情侣男'
    //   },
    //   {
    //     url: '../../image/4.jpg',
    //     mengUrl: '../../image/meng4.png',
    //     text: '情侣女'
    //   },
    //   {
    //     url: '../../image/07.jpg',
    //     mengUrl: '../../image/07.png',
    //     text: '太难了'
    //   },
    // ],
    // lovelyList: [{
    //     url: '../../image/1.jpg',
    //     mengUrl: '../../image/meng1.png',
    //     text: '萌妹子'
    //   },
    //   {
    //     url: '../../image/2.jpg',
    //     mengUrl: '../../image/meng2.png',
    //     text: '呆萌'
    //   },
    // ],
    // kingList: [],
    // loversList: [{
    //     url: '../../image/3.jpg',
    //     mengUrl: '../../image/meng3.png',
    //     text: '情侣男'
    //   },
    //   {
    //     url: '../../image/4.jpg',
    //     mengUrl: '../../image/meng4.png',
    //     text: '情侣女'
    //   },
    // ],
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function() {
    wx.cloud.callFunction({
      name: "getTemp",
      data: {},
      success: (res) => {
        this.setData({
          imageList: res.result.result.data,
          tempList: res.result.result.data[0].img_list
        })
      }
    })
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  onShow() {
    let avatarUrl = wx.getStorageSync('avatarUrl')
    let widgetsUrl = wx.getStorageSync('widgetsUrl')
    if (avatarUrl) {
      this.drawImage(avatarUrl, widgetsUrl)
    }
  },
  selectWidgets(e) {
    const that = this
    let data = e.currentTarget.dataset
    let avatarUrl = wx.getStorageSync('avatarUrl')
    if (!avatarUrl) {
      wx.showToast({
        title: '点击上方授权头像',
        icon: "none"
      })
      return
    }
    wx.showLoading({
      title: '图片合成中......',
    })
    let widgetsUrl = data.item.temp_img
    this.setData({
      currentItemIndex: data.index
    })
    wx.cloud.getTempFileURL({
      fileList: [widgetsUrl],
      success: res => {
        wx.getImageInfo({
          src: res.fileList[0].tempFileURL,
          success: function(e) {
            that.drawImage(avatarUrl, e.path)
            wx.setStorageSync('widgetsUrl', e.path)
          }
        })
      }
    })
  },
  scroll(e) {},
  changeType(e) {
    let data = e.currentTarget.dataset
    this.setData({
      currentTypeIndex: data.index,
      currentType: data.type,
      tempList: this.data.imageList[data.index].img_list,
      currentItemIndex: null
    })
  },
  selectImg() {
    this.setData({
      isShow: false
    })
  },
  close() {
    this.setData({
      isShow: true
    })
  },
  getUserInfo: function(e) {
    const that = this
    app.globalData.userInfo = e.detail.userInfo
    let avatarUrl = e.detail.userInfo.avatarUrl.replace('/132', "/0")
    wx.setStorageSync('avatarUrl', avatarUrl)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
    that.drawImage(avatarUrl)
  },
  drawImage: function(file, widgetsUrl) {
    const that = this
    wx.showLoading({
      title: '图片合成中......',
    })
    wx.getImageInfo({
      src: file,
      success: function(res) {
        let imgW = res.width
        let imgH = res.height
        let imgPath = res.path
        var context = wx.createCanvasContext('canvas')
        context.drawImage(res.path, 0, 0, imgW, imgH, 0, 0, 180, 180)
        if (widgetsUrl) {
          context.drawImage(widgetsUrl, 0, 0, 180, 180)
        }
        context.draw(false, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              x: 0,
              y: 0,
              width: 180,
              height: 180,
              destWidth: 576,
              destHeight: 576,
              canvasId: 'canvas',
              success(res) {
                wx.hideLoading()
                that.setData({
                  newAvatar: res.tempFilePath,
                  isShow: true
                })
                wx.setStorageSync('newAvatar', res.tempFilePath)
              },
              fail: function(err) {
                wx.hideLoading()
              }
            })
          }, 100)
        })
      }
    })
  },
  onsave: function() {
    const that = this
    let newAvatar = wx.getStorageSync('newAvatar')
    wx.getSetting({
      success(res) {
        if ((typeof res.authSetting['scope.writePhotosAlbum']) == 'undefined') {
          wx.saveImageToPhotosAlbum({
            filePath: that.data.newAvatar || newAvatar,
            success(res) {
              wx.showModal({
                title: '温馨提示',
                content: '图片保存成功，可在相册中查看',
                showCancel: false
              })
            },
            fail: function(err) {
              wx.showModal({
                title: '温馨提示',
                content: '图片保存失败，请重试',
                showCancel: false
              })
            }
          })
        } else if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.openSetting({
            success(res) {
              wx.saveImageToPhotosAlbum({
                filePath: that.data.newAvatar || newAvatar,
                success(res) {
                  wx.showModal({
                    title: '温馨提示',
                    content: '图片保存成功，可在相册中查看',
                    showCancel: false
                  })
                },
                fail: function(err) {
                  wx.showModal({
                    title: '温馨提示',
                    content: '图片保存失败，请重试',
                    showCancel: false
                  })
                }
              })
            }
          })
        } else {
          wx.saveImageToPhotosAlbum({
            filePath: that.data.newAvatar || newAvatar,
            success(res) {
              wx.showModal({
                title: '温馨提示',
                content: '图片保存成功，可在相册中查看',
                showCancel: false
              })
            },
            fail: function(err) {
              wx.showModal({
                title: '温馨提示',
                content: '图片保存失败，请重试',
                showCancel: false
              })
            }
          })
        }
        res.authSetting = {
          "scope.writePhotosAlbum": true,
        }
      }
    })

  },
  onShareAppMessage: function() {
    // 页面被用户分享时执行
    return {
      title: '私人定制，你的专属头像',
      path: '/pages/index/index',
      imageUrl: '../../image/share.jpg'
    }
  },
})