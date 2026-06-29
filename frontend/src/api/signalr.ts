import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/stores/authStore';

let sceneConnection: signalR.HubConnection | null = null;
let editorConnection: signalR.HubConnection | null = null;
let startingPromise: Promise<void> | null = null;

function buildHub(url: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      transport: signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect()
    .build();
}

export function getSceneHub(): signalR.HubConnection {
  if (!sceneConnection) {
    sceneConnection = buildHub('/hubs/scene');
  }
  return sceneConnection;
}

export function getEditorHub(): signalR.HubConnection {
  if (!editorConnection) {
    editorConnection = buildHub('/hubs/editor');
  }
  return editorConnection;
}

export async function startConnections() {
  if (startingPromise) return startingPromise;
  startingPromise = (async () => {
    try {
      await getSceneHub().start();
      await getEditorHub().start();
    } catch (err) {
      console.error('SignalR connection error:', err);
    }
  })();
  await startingPromise;
  startingPromise = null;
}

export async function stopConnections() {
  startingPromise = null;
  if (sceneConnection) { await sceneConnection.stop(); sceneConnection = null; }
  if (editorConnection) { await editorConnection.stop(); editorConnection = null; }
}
