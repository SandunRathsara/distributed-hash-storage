import {Express} from "express";
import {getNodeId, getNodeName, getNodeRole, ROLES, setNodeRole} from "./server-config";
import {ClusterService} from "../services/cluster-service";
export function startNode(port: number, app: Express): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const server = require('http').createServer(app)
        server.once('error', (err: { code: string }) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false)
            }
        })
        server.once('listening', () => {
            setNodeRole(getNodeId() % 2 === 0 ? ROLES.RECEIVER : ROLES.HASHER)
            console.log(`Server is running on port ${port}. ${getNodeRole()} role is assigned and named ${getNodeName()}`)
            const clusterService = new ClusterService()
            clusterService.initCall()
            resolve(true)
        })
        server.listen(port)
    })
}
