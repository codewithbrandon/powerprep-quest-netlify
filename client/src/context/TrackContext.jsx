import { createContext, useContext, useState } from 'react';

const TrackContext = createContext(null);

export function TrackProvider({ children }) {
  const [track, setTrack] = useState(localStorage.getItem('pp_track') || 'PL200');

  const changeTrack = (next) => {
    setTrack(next);
    localStorage.setItem('pp_track', next);
  };

  return <TrackContext.Provider value={{ track, setTrack: changeTrack }}>{children}</TrackContext.Provider>;
}

export function useTrack() {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error('useTrack must be used within TrackProvider');
  return ctx;
}

export const TRACKS = {
  PL200: {
    code: 'PL200',
    name: 'PL-200',
    fullName: 'Power Platform Functional Consultant',
    domains: ['Dataverse', 'Security', 'Canvas Apps', 'Model-Driven Apps', 'Power Automate', 'Power Pages'],
    color: 'indigo',
  },
  PL300: {
    code: 'PL300',
    name: 'PL-300',
    fullName: 'Power BI Data Analyst',
    domains: ['Data Preparation', 'Data Modeling', 'DAX', 'Visualizations', 'Governance & RLS'],
    color: 'emerald',
  },
};
