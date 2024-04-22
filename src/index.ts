import express, {Request, Response} from "express";
import {startNode} from "./util/check-port-availability";
import {getNodeId, getNodeName, getNodeRole, ROLES, setNodeId} from "./util/server-config";
import {json2csv} from 'json-2-csv';
import {calculateNodeId} from "./util/calculateNodeId";
import {json, urlencoded, raw} from "body-parser";
import {NodeRepository} from "./repositories/node-repository";

const app = express()
let port = 3000

app.use(raw())
app.use(json())
app.use(urlencoded({extended: true}))

app.post('/', (req: Request, res: Response) => {
    // convert json to csv and append into the node table

    const filePath = `/Users/alpha/Developer/personal/distributed/src/store/node_table_${getNodeId()}.csv`;
    const nodeRepo = new NodeRepository(filePath)

    nodeRepo.addNewNode(req.body)

    res.send({name: getNodeName(), id: getNodeId()})
})

app.get('/get-data', (req: Request, res: Response) => {
    if (getNodeRole() === ROLES.HASHER) {
        const nodeId = calculateNodeId(req.body.hash)
        const data = fetch(`http://localhost:300${nodeId}/get-data`)
        res.send(data)
    }

    // const file: any[] = csv2json('./store/value_table.csv')
    // return res.send(file.find((row) => row.key === req.body.hash))
})

app.post('/store-data', (req: Request, res: Response) => {
    if (getNodeRole() === ROLES.HASHER) {
        const data = fetch(`http://localhost:300${getNodeId() - 1 % 5}/hash-data`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: {'Content-Type': 'application/json'}
        })
        res.send('Success');
    }

    const csv = json2csv(req.body)
    // appendFileSync('./store/value_table.csv', csv)
    // res.send({id: getNodeId(), name: getNodeName(), role: getNodeRole()})
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
