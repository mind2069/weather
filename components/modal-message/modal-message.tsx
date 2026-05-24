"use client";

import { useEffect } from "react";
import "./styles.css";

interface ModalMessageProperties
{
    title: string;
    message: string;
    closeLabel: string;
    onClose: () => void;
}

export default function ModalMessage({ title, message, closeLabel, onClose }: ModalMessageProperties)
{
    useEffect(() =>
    {
        const onKeyDown = (event: KeyboardEvent) =>
        {
            if (event.key === "Escape")
            {
                onClose();
            }
        };

        document.addEventListener("keydown", onKeyDown);

        return () =>
        {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose]);

    return (
        <div className="modal-message-overlay">
            <button
                type="button"
                className="modal-message-backdrop"
                aria-label={closeLabel}
                onClick={onClose}
            />
            <div
                className="modal-message-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="modal-message-title"
                aria-describedby="modal-message-desc"
            >
                <div className="modal-message-header">
                    <h2 id="modal-message-title" className="modal-message-title">
                        {title}
                    </h2>
                </div>
                <div id="modal-message-desc" className="modal-message-body">
                    <p className="modal-message-text">{message}</p>
                </div>
                <div className="modal-message-footer">
                    <button type="button" className="btn btn-brand" onClick={onClose}>
                        {closeLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
