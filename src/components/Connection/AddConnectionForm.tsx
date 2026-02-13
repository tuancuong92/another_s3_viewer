import { Component, createSignal, createMemo, Show } from 'solid-js';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { addConnection } from '../../store/connectionStore';
import { useNavigate } from '@solidjs/router';

export const AddConnectionForm: Component = () => {
  const navigate = useNavigate();
  const [name, setName] = createSignal('');
  const [endpoint, setEndpoint] = createSignal('');
  const [accessKey, setAccessKey] = createSignal('');
  const [secretKey, setSecretKey] = createSignal('');
  const [region, setRegion] = createSignal('us-east-1');
  const [loading, setLoading] = createSignal(false);

  // Error signals
  const [nameError, setNameError] = createSignal('');
  const [endpointError, setEndpointError] = createSignal('');
  const [accessKeyError, setAccessKeyError] = createSignal('');
  const [secretKeyError, setSecretKeyError] = createSignal('');
  const [regionError, setRegionError] = createSignal('');

  // Validation functions
  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError('Connection name is required');
      return false;
    }
    if (value.length > 50) {
      setNameError('Connection name must be 50 characters or less');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEndpoint = (value: string) => {
    if (!value.trim()) {
      setEndpointError('Endpoint URL is required');
      return false;
    }
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      setEndpointError('Endpoint must start with http:// or https://');
      return false;
    }
    try {
      new URL(value);
      setEndpointError('');
      return true;
    } catch {
      setEndpointError('Invalid URL format');
      return false;
    }
  };

  const validateAccessKey = (value: string) => {
    if (!value.trim()) {
      setAccessKeyError('Access Key ID is required');
      return false;
    }
    if (value.length < 16) {
      setAccessKeyError('Access Key ID must be at least 16 characters');
      return false;
    }
    setAccessKeyError('');
    return true;
  };

  const validateSecretKey = (value: string) => {
    if (!value.trim()) {
      setSecretKeyError('Secret Access Key is required');
      return false;
    }
    if (value.length < 8) {
      setSecretKeyError('Secret Access Key must be at least 8 characters');
      return false;
    }
    setSecretKeyError('');
    return true;
  };

  const validateRegion = (value: string) => {
    if (!value.trim()) {
      setRegionError('Region is required');
      return false;
    }
    const regionPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!regionPattern.test(value)) {
      setRegionError('Region must contain lowercase letters, numbers, and hyphens only (e.g., us-east-1)');
      return false;
    }
    setRegionError('');
    return true;
  };

  // Check if form is valid
  const isFormValid = createMemo(() => {
    return (
      !nameError() &&
      !endpointError() &&
      !accessKeyError() &&
      !secretKeyError() &&
      !regionError() &&
      name().trim() !== '' &&
      endpoint().trim() !== '' &&
      accessKey().trim() !== '' &&
      secretKey().trim() !== '' &&
      region().trim() !== ''
    );
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    // Validate all fields before submitting
    const isNameValid = validateName(name());
    const isEndpointValid = validateEndpoint(endpoint());
    const isAccessKeyValid = validateAccessKey(accessKey());
    const isSecretKeyValid = validateSecretKey(secretKey());
    const isRegionValid = validateRegion(region());

    if (!isNameValid || !isEndpointValid || !isAccessKeyValid || !isSecretKeyValid || !isRegionValid) {
      return;
    }

    setLoading(true);
    try {
      await addConnection({
        name: name(),
        endpoint: endpoint(),
        accessKeyId: accessKey(),
        secretAccessKey: secretKey(),
        region: region(),
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to add connection:', error);
      // Could add a general error message here if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4 max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-100">
      <h2 class="text-xl font-bold mb-6">Add New Connection</h2>
      
      <div>
        <Input
          label="Connection Name"
          placeholder="My MinIO"
          value={name()}
          onInput={(e) => {
            setName(e.currentTarget.value);
            validateName(e.currentTarget.value);
          }}
          required
        />
        <Show when={nameError()}>
          <p class="text-red-500 text-sm mt-1">{nameError()}</p>
        </Show>
      </div>

      <div>
        <Input
          label="Endpoint URL"
          placeholder="http://localhost:9000"
          value={endpoint()}
          onInput={(e) => {
            setEndpoint(e.currentTarget.value);
            validateEndpoint(e.currentTarget.value);
          }}
          required
        />
        <Show when={endpointError()}>
          <p class="text-red-500 text-sm mt-1">{endpointError()}</p>
        </Show>
      </div>

      <div>
        <Input
          label="Region"
          placeholder="us-east-1"
          value={region()}
          onInput={(e) => {
            setRegion(e.currentTarget.value);
            validateRegion(e.currentTarget.value);
          }}
        />
        <Show when={regionError()}>
          <p class="text-red-500 text-sm mt-1">{regionError()}</p>
        </Show>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Access Key ID"
            type="password"
            autocomplete="off"
            value={accessKey()}
            onInput={(e) => {
              setAccessKey(e.currentTarget.value);
              validateAccessKey(e.currentTarget.value);
            }}
            required
          />
          <Show when={accessKeyError()}>
            <p class="text-red-500 text-sm mt-1">{accessKeyError()}</p>
          </Show>
        </div>
        <div>
          <Input
            label="Secret Access Key"
            type="password"
            autocomplete="off"
            value={secretKey()}
            onInput={(e) => {
              setSecretKey(e.currentTarget.value);
              validateSecretKey(e.currentTarget.value);
            }}
            required
          />
          <Show when={secretKeyError()}>
            <p class="text-red-500 text-sm mt-1">{secretKeyError()}</p>
          </Show>
        </div>
      </div>

      <div class="pt-4 flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={() => navigate('/')} disabled={loading()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid() || loading()}>
          {loading() ? 'Saving...' : 'Save Connection'}
        </Button>
      </div>
    </form>
  );
};
