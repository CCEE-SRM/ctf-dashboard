"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

type TriggerData = {
    announcements?: boolean;
    challenges?: boolean;
    leaderboard?: boolean;
    status?: boolean;
};

type TriggerContextType = {
    // We can add state or functions here if needed
};

const TriggerContext = createContext<TriggerContextType | undefined>(undefined);

export const TriggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const listeners = useRef<Set<(data: TriggerData) => void>>(new Set());

    const subscribe = useCallback((callback: (data: TriggerData) => void) => {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
    }, []);

    useEffect(() => {
        const eventSource = new EventSource('/api/trigger-stream');

        eventSource.onmessage = (event) => {
            try {
                const data: TriggerData = JSON.parse(event.data);
                console.log('[SSE Context] Broadcast Trigger:', data);
                listeners.current.forEach(listener => listener(data));
            } catch (err) {
                console.error('[SSE Context] Parse Error:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('[SSE Context] Connection Error:', err);
        };

        return () => {
            console.log('[SSE Context] Closing connection');
            eventSource.close();
        };
    }, []);

    return (
        <TriggerContext.Provider value={{}}>
            <InternalTriggerContext.Provider value={{ subscribe }}>
                {children}
            </InternalTriggerContext.Provider>
        </TriggerContext.Provider>
    );
};

// Internal context to avoid exposing subscribe to everyone if not needed
const InternalTriggerContext = createContext<{ subscribe: (cb: (data: TriggerData) => void) => () => void } | undefined>(undefined);

export const useTriggerSubscription = (onTrigger: (data: TriggerData) => void) => {
    const ctx = useContext(InternalTriggerContext);
    if (!ctx) throw new Error('useTriggerSubscription must be used within TriggerProvider');

    const cbRef = useRef(onTrigger);
    useEffect(() => {
        cbRef.current = onTrigger;
    }, [onTrigger]);

    useEffect(() => {
        const unsubscribe = ctx.subscribe((data) => cbRef.current(data));
        return () => unsubscribe();
    }, [ctx]);
};
