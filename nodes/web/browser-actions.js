const common = require('../utils')
const utils = require('./utils/browser')

module.exports = function (RED) {
  function browserAction(config) {
    RED.nodes.createNode(this, config)
    const node = this
    node.save = config.save
    node.saveType = config.saveType
    node.log = config.log
    node.logType = config.logType
    node.category = config.category
    node.subCategory = config.subCategory
    node.captureData = config.captureData
    node.assertionData = config.assertionData

    let log = {
      nodeId: node.id,
      name: node.name || node.type.replace('-', ' '),
      driverName: node.save,
      driverType: node.saveType,
      log: node.log,
      logType: node.logType,
      category: node.category,
      subCategory: node.subCategory,
      captureData: node.captureData,
      assertionData: node.assertionData,
      timestamp: (new Date()).toISOString()
    }

    node.on('input', async (msg) => {
      try {
        common.clearStatus(node)
        node.browser = await common.getSession(RED, node, msg)
        node.attr1 = config.param1 ? await common.getTypeInputValue(RED, node, msg, config.param1Type, config.param1) : ''
        node.attr2 = config.param2 ? await common.getTypeInputValue(RED, node, msg, config.param2Type, config.param2) : ''

        log.sessionId = node.browser.sessionId
        log.attr1 = node.attr1
        log.attr2 = node.attr2

        log.actionLog = await utils.action(node)
        log.captureLog = await utils.capture(RED, node, msg)
        log.assertionsLog = node.assertionData.length?await common.assertions(RED, node, msg):[]
        await common.logNode(RED, node, msg, log)
        //Throw exception if there is an fail
        if(log.assertionsLog.length > 0){
          console.log('inside assertion log check')
          let lastAssertion = log.assertionsLog[(log.assertionsLog.length - 1)]
          if(lastAssertion.finalResult == 'FAIL'){
            throw {
              message: `Assertion Failed - ${lastAssertion.assertionName}`
            }
          }
        }
        common.successStatus(node, 'Done')
        node.send(msg)
      } catch (ex) {
        msg.error = ex
        common.handleError(node, msg)
      }
    })
  }
  RED.nodes.registerType('browser-actions', browserAction)
}
