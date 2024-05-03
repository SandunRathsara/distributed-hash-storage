import {FileRepository} from "./file-repository";

type TNode = { name: string, id: number, role: string }

export class NodeRepository extends FileRepository<TNode> {
    constructor(filename: string) {
        super(filename);
    }

    public addOrUpdateNode(data: TNode) {
        const nodes = this.readFileAndConvertToJson();
        const nodeIndex = nodes.findIndex((row) => row.id === data.id);
        if (nodeIndex < 0) nodes.push(data);
        else nodes[nodeIndex] = data;

        this.convertToCsvAndWriteToFile(nodes);

    }

    public getAllNodes() {
        return this.readFileAndConvertToJson();
    }

    public getNodeById(id: number) {
        return this.readFileAndConvertToJson().find((row) => row.id === id);
    }

    public removeNodeById(id: number) {
        const nodes = this.readFileAndConvertToJson();
        const index = nodes.findIndex((row) => row.id === id);
        if (index !== -1) {
            nodes.splice(index, 1);
            this.convertToCsvAndWriteToFile(nodes);
        }
    }
}