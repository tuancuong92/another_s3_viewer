import { Component, For } from 'solid-js';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Database, Plus, Trash2 } from 'lucide-solid';
import { useNavigate } from '@solidjs/router';
import { connectionStore, removeConnection } from '../store/connectionStore';

const Home: Component = () => {
    const navigate = useNavigate();
    
    return (
        <Layout>
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-primary">Dashboard</h1>
                    <p class="text-secondary mt-1">Manage your S3 compatible storage buckets</p>
                </div>
                <Button onClick={() => navigate('/connections/add')}>
                    <Plus size={20} />
                    New Connection
                </Button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card hover class="flex flex-col items-center justify-center py-12 text-center border-dashed border-2 border-slate-200 shadow-none hover:border-cta hover:bg-yellow-50/10" onClick={() => navigate('/connections/add')}>
                    <div class="bg-slate-100 p-4 rounded-full mb-4">
                        <Plus size={24} class="text-secondary" />
                    </div>
                    <h3 class="font-semibold text-lg">Add Connection</h3>
                    <p class="text-sm text-secondary mt-1">Connect to MinIO, AWS, etc.</p>
                 </Card>
                 
                 <For each={connectionStore.connections}>
                    {(conn) => (
                        <Card hover onClick={() => navigate(`/connections/${conn.id}/buckets`)} class="relative group">
                            <div class="flex justify-between items-start mb-4">
                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                    <Database size={20} />
                                </div>
                                <button
                                    class="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(confirm('Delete this connection?')) removeConnection(conn.id);
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 class="font-bold text-lg truncate" title={conn.name}>{conn.name}</h3>
                            <p class="text-sm text-secondary mb-4 truncate" title={conn.endpoint}>{conn.endpoint}</p>
                            <div class="flex gap-2 text-sm text-secondary">
                                <span class="uppercase text-xs font-bold tracking-wider bg-slate-100 px-2 py-1 rounded">{conn.region}</span>
                            </div>
                        </Card>
                    )}
                 </For>
            </div>
        </Layout>
    )
}

export default Home;
