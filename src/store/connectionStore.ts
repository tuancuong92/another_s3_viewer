import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { encrypt, decrypt } from '../utils/crypto';
import { removeClient } from '../services/s3';

export interface S3Connection {
    id: string;
    name: string;
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

interface ConnectionState {
    connections: S3Connection[];
    activeConnectionId: string | null;
}

const STORAGE_KEY = 's3-manager-connections';

// Error notification signal
export const [lastError, setLastError] = createSignal<string | null>(null);

async function loadConnections(): Promise<ConnectionState> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            // Decrypt sensitive fields
            if (data.connections && Array.isArray(data.connections)) {
                const decryptedConnections = await Promise.all(
                    data.connections.map(async (conn: any) => {
                        try {
                            return {
                                ...conn,
                                accessKeyId: await decrypt(conn.accessKeyId),
                                secretAccessKey: await decrypt(conn.secretAccessKey),
                            };
                        } catch (e) {
                            console.error('Failed to decrypt connection', e);
                            setLastError('Failed to decrypt saved connections. They may be corrupted.');
                            return null;
                        }
                    })
                );
                data.connections = decryptedConnections.filter((c): c is S3Connection => c !== null);
            }
            return data;
        }
    } catch (e) {
        console.error('Failed to load connections', e);
        setLastError('Failed to load saved connections.');
    }
    return { connections: [], activeConnectionId: null };
}

// Initialize store asynchronously
const initialState: ConnectionState = { connections: [], activeConnectionId: null };
export const [connectionStore, setConnectionStore] = createStore<ConnectionState>(initialState);

// Load connections on initialization
loadConnections().then((state) => {
    setConnectionStore(state);
});

export const addConnection = async (connection: Omit<S3Connection, 'id'>) => {
    const id = crypto.randomUUID();
    setConnectionStore('connections', (prev) => [...prev, { ...connection, id }]);
    await saveConnections();
};

export const removeConnection = async (id: string) => {
    // Clean up cached S3 client
    removeClient(id);
    
    setConnectionStore('connections', (prev) => prev.filter((c) => c.id !== id));
    if (connectionStore.activeConnectionId === id) {
        setConnectionStore('activeConnectionId', null);
    }
    await saveConnections();
};

export const setActiveConnection = async (id: string) => {
    setConnectionStore('activeConnectionId', id);
    await saveConnections();
};

async function saveConnections() {
    try {
        // Encrypt sensitive fields before saving
        const encryptedConnections = await Promise.all(
            connectionStore.connections.map(async (conn) => {
                try {
                    return {
                        ...conn,
                        accessKeyId: await encrypt(conn.accessKeyId),
                        secretAccessKey: await encrypt(conn.secretAccessKey),
                    };
                } catch (e) {
                    console.error('Failed to encrypt connection', e);
                    setLastError('Failed to encrypt connection credentials.');
                    throw e;
                }
            })
        );
        
        const stateToSave = {
            connections: encryptedConnections,
            activeConnectionId: connectionStore.activeConnectionId,
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        setLastError(null); // Clear any previous errors on success
    } catch (e) {
        console.error('Failed to save connections', e);
        setLastError('Failed to save connections securely.');
    }
}
