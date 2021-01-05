const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const formatMessage = require("format-message");
const AdapterBaseClient = require("../scratch3_eim/codelab_adapter_base.js");

const blockIconURI = 
"data:image/png;base64,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"//require('./icon_logo.png');
const menuIconURI = blockIconURI;
/**
 * Enum for button parameter values.
 * @readonly
 * @enum {string}
 */

const NODE_ID = "eim/tello";
const HELP_URL = 'https://adapter.codelab.club/extension_guide/tello/';

// 翻译
const FormHelp = {
  en: "help",
  "zh-cn": "帮助",
};

class Client {
  onAdapterPluginMessage(msg) {
      this.node_id = msg.message.payload.node_id;
      if (this.node_id === this.NODE_ID) {
          // json 数据, class

          this.adapter_node_content_hat = msg.message.payload.content;
          this.adapter_node_content_reporter = msg.message.payload.content;
          console.log("content ->", msg.message.payload.content);
      }
  }

  constructor(node_id, help_url) {
      this.NODE_ID = node_id;
      this.HELP_URL = help_url;

      this.adapter_base_client = new AdapterBaseClient(
          null, // onConnect,
          null, // onDisconnect,
          null, // onMessage,
          this.onAdapterPluginMessage.bind(this), // onAdapterPluginMessage,
          null, // update_nodes_status,
          null, // node_statu_change_callback,
          null, // notify_callback,
          null, // error_message_callback,
          null // update_adapter_status
      );
  }
}

class Scratch3TelloBlocks {
  constructor(runtime) {
    this.client = new Client(NODE_ID, HELP_URL);
  }

  /**
   * The key to load & store a target's test-related state.
   *
   */
  static get STATE_KEY() {
    return "Scratch.cxtello";
  }

  get CMDMENU_INFO () {
    return [
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.up',
            default: 'up',
            description: ''
          }),
          value: 'up'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.down',
            default: 'down',
            description: ''
          }),
          value: 'down'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.left',
            default: 'left',
            description: ''
          }),
          value: 'left'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.right',
            default: 'right',
            description: ''
          }),
          value: 'right'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.forward',
            default: 'forward',
            description: ''
          }),
          value: 'forward'
        },
        {
          name: formatMessage({
            id: 'cxtello.cmdmenu.back',
            default: 'back',
            description: ''
          }),
          value: 'back'
        }
    ];
  }

  get CWMENU_INFO () {
    return [
      {
        name: formatMessage({
          id: 'cxtello.cwmenu.cw',
          default: 'cw',
          description: ''
        }),
        value: 'cw'
      },
      {
        name: formatMessage({
          id: 'cxtello.cwmenu.ccw',
          default: 'ccw',
          description: ''
        }),
        value: 'ccw'
      }
    ]
  }

  get DIRECTIONMENU () {
    return [
      {
        name: formatMessage({
          id: 'cxtello.directionmenu.l',
          default: 'left',
          description: ''
        }),
        value: 'l'
      },
      {
        name: formatMessage({
          id: 'cxtello.directionmenu.r',
          default: 'right',
          description: ''
        }),
        value: 'r'
      },
      {
        name: formatMessage({
          id: 'cxtello.directionmenu.b',
          default: 'back',
          description: ''
        }),
        value: 'b'
      },
      {
        name: formatMessage({
          id: 'cxtello.directionmenu.f',
          default: 'forward',
          description: ''
        }),
        value: 'f'
      }
    ]
  }

  _buildMenu (info) {
    return info.map((entry, index) => {
        const obj = {};
        obj.text = entry.name;
        obj.value = entry.value || String(index + 1);
        return obj;
    });
  }

  _setLocale() {
    let now_locale = "";
    switch (formatMessage.setup().locale) {
        case "en":
            now_locale = "en";
            break;
        case "zh-cn":
            now_locale = "zh-cn";
            break;
        default:
            now_locale = "zh-cn";
            break;
    }
    return now_locale;
  }
  /**
   * @returns {object} metadata for this extension and its blocks.
   */
  getInfo() {
    let the_locale = this._setLocale();
    return {
      id: "cxtello",
      name: "tello",
      colour: '#ff641d',
      colourSecondary: '#c94f18',
      colourTertiary: '#c94f18',
      menuIconURI: menuIconURI,
      blockIconURI: blockIconURI,
      blocks: [
        {
          opcode: "open_help_url",
          blockType: BlockType.COMMAND,
          text: FormHelp[the_locale],
          arguments: {},
        },
        {
          opcode: "verify_the_SSL_certificate",
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: "verify [hass_https]",
            id: "tello.verify",
            description: "verify the SSL certificate"
          }),
          arguments: {
            hass_https: {
              type: ArgumentType.STRING,
              defaultValue: `https://${this.client.adapter_base_client.adapterHost}:12358`
            }
          }
        },
        {
          opcode: "control_extension",
          blockType: BlockType.COMMAND,
          text: formatMessage({
              id: "cxtello.control_extension",
              default: "[turn] [ext_name]",
              description:
                  "turn on/off the extension of codelab-adapter",
          }),
          arguments: {
              turn: {
                  type: ArgumentType.STRING,
                  defaultValue: "start",
                  menu: "turn",
              },
              ext_name: {
                  type: ArgumentType.STRING,
                  defaultValue: "extension_tello",
              },
          },
      },
        {
          opcode: 'command',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.command',
              default: 'enable SDK',
              description: 'command'
            }),
            description: ''
          })
        },
        {
          opcode: 'takeoff',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.takeoff',
              default: 'take off',
              description: 'takeoff'
            }),
            description: ''
          })
        },
        {
          opcode: 'land',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.land',
              default: 'land',
              description: 'land'
            }),
            description: ''
          })
        },
        {
          opcode: 'streamon',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.streamon',
              default: 'video stream on',
              description: 'streamon'
            }),
            description: ''
          })
        },
        {
          opcode: 'streamoff',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.streamoff',
              default: 'video stream off',
              description: 'streamoff'
            }),
            description: ''
          })
        },
        {
          opcode: 'emergency',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.emergency',
              default: 'emergency',
              description: 'emergency'
            }),
            description: ''
          })
        },
        {
          opcode: 'movecmd',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.up',
              default: 'move [CMD] [DISTANCE] cm',
              description: 'up'
            }),
            description: ''
          }),
          arguments: {
            DISTANCE: {
              type: ArgumentType.STRING,
              defaultValue: formatMessage({
                  id: 'cxtello.actionMenu.DISTANCE',
                  default: '20',
                  description: 'cxtello.actionMenu.DISTANCE'
              })
            },
            CMD: {
              type: ArgumentType.STRING,
              menu: 'cmdmenu',
              defaultValue: 'up'
            }
          }
        },
        {
          opcode: 'cwcmd',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.cw',
              default: 'clockwise/anticlockwise [CMD] [DEGREE] °',
              description: 'cw'
            }),
            description: '转向飞 x °'
          }),
          arguments: {
            DEGREE: {
              type: ArgumentType.STRING,
              defaultValue: formatMessage({
                  id: 'cxtello.actionMenu.DEGREE',
                  default: '45',
                  description: 'cxtello.actionMenu.DEGREE'
              })
            },
            CMD: {
              type: ArgumentType.STRING,
              menu: 'cwcmdmenu',
              defaultValue: 'cw'
            }
          }
        },
        {
          opcode: 'flip',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.direction',
              default: 'flip [DIRECTION]',
              description: 'direction'
            }),
            description: 'flip'
          }),
          arguments: {
            DIRECTION: {
              type: ArgumentType.STRING,
              menu: 'directionmenu',
              defaultValue: 'l'
            }
          }
        },
        {
          opcode: 'go',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.go',
              default: 'go x:[X] y:[Y] z:[Z] speed:[SPEED]',
              description: 'go'
            }),
            description: 'go'
          }),
          arguments: {
            X: {
              type: ArgumentType.STRING,
              defaultValue: '20'
            },
            Y: {
              type: ArgumentType.STRING,
              defaultValue: '20'
            },
            Z: {
              type: ArgumentType.STRING,
              defaultValue: '20'
            },
            SPEED: {
              type: ArgumentType.STRING,
              defaultValue: '10'
            }
          }
        },
        {
          opcode: 'setspeed',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.setspeed',
              default: 'set speed [SPEED]',
              description: 'setspeed'
            }),
            description: 'go'
          }),
          arguments: {
            SPEED: {
              type: ArgumentType.STRING,
              defaultValue: '10'
            }
          }
        },
        {
          opcode: 'setwifi',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.setwifi',
              default: 'set wifi:[WIFI] pass:[PASS]',
              description: 'setwifi'
            }),
            description: 'setwifi'
          }),
          arguments: {
            WIFI: {
              type: ArgumentType.STRING,
              defaultValue: 'wifi'
            },
            PASS: {
              type: ArgumentType.STRING,
              defaultValue: 'password'
            }
          }
        },
        {
          opcode: 'setrc',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.setrc',
              default: 'set roll:[A] pitch:[B] accelerator:[C] rotation:[D]',
              description: 'setrc'
            }),
            description: 'setrc'
          }),
          arguments: {
            A: {
              type: ArgumentType.STRING,
              defaultValue: '0'
            },
            B: {
              type: ArgumentType.STRING,
              defaultValue: '0'
            },
            C: {
              type: ArgumentType.STRING,
              defaultValue: '0'
            },
            D: {
              type: ArgumentType.STRING,
              defaultValue: '0'
            }
          }
        },
        {
          opcode: 'getspeed',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getspeed',
              default: 'get speed',
              description: 'getspeed'
            }),
            description: 'getspeed'
          })
        },
        {
          opcode: 'getbattery',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getbattery',
              default: 'get battery',
              description: 'getbattery'
            }),
            description: 'getbattery'
          })
        },
        {
          opcode: 'gettime',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.gettime',
              default: 'get time',
              description: 'gettime'
            }),
            description: 'gettime'
          })
        },
        {
          opcode: 'getheight',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getheight',
              default: 'get height',
              description: 'getheight'
            }),
            description: 'getheight'
          })
        },
        {
          opcode: 'gettemp',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.gettemp',
              default: 'get temp',
              description: 'gettemp'
            }),
            description: 'gettemp'
          })
        },
        {
          opcode: 'getattitude',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getattitude',
              default: 'get attitude',
              description: 'getattitude'
            }),
            description: 'getattitude'
          })
        },
        {
          opcode: 'getbaro',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getbaro',
              default: 'get baro',
              description: 'getbaro'
            }),
            description: 'getbaro'
          })
        },
        {
          opcode: 'getacceleration',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getacceleration',
              default: 'get acceleration',
              description: 'getacceleration'
            }),
            description: 'getacceleration'
          })
        },
        {
          opcode: 'gettof',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.gettof',
              default: 'get tof',
              description: 'gettof'
            }),
            description: 'gettof'
          })
        },
        {
          opcode: 'getwifi',
          blockType: BlockType.REPORTER,
          text: formatMessage({
            default: formatMessage({
              id: 'cxtello.actionMenu.getwifi',
              default: 'get wifi',
              description: 'getwifi'
            }),
            description: 'getwifi'
          })
        }
      ],
      menus: {
        cmdmenu: {
          acceptReporters: true,
          items: this._buildMenu(this.CMDMENU_INFO)
        },
        cwcmdmenu: {
          acceptReporters: true,
          items: this._buildMenu(this.CWMENU_INFO),
        },
        directionmenu: {
          acceptReporters: true,
          items: this._buildMenu(this.DIRECTIONMENU)
        },
        turn: {
          acceptReporters: true,
          items: ["start", "stop"],
        },
      }
    };
  }

  command(args, util) {
    const content = 'command'
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  takeoff(args, util) {
    const content = 'takeoff'
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  land(args, util) {
    const content = 'land'
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  streamon(args, util) {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'streamon')
  }

  streamoff(args, util) {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'streamoff')
  }

  emergency(args, util) {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'emergency')

  }

  movecmd(args, util) {
    const content = args.CMD + ' ' + args.DISTANCE
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  cwcmd(args, util) {
    const content = args.CMD + ' ' + args.DEGREE
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  flip(args, util) {
    const content = 'flip ' + args.DIRECTION
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  go(args, util) {
    const content = `go ${args.X} ${args.Y} ${args.Z} ${args.SPEED}`
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  setspeed(args, util) {
    const content = `speed ${args.SPEED}`
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  setwifi() {
    const content =`wifi ${args.WIFI} ${args.PASS}`
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  setrc() {
    const content = `rc ${args.A} ${args.B} ${args.C} ${args.D}`
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  getspeed() {
    const content = 'speed?'
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, content)
  }

  getbattery() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'battery?')
  }

  gettime() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'time?')
  }

  getheight() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'height?')
  }

  gettemp() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'temp?')
  }

  getattitude() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'attitude?')
  }

  getbaro() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'baro?')
  }


  getacceleration() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'acceleration?')

  }

  gettof() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'tof?')
  }

  getwifi() {
    return this.client.adapter_base_client.emit_with_messageid(NODE_ID, 'wifi?')
  }

  open_help_url(args) {
    window.open(HELP_URL);
  }

  verify_the_SSL_certificate(args) {
    window.open(args.hass_https);
  }

  control_extension(args) {
  const content = args.turn;
  const ext_name = args.ext_name;
  return this.client.adapter_base_client.emit_with_messageid_for_control(
      NODE_ID,
      content,
      ext_name,
      "extension"
  );
  }

}

module.exports = Scratch3TelloBlocks;
