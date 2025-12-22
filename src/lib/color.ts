export function typeToColorClass(type: string) {
	if (type === 'compose') return 'bg-blue-500';
	if (type === 'swarm') return 'bg-green-500';
	return 'bg-gray-500';
}

export function statusToColorClass(status: string) {
	if (status === 'running') return 'text-green-500';
	if (status === 'exited') return 'text-red-500';
	if (status === 'paused') return 'text-yellow-500';
	if (status === 'restarting') return 'text-orange-500';
	if (status === 'created') return 'text-blue-500';
	if (status === 'dead') return 'text-black';
	if (status === 'removing') return 'text-purple-500';
	if (status === 'unknown') return 'text-gray-700 dark:text-gray-300';
	if (status === 'unhealthy') return 'text-pink-500';
	return 'text-gray-500';
}

export function aliveToColorClass(alive: boolean) {
	return alive ? '': 'bg-black/[0.05] dark:bg-white/[0.05]';
}