import {createElement} from 'react';

/** Creates a host component that serializes its props for the smoke test to inspect. */
export function host(name) {
  function HostComponent(props) {
    const {children, ...rest} = props;
    return createElement(
      'rn-host',
      {'data-host': name, 'data-props': JSON.stringify(rest)},
      children,
    );
  }
  HostComponent.displayName = name;
  return HostComponent;
}
