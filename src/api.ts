import axios from 'axios';
import type { Container, ServiceMap, Log } from './types';

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

export const getLogs = async (limit: number = 100, containerId?: string) => {
    const params = { limit, container_id: containerId };
    const response = await apiClient.get<Log[]>('/web/logs', { params });
    return response.data;
};

export const getUptime = async () => {
    const response = await apiClient.get('/processors/uptime');
    return response.data;
};
