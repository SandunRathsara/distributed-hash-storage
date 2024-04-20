import express, {Request, Response} from "express";
import {startNode} from "./util/check-port-availability";
import {getNodeId, getNodeName, setNodeId} from "./util/server-config";
import { json2csv, csv2json } from 'json-2-csv';
import {appendFileSync} from "fs";

const app = express()
let port = 3000

app.use(express.json())

app.post('/', (req: Request, res: Response) => {
    // convert json to csv and append into the node table
    const csv = json2csv(req.body)
    appendFileSync('./store/node_table.csv', csv)

    res.send({name: getNodeName(), id: getNodeId()})
})

async function main () {
    let started = await startNode(port, app)
    while (!started) {
        port++
        setNodeId(getNodeId()+1)
        started = await startNode(port, app)
    }
}
main()
