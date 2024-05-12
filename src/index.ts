import express, {Request, Response} from "express";
import {startNode} from "./util/check-port-availability";
import {getNodeId, getNodeName, getNodeRole, ROLES, setNodeId} from "./util/server-config";
import {calculateNodeId} from "./util/calculateNodeId";
import {json, urlencoded, raw} from "body-parser";
import {NodeRepository} from "./repositories/node-repository";
import {DATA_TABLE_FILE_PATH, NODE_TABLE_FILE_PATH} from "./util/constants";
import isEmpty from "lodash/isEmpty";
import {DataRepository} from "./repositories/data-repository";
import {createHash} from "node:crypto";


const app = express()
let port = 3000

app.use(raw())
app.use(json())
app.use(urlencoded({extended: true}))

// Cluster Management ================================================================================
// Connect to the Cluster ============================================================================
app.post('/connect', (req: Request, res: Response) => {

    const nodeRepo = new NodeRepository(NODE_TABLE_FILE_PATH(getNodeId()))

    nodeRepo.addOrUpdateNode(req.body)

    return res.send({name: getNodeName(), id: getNodeId(), role: getNodeRole()})
})

// Disconnect from the Cluster =======================================================================
app.post('/disconnect', (req: Request, res: Response) => {
    const nodeRepo = new NodeRepository(NODE_TABLE_FILE_PATH(getNodeId()))
    nodeRepo.removeNodeById(req.body.id);
    return res.send({success: true, message: 'Successfully disconnected from the cluster'});
})

// Check if the nodes are active =====================================================================
app.get('/heart-beat', (_, res: Response) => {
    return res.send({id: getNodeId(), name: getNodeName(), role: getNodeRole()})
})


// Storage Management ================================================================================
// Store Data ========================================================================================
app.post('/store-data', async (req: Request, res: Response) => {
    if (getNodeRole() === ROLES.HASHER) {
        const data = await fetch(`http://localhost:300${calculateNodeId()}/hash-data`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: {'Content-Type': 'application/json'}
        })
        return res.status(data.status).send({success: true, message: 'Success', data: await data.json()})
    }

    if (isEmpty(req.body.key) || isEmpty(req.body.value)) return res.status(400).send('Bad Request')
    const {key, value} = req.body

    const dataRepo = new DataRepository(DATA_TABLE_FILE_PATH(getNodeId()))
    dataRepo.addOrUpdateData({key, value})

    return res.status(201).send({success: true, message: 'Saved', data: {key}})
})

// Get Data ========================================================================================
app.get('/get-data', async (req: Request, res: Response) => {
    if (isEmpty(req.query.key)) return res.status(400).send({success: false, message: 'Bad Request'});
    const {key, internal} = req.query

    if (getNodeRole() === ROLES.HASHER) {
        const data = await fetch(`http://localhost:300${calculateNodeId()}/get-data?key=${key}`)
        return res.send(await data.json())
    }

    const dataRepo = new DataRepository(DATA_TABLE_FILE_PATH(getNodeId()))
    const data = dataRepo.getDataByKey(key as string)

    if (isEmpty(data)) {
        if (parseInt(internal as string) === 1) return res.status(404).send({
            success: false,
            message: 'Data not found'
        });

        const nodeIds = (new NodeRepository(NODE_TABLE_FILE_PATH(getNodeId())))
            .getAllNodes()
            .filter(node => node.role === ROLES.RECEIVER)
            .map(node => node.id)

        for (const nodeId of nodeIds) {
            const dataRes = await fetch(`http://localhost:300${nodeId}/get-data?key=${key}&internal=1`)
            if (!dataRes.ok) continue

            const dataJson = await dataRes.json()
            if (isEmpty(dataJson)) continue

            return res.send(dataJson)
        }
        return res.status(404).send({success: false, message: 'Data not found'});
    }
    return res.send({success: true, message: 'Success', data})
})

// Hasher Management ================================================================================
// Hash Data ========================================================================================
app.post('/hash-data', async (req: Request, res: Response) => {
    console.log('here', calculateNodeId())
    if (getNodeRole() === ROLES.RECEIVER) {
        const data = await fetch(`http://localhost:300${calculateNodeId()}/hash-data`,
            {
                method: 'POST',
                body: JSON.stringify(req.body),
                headers: {'Content-Type': 'application/json'}
            })
        return res.send({success: true, message: 'Success', data: await data.json()})
    }

    const paragraph = req.body.paragraph
    if (isEmpty(paragraph) || typeof paragraph !== 'string') return res.status(400).send({
        success: false,
        message: 'Bad Request'
    })

    const algorithm = createHash('sha1')
    const key = algorithm.update(paragraph.substring(0, 10)).digest('hex')
    const [res1, res2] = await Promise.all([fetch(`http://localhost:300${calculateNodeId()}/store-data`, {
        method: 'POST',
        body: JSON.stringify({key, value: paragraph}),
        headers: {'Content-Type': 'application/json'}
    }), fetch(`http://localhost:300${calculateNodeId()}/store-data`, {
        method: 'POST',
        body: JSON.stringify({key, value: paragraph}),
        headers: {'Content-Type': 'application/json'}
    })])

    if (!res1.ok && !res2.ok) return res.status(500).send({success: false, message: 'Internal Server Error'})

    return res.send({success: true, message: 'Success', data: {key}})
})

async function main() {
    let started = await startNode(port, app)
    while (!started) {
        port++
        setNodeId(getNodeId() + 1)
        started = await startNode(port, app)
    }
}

main()
