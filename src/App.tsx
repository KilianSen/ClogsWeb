import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getServices, getOrphans, getUptime, getHealth, getLogs } from './api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function App() {
    const [logLimit, setLogLimit] = useState(50);

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
        queryKey: ['logs', logLimit],
        queryFn: () => getLogs(logLimit),
        refetchInterval: 5000
    });

    // Transform uptime data for chart
    const uptimeData = uptime ? Object.entries(uptime).map(([name, seconds]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        hours: (Number(seconds) / 3600).toFixed(2)
    })) : [];

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex items-center justify-center mb-8 relative">
                <h1 className="text-4xl font-bold text-center">Clogs Dashboard</h1>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
                     <Badge variant={health ? "default" : "destructive"}>
                        API: {health ? "Online" : "Offline"}
                    </Badge>
                    <Badge variant="outline" className="animate-pulse text-green-600 border-green-600">
                        Live Updates
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Services Section */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingServices ? <Skeleton className="h-20 w-full" /> : (
                            <Accordion type="single" collapsible className="w-full">
                                {Object.entries(services || {}).map(([serviceName, containers]) => (
                                    <AccordionItem key={serviceName} value={serviceName}>
                                        <AccordionTrigger>{serviceName} ({containers.length} containers)</AccordionTrigger>
                                        <AccordionContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Agent ID</TableHead>
                                                        <TableHead>Image</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {containers.map((container) => (
                                                        <TableRow key={container.id || container.name}>
                                                            <TableCell>{container.name}</TableCell>
                                                            <TableCell>{container.status}</TableCell>
                                                            <TableCell className="font-mono text-xs">{container.agent_id.substring(0, 8)}</TableCell>
                                                            <TableCell className="font-mono text-xs">{container.image}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>

                {/* Orphans Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Orphans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingOrphans ? <Skeleton className="h-20 w-full" /> : (
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orphans?.map((container) => (
                                            <TableRow key={container.id || container.name}>
                                                <TableCell>{container.name}</TableCell>
                                                <TableCell>{container.status}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                 {/* Uptime Section */}
                 <Card>
                    <CardHeader>
                        <CardTitle>Uptime (Hours)</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {isLoadingUptime ? <Skeleton className="h-[300px] w-full" /> : (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={uptimeData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-background border rounded p-2 shadow-md">
                                                        <p className="font-bold">{payload[0].payload.fullName}</p>
                                                        <p>{payload[0].value} hours</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Bar dataKey="hours" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                            {uptimeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8884d8' : '#82ca9d'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                         )}
                    </CardContent>
                </Card>
            </div>

            {/* Logs Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Logs (Last {logLimit})</CardTitle>
                    <Button variant="outline" onClick={() => setLogLimit(prev => prev + 50)}>Load More</Button>
                </CardHeader>
                <CardContent>
                    {isLoadingLogs ? <Skeleton className="h-[400px] w-full" /> : (
                        <ScrollArea className="h-[400px] rounded-md border p-4 bg-muted/50">
                            <div className="space-y-2">
                                {logs?.map((log, i) => (
                                    <div key={i} className="flex gap-4 text-sm font-mono border-b border-border/50 pb-1 last:border-0">
                                        <span className="text-muted-foreground min-w-[160px]">{new Date(log.timestamp * 1000).toLocaleString()}</span>
                                        <span className="text-blue-600 dark:text-blue-400 min-w-[80px]">[{log.level}]</span>
                                        <span className="text-green-600 dark:text-green-400 min-w-[80px]">[{log.container_id.substring(0, 8)}]</span>
                                        <span className="break-all">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default App;
