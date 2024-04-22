import {getNodeId, getNodeName} from "../util/server-config";
import {NodeRepository} from "../repositories/node-repository";

export class ClusterService {
    initCall() {
        const filePath = `/Users/alpha/Developer/personal/distributed/src/store/node_table_${getNodeId()}.csv`
        const nodeRepo = new NodeRepository(filePath)
        for (let i = 0; i < 5; i++) {
            if (i === getNodeId()) continue;

            fetch(`http://localhost:300${i}/`, {
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: getNodeName(), id: getNodeId()})
            }).then(async (res) => {
                const data = await res.json()
                nodeRepo.addNewNode(data)
            }).catch((err) => {
                if (err?.cause?.code === 'ECONNREFUSED') {
                    console.log(`No service running on port 300${i}`)
                } else {
                    console.error(err.message)
                }
            })
        }
    }
}