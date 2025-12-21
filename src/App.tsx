import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {getServices, getOrphans, getUptime, getHealth, getLogs, getAgents, getActiveAgents} from './api';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    BluetoothConnected,
    CircleQuestionMark,
    Settings,
    SignalHigh,
    SignalLow,
    SignalMedium,
    SignalZero
} from "lucide-react";
import type {Container, ServiceContainer, ActiveAgent, Agent} from "@/types.ts";
import {Switch} from "@/components/ui/switch.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

function typeToColorClass(type: string) {
    if (type === 'compose') return 'bg-blue-500';
    if (type === 'swarm') return 'bg-green-500';
    return 'bg-gray-500';
}

function statusToColorClass(status: string) {
    if (status === 'running') return 'text-green-500';
    if (status === 'exited') return 'text-red-500';
    if (status === 'paused') return 'text-yellow-500';
    if (status === 'restarting') return 'text-orange-500';
    if (status === 'created') return 'text-blue-500';
    if (status === 'dead') return 'text-black';
    if (status === 'removing') return 'text-purple-500';
    if (status === 'unknown') return 'text-gray-700';
    if (status === 'unhealthy') return 'text-pink-500';
    return 'text-gray-500';
}

function aliveToColorClass(alive: boolean) {
    return alive ? '': 'bg-black/[0.05]';
}

