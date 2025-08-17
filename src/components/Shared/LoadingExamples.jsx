import React from 'react';
import { useLoading } from './LoadingContext';
import LoadingSpinner from './LoadingSpinner';
import SkeletonLoader from './SkeletonLoader';
import LoadingButton from './LoadingButton';

// Example component showing how to use the loading system
export const LoadingExamples = () => {
  const { setLoading, isLoading, setGlobalLoading } = useLoading();

  const handleStartLoading = () => {
    setLoading('example', true);
    // Simulate some async work
    setTimeout(() => setLoading('example', false), 3000);
  };

  const handleGlobalLoading = () => {
    setGlobalLoading(true);
    setTimeout(() => setGlobalLoading(false), 2000);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Loading System Examples</h2>
      
      <h3>1. Basic Spinners</h3>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <LoadingSpinner size="small" variant="spinner" />
        <LoadingSpinner size="medium" variant="dots" />
        <LoadingSpinner size="large" variant="pulse" />
        <LoadingSpinner size="xl" variant="bars" />
      </div>

      <h3>2. Different Colors</h3>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <LoadingSpinner color="accent" />
        <LoadingSpinner color="primary" />
        <LoadingSpinner color="secondary" />
        <LoadingSpinner color="white" />
      </div>

      <h3>3. With Text</h3>
      <div style={{ marginBottom: '30px' }}>
        <LoadingSpinner text="Loading data..." />
      </div>

      <h3>4. Skeleton Loaders</h3>
      <div style={{ marginBottom: '30px' }}>
        <SkeletonLoader type="text" lines={3} width="80%" />
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <SkeletonLoader type="avatar" width="60px" height="60px" />
          <div style={{ flex: 1 }}>
            <SkeletonLoader type="text" lines={2} />
          </div>
        </div>
      </div>

      <h3>5. Loading Buttons</h3>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <LoadingButton 
          loading={isLoading('example')} 
          onClick={handleStartLoading}
          variant="primary"
        >
          Start Loading
        </LoadingButton>
        
        <LoadingButton 
          loading={isLoading('example')} 
          onClick={handleStartLoading}
          variant="outline"
        >
          Outline Button
        </LoadingButton>
      </div>

      <h3>6. Context-Based Loading</h3>
      <div style={{ marginBottom: '30px' }}>
        <button onClick={handleGlobalLoading}>
          Trigger Global Loading
        </button>
        <p>This will show a loading state across the entire app</p>
      </div>

      <h3>7. Overlay Loading</h3>
      <div style={{ position: 'relative', height: '200px', border: '1px solid #ccc', marginBottom: '30px' }}>
        <p>This container has relative positioning</p>
        <LoadingSpinner 
          overlay 
          text="Loading overlay..." 
          variant="pulse"
        />
      </div>

      <h3>8. Full Screen Loading</h3>
      <div style={{ marginBottom: '30px' }}>
        <button onClick={() => setGlobalLoading(true)}>
          Show Full Screen Loading
        </button>
        <p>Click to see full screen loading (will show for 2 seconds)</p>
      </div>
    </div>
  );
};

export default LoadingExamples;
