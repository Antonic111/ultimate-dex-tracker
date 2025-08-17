import { createContext, useContext } from 'react';

export const UserContext = createContext({
    username: null,
    email: null,
    isProfilePublic: false,
    setUser: () => {},
    loading: false
});

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserContext.Provider');
    }
    return context;
}; 
