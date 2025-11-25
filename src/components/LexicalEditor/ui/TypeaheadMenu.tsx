/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {MenuOption} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {JSX} from 'react';
import {createPortal} from 'react-dom';
import {RefObject, useCallback, useEffect, useRef} from 'react';

import './TypeaheadMenu.css';

export type TypeaheadMenuPluginProps<TOption extends MenuOption> = {
  selectedIndex: number | null;
  selectOptionAndCleanUp: (option: TOption) => void;
  setHighlightedIndex: (index: number) => void;
  options: Array<TOption>;
};

export function TypeaheadMenu<TOption extends MenuOption>({
  options,
  selectedIndex,
  selectOptionAndCleanUp,
  setHighlightedIndex,
}: TypeaheadMenuPluginProps<TOption>): JSX.Element | null {
  const listRef = useRef<HTMLUListElement>(null);

  const handleOptionClick = useCallback(
    (option: TOption, index: number) => {
      setHighlightedIndex(index);
      selectOptionAndCleanUp(option);
    },
    [selectOptionAndCleanUp, setHighlightedIndex],
  );

  const handleMouseEnter = useCallback(
    (index: number) => {
      setHighlightedIndex(index);
    },
    [setHighlightedIndex],
  );

  useEffect(() => {
    if (selectedIndex !== null && listRef.current) {
      const selectedItem = listRef.current.querySelector(
        `[data-option-index="${selectedIndex}"]`,
      );
      if (selectedItem) {
        selectedItem.scrollIntoView({block: 'nearest'});
      }
    }
  }, [selectedIndex]);

  return (
    <ul className="typeahead-menu" ref={listRef}>
      {options.map((option, index) => (
        <TypeaheadMenuItem
          key={option.key}
          option={option}
          index={index}
          isSelected={selectedIndex === index}
          onClick={handleOptionClick}
          onMouseEnter={handleMouseEnter}
        />
      ))}
    </ul>
  );
}

type TypeaheadMenuItemProps<TOption extends MenuOption> = {
  option: TOption;
  index: number;
  isSelected: boolean;
  onClick: (option: TOption, index: number) => void;
  onMouseEnter: (index: number) => void;
};

function TypeaheadMenuItem<TOption extends MenuOption>({
  option,
  index,
  isSelected,
  onClick,
  onMouseEnter,
}: TypeaheadMenuItemProps<TOption>) {
  // Support for different option types
  const displayContent = (() => {
    const opt = option as any;
    
    // ComponentPickerOption with icon and title
    if (opt.icon && opt.title) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="option-icon">{opt.icon}</span>
          <span className="option-title">{opt.title}</span>
          {opt.keyboardShortcut && (
            <span className="option-shortcut" style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>
              {opt.keyboardShortcut}
            </span>
          )}
        </div>
      );
    }
    
    // EmojiOption with emoji and title
    if (opt.emoji && opt.title) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{opt.emoji}</span>
          <span>{opt.title}</span>
        </div>
      );
    }
    
    // MentionOption or default
    return option.key;
  })();

  return (
    <li
      key={option.key}
      data-option-index={index}
      ref={(element) => {
        if (option.ref) {
          (option.ref as any).current = element;
        }
      }}
      className={isSelected ? 'selected' : undefined}
      onClick={() => onClick(option, index)}
      onMouseEnter={() => onMouseEnter(index)}
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}>
      {displayContent}
    </li>
  );
}

export function createTypeaheadMenuRenderFn<TOption extends MenuOption>() {
  return (
    anchorElementRef: RefObject<HTMLElement | null>,
    itemProps: TypeaheadMenuPluginProps<TOption>,
  ) => {
    if (!anchorElementRef.current) {
      return null;
    }

    return createPortal(
      <div className="typeahead-popover">
        <TypeaheadMenu {...itemProps} />
      </div>,
      anchorElementRef.current,
    );
  };
}
