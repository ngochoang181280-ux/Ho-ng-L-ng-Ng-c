import { RealtimeExamMessage } from '../types/exam';

const CHANNEL_NAME = 'spmo_exam_realtime_channel';

class RealtimeExamBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(msg: RealtimeExamMessage) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notify(event.data as RealtimeExamMessage);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or failed to initialize', e);
      }
    }

    // Fallback: lắng nghe qua storage event
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'spmo_realtime_event_v9' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notify(data as RealtimeExamMessage);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  public send(msg: RealtimeExamMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('Error posting broadcast message', e);
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('spmo_realtime_event_v9', JSON.stringify({ ...msg, _t: Date.now() }));
      } catch {
        // ignore
      }
    }
  }

  public subscribe(callback: (msg: RealtimeExamMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(msg: RealtimeExamMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (e) {
        console.error('Error in realtime listener callback', e);
      }
    });
  }
}

export const realtimeExamBus = new RealtimeExamBus();
