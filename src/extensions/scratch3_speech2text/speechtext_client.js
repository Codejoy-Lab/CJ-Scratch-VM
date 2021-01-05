const CryptoJS = require('crypto-js')
const Base64 = require('js-base64')


class textSpeechClient {
    // fork for eim client
    // onMessage,
    constructor(
        onConnect,
        onDisconnect
        // onMessage,
        // onAdapterPluginMessage,
        // update_nodes_status,
        // node_statu_change_callback,
        // notify_callback,
        // error_message_callback,
        // update_adapter_status
    ) {
        this.config = {
            // 请求地址
            // const config = {
            // 请求地址
            hostUrl: "wss://rtasr.xfyun.cn/v1/ws",
            //在控制台-我的应用-实时语音转写获取
            appid: "5f9a2331",
            //在控制台-我的应用-实时语音转写获取
            apiKey: "06f854c359bf71140fa3b6a0bcbd77f5",
            file: "./test_1.pcm",//请填写您的音频文件路径
            highWaterMark: 1280

        }
  
        // let date = new Date().toGMTString()
        let ts = parseInt(new Date().getTime() / 1000)

        //set up the signature String
        let wssUrl = this.config.hostUrl + "?appid=" + this.config.appid + "&ts=" + ts + "&signa=" + this.getSigna(ts)
        this.url = wssUrl
        // let ws = new WebSocket(wssUrl)
        // let wssUrl = this.config.hostUrl + "?authorization=" + this.getAuthStr(this.config,date) + "&date=" + date + "&host=" + this.config.host

        // let ws
        // if ('WebSocket' in window) {
        //     ws = new WebSocket(wssUrl);
        // } else if ('MozWebSocket' in window) {
        //     ws = new MozWebSocket(wssUrl)
        // } else {
        //     alert('浏览器不支持WebSocket')
        // }
        // this.ws = ws
        // ws.onerror=function(data){
        // console.log("失败")
        // }
        // this.audio = []
        // var _this = this
        // ws.onopen=function(evt){
        //     console.log("打开链接了")
        //     if (typeof onConnect === "function") {
        //         onConnect(); // 回调外部函数，onConnect可以是空的，忽视
        //     } else {
        //         console.log("onConnect is not function");
        //     }
        //     this.connected = true;
        //     // console.log()
        //     // _this.sendRequestTo()
        // }
        
        // ws.onmessage=function(evt){
        //     let res = JSON.parse(evt.data)
        //     console.log('evt.data.audio',evt)
        //     // _this.audio = Buffer.from(res.data.audio, 'base64')
        //     // console.log('audioBuf',audioBuf)
            
        // }

        
       
     }

     getSigna(ts) {
        let md5 = CryptoJS.MD5(this.config.appid + ts).toString()
        let sha1 = CryptoJS.HmacSHA1(md5, this.config.apiKey)
        let base64 = CryptoJS.enc.Base64.stringify(sha1)
        return encodeURIComponent(base64)
      }
    //  getAuthStr(config,date) {
    //     let signatureOrigin = `host: ${config.host}\ndate: ${date}\nGET ${config.uri} HTTP/1.1`
    //     let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret)
    //     let signature = CryptoJS.enc.Base64.stringify(signatureSha)
    //     let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    //     let authStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin))
    //     return authStr
    // }

    sendRequestTo(words,voice){
        console.log("开始合成")
        var params = {
            "common": {
                "app_id": this.config.appid
            },
            // 填充business
            "business": {
                "aue": "lame",
                "auf": "audio/L16;rate=16000",
                "vcn": voice,//"aisjiuxu",
                "tte": "UTF8"
            },
            // 填充data
            "data": {
                "text": Buffer.from(words).toString('base64'),
                "status": 2
            }
          }
        this.ws.send(JSON.stringify(params))
        // return this.audio
    }

    encodeText (text, encoding) {
        switch (encoding) {
          case 'utf16le' : {
            let buf = new ArrayBuffer(text.length * 4)
            let bufView = new Uint16Array(buf)
            for (let i = 0, strlen = text.length; i < strlen; i++) {
              bufView[i] = text.charCodeAt(i)
            }
            return buf
          }
          case 'buffer2Base64': {
            let binary = ''
            let bytes = new Uint8Array(text)
            let len = bytes.byteLength
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i])
            }
            return window.btoa(binary)
          }
          case 'base64&utf16le' : {
            return this.encodeText(this.encodeText(text, 'utf16le'), 'buffer2Base64')
          }
          default : {
            return Base64.encode(text)
          }
        }
      }
}

// window.AdapterBaseClient = AdapterBaseClient;
module.exports = textSpeechClient;
