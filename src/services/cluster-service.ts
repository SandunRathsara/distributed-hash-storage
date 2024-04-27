import {getNodeId, getNodeName} from "../util/server-config";
import {NodeRepository} from "../repositories/node-repository";
import {NODE_TABLE_FILE_PATH} from "../util/constants";

export class ClusterService {
    connectWithCluster() {
        const nodeRepo = new NodeRepository(NODE_TABLE_FILE_PATH(getNodeId()))
        for (let i = 0; i < 5; i++) {
            if (i === getNodeId()) continue;

            fetch(`http://localhost:300${i}/connect`, {
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: getNodeName(), id: getNodeId()})
            }).then(async (res) => {
                const data = await res.json()
                nodeRepo.addNewNode(data)
            }).catch((err) => {
                if (err?.cause?.code === 'ECONNREFUSED') console.log(`No service running on port 300${i}`)
                else console.error('ERROR => ', err.message)
            })
        }
    }

    disconnectFromCluster() {
        const nodeRepo = new NodeRepository(NODE_TABLE_FILE_PATH(getNodeId()))
        const nodes = nodeRepo.getAllNodes()
        nodes.forEach((node) => {
            fetch(`http://localhost:300${node.id}/disconnect`, {
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: getNodeName(), id: getNodeId()})
            }).then(async (res) => {
                if (res.ok) console.log(`Disconnected from node ${node.id}`)
            })
        })
    }
}