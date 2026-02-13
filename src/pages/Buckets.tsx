import { Component, createResource, For, Show, createSignal, createEffect } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { connectionStore, setActiveConnection } from '../store/connectionStore';
import { listBuckets, createBucket, deleteBucket } from '../services/s3';
import { openPanel } from '../store/uiStore';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { HardDrive, Plus, Trash2, Folder, Info } from 'lucide-solid';

const BucketsPage: Component = () => {
    const params = useParams();
    const connection = () => connectionStore.connections.find(c => c.id === params.id);
    
    createEffect(() => {
        if (params.id) {
            setActiveConnection(params.id);
        }
    });

    // Resource to fetch buckets
    const [buckets, { refetch }] = createResource(connection, async (conn) => {
        if (!conn) return [];
        try {
            return await listBuckets(conn);
        } catch (e) {
            console.error(e);
            return [];
        }
    });

    const [newBucketName, setNewBucketName] = createSignal('');
    const [isCreating, setIsCreating] = createSignal(false);

    const handleCreateBucket = async (e: Event) => {
        e.preventDefault();
        const conn = connection();
        if (!conn || !newBucketName()) return;
        
        try {
            await createBucket(conn, newBucketName());
            setNewBucketName('');
            setIsCreating(false);
            refetch();
        } catch (e) {
            alert('Failed to create bucket');
            console.error(e);
        }
    };

    const handleDeleteBucket = async (name: string) => {
        if (!confirm(`Are you sure you want to delete bucket ${name}?`)) return;
        const conn = connection();
        if (!conn) return;

        try {
            await deleteBucket(conn, name);
            refetch();
        } catch (e) {
            alert('Failed to delete bucket');
            console.error(e);
        }
    }

    return (
        <Layout>
            <Show when={connection()} fallback={<div>Connection not found</div>}>
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-3xl font-bold text-primary">{connection()?.name} Buckets</h1>
                        <p class="text-secondary mt-1">{connection()?.endpoint}</p>
                    </div>
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus size={20} />
                        New Bucket
                    </Button>
                </div>

                <Show when={isCreating()}>
                    <div class="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                        <form onSubmit={handleCreateBucket} class="flex gap-4 items-end">
                            <div class="flex-1">
                                <Input 
                                    label="Bucket Name" 
                                    value={newBucketName()} 
                                    onInput={(e) => setNewBucketName(e.currentTarget.value)}
                                    placeholder="my-new-bucket"
                                    required 
                                />
                            </div>
                            <Button type="submit">Create</Button>
                            <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
                        </form>
                    </div>
                </Show>

                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <For each={buckets()}>
                        {(bucket) => (
                            <A href={`/connections/${connection()?.id}/buckets/${bucket.Name}`}>
                                <Card hover class="relative group">
                                    <div class="flex items-center justify-between mb-4">
                                        <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                            <HardDrive size={24} />
                                        </div>
                                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                class="p-2 text-slate-400 hover:text-primary transition-colors"
                                                title="View Details"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    openPanel('BUCKET_DETAILS', {
                                                        bucketName: bucket.Name,
                                                        connectionName: connection()?.name,
                                                        endpoint: connection()?.endpoint,
                                                        region: connection()?.region,
                                                        creationDate: bucket.CreationDate?.toISOString(),
                                                    });
                                                }}
                                            >
                                                <Info size={18} />
                                            </button>
                                            <button
                                                class="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Delete Bucket"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (bucket.Name) handleDeleteBucket(bucket.Name);
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 class="font-bold text-lg truncate" title={bucket.Name}>{bucket.Name}</h3>
                                    <p class="text-xs text-secondary mt-1">
                                        {bucket.CreationDate ? new Date(bucket.CreationDate).toLocaleDateString() : '-'}
                                    </p>
                                </Card>
                            </A>
                        )}
                    </For>
                    <Show when={buckets() && buckets()?.length === 0}>
                        <div class="col-span-full text-center py-12 text-secondary">
                            <Folder size={48} class="mx-auto mb-4 opacity-20" />
                            <p>No buckets found. Create one to get started.</p>
                        </div>
                    </Show>
                </div>
            </Show>
        </Layout>
    );
};

export default BucketsPage;
