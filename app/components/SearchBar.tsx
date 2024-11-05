'use client';

import React from 'react';
import { Input } from './ui/input';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = 'Search...' }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  return (
    <div className="w-full max-w-sm">
      <Input
        type="search"
        placeholder={placeholder}
        onChange={handleChange}
        className="w-full"
      />
    </div>
  );
};

export default SearchBar;
