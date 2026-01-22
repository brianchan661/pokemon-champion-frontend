import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';

interface GlobalConfig {
    readOnlyMode: boolean;
    adsDisabled: boolean;
    readOnlyMessage: string;
}

interface GlobalConfigContextType extends GlobalConfig {
    isLoading: boolean;
    error: Error | null;
    refreshConfig: () => Promise<void>;
}

const GlobalConfigContext = createContext<GlobalConfigContextType | undefined>(undefined);

export const GlobalConfigProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<GlobalConfig>({
        readOnlyMode: false,
        adsDisabled: false,
        readOnlyMessage: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchConfig = async () => {
        try {
            const response = await axios.get(`${getApiBaseUrl()}/config`);
            setConfig(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch global config:', err);
            // Don't block app on config failure, just use defaults
            setError(err instanceof Error ? err : new Error('Failed to fetch config'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <GlobalConfigContext.Provider value={{ ...config, isLoading, error, refreshConfig: fetchConfig }}>
            {children}
        </GlobalConfigContext.Provider>
    );
};

export const useGlobalConfig = () => {
    const context = useContext(GlobalConfigContext);
    if (context === undefined) {
        throw new Error('useGlobalConfig must be used within a GlobalConfigProvider');
    }
    return context;
};
