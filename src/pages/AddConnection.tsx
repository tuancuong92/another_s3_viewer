import { Component } from 'solid-js';
import { Layout } from '../components/Layout/Layout';
import { AddConnectionForm } from '../components/Connection/AddConnectionForm';

const AddConnectionPage: Component = () => {
  return (
    <Layout>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-primary">Add Connection</h1>
        <p class="text-secondary mt-1">Configure a new S3 compatible endpoint.</p>
      </div>
      <AddConnectionForm />
    </Layout>
  );
};

export default AddConnectionPage;
