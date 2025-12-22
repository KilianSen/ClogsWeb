import axios from 'axios';
import type {Container, ServiceMap, Log, Agent, ActiveAgent, UptimeSection, Uptimes} from './types';

const API_BASE_URL = '/api'; // Assuming proxy or same origin

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

export const getHealth = async () => {
    const response = await apiClient.get('/health');
    return response.data;
};

export const getOrphans = async () => {
    const response = await apiClient.get<Container[]>('/web/orphans');
    return response.data;
};

export const getServices = async () => {
    const response = await apiClient.get<ServiceMap>('/web/services');
    return response.data;
};

export const getLogs = async (limit: number = 100, level?: string, containerId?: string) => {
    const params = { limit, container_id: containerId, level };
    const response = await apiClient.get<Log[]>('/web/logs', { params });
    return response.data;
};

export const getUptime = async () => {
    const response = await apiClient.get<{
        container_id: string;
        uptime_seconds: number;
        uptime_percentage: number;
        first_recorded: number;
    }[]>('/processors/uptime');
    const r: Uptimes = {};
    for (const [,data] of Object.entries(response.data)) {
        r[data.container_id] = {
            uptime_seconds: data.uptime_seconds,
            uptime_percentage: data.uptime_percentage,
            first_recorded: data.first_recorded
        };
    }

    return r;
};

export const getAgents = async () => {
    const response = await apiClient.get<{[key:string]: Agent }>('/web/agents');
    return response.data;
}

export const getActiveAgents = async () => {
    const response = await apiClient.get<ActiveAgent>('/processors/active');
    return response.data;
}

export const getUptimeSections = async (containerId?: string) => {
    const response = await apiClient.get<UptimeSection[]>(`/processors/uptime/sections/${containerId || ''}`);
    return response.data;
}