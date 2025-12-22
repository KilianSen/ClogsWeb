import {useEffect, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {getActiveAgents, getAgents, getHealth, getLogs, getOrphans, getServices} from './api';
import {Badge} from "@/components/ui/badge";
import {Skeleton} from "@/components/ui/skeleton";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {CircleQuestionMark, GithubIcon, Link, Moon, Sun,} from "lucide-react";
import type {Container, ServiceContainer, WhitelabelConfig} from "@/types.ts";
import {Switch} from "@/components/ui/switch.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {aliveToColorClass, typeToColorClass} from "@/lib/color.ts";
import {ContainerEntry} from "@/components/ContainerEntry.tsx";
import {AgentEntry} from "@/components/AgentEntry.tsx";


function ContainerTable({containers}: { containers: Container[] }) {
    const { data: activeAgents } = useQuery({
        queryKey: ['activeAgents'],
        queryFn: getActiveAgents,
        refetchInterval: 5000
    });

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Container ID</TableHead>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Uptime Percent</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {containers.map((container) => (
                    <ContainerEntry key={container.id || container.name} container={container} activeAgents={activeAgents} internal={true} />
                ))}
            </TableBody>
        </Table>
    )
}

function App() {
    const [logLimit, setLogLimit] = useState(50);
    const [loggingMode, setLoggingMode] = useState(false)
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

    const { data: whitelabelConfig } = useQuery({
        queryKey: ['whitelabelConfig'],
        queryFn: async () => {
            try {
                const response = await fetch('/whitelabeling/config.json');
                if (!response.ok) return null;
                return await response.json() as WhitelabelConfig;
            } catch {
                return null;
            }
        },
        staleTime: Infinity,
        retry: false
    });

    useEffect(() => {
        if (whitelabelConfig?.documentTitle) {
            document.title = whitelabelConfig.documentTitle;
        }
    }, [whitelabelConfig]);

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

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', darkMode.toString());
    }, [darkMode]);


    return (
        <div className="container mx-auto p-6">
            <div className="space-y-8 min-h-screen">
                <div className="flex items-center justify-center mb-8 relative">
                    <div className="flex flex-col items-center justify-center gap-8">
                        <img
                            src="/whitelabeling/logo.png"
                            alt="Logo"
                            className={"w-1/2"}
                        />
                        <h1 className="text-4xl font-bold text-center">{whitelabelConfig?.title || "Clogs Dashboard"}</h1>
                    </div>

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
                                                                console.log(containers);
                                                                const problemContainers = (containers || []).filter(c => ['debug', 'unhealthy', 'exited', 'dead', 'unknown'].includes(c.status));
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
                                                <ContainerTable containers={containers} />
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
                                <ContainerTable containers={orphans || []}  />
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
            <Separator orientation="horizontal" className={"my-6"}/>
            <div className="flex items-center">
                <div className="flex-1 flex justify-start gap-2">
                    {
                        whitelabelConfig?.footerLink ? (
                            <a href={whitelabelConfig.footerLink} target="_blank" rel="noopener noreferrer">
                                <Button
                                    variant="outline"
                                    size="icon"
                                >
                                    {
                                        whitelabelConfig.footerLinkLogo ? (
                                            <img src={whitelabelConfig.footerLinkLogo} alt="Footer Link Logo" className="w-5 h-5"/>
                                        ) : (
                                            <Link/>
                                        )
                                    }
                                </Button>
                            </a>
                        ) : <></>
                    }
                    <a href="/">
                        <Button
                            variant="outline"
                            size="icon"
                        >
                            <GithubIcon />
                        </Button>
                    </a>
                </div>
                <div className="text-center text-sm text-muted-foreground grow flex-none">
                    { whitelabelConfig?.footerText ? <p>{whitelabelConfig.footerText} built with</p> : null }
                    <p>{"Clogs Web \u00A9 2025. Built with \u2764\uFE0F in \uD83C\uDDE9\uD83C\uDDEA \uD83C\uDDEA\uD83C\uDDFA."}</p>
                </div>
                <div className="flex-1 flex justify-end">
                    {/* Darkmode */}
                    {
                        whitelabelConfig?.enableDarkMode ? (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setDarkMode(!darkMode)
                                }}
                            >
                                {
                                    !darkMode ? <Moon/> : <Sun/>
                                }
                            </Button>
                        ): <></>
                    }
                </div>
            </div>
        </div>
    );
}

export default App;
