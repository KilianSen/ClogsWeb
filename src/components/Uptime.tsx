import {Bar, BarChart, ResponsiveContainer, Tooltip as RCTooltip} from "recharts"
import type {TooltipContentProps} from "recharts/types/component/Tooltip";
import {useEffect, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import { getUptimeSections} from "@/api.ts";
import {Skeleton} from "@/components/ui/skeleton.tsx";

const UptimeTooltip = ({ active, payload}: TooltipContentProps<string | number, string>) => {
	const isVisible = active && payload && payload.length;
	return (
		<div className="custom-tooltip" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
			{isVisible && (
				<>
					<div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg">
						{payload!.filter(e => e.value != 0).map((entry, index) => (
							<p key={`item-${index}`} style={{ color: entry.color }} className="uppercase dark:text-white font-bold">
								{entry.name}
							</p>
						))}
					</div>
				</>
			)}
		</div>
	);
};


export default function Uptime({ container, maxSectionTime, historyTime }: { container: { id?: string | null }, maxSectionTime?: number, historyTime?: number }) {
	const maxTimeBack = historyTime || 3600; // in seconds, default to last hour
	const maxSectionLength = maxSectionTime || 30; // in seconds, default to 30 seconds
	const { data: uptimeSections, isLoading: isLoadingUptimeSections} = useQuery({
		queryKey: ['uptimeSections', container.id],
		queryFn: () => getUptimeSections(container.id || undefined),
		refetchInterval: 5000
	});
	const [currentTime, setCurrentTime] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(Math.floor(Date.now() / 1000));
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	const processedUptimeSections = uptimeSections ? uptimeSections.flatMap((section) => {
		const sections = [];
		const sectionLength = ((section.end_time ||currentTime) - section.start_time);
		const numChunks = Math.ceil(sectionLength / maxSectionLength);
		for (let i = 0; i < numChunks; i++) {
			const chunkStart = section.start_time + i * maxSectionLength;
			const chunkEnd = Math.min(section.start_time + (i + 1) * maxSectionLength, section.end_time || currentTime);
			sections.push({
				...section,
				start_time: chunkStart,
				end_time: chunkEnd
			});
		}

		// Filter sections to only include those within maxTimeBack
		return sections.filter(s => (s.end_time || currentTime) >= (currentTime - maxTimeBack));
	} ) : [];

	const dataKeys = (processedUptimeSections || []).map((uptimeSection) => uptimeSection.state).filter((value, index, self) => self.indexOf(value) === index);

	const data = processedUptimeSections ? processedUptimeSections.map((section, index) => ({
		name: `${index + 1}`,
		...dataKeys.reduce((acc, key) => {{
			acc[key] = key === section.state ? 1 : 0;
			return acc;
		}}, {} as {[key: string]: number})
	})) : [];


	return (
		!isLoadingUptimeSections ?
			<ResponsiveContainer width="100%" height={50}>
				<BarChart
					height="100%"
					width="100%"
					responsive
					data={data}
				>
					{dataKeys.map((key) => {
						let fillColor = '#8884d8'; // Default gray
						if (key === 'running') fillColor = '#4ade80'; // Green
						else if (key === 'exited') fillColor = '#f87171'; // Red
						else if (key === 'paused') fillColor = '#fbbf24'; // Yellow
						else if (key === 'restarting') fillColor = '#fb923c'; // Orange
						else if (key === 'created') fillColor = '#60a5fa'; // Blue
						else if (key === 'dead') fillColor = '#000000'; // Black
						else if (key === 'removing') fillColor = '#a78bfa'; // Purple
						else if (key === 'unknown') fillColor = '#9ca3af'; // Gray
						else if (key === 'unhealthy') fillColor = '#ec4899'; // Pink
						return <Bar key={key} dataKey={key} stackId="a" fill={fillColor} />;
					})}
					<RCTooltip content={UptimeTooltip} />
				</BarChart>
			</ResponsiveContainer>
			:
			<Skeleton className="h-12 w-full" />
	);
}