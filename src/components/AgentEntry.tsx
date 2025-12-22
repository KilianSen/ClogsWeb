import type {ActiveAgent, Agent} from "@/types.ts";
import {TableCell, TableRow} from "@/components/ui/table.tsx";
import {aliveToColorClass} from "@/lib/color.ts";
import {SignalHigh, SignalLow} from "lucide-react";

export function AgentEntry({agent, activeAgents}: { agent: Agent, activeAgents?: ActiveAgent }) {
	return (
		<TableRow key={agent.id} className={aliveToColorClass(!!activeAgents && activeAgents[agent.id])}>
			<TableCell className="font-mono text-xs">{agent.id}</TableCell>
			<TableCell>{agent.hostname}</TableCell>
			<TableCell>{agent.heartbeat_interval}</TableCell>
			<TableCell>{agent.discovery_interval}</TableCell>
			<TableCell>{agent.on_host ? "true" : "false"}</TableCell>
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