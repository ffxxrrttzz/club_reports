"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./ComboBox.module.css";

interface ComboBoxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAddNew?: (newValue: string) => Promise<boolean>;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function ComboBox({
  options,
  value,
  onChange,
  placeholder = "Выберите или введите значение",
  onAddNew,
  disabled = false,
  required = false,
  className = "",
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const filtered = options.filter((opt) =>
      opt.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError("");
    setIsOpen(true);
  };

  const handleSelectOption = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
    setError("");
  };

  const handleAddNew = async () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      setError("Введите значение");
      return;
    }

    if (options.includes(trimmedValue)) {
      setError("Это значение уже существует");
      return;
    }

    if (!onAddNew) {
      handleSelectOption(trimmedValue);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await onAddNew(trimmedValue);
      if (success) {
        handleSelectOption(trimmedValue);
      } else {
        setError("Ошибка при добавлении значения");
      }
    } catch (err) {
      console.error("Error adding new value:", err);
      setError(
        err instanceof Error ? err.message : "Неизвестная ошибка"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddNew();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
    >
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`${styles.input} ${error ? styles.error : ""}`}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label="Toggle dropdown"
        >
          ▼
        </button>
      </div>

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          {filteredOptions.length > 0 ? (
            <ul className={styles.list}>
              {filteredOptions.map((option, index) => (
                <li key={`${option}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={`${styles.option} ${
                      option === value ? styles.selected : ""
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          ) : inputValue.trim() ? (
            <div className={styles.noResults}>
              <p>Нет совпадений</p>
              {onAddNew && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  disabled={isLoading}
                  className={styles.addButton}
                >
                  {isLoading ? "Добавляю..." : `+ Добавить "${inputValue}"`}
                </button>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              {options.length === 0
                ? "Нет доступных вариантов"
                : "Начните вводить для поиска"}
            </div>
          )}
        </div>
      )}

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
