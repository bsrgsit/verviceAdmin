'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CommunityOption {
  id: string;
  name: string;
  city?: string;
  blocks?: string[];
}

interface CommunityContextType {
  selectedCommunity: string; // 'ALL' or community ID/Name
  setSelectedCommunity: (id: string) => void;
  communities: CommunityOption[];
  isLoading: boolean;
  selectedCommunityObj: CommunityOption | null;
}

const CommunityContext = createContext<CommunityContextType>({
  selectedCommunity: 'ALL',
  setSelectedCommunity: () => {},
  communities: [],
  isLoading: true,
  selectedCommunityObj: null,
});

export const COMMUNITY_STORAGE_KEY = 'vervice_admin_selected_community';

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCommunity, setSelectedCommunityState] = useState<string>('ALL');
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted selection from localStorage
    const saved = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (saved) {
      setSelectedCommunityState(saved);
    }

    // Fetch communities list
    fetch('/api/communities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCommunities(data);
        }
      })
      .catch((err) => console.error('Failed to load communities for selector:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const setSelectedCommunity = (id: string) => {
    setSelectedCommunityState(id);
    localStorage.setItem(COMMUNITY_STORAGE_KEY, id);
  };

  const selectedCommunityObj =
    selectedCommunity === 'ALL'
      ? null
      : communities.find((c) => c.id === selectedCommunity || c.name === selectedCommunity) || null;

  return (
    <CommunityContext.Provider
      value={{
        selectedCommunity,
        setSelectedCommunity,
        communities,
        isLoading,
        selectedCommunityObj,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  return useContext(CommunityContext);
}
