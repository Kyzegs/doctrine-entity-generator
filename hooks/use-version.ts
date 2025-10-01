import { useState, useEffect } from 'react';

interface VersionInfo {
  gitTag: string | null;
}

export function useVersion() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/version.json');
        if (response.ok) {
          const data = await response.json();
          setVersionInfo(data);
        }
      } catch (error) {
        console.warn('Could not fetch version info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, []);

  const getDisplayVersion = () => {
    if (!versionInfo || !versionInfo.gitTag) return 'v1.0.0';
    return versionInfo.gitTag;
  };

  return {
    versionInfo,
    loading,
    displayVersion: getDisplayVersion()
  };
}
