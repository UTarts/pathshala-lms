import { useState, useEffect } from 'react';

export function useLocalState<T>(key: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setData(JSON.parse(item));
      }
    } catch (error) {
      console.log('Error loading local data', error);
    }
    setIsLoaded(true);
  }, [key]);

  const setValue = (value: T) => {
    try {
      setData(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log('Error saving local data', error);
    }
  };

  return [data, setValue, isLoaded] as const;
}