import type {ViewProps} from 'react-native';

/** Labels the wrapper as one image, or hides a decorative QR code from screen readers. */
export function accessibilityProps(ariaLabel: string | undefined): ViewProps {
  const label = ariaLabel?.trim();
  return label ? {accessible: true, role: 'img', 'aria-label': label} : {'aria-hidden': true};
}
