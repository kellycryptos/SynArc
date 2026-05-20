"use client";

import { ReactNode } from 'react';
import { PrivyProviderWrapper } from '@/components/providers/PrivyProviderWrapper';

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderWrapper>
      {children}
    </PrivyProviderWrapper>
  );
}
