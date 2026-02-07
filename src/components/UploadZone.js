'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Camera } from 'lucide-react';
import Webcam from 'react-webcam';

export default function UploadZone({ onFileSelect }) {
    console.log("[v0] UploadZone component rendering");
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const processFile = (file) => {
        if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            onFileSelect(file);
            setIsCameraOpen(false);
        } else {
            alert('Please upload an image or PDF receipt.');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const clearFile = (e) => {
        e.stopPropagation();
        setPreview(null);
        onFileSelect(null);
        setIsCameraOpen(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const capture = (e) => {
        e.stopPropagation();
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            // Convert base64 to file
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    processFile(file);
                });
        }
    };

    return (
        <div
            className={`glass-panel`}
            style={{
                padding: isCameraOpen ? '1rem' : '3rem',
                textAlign: 'center',
                border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--card-border)',
                cursor: isCameraOpen ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'var(--card-bg)',
                position: 'relative',
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isCameraOpen && !preview && fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/*,application/pdf"
                hidden
            />

            {isCameraOpen ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary)', width: '100%', maxWidth: '480px' }}>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width="100%"
                            videoConstraints={{ facingMode: "environment" }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={capture}
                            className="glass-button"
                            style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                        >
                            <Camera size={20} /> Capture Receipt
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsCameraOpen(false); }}
                            className="glass-button"
                            style={{ background: '#ef4444', color: 'white', border: 'none' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : preview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={preview}
                        alt="Receipt preview"
                        style={{
                            maxHeight: '300px',
                            borderRadius: '8px',
                            maxWidth: '100%'
                        }}
                    />
                    <button
                        onClick={clearFile}
                        style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '5px',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#94a3b8' }}>
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '1rem',
                        borderRadius: '50%',
                        color: 'var(--primary)'
                    }}>
                        <Upload size={32} />
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--foreground)', marginBottom: '0.5rem' }}>Drop receipt here</h3>
                        <p style={{ fontSize: '0.9rem' }}>or click to browse</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ImageIcon size={14} /> JPG/PNG</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> PDF</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
                        <span style={{ fontSize: '0.8rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCameraOpen(true);
                            }}
                            className="glass-button"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Camera size={18} /> Use Camera
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect('manual');
                            }}
                            className="glass-button"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                        >
                            <FileText size={18} /> Manual Entry
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
