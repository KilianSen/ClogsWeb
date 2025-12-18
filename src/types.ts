export interface AgentRegistration {
    agent_id: string;
    hostname: string;
    heartbeat_interval: number;
    discovery_interval: number;
    started_at: number;
}

export interface Container {
    id: string | null;
    agent_id: string;
    context: number | null;
    name: string;
    image: string;
    created_at: number;
    status: string;
}

export interface ServiceContainer extends Container {
    type: 'compose' | 'swarm';
}

export type ServiceMap = Record<string, ServiceContainer[]>;

export interface StackInfo {
    name: string;
    type: string;
    containers: ContainerInfo[];
}

export interface AgentState {
    agent_id: string;
    timestamp: number;
    monitored_stacks: StackInfo[];
}

export interface Log {
    id: string | null;
    container_id: string;
    timestamp: number;
    level: string;
    message: string;
}

export interface Heartbeat {
    agent_id: string;
    timestamp: number;
}
