import { CronJob } from "cron";
import {ClusterService} from "./cluster-service";
const clusterService = new ClusterService()

export const heartBeatCron = CronJob.from({
    cronTime: '*/10 * * * * *',
    onTick: clusterService.heartBeat,
})