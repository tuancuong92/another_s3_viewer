import { createStore } from 'solid-js/store';

export type PanelViewType = 'BUCKET_DETAILS' | 'OBJECT_DETAILS' | 'NONE';

export interface PanelState {
    isOpen: boolean;
    viewType: PanelViewType;
    // Store bucket data for the panel
    data: {
        // Bucket Details Data
        bucketName?: string;
        connectionName?: string;
        endpoint?: string;
        region?: string;
        creationDate?: string;
        // Object Details Data
        objectKey?: string;
        objectSize?: number;
        lastModified?: string;
    } | null;
}

const initialState: PanelState = {
    isOpen: false,
    viewType: 'NONE',
    data: null
};

export const [uiStore, setUiStore] = createStore<PanelState>(initialState);

export const openPanel = (
    viewType: PanelViewType,
    data: PanelState['data']
) => {
    setUiStore({
        isOpen: true,
        viewType,
        data
    });
};

export const closePanel = () => {
    setUiStore({
        isOpen: false,
        viewType: 'NONE',
        data: null
    });
};

export const togglePanel = () => {
    setUiStore('isOpen', !uiStore.isOpen);
};
