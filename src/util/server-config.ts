import { faker } from '@faker-js/faker'

export enum ROLES {
    RECEIVER ='Receiver',
    HASHER = 'Hasher',
}

var NODE_ID = 0;
var NODE_NAME = faker.color.human();
var NODE_ROLE = ROLES.RECEIVER

export function setNodeId(id: number) {
    NODE_ID = id;
}

export function getNodeId() {
    return NODE_ID;
}

export function getNodeName() {
    return NODE_NAME;
}

export function getNodeRole() {
    return NODE_ROLE;
}

export function setNodeRole(name: ROLES) {
    NODE_NAME = name;
}