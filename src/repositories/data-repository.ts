import {FileRepository} from "./file-repository";

export type TData = { key: string, value: string }

export class DataRepository extends FileRepository<TData> {

    constructor(filename: string) {
        super(filename);
    }

    public addOrUpdateData(data: TData) {
        const nodes = this.readFileAndConvertToJson();
        const nodeIndex = nodes.findIndex((row) => row.key === data.key);
        if (nodeIndex < 0) nodes.push(data);
        else nodes[nodeIndex] = data;
        this.convertToCsvAndWriteToFile(nodes);
    }

    public getAllData() {
        return this.readFileAndConvertToJson();
    }

    public getDataByKey(key: string) {
        return this.readFileAndConvertToJson().find((row) => row.key === key);
    }

    public removeDataByKey(key: string) {
        const nodes = this.readFileAndConvertToJson();
        const index = nodes.findIndex((row) => row.key === key);
        if (index !== -1) {
            nodes.splice(index, 1);
            this.convertToCsvAndWriteToFile(nodes);
        }
    }
}