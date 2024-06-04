const utils = require('../utils')

module.exports = function(RED) {
  function deleteSession(config) {
    RED.nodes.createNode(this, config)
    this.save = config.save
    this.saveType = config.saveType
    this.log = config.log
    this.logType = config.logType
    const node = this
    
    let log = {
      nodeId: node.id,
      name : node.name || node.type.replace('-',' '),
      driverName : node.save,
      driverType : node.saveType,
      log : node.log,
      logType : node.logType,
      timestamp: (new Date()).toISOString()
    }

    node.on('input', async (msg) => {
      try {
        utils.clearStatus(node)
        let session = await utils.deleteSession(RED, node, msg)
        log.msg = `Delete Session - Session Id: ${session}`
        utils.logNode(RED, node, msg, log)
        utils.successStatus(node, 'Session - deleted')
        node.send(msg)
      } catch (ex) {
        msg.error = ex
        utils.handleError(node,msg)
      }
    })
  }
  RED.nodes.registerType('close-session', deleteSession)
}