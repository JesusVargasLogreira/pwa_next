"use client";
import { useEffect } from 'react';
export default function SWRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => console.log('SW registrado!', reg))
                .catch((err) => console.log('Error al registrar SW', err));
        }
    }, []);
    return null; // Este componente no dibuja nada, solo ejecuta código
}