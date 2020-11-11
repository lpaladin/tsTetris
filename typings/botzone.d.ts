interface DisplayLog { }
interface PlayerRequest { }
interface PlayerResponse { }

interface ResultLogBase {
	verdict: string;
	time?: number;
	memory?: number;
}

interface JudgeResultLog extends ResultLogBase {
	output: {
		display: DisplayLog;
		content: {
			[index: string]: PlayerRequest;
		}
		command: string;
	}
}

interface BrowserResultLog extends ResultLogBase {
	response: PlayerResponse;
	content: any;
}

interface BotResultLog extends ResultLogBase {
	response: PlayerResponse;
	debug?: any;
}

interface PlayerResultLog {
	[index: string]: BrowserResultLog | BotResultLog
}

declare type FullLogItem = JudgeResultLog | PlayerResultLog;

declare type FullLog = FullLogItem[];