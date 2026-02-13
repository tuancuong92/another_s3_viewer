import type { Component } from 'solid-js';
import type { RouteSectionProps } from '@solidjs/router';

const App: Component<RouteSectionProps> = (props) => {
  return (
    <div class="min-h-screen bg-background text-text font-inter">
      {props.children}
    </div>
  );
};

export default App;
