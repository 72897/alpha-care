import {
  AgentSession,
  AgentMicrophone,
  AgentPlayer,
  AgentSessionConfig,
  AgentSettingsObject,
} from "@deepgram/agents";

export type {
  AgentSession as DeepgramAgentSession,
  AgentMicrophone as DeepgramAgentMicrophone,
  AgentPlayer as DeepgramAgentPlayer,
  AgentSettingsObject,
};

export const createAgentSession = (config: AgentSessionConfig): AgentSession =>
  new AgentSession(config);

export const createMicrophone = (
  onAudioFrame: (data: ArrayBuffer) => void
): AgentMicrophone => new AgentMicrophone(onAudioFrame);

export const createPlayer = (): AgentPlayer => new AgentPlayer();
