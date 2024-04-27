// Works like an orm for node table
import {csv2json, json2csv} from "json-2-csv";
import {existsSync, readFileSync, writeFileSync} from "fs";

export class NodeRepository {
    private readonly filepath: string;

    constructor(filename: string) {
        this.filepath = filename;
    }

    private readFileAndConvertToJson() {
        if (existsSync(this.filepath)) return csv2json(readFileSync(this.filepath).toString()) as { name: string, id: number }[];
        else return [];
    }

    private convertToCsvAndWriteToFile(data: object[]) {
        const csv = json2csv(data, {prependHeader: true});
        writeFileSync(this.filepath, csv);
    }

    public addNewNode(data: { name: string, id: number }) {
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