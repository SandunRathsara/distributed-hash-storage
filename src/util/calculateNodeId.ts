import {getNodeId} from "./server-config";

export function calculateNodeId (): number {
    const nodeId = (getNodeId() - 1) % 5
    return nodeId === -1 ? 4 : nodeId
}