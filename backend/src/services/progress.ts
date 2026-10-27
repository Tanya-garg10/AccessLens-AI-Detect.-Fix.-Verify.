import type { z } from "zod";
import { scanProgressStageSchema, streamScanResponseSchema } from "@accesslens/shared";

type ProgressEvent = z.infer<typeof streamScanResponseSchema>;
type Listener = (event: ProgressEvent) => void;

class ProgressBroker {
  private readonly events = new Map<string, ProgressEvent[]>();
  private readonly listeners = new Map<string, Set<Listener>>();

  emit(scanId: string, stage: z.infer<typeof scanProgressStageSchema>, message: string): void {
    const event = streamScanResponseSchema.parse({ event: stage, data: { scanId, message } });
    const history = this.events.get(scanId) ?? [];
    history.push(event);
    this.events.set(scanId, history);
    this.listeners.get(scanId)?.forEach((listener) => listener(event));
  }

  subscribe(scanId: string, listener: Listener): () => void {
    (this.events.get(scanId) ?? []).forEach(listener);
    const listeners = this.listeners.get(scanId) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(scanId, listeners);
    return () => listeners.delete(listener);
  }
}

export const progressBroker = new ProgressBroker();
