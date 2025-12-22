import type {ActiveAgent, Container} from "@/types.ts";
import {cloneElement, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getLogs, getUptime} from "@/api.ts";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {aliveToColorClass, statusToColorClass} from "@/lib/color.ts";
import Uptime from "@/components/Uptime.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {Box, FileQuestion, HeartCrack, Pause, Play, RefreshCw, Skull, Square, Trash2} from "lucide-react";
import {Tooltip, TooltipTrigger, TooltipContent} from "@/components/ui/tooltip.tsx";

function StatusSymbol({status}: { status: string }) {
	let element = <FileQuestion/>;
	switch (status) {
		case 'running':
			element = <Play/>
			break;
		case 'paused':
			element = <Pause/>
			break;
		case 'exited':
			element = <Square/>
			break;
		case 'dead':
			element = <Skull/>
			break;
		case 'removing':
			element = <Trash2/>
			break;
		case 'unhealthy':
			element = <HeartCrack/>
			break;
		case 'restarting':
			element = <RefreshCw/>
			break;
		case 'created':
			element = <Box/>
			break;
		default:
			element = <FileQuestion/>
	}

	return (
		<span className={statusToColorClass(status)}>
			<Tooltip>
				<TooltipTrigger>
					{cloneElement(element, {fill: 'currentColor', size: 16})}
				</TooltipTrigger>
				<TooltipContent>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</TooltipContent>
			</Tooltip>
		</span>
	)
}

function ContainerDialog({container}: { container: Container }) {
	const [logLimit, setLogLimit] = useState(50);
	const {data: logs, isLoading: isLoadingLogs} = useQuery({
		queryKey: ['logs', container.id],
		queryFn: () => getLogs(logLimit, undefined, container.id || undefined),
		refetchInterval: 5000
	});

	return (
		<div className="p-4">
			<div className="space-y-2">
				<div><strong>Name:</strong> {container.name}</div>
				<div><strong>Container ID:</strong> {container.id || 'N/A'}</div>
				<div><strong>Agent ID:</strong> {container.agent_id}</div>
				<div><strong>Image:</strong> {container.image}</div>
				<div><strong>Created At:</strong>{new Date((container.created_at || 0) * 1000).toLocaleString()}
				</div>
				<div><strong>Status:</strong> <span
					className={statusToColorClass(container.status)}>{container.status}</span></div>
			</div>
			<div className="w-full">
				<Uptime container={container}/>
			</div>
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-lg font-semibold">Recent Logs</h3>
				<div className="flex items-center gap-2">
					<span>Log Entries:</span>
					<Button variant="outline" size="sm" onClick={() => setLogLimit(50)}
					        className={logLimit === 50 ? 'bg-gray-200' : ''}>50</Button>
					<Button variant="outline" size="sm" onClick={() => setLogLimit(100)}
					        className={logLimit === 100 ? 'bg-gray-200' : ''}>100</Button>
					<Button variant="outline" size="sm" onClick={() => setLogLimit(200)}
					        className={logLimit === 200 ? 'bg-gray-200' : ''}>200</Button>
				</div>
			</div>
			<div className="outline-1 rounded-xs px-2">
				{isLoadingLogs ? <Skeleton className="h-20 "/> : (
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
									<TableCell
										className={"w-32"}>{new Date(log.timestamp / 1000000).toLocaleString()}</TableCell>
									<TableCell className={"w-16"}>{log.level}</TableCell>
									<TableCell className={"overflow-scroll max-w-48!"}>{log.message}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	)
}

export function ContainerEntry({container, activeAgents, internal}: {
	container: Container,
	activeAgents?: ActiveAgent,
	internal?: boolean
}) {

	const {data: uptimes, isLoading: isLoadingUptimes} = useQuery({
		queryKey: ['uptime'],
		queryFn: () => getUptime(),
		refetchInterval: 5000
	});

	return (
		<Dialog>
			<DialogTrigger asChild>
				<TableRow key={container.id || container.name}
				          className={!internal ? aliveToColorClass(!!activeAgents && activeAgents[container.agent_id]) : ""}>
					<TableCell>{container.name}</TableCell>
					<TableCell
						className="font-mono text-xs">{container.id ? container.id.substring(0, 8) : 'N/A'}</TableCell>
					<TableCell className="font-mono text-xs">{container.agent_id.substring(0, 8)}</TableCell>
					<TableCell className="font-mono text-xs">{container.image}</TableCell>
					{/* Uptime Chart */}
					<TableCell>
						<div className="w-full min-w-36">
							<Uptime container={container} maxSectionTime={120}/>
						</div>
					</TableCell>
					<TableCell>
						{isLoadingUptimes ? <Skeleton className="h-4 w-12"/> : (
							<span>
								{uptimes && uptimes[container.id || ''] ?
									`${(uptimes[container.id || ''].uptime_percentage * 100).toFixed(2)}%` :
									'N/A'}
							</span>
						)}
					</TableCell>
					<TableCell
						className="font-mono text-xs">{new Date((container.since || 0) * 1000).toLocaleString()}</TableCell>
					<TableCell className={statusToColorClass(container.status)}><StatusSymbol status={container.status}/></TableCell>
				</TableRow>
			</DialogTrigger>
			<DialogContent className="max-w-4/5! max-h-4/5 overflow-scroll">
				<DialogHeader>
					<DialogTitle>Container Details</DialogTitle>
					<DialogDescription>
						Detailed information and logs for the selected container.
					</DialogDescription>
				</DialogHeader>

				{/* Log section */}
				<ContainerDialog container={container}/>
			</DialogContent>
		</Dialog>
	)
}