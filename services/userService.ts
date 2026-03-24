import { auth, db } from './firebaseClient';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updatePassword, 
    onAuthStateChanged, 
    signOut, 
    updateProfile
} from 'firebase/auth';
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    updateDoc, 
    deleteDoc, 
    addDoc 
} from 'firebase/firestore';
import { UserProfile, Message, Conversation } from '../types';

// --- AUTHENTICATION ---

export const signUpUser = async (email: string, password: string, name: string): Promise<{ user: UserProfile | null, error: string | null }> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        return {
            user: {
                name: name,
                email: userCredential.user.email || email,
                joinedDate: new Date(userCredential.user.metadata.creationTime || Date.now())
            },
            error: null
        };
    } catch (error: any) {
        console.warn("Firebase auth failed, falling back to local:", error.message);
        
        // Local Storage Fallback
        try {
            const existing = localStorage.getItem(`zestislam_user_${email}`);
            if (existing) return { user: null, error: "User already exists locally." };

            const newUser: UserProfile = {
                name,
                email,
                joinedDate: new Date()
            };
            localStorage.setItem(`zestislam_user_${email}`, JSON.stringify(newUser));
            return { user: newUser, error: null };
        } catch (e) {
            return { user: null, error: "Local storage error" };
        }
    }
};

export const signInUser = async (email: string, password: string): Promise<{ user: UserProfile | null, error: string | null }> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
            user: {
                name: userCredential.user.displayName || email.split('@')[0],
                email: userCredential.user.email || email,
                joinedDate: new Date(userCredential.user.metadata.creationTime || Date.now())
            },
            error: null
        };
    } catch (error: any) {
        console.warn("Firebase signin failed:", error.message);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            return { user: null, error: "Invalid email or password" };
        }
        
        // Local Storage Fallback
        try {
            const stored = localStorage.getItem(`zestislam_user_${email}`);
            if (stored) {
                const user = JSON.parse(stored);
                return { user, error: null };
            }
            return { user: null, error: "User not found or invalid credentials." };
        } catch (e) {
            return { user: null, error: "Login failed" };
        }
    }
};

export const resetUserPassword = async (email: string): Promise<{ success: boolean, error: string | null }> => {
    try {
        const actionCodeSettings = {
            url: 'https://zestislamaiapp.netlify.app/',
            handleCodeInApp: false,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export const updateUserPassword = async (password: string) => {
    if (auth.currentUser) {
        try {
            await updatePassword(auth.currentUser, password);
            return { success: true, error: null };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
    return { success: false, error: "User not logged in" };
};

export const subscribeToAuthChanges = (callback: (event: string, session: any) => void) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            callback('SIGNED_IN', { user });
        } else {
            callback('SIGNED_OUT', null);
        }
    });
    return { unsubscribe };
}

export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Sign out error", error);
    }
};

// --- CONVERSATION MANAGEMENT ---

export const getUserConversations = async (email: string): Promise<Conversation[]> => {
    try {
        const q = query(
            collection(db, 'conversations'), 
            where('user_email', '==', email),
            orderBy('updated_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const conversations: Conversation[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            conversations.push({
                id: doc.id,
                title: data.title,
                lastMessage: data.last_message || 'No messages',
                timestamp: new Date(data.created_at)
            });
        });
        if (conversations.length > 0) {
            return conversations;
        }
    } catch (error) {
        console.warn("Firebase get conversations failed", error);
    }

    const stored = localStorage.getItem(`zestislam_conversations_${email}`);
    if (stored) {
        return JSON.parse(stored).map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp)
        }));
    }
    return [];
}

export const createConversation = async (email: string, title: string, id?: string): Promise<Conversation> => {
    const newConv: Conversation = {
        id: id || crypto.randomUUID(),
        title,
        lastMessage: '',
        timestamp: new Date()
    };

    try {
        await setDoc(doc(db, 'conversations', newConv.id), {
            user_email: email,
            title: title,
            created_at: newConv.timestamp.toISOString(),
            updated_at: newConv.timestamp.toISOString(),
            last_message: ''
        });
        return newConv;
    } catch (error) {
        console.warn("Firebase create conversation failed", error);
    }

    const existing = await getUserConversations(email);
    const updated = [newConv, ...existing.filter(c => c.id !== newConv.id)];
    localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify(updated));
    return newConv;
}

