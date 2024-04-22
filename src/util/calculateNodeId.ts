export function calculateNodeId (hash: string): number {
    return hash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
}