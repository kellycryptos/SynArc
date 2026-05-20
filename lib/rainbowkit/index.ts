import { darkTheme, Theme } from '@rainbow-me/rainbowkit';

const baseDarkTheme = darkTheme({
  accentColor: '#7c3aed',
  accentColorForeground: '#ffffff',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

export const synArcRainbowKitTheme: Theme = {
  ...baseDarkTheme,
  fonts: {
    body: 'var(--font-inter), system-ui, sans-serif',
  },
  colors: {
    ...baseDarkTheme.colors,
    modalBackground: '#0d0d14', // matching --surface
    modalBorder: 'rgba(255, 255, 255, 0.08)', // matching --border-thin
    modalText: '#f8fafc', // matching --foreground
    modalTextSecondary: '#94a3b8', // matching --muted
    actionButtonSecondaryBackground: 'rgba(20, 20, 32, 0.6)', // matching --surface-elevated
    actionButtonBorder: 'rgba(255, 255, 255, 0.08)', // matching --border-thin
    closeButton: '#f8fafc',
    closeButtonBackground: 'rgba(255, 255, 255, 0.05)',
  },
};