export const updateConversationTitle = async (email: string, conversationId: string, newTitle: string) => {
    try {
        await updateDoc(doc(db, 'conversations', conversationId), {
            title: newTitle
        });
    } catch (error) {
        console.warn("Firebase update conversation title failed", error);
    }
    
    const existing = await getUserConversations(email);
    const updated = existing.map(c => c.id === conversationId ? { ...c, title: newTitle } : c);
    localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify(updated));
}

export const deleteConversation = async (email: string, conversationId: string) => {
    try {
        await deleteDoc(doc(db, 'conversations', conversationId));
        
        // Delete messages
        const q = query(collection(db, 'messages'), where('conversation_id', '==', conversationId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (messageDoc) => {
            await deleteDoc(doc(db, 'messages', messageDoc.id));
        });
    } catch (error) {
        console.warn("Firebase delete conversation failed", error);
    }

    const existing = await getUserConversations(email);
    const updated = existing.filter(c => c.id !== conversationId);
    localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify(updated));
    localStorage.removeItem(`zestislam_messages_${conversationId}`);
}

// --- MESSAGE MANAGEMENT ---

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
    try {
        const q = query(
            collection(db, 'messages'), 
            where('conversation_id', '==', conversationId),
            orderBy('created_at', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const messages: Message[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                role: data.role,
                content: data.content,
                timestamp: new Date(data.created_at),
                conversationId: data.conversation_id
            });
        });
        if (messages.length > 0) {
            return messages;
        }
    } catch (error) {
        console.warn("Firebase get messages failed", error);
    }

    const stored = localStorage.getItem(`zestislam_messages_${conversationId}`);
    if (stored) {
        return JSON.parse(stored).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
        }));
    }
    return [];
};

export const saveUserChatMessage = async (email: string, conversationId: string, message: Message, isNewConversation = false, title = '') => {
    if (isNewConversation) {
        await createConversation(email, title, conversationId);
    }

    try {
        await setDoc(doc(db, 'messages', message.id), {
            conversation_id: conversationId,
            user_email: email,
            role: message.role,
            content: message.content,
            created_at: message.timestamp.toISOString()
        });
        
        await updateDoc(doc(db, 'conversations', conversationId), {
            last_message: message.content.substring(0, 50),
            updated_at: new Date().toISOString()
        });
    } catch (error) {
        console.warn("Firebase save message failed", error);
    }

    const history = await getConversationMessages(conversationId);
    const updatedMsgs = [...history, message];
    localStorage.setItem(`zestislam_messages_${conversationId}`, JSON.stringify(updatedMsgs));

    const conversations = await getUserConversations(email);
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (convIndex >= 0) {
        conversations[convIndex].lastMessage = message.content.substring(0, 50) + '...';
        conversations[convIndex].timestamp = new Date();
        const active = conversations.splice(convIndex, 1)[0];
        conversations.unshift(active);
        localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify(conversations));
    } else if (isNewConversation) {
        const newConv: Conversation = {
            id: conversationId,
            title: title || 'New Chat',
            lastMessage: message.content.substring(0, 50),
            timestamp: new Date()
        };
        
        if(!conversations.find(c => c.id === conversationId)) {
             localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify([newConv, ...conversations]));
        }
    }
};

// --- CONTACT FORM ---

export const sendContactMessage = async (name: string, email: string, message: string): Promise<{ success: boolean, error?: string }> => {
    try {
        await addDoc(collection(db, 'contact_messages'), {
            name,
            email,
            message,
            created_at: new Date().toISOString()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Firebase contact message error:", error);
        
        // 2. Fallback to mailto link approach (handled in App.tsx)
        return { success: false, error: error.message };
    }
};