export function ContainerEntry({container, activeAgents}: {container: Container, activeAgents?: ActiveAgent}) {
    const [logLimit, setLogLimit] = useState(50);
    const { data: logs, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['logs', container.id],
        queryFn: () => getLogs(logLimit, undefined, container.id || undefined),
        refetchInterval: 5000
    });


    return (
        <Dialog>
            <DialogTrigger asChild>
                <TableRow key={container.id || container.name} className={aliveToColorClass(!!activeAgents && activeAgents[container.agent_id])}>
                    <TableCell>{container.name}</TableCell>
                    <TableCell className="font-mono text-xs">{container.id ? container.id.substring(0, 8) : 'N/A'}</TableCell>
                    <TableCell className="font-mono text-xs">{container.agent_id.substring(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{container.image}</TableCell>
                    <TableCell className={statusToColorClass(container.status)}>{container.status}</TableCell>
                </TableRow>
            </DialogTrigger>
            <DialogContent className="max-w-4/5! max-h-4/5 overflow-scroll">
                <DialogHeader>
                    <DialogTitle>Container Details</DialogTitle>
                        <DialogDescription>
                            Detailed information and logs for the selected container.
                        </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <div><strong>Name:</strong> {container.name}</div>
                    <div><strong>Container ID:</strong> {container.id || 'N/A'}</div>
                    <div><strong>Agent ID:</strong> {container.agent_id}</div>
                    <div><strong>Image:</strong> {container.image}</div>
                    <div><strong>Created At:</strong>{ new Date((container.created_at || 0) * 1000).toLocaleString()}</div>
                    <div><strong>Status:</strong> <span className={statusToColorClass(container.status)}>{container.status}</span></div>
                </div>
                {/* Log section */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Recent Logs</h3>
                        <div className="flex items-center gap-2">
                            <span>Log Entries:</span>
                            <Button variant="outline" size="sm" onClick={() => setLogLimit(50)} className={logLimit === 50 ? 'bg-gray-200' : ''}>50</Button>
                            <Button variant="outline" size="sm" onClick={() => setLogLimit(100)} className={logLimit === 100 ? 'bg-gray-200' : ''}>100</Button>
                            <Button variant="outline" size="sm" onClick={() => setLogLimit(200)} className={logLimit === 200 ? 'bg-gray-200' : ''}>200</Button>
                        </div>
                    </div>
                    <div className="outline-1 rounded-xs px-2">
                        {isLoadingLogs ? <Skeleton className="h-20 " /> : (
                                <Table className={"overflow-scroll h-full"}>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Message</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(logs || []).map((log) => (
                                            <TableRow key={log.id || `${log.container_id}-${log.timestamp}`}>
                                                <TableCell className={"w-32"}>{new Date(log.timestamp / 1000000).toLocaleString()}</TableCell>
                                                <TableCell className={"w-16"}>{log.level}</TableCell>
                                                <TableCell className={"overflow-scroll max-w-48!"}>{log.message}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function AgentEntry({agent, activeAgents}: {agent: Agent, activeAgents?: ActiveAgent}) {
    return (
        <TableRow key={agent.id} className={aliveToColorClass(!!activeAgents && activeAgents[agent.id])}>
            <TableCell className="font-mono text-xs">{agent.id}</TableCell>
            <TableCell>{agent.hostname}</TableCell>
            <TableCell>{agent.heartbeat_interval}</TableCell>
            <TableCell>{agent.discovery_interval}</TableCell>
            <TableCell>{agent.on_host ? "true": "false"}</TableCell>
            <TableCell>
                {activeAgents && activeAgents[agent.id] ? (
                    <div className="flex items-center gap-1 text-green-600">
                        <SignalHigh size={16}/>
                        Active
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-red-600">
                        <SignalLow size={16}/>
                        Inactive
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}

function App() {
    const [logLimit, setLogLimit] = useState(50);
    const [loggingMode, setLoggingMode] = useState(false)

    const { data: health } = useQuery({
        queryKey: ['health'],
        queryFn: getHealth,
        refetchInterval: 10000
    });

    const { data: services, isLoading: isLoadingServices } = useQuery({
        queryKey: ['services'],
        queryFn: getServices,
        refetchInterval: 5000
    });

    const { data: orphans, isLoading: isLoadingOrphans } = useQuery({
        queryKey: ['orphans'],
        queryFn: getOrphans,
        refetchInterval: 5000
    });

    const { data: uptime, isLoading: isLoadingUptime } = useQuery({
        queryKey: ['uptime'],
        queryFn: getUptime,
        refetchInterval: 5000
    });

    const { data: logs, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['logs', logLimit, loggingMode ? 'warning' : 'error'],
        queryFn: () => getLogs(logLimit, loggingMode ? 'warning' : 'error'),
        refetchInterval: 5000
    });

    const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
        queryKey: ['agents'],
        queryFn: getAgents,
        refetchInterval: 5000
    });

    const { data: activeAgents } = useQuery({
        queryKey: ['activeAgents'],
        queryFn: getActiveAgents,
        refetchInterval: 5000
    });


    return (
        <div className="container mx-auto p-6">
            <div className="space-y-8 min-h-screen">
                <div className="flex items-center justify-center mb-8 relative">
                    <h1 className="text-4xl font-bold text-center">Clogs Dashboard</h1>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
                        {!health ? <Badge variant="destructive">
                            Disconnected
                        </Badge>:<></>}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Services Section */}
                    <div className="">

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-semibold">Services </h2>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <CircleQuestionMark/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Services are groups of containers managed together, such as those defined in Docker Compose or Docker Swarm stacks.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div>
                                {
                                    services && Object.keys(services).length === 0 ? <span className="text-sm text-muted-foreground">No services found</span> : null
                                }
                                {
                                    <div className="flex items-center gap-4">
                                        { Array.from(new Set((services ? Object.values(services).flat() : []).map(c => (c as ServiceContainer).type))).map((type) => {
                                            const colorClass = typeToColorClass(type);
                                            return (
                                                <div key={type} className="flex items-center gap-2">
                                                    <span className={`w-4 h-4 ${colorClass} rounded-sm`}></span>
                                                    <span className="capitalize">{type}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                }
                            </div>
                        </div>
                        <div className="outline-1 rounded-xs">
                            {isLoadingServices ? <Skeleton className="h-20 w-full" /> : (
                                <Accordion type="single" collapsible className="w-full">
                                    {Object.entries(services || {}).map(([serviceName, containers]) => (
                                        <AccordionItem key={serviceName} value={serviceName} className={"px-2 " + aliveToColorClass(!!activeAgents && activeAgents[containers[0].agent_id])}>
                                            <AccordionTrigger>
                                                <div className="w-full flex justify-between items-center">
                                                                                            <span className="flex items-center gap-2">
                                                <span className={`w-4 h-4 ${typeToColorClass(containers[0].type)} rounded-sm`}></span>
                                                                                                {serviceName} ({containers.length} containers)
                                            </span>
                                                    <div>
                                                        {
                                                            // If any containers are either 'unhealthy' or 'exited' or 'dead' or 'unknown', show a red badge with the count of such containers
                                                            (() => {
                                                                const problemContainers = containers.filter(c => ['unhealthy', 'exited', 'dead', 'unknown'].includes(c.status));
                                                                if (problemContainers.length > 0) {
                                                                    return <Badge variant="destructive">{problemContainers.length} issue{problemContainers.length > 1 ? 's' : ''}</Badge>;
                                                                }
                                                                return <Badge className={"bg-green-400"}>All Healthy</Badge>
                                                            })()
                                                        }
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Name</TableHead>
                                                            <TableHead>Container ID</TableHead>
                                                            <TableHead>Agent ID</TableHead>
                                                            <TableHead>Image</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {containers.map((container) => (
                                                            <ContainerEntry key={container.id || container.name} container={container} activeAgents={activeAgents} />
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </div>
                    </div>
                    {/* Orphans Section */}
                    <div className="">

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-semibold">Orphans</h2>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <CircleQuestionMark/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Services are groups of containers managed together, such as those defined in Docker Compose or Docker Swarm stacks.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div>
                                {
                                    orphans && orphans.length === 0 ? <span className="text-sm text-muted-foreground">No orphan containers found</span> : null
                                }
                                {
                                    // If any orphans are either 'unhealthy' or 'exited' or 'dead' or 'unknown', show a red badge with the count of such containers
                                    (() => {
                                        const problemContainers = (orphans || []).filter(c => ['unhealthy', 'exited', 'dead', 'unknown'].includes(c.status));
                                        if (problemContainers.length > 0) {
                                            return <Badge variant="destructive">{problemContainers.length} issue{problemContainers.length > 1 ? 's' : ''}</Badge>;
                                        }
                                        if ((orphans || []).length > 0) {
                                            return <Badge className={"bg-green-400"}>All Healthy</Badge>
                                        }
                                        return null;
                                    })()
                                }
                            </div>
                        </div>
                        <div className="outline-1 rounded-xs">
                            {isLoadingOrphans ? <Skeleton className="h-20 w-full" /> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Container ID</TableHead>
                                            <TableHead>Agent ID</TableHead>
                                            <TableHead>Image</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(orphans || []).map((container) => (
                                            <ContainerEntry key={container.id || container.name} container={container} activeAgents={activeAgents} />
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                    {/* Agents Section*/}
                    <div className="">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-semibold">Agents</h2>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <CircleQuestionMark/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Agents are instances of Clogs running on different hosts, responsible for monitoring and reporting container statuses.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div>
                                {
                                    agentsData && Object.keys(agentsData).length === 0 ? <span className="text-sm text-muted-foreground">No agents found</span> : null
                                }
                            </div>
                        </div>
                        <div className="outline-1 rounded-xs">
                            {isLoadingAgents ? <Skeleton className="h-20 w-full" /> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Agent ID</TableHead>
                                            <TableHead>Hostname</TableHead>
                                            <TableHead>Heartbeat Interval (s)</TableHead>
                                            <TableHead>Discovery Interval (s)</TableHead>
                                            <TableHead>On Host</TableHead>
                                            <TableHead>Active</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {
                                            agentsData && Object.values(agentsData).map((agent) => (
                                                <AgentEntry key={agent.id} agent={agent} activeAgents={activeAgents} />
                                            ))
                                        }
                                    </TableBody>
                                </Table>
                            )}
                    </div>
                    </div>
                </div>

                {/* Logs Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-semibold">{loggingMode ? "Warning/Error Logs" : "Error Logs"}</h2>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <CircleQuestionMark/>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        View recent container errors. Toggle to include warnings as well.
                                        Note: Extraction of log levels depends on container log formats and may not be accurate for all containers.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Switch checked={loggingMode} onCheckedChange={(checked) => setLoggingMode(checked)} />
                                <span>Include Warnings</span>
                            </div>
                            <Separator orientation="vertical"/>
                            <div className="flex items-center gap-2">
                                <span>Log Entries:</span>
                                <Button variant="outline" size="sm" onClick={() => setLogLimit(50)} className={logLimit === 50 ? 'bg-gray-200' : ''}>50</Button>
                                <Button variant="outline" size="sm" onClick={() => setLogLimit(100)} className={logLimit === 100 ? 'bg-gray-200' : ''}>100</Button>
                                <Button variant="outline" size="sm" onClick={() => setLogLimit(200)} className={logLimit === 200 ? 'bg-gray-200' : ''}>200</Button>
                            </div>
                        </div>
                    </div>
                    <div className="outline-1 rounded-xs px-2">
                        {isLoadingLogs ? <Skeleton className="h-20 w-full" /> : (
                            <ScrollArea>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Container ID</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Message</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(logs || []).map((log) => (
                                            <TableRow key={log.id || `${log.container_id}-${log.timestamp}`}>
                                                <TableCell>{new Date(log.timestamp * 1000).toLocaleString()}</TableCell>
                                                <TableCell className="font-mono text-xs">{log.container_id.substring(0, 8)}</TableCell>
                                                <TableCell>{log.level}</TableCell>
                                                <TableCell>{log.message}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </div>
                </div>


            </div>
            {/* Footer */}
            <Separator orientation="horizontal"/>
            <div className="text-center text-sm text-muted-foreground pt-6">
                <p>Clogs Web &copy; 2025. Built with ❤️ in 🇩🇪 🇪🇺.</p>
            </div>
        </div>
    );
}

export default App;
