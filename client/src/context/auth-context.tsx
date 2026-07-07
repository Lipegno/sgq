import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import type {User} from '../types';
import {apiLogout, refresh} from "@/api/auth.ts";
import {setAuthToken} from "@/api/axios.ts";
import {getMyYears} from "@/api/core.ts";

interface AuthContextType {
    user: User | null;
    token: string | null;
    roles: string[];
    isExternal: boolean;
    allowedYearIds: number[] | null;
    isLoadingYears: boolean;
    setAuth: (data: { user: User; accessToken: string }) => void;
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allowedYearIds, setAllowedYearIds] = useState<number[] | null>(null);
    const [isLoadingYears, setIsLoadingYears] = useState(false);

    const roles = user?.roles ?? [];
    const isExternal = roles.includes("ROLE_EXTERNAL");

    const fetchAllowedYears = useCallback(async () => {
        setIsLoadingYears(true);
        try {
            const years = await getMyYears();
            setAllowedYearIds(years.map(y => y.id));
        } catch {
            setAllowedYearIds([]);
        } finally {
            setIsLoadingYears(false);
        }
    }, []);

    useEffect(() => {
        if (isExternal && allowedYearIds === null && !isLoadingYears) {
            fetchAllowedYears();
        } else if (!isExternal) {
            setAllowedYearIds(null);
        }
    }, [isExternal, allowedYearIds, isLoadingYears, fetchAllowedYears]);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const data = await refresh()
                setAuth({
                    accessToken: data.accessToken,
                    user: {
                        id: data.userId,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        roles: data.roles ?? [],
                    },
                })
            } catch (err) {
                console.log("No valid session found", err)
                logout()
            } finally {
                setIsLoading(false)
            }
        }

        checkSession()
    }, [])

    const setAuth = ({user, accessToken}: any) => {
        setUser(user)
        setToken(accessToken)
        setAuthToken(accessToken)
    }

    const logout = async () => {
        try {
            await apiLogout();
        } catch (err: any) {
        } finally {
            setAuth({user: null, accessToken: null});
            setAuthToken(null);
            setAllowedYearIds(null);
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            roles,
            isExternal,
            allowedYearIds,
            isLoadingYears,
            setAuth,
            logout,
            isLoading,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};