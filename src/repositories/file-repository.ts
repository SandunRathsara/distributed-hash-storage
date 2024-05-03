import {existsSync, readFileSync, writeFileSync} from "fs";
import {csv2json, json2csv} from "json-2-csv";

export class FileRepository<T> {
    private readonly filepath: string;

    constructor(filename: string) {
        this.filepath = filename;
    }

    readFileAndConvertToJson() {
        if (existsSync(this.filepath)) return csv2json(readFileSync(this.filepath).toString()) as T[];
        else return [];
    }

    convertToCsvAndWriteToFile(data: object[]) {
        const csv = json2csv(data, {prependHeader: true});
        writeFileSync(this.filepath, csv);
    }
}