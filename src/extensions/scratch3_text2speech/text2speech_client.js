// const io = require("socket.io-client");
var WebSocketClient = require('websocket').client;
const hmacSHA256 = require("crypto-js/hmac-sha256")
const Base64 =  require('crypto-js/enc-base64');
const base64 = require('js-base64')

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
        const API_KEY = "23dbdbe0fa3850c06e4851297fe1b385"
        const API_SECRET = "6d55ab4e8ea85f5c19eb6968e425d9df"
        const algorithm = "hmac-sha256"
        const URL = "ws://tts-api.xfyun.cn/v2/tts"
        //get time of sign
        let date = new Date().toGMTString()

        //set up the signature String
        let signStr = "host: "+"tts-api.xfyun.cn"+"\n"+"date: "+date+"\n"+"GET "+"/v2/tts"+" HTTP/1.1"
        let sha = hmacSHA256(signStr,API_SECRET)

        let signature = Base64.stringify(sha)
        console.log('signature',signature)

        let authorization_origin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="host date request-line", signature="${signature}"`
        authorization = base64.encode(authorization_origin)
        console.log('authorization',authorization)
        // this._requestID = 0;
        // this._promiseResolves = {};

        // const url = new URL(window.location.href);
        // // let adapterHost = url.searchParams.get("adapter_host"); // 支持树莓派(分布式使用)
        // // if (!adapterHost) {
        // //     adapterHost = window.__static
        // //         ? "127.0.0.1"
        // //         : "codelab-adapter.codelab.club";
        // // }
        // // console.log("adapterHost",)
        // // this.adapterHost = adapterHost;
        // const urlParams = new URLSearchParams(window.location.search);
        // const token =urlParams.get("token");
        // var client = new WebSocketClient();
        var ws = new WebSocket(`${URL}?authorization=${authorization}`)

        ws.onopen = function(evt) {
            console.log('Connection open ...');
            // ws.send('Hello WebSockets!');
          };
          
          ws.onmessage = function(evt) {
            console.log('Received Message: ' + evt.data);
            ws.close();
          };
          
          ws.onclose = function(evt) {
            console.log('Connection closed.');
          };

        // console.log('URL',URL)
        // this.socket = io(
        //     `${URL}?authorization=${authorization}`,
        //         {
        //             transports: ["websocket"],
        //         }
            
        // );
        // // console.log("this.socket",this.socket)
        this.connected = false;

        // this.socket.on("connect", (res) => {
        //     console.log('res',res)
        //     // 主动发起获取插件状态的请求，发出一则消息
        //     // console.log("socket connect ->", reason);
        //     // this.nodes_status_trigger();
        //     // let onConnect = '';
        //     // if (typeof onConnect === "function") {
        //     //     onConnect(); // 回调外部函数，onConnect可以是空的，忽视
        //     // } else {
        //     //     console.log("onConnect is not function");
        //     // }
        //     this.connected = true;
        // });
        // this.socket.on("disconnect", (reason) => {
        //     if (typeof onDisconnect === "function") {
        //         onDisconnect(reason);
        //     }
        //     this.connected = false;
        // });

        // on message
    //     this.socket.on("sensor", (msg) => {
    //         // actuator: to scratch
    //         console.log("recv(all message):", msg.message);
    //         if (typeof onMessage === "function") {
    //             onMessage(msg);
    //         }
    //         const topic = msg.message.topic;
    //         const content = msg.message.payload.content;
    //         const message_id = msg.message.payload.message_id;
    //         // console.log('topic ->', topic);
    //         switch (topic) {
    //             case ADAPTER_STATUS_TOPIC: {
    //                 // if (msg.message.topic === this.ADAPTER_STATUS_TOPIC) {
    //                 console.log("adapter core info:", content);
    //                 // this.version = content.version;
    //                 if (typeof update_adapter_status === "function") {
    //                     update_adapter_status(content);
    //                 }
    //                 break;
    //             }
    //             case NODES_STATUS_TOPIC: {
    //                 // 所有 plugin 的状态信息 初始化触发一次
    //                 // parents: this.adapter_client. trigger for nodes status
    //                 // console.debug("NODES_STATUS_TOPIC message");
    //                 if (typeof update_nodes_status === "function") {
    //                     // console.debug("callback update_nodes_status")
    //                     update_nodes_status(content);
    //                 }
    //                 // console.debug("NODES_STATUS_TOPIC messsage end");
    //                 break;
    //             }
    //             // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/switch
    //             // 如果没有break，则自动运行 已匹配到case的下一个 case
    //             case NODE_STATU_CHANGE_TOPIC: {
    //                 // update extension status(start/stop  open/close)
    //                 const extension_node_name = msg.message.payload.node_name; //node or extension
    //                 // extension or node
    //                 console.log("extension_node_name:", extension_node_name);
    //                 if (typeof node_statu_change_callback === "function") {
    //                     node_statu_change_callback(
    //                         extension_node_name,
    //                         content
    //                     );
    //                 }
    //                 break;
    //             }

    //             case NOTIFICATION_TOPIC: {
    //                 // todo content.type
    //                 const type = msg.message.payload.type.toLowerCase();
    //                 const html = msg.message.payload.html;
    //                 console.log("notification:", msg.message.payload);
    //                 // alert(content);

    //                 if (html == true) {
    //                     let notify_message = {
    //                         dangerouslyUseHTMLString: true,
    //                         message: content,
    //                         duration: 0,
    //                     };
    //                     if (typeof notify_callback === "function") {
    //                         notify_callback(notify_message);
    //                     }
    //                     return; //不再往下走
    //                 }

    //                 if (type === "error") {
    //                     // show error
    //                     let error_message = {
    //                         // html ?
    //                         showClose: true,
    //                         duration: 5000,
    //                         message: content,
    //                         type: type, // warning
    //                     };
    //                     if (typeof error_message_callback === "function") {
    //                         error_message_callback(error_message);
    //                     }
    //                 } else {
    //                     let notify_message = {
    //                         message: content,
    //                         type: type, // warning
    //                     };
    //                     if (typeof notify_callback === "function") {
    //                         notify_callback(notify_message);
    //                     }
    //                 }
    //                 if (content == "download successfully!") {
    //                     this.nodes_status_trigger();
    //                 }
    //                 break;
    //             }
    //             case ADAPTER_TOPIC: {
    //                 // console.log("ADAPTER_TOPIC message");
    //                 if (typeof onAdapterPluginMessage === "function") {
    //                     onAdapterPluginMessage(msg);
    //                 }
    //                 // window.message = msg; // to global
    //                 console.log(
    //                     `ADAPTER_TOPIC message->`,
    //                     content
    //                 );
    //                 // 处理对应id的resolve
    //                 if (typeof message_id !== "undefined") {
    //                     this._promiseResolves[message_id] &&
    //                         this._promiseResolves[message_id](
    //                             content
    //                         );
    //                 }
    //                 break;
    //             }
    //         }
    //     });
     }

    
}

// window.AdapterBaseClient = AdapterBaseClient;
module.exports = textSpeechClient;
