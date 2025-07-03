import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth"
import { auth } from "../firebase/firebase"; 

interface AuthContextType {
    currentUser: User | null;
    loading: boolean
}

// create context with currentUser null
const AuthContext = createContext<AuthContextType>({ currentUser: null, loading:true});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({children}: {children: ReactNode}) {

    const [currentUser, setCurrentUser] = useState<User | null> (null);
    const [loading, setLoading] = useState(true);

    // listen for authentication state changes
    useEffect(() => { 
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return () => unsubscribe()

    }, []);

    return (
        <AuthContext.Provider value={{currentUser, loading}}>
            {children}
        </AuthContext.Provider>
    );



}