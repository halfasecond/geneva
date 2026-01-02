// src/components/Modal.tsx
import { useEffect } from "react";

export default function Modal({ visible, close, children, style }: {
    visible: boolean;
    close: () => void;
    children: React.ReactNode;
    style?: object;
}) {

    useEffect(() => {
        if (visible) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                ...style
            }}
            onClick={close}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    padding: 20,
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    overflow: "auto",
                }}
            >
                {children}
            </div>
        </div>
    );
}