const { DahuaRpc } = require("dahua-rpc2");

module.exports = function(RED) {
    function DahuaRpcNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Retrieve the config options
        node.host = config.host;
        node.user = config.user;
        node.pass = config.pass;

        node.on('input', async function(msg, send, done) {
            // Allow overriding config via msg.payload
            const host = msg.payload.host || node.host;
            const user = msg.payload.user || node.user;
            const pass = msg.payload.pass || node.pass;

            const dahuaRpc = new DahuaRpc(host, user, pass);

            try {
                await dahuaRpc.login();
                // Store the session globally in Node-RED
                const globalContext = node.context().global;
                globalContext.set('dahuaSession', dahuaRpc.sessionId);
                msg.payload.session = dahuaRpc.sessionId;
                send(msg);
                if (done) {
                    done();
                }
            } catch (error) {
                node.error('Login failed: ' + error.message);
                if (done) {
                    done(error);
                }
            }
        });

        node.on('close', function() {
            node.log('Dahua RPC node closed');
        });
    }

    // Register the node type
    RED.nodes.registerType('dahua-rpc', DahuaRpcNode);
};
