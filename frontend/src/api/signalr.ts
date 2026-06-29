import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/stores/authStore';

let sceneConnection: signalR.HubConnection | null = null;
let editorConnection: signalR.HubConnection | null = null;

export function getSceneHub(): signalR.HubConnection {
  if (!sceneConnection) {
    sceneConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/scene', {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect()
      .build();
  }
  return sceneConnection;
}

export function getEditorHub(): signalR.HubConnection {
  if (!editorConnection) {
    editorConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/editor', {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect()
      .build();
  }
  return editorConnection;
}

export async function startConnections() {
  try {
    await getSceneHub().start();
    await getEditorHub().start();
  } catch (err) {
    console.error('SignalR connection error:', err);
  }
}

export async function stopConnections() {
  if (sceneConnection) { await sceneConnection.stop(); sceneConnection = null; }
  if (editorConnection) { await editorConnection.stop(); editorConnection = null; }
}
