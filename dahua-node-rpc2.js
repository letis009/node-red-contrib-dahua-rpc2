const { DahuaRpc } = require("dahua-rpc2");

module.exports = function(RED) {
    function DahuaRpcNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Set up initial configuration from the node's settings
        node.host = config.host;
        node.user = config.user;
        node.pass = config.pass;
        node.sendKeepAlive = config.sendKeepAlive; // Get the checkbox value

        // When input is received
        node.on('input', async function(msg, send, done) {
            // Check if the host, user, or pass is missing from the node configuration and the message payload
            const host = msg.payload.host || node.host;
            const user = msg.payload.user || node.user;
            const pass = msg.payload.pass || node.pass;

            // If any of the required fields are missing, set the node status to red and return
            if (!host || !user || !pass) {
                node.status({ fill: "red", shape: "ring", text: "missing credentials" });
                node.error("Missing host, user, or pass in config or input payload.");
                return done(new Error("Missing credentials"));
            }

            // Create the DahuaRpc instance
            const dahuaRpc = new DahuaRpc(host, user, pass);

            // Set the node status to blue (busy) while awaiting the login process
            node.status({ fill: "blue", shape: "dot", text: "connecting..." });

            try {
                // Attempt to login to Dahua device
                await dahuaRpc.login();

                // If successful, change node status to green (success)
                node.status({ fill: "green", shape: "dot", text: "connected" });

                // Store the session globally in Node-RED
                const globalContext = node.context().global;
                globalContext.set('dahuaSession', dahuaRpc.sessionId);

                // Add session ID to the msg payload and send it along
                msg.payload.session = dahuaRpc.sessionId;
                send(msg);

                // Check if keepAlive should be sent
                if (node.sendKeepAlive) {
                    await dahuaRpc.keepAlive();
                    node.status({ fill: "green", shape: "dot", text: "keepAlive sent" });
                }

                if (done) {
                    done();
                }
            } catch (error) {
                // On failure, set node status to red
                node.status({ fill: "red", shape: "ring", text: "login failed" });
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

    // Register the node type in Node-RED
    RED.nodes.registerType('dahua-rpc', DahuaRpcNode);
};
