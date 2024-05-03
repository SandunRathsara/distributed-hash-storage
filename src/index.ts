import express, {Request, Response} from "express";
import {startNode} from "./util/check-port-availability";
import {getNodeId, getNodeName, getNodeRole, ROLES, setNodeId} from "./util/server-config";
import {calculateNodeId} from "./util/calculateNodeId";
import {json, urlencoded, raw} from "body-parser";
import {NodeRepository} from "./repositories/node-repository";
import {DATA_TABLE_FILE_PATH, NODE_TABLE_FILE_PATH} from "./util/constants";
import isEmpty from "lodash/isEmpty";
import {DataRepository} from "./repositories/data-repository";

const app = express()
let port = 3000

app.use(raw())
app.use(json())
app.use(urlencoded({extended: true}))

app.post('/connect', (req: Request, res: Response) => {

    const nodeRepo = new NodeRepository(NODE_TABLE_FILE_PATH(getNodeId()))

    nodeRepo.addOrUpdateNode(req.body)

    res.send({name: getNodeName(), id: getNodeId(), role: getNodeRole()})
})

app.post('/disconnect', (req: Request, res: Response) => {
    const nodeRepo = new NodeRepository(NODE_TABLE_FILE_PATH(getNodeId()))
    nodeRepo.removeNodeById(req.body.id);
    res.send('Success');
})

app.get('/heart-beat', (_, res: Response) => {
  res.send({id: getNodeId(), name: getNodeName(), role: getNodeRole()})
})

app.post('/store-data', async (req: Request, res: Response) => {
    if (getNodeRole() === ROLES.HASHER) {
        const data = await fetch(`http://localhost:300${getNodeId() - 1 % 5}/hash-data`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: {'Content-Type': 'application/json'}
        })
        res.status(data.status).send(data.statusText)
    }

    if (isEmpty(req.body.key) || isEmpty(req.body.value)) res.status(400).send('Bad Request')
    const {key, value} = req.body

    const dataRepo = new DataRepository(DATA_TABLE_FILE_PATH(getNodeId()))
    dataRepo.addOrUpdateData({key, value})

    return res.status(201).send('Saved')
})

app.get('/get-data', async (req: Request, res: Response) => {
    if (isEmpty(req.query.key)) res.status(400).send('Bad Request');
    const {key, internal} = req.query

    if (getNodeRole() === ROLES.HASHER) {
        const nodeId = calculateNodeId(req.body.hash)
        const data = fetch(`http://localhost:300${nodeId}/get-data`)
        res.send(data)
    }

    const dataRepo = new DataRepository(DATA_TABLE_FILE_PATH(getNodeId()))
    const data = dataRepo.getDataByKey(key as string)

    if (isEmpty(data) && internal !== 'true') {
        if (parseInt(internal as string) === 1) return res.status(404).send('Data not found');

        const nodeIds = (new NodeRepository(NODE_TABLE_FILE_PATH(getNodeId())))
            .getAllNodes()
            .filter(node => node.role === ROLES.RECEIVER)
            .map(node => node.id)

        for (const nodeId of nodeIds) {
            console.log('nodeId', nodeId)
            const dataRes = await fetch(`http://localhost:300${nodeId}/get-data?key=${key}&internal=1`)
            console.log('requestResponse', nodeId, dataRes.ok)
            if (!dataRes.ok) continue

            const dataJson = await dataRes.json()
            console.log('dataJson', nodeId, dataJson)
            if (isEmpty(dataJson)) continue

            return res.send(dataJson)
        }
        return res.status(404).send('Data not found');
    }
    return res.send(data)
})

// Hasher Routes
app.post('/hash-data', async (req: Request, res: Response) => {
    if (getNodeRole() === ROLES.RECEIVER) {
        const data = await fetch(`http://localhost:300${getNodeId() - 1 % 5}/hash-data`,
            {
                method: 'POST',
                body: JSON.stringify(req.body),
                headers: {'Content-Type': 'application/json'}
            })
        res.send(data)
    }

    const paragraph = req.body.paragraph
    // create a hash value using sha-1 algorithm from the first 10 characters of the paragraph
    const algorithm = require('crypto').createHash('sha1')
    const hash = algorithm.hash(paragraph.substring(0, 10)).digest('hex')
    const response = await fetch(`http://localhost:300${calculateNodeId(hash)}/store-data`, {
        method: 'POST',
        body: JSON.stringify({key: hash, value: paragraph}),
        headers: {'Content-Type': 'application/json'}
    })

    res.send('Success')
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
