'use client';

import { SegmentedControl } from './segmented-control';
import type { UiLanguage } from '../../types/analytics';

interface LanguageSwitchProps {
  value: UiLanguage;
  onChange: (language: UiLanguage) => void;
  ariaLabel: string;
}

export function LanguageSwitch({ value, onChange, ariaLabel }: LanguageSwitchProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      options={[
        { value: 'es', label: 'ES' },
        { value: 'en', label: 'EN' },
      ]}
    />
  );
}
