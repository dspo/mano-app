/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from 'react';

import { CAN_USE_BEFORE_INPUT } from '@lexical/utils';
import { useEffect, useMemo, useState } from 'react';

import { INITIAL_SETTINGS, isDevPlayground } from './appSettings';
import { useSettings } from './context/SettingsContext';
import Switch from './ui/Switch';

export default function Settings(): JSX.Element {
  const windowLocation = window.location;
  const {
    setOption,
    settings: {
      measureTypingPerf,
      isCollab,
      isRichText,
      hasNestedTables,
      isMaxLength,
      hasLinkAttributes,
      isCharLimit,
      isCharLimitUtf8,
      isAutocomplete,
      showTreeView,
      showNestedEditorTreeView,
      // disableBeforeInput,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
      shouldAllowHighlightingWithBrackets,
      // tableHorizontalScroll,
      selectionAlwaysOnDisplay,
      isCodeHighlighted,
      isCodeShiki,
    },
  } = useSettings();
  useEffect(() => {
    if (INITIAL_SETTINGS.disableBeforeInput && CAN_USE_BEFORE_INPUT) {
      console.error(
        `Legacy events are enabled (disableBeforeInput) but CAN_USE_BEFORE_INPUT is true`,
      );
    }
  }, []);
  // Removed showSettings state and Options button
  const [isSplitScreen, search] = useMemo(() => {
    const parentWindow = window.parent;
    const _search = windowLocation.search;
    const _isSplitScreen =
      parentWindow && parentWindow.location.pathname === '/split/';
    return [_isSplitScreen, _search];
  }, [windowLocation]);

  return null;
}