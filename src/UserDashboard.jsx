import React, { useState, useEffect, useRef } from 'react';

export default function UserDashboard({ onExit, authToken, authRole }) {
    const [activeTab, setActiveTab] = useState('gallery');
    const [gallery, setGallery] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [actionLog, setActionLog] = useState('');
    const [actionLogType, setActionLogType] = useState('success');

    // Booking form state
    const [selectedStyle, setSelectedStyle] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [bookingRefFile, setBookingRefFile] = useState(null); // FIX: file instead of URL
    const [bookingLoading, setBookingLoading] = useState(false);

    // Submission upload state
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const uploadRef = useRef(null);
    const bookingFileRef = useRef(null);
    const BASE_IMAGE = 'http://localhost:3000/api/image';
    const BASE_APPT = 'http://localhost:3000/api/appointments';

    const authHeaders = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };

    const log = (msg, type = 'success') => {
        setActionLog(msg);
        setActionLogType(type);
        setTimeout(() => setActionLog(''), 5000);
    };

    useEffect(() => {
        if (!authToken) return;
        fetchGallery();
        fetchMyAppointments();
        fetchMySubmissions();
    }, [authToken]);

    const fetchGallery = () => {
        fetch(`${BASE_IMAGE}/get`, { headers: authHeaders })
            .then(res => res.json())
            .then(data => {
                const results = data.data || (Array.isArray(data) ? data : []);
                setGallery(results.filter(img => img.uploadedByRole === 'admin' && img.status === 'approved'));
            })
            .catch(err => log(`Failed to load gallery: ${err.message}`, 'error'));
    };

    const fetchMyAppointments = () => {
        fetch(`${BASE_APPT}/my-appointments`, { headers: authHeaders })
            .then(res => res.json())
            .then(data => setMyAppointments(data.data || []))
            .catch(err => log(`Failed to load appointments: ${err.message}`, 'error'));
    };

    const fetchMySubmissions = () => {
        fetch(`${BASE_IMAGE}/get`, { headers: authHeaders })
            .then(res => res.json())
            .then(data => {
                const results = data.data || (Array.isArray(data) ? data : []);
                setMySubmissions(results.filter(img => img.uploadedByRole === 'user'));
            })
            .catch(err => log(`Failed to load submissions: ${err.message}`, 'error'));
    };

    // ── Upload a file and return its URL ────────────────────────────────
    const uploadFileToServer = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('name', 'User Reference');
        formData.append('price', '0');

        const res = await fetch(`${BASE_IMAGE}/user-upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });

        if (!res.ok) throw new Error('Image upload failed');
        const data = await res.json();
        return data.Image?.url || null;
    };

    // ── Book appointment ─────────────────────────────────────────────────
    const handleBooking = async (e) => {
        e.preventDefault();
        if (!selectedStyle) { log('Please select a hairstyle.', 'error'); return; }
        if (!selectedDate) { log('Please select a date.', 'error'); return; }
        if (!selectedTime) { log('Please select a time.', 'error'); return; }

        setBookingLoading(true);

        try {
            let referenceImageUrl = null;

            // FIX: if user attached a reference image, upload it first
            if (bookingRefFile) {
                log('Uploading reference image...');
                referenceImageUrl = await uploadFileToServer(bookingRefFile);
            }

            const payload = {
                serviceType: selectedStyle,
                appointmentDate: selectedDate,
                appointmentTime: selectedTime,
                customReferenceImage: referenceImageUrl
            };

            const res = await fetch(`${BASE_APPT}/book`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Booking failed');

            log('✅ Appointment booked successfully!');
            setSelectedStyle('');
            setSelectedDate('');
            setSelectedTime('');
            setBookingRefFile(null);
            if (bookingFileRef.current) bookingFileRef.current.value = '';
            fetchMyAppointments();

        } catch (err) {
            log(`Booking failed: ${err.message}`, 'error');
        } finally {
            setBookingLoading(false);
        }
    };

    // ── Submit reference image for review ────────────────────────────────
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) { log('Please select an image.', 'error'); return; }

        setUploadLoading(true);
        try {
            await uploadFileToServer(uploadFile);
            log('✅ Reference image submitted! Admin will review it shortly.');
            setUploadFile(null);
            setPreviewUrl(null);
            if (uploadRef.current) uploadRef.current.reset();
            fetchMySubmissions();
        } catch (err) {
            log(`Upload failed: ${err.message}`, 'error');
        } finally {
            setUploadLoading(false);
        }
    };

    // ── Cancel appointment ───────────────────────────────────────────────
    const handleCancelAppointment = (id) => {
        fetch(`${BASE_APPT}/${id}`, {
            method: 'DELETE',
            headers: authHeaders
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setMyAppointments(prev => prev.filter(a => a._id !== id));
                log('🗑️ Appointment cancelled.');
            } else {
                log(`Failed: ${data.message}`, 'error');
            }
        })
        .catch(err => log(`Error: ${err.message}`, 'error'));
    };

    const handleLogout = () => {
        localStorage.clear();
        if (onExit) onExit();
    };

    // ── Styles ───────────────────────────────────────────────────────────
    const s = {
        container: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#111', borderBottom: '1px solid #222' },
        logo: { fontSize: '20px', fontWeight: '800', color: '#ffb700', letterSpacing: '2px' },
        navBtn: { padding: '8px 16px', background: 'transparent', color: '#ccc', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px', fontSize: '13px' },
        logoutBtn: { padding: '8px 16px', background: '#ff007f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px', fontSize: '13px', fontWeight: '700' },
        actionLog: (type) => ({ margin: '16px 40px', background: type === 'error' ? '#1a0000' : '#001a0a', borderLeft: `4px solid ${type === 'error' ? '#ff3333' : '#00c853'}`, padding: '12px 16px', borderRadius: '0 6px 6px 0', fontSize: '14px', fontWeight: '600', color: type === 'error' ? '#ff6666' : '#00c853' }),
        tabs: { display: 'flex', gap: '4px', padding: '20px 40px 0', borderBottom: '1px solid #222', flexWrap: 'wrap' },
        tab: (active) => ({ padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', letterSpacing: '1px', border: 'none', borderRadius: '6px 6px 0 0', background: active ? '#ffb700' : '#1a1a1a', color: active ? '#000' : '#888', transition: 'all 0.2s' }),
        section: { padding: '30px 40px' },
        sectionTitle: { fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#fff', letterSpacing: '1px' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
        card: { background: '#111', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' },
        cardImg: { width: '100%', height: '190px', objectFit: 'cover' },
        cardBody: { padding: '14px' },
        cardName: { fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: '#fff' },
        cardPrice: { fontSize: '14px', color: '#ffb700', fontWeight: '700' },
        bookingBox: { background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '28px', maxWidth: '560px' },
        formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
        label: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' },
        input: { padding: '10px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' },
        select: { padding: '10px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none', width: '100%' },
        submitBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ff7b00, #ffb700)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', marginTop: '8px' },
        disabledBtn: { width: '100%', padding: '12px', background: '#333', color: '#666', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '800', fontSize: '15px', marginTop: '8px' },
        uploadBox: { background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '28px', maxWidth: '460px', marginBottom: '30px' },
        // FIX: nice file picker button style
        filePickerLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '30px', background: '#1a1a1a', border: '2px dashed #333', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' },
        filePickerText: { fontSize: '14px', color: '#888' },
        filePickerBtn: { padding: '8px 20px', background: '#ffb700', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
        previewImg: { width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '12px' },
        badge: (status) => ({ display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: status === 'pending' ? '#332200' : status === 'approved' ? '#003322' : '#330011', color: status === 'pending' ? '#ffb700' : status === 'approved' ? '#00c853' : '#ff3333' }),
        apptCard: { background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '18px', marginBottom: '12px' },
        apptRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
        cancelBtn: { padding: '6px 14px', background: 'transparent', border: '1px solid #ff3333', color: '#ff3333', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
        emptyMsg: { color: '#444', fontSize: '14px', textAlign: 'center', padding: '40px' }
    };

    // Reusable file picker component
    const FilePicker = ({ onFileSelect, fileRef, selectedFile, label }) => (
        <div style={s.formGroup}>
            <label style={s.label}>{label}</label>
            <label style={s.filePickerLabel}>
                <span style={{ fontSize: '28px' }}>📁</span>
                <span style={s.filePickerText}>
                    {selectedFile ? selectedFile.name : 'Tap to choose an image from your device'}
                </span>
                <span style={s.filePickerBtn}>Browse Files</span>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                        const file = e.target.files[0];
                        if (file) onFileSelect(file);
                    }}
                />
            </label>
            {selectedFile && (
                <p style={{ fontSize: '12px', color: '#00c853', marginTop: '6px' }}>
                    ✓ {selectedFile.name} selected
                </p>
            )}
        </div>
    );

    return (
        <div style={s.container}>

            {/* Header */}
            <header style={s.header}>
                <div style={s.logo}>LUXLAB</div>
                <div>
                    <button style={s.navBtn} onClick={onExit}>← Back to Site</button>
                    <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </header>

            {/* Action Log */}
            {actionLog && <div style={s.actionLog(actionLogType)}>{actionLog}</div>}

            {/* Tabs */}
            <div style={s.tabs}>
                <button style={s.tab(activeTab === 'gallery')} onClick={() => setActiveTab('gallery')}>HAIRSTYLES</button>
                <button style={s.tab(activeTab === 'book')} onClick={() => setActiveTab('book')}>BOOK APPOINTMENT</button>
                <button style={s.tab(activeTab === 'appointments')} onClick={() => setActiveTab('appointments')}>
                    MY APPOINTMENTS ({myAppointments.length})
                </button>
                <button style={s.tab(activeTab === 'submissions')} onClick={() => setActiveTab('submissions')}>
                    MY SUBMISSIONS ({mySubmissions.length})
                </button>
            </div>

            {/* ── GALLERY TAB ── */}
            {activeTab === 'gallery' && (
                <div style={s.section}>
                    <p style={s.sectionTitle}>Our Hairstyle Collection</p>
                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>
                        Browse our styles and click one to book it. Don't see what you want? Go to "My Submissions" to upload your own reference image.
                    </p>
                    {gallery.length === 0 ? (
                        <p style={s.emptyMsg}>No hairstyles available yet.</p>
                    ) : (
                        <div style={s.grid}>
                            {gallery.map(img => (
                                <div
                                    key={img._id}
                                    style={s.card}
                                    onClick={() => {
                                        setSelectedStyle(img.name);
                                        setActiveTab('book');
                                        log(`✅ "${img.name}" selected. Complete your booking below.`);
                                    }}
                                >
                                    <img src={img.url} alt={img.name} style={s.cardImg} />
                                    <div style={s.cardBody}>
                                        <p style={s.cardName}>{img.name}</p>
                                        <p style={s.cardPrice}>${img.price}</p>
                                        <p style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>Tap to select</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── BOOK APPOINTMENT TAB ── */}
            {activeTab === 'book' && (
                <div style={s.section}>
                    <p style={s.sectionTitle}>Book an Appointment</p>
                    <div style={s.bookingBox}>
                        <form onSubmit={handleBooking}>
                            <div style={s.formGroup}>
                                <label style={s.label}>Service / Hairstyle</label>
                                <select
                                    style={s.select}
                                    value={selectedStyle}
                                    onChange={e => setSelectedStyle(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select a hairstyle</option>
                                    {gallery.map(img => (
                                        <option key={img._id} value={img.name}>{img.name} — ${img.price}</option>
                                    ))}
                                    <option value="Custom">Custom (I uploaded my own reference)</option>
                                </select>
                            </div>

                            <div style={s.formGroup}>
                                <label style={s.label}>Preferred Date</label>
                                <input
                                    style={s.input}
                                    type="date"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div style={s.formGroup}>
                                <label style={s.label}>Preferred Time</label>
                                <input
                                    style={s.input}
                                    type="time"
                                    value={selectedTime}
                                    onChange={e => setSelectedTime(e.target.value)}
                                    required
                                />
                            </div>

                            {/* FIX: File picker instead of URL input */}
                            <FilePicker
                                label="Reference Image (optional — attach if you have one)"
                                fileRef={bookingFileRef}
                                selectedFile={bookingRefFile}
                                onFileSelect={(file) => setBookingRefFile(file)}
                            />

                            {/* Preview selected booking reference image */}
                            {bookingRefFile && (
                                <img
                                    src={URL.createObjectURL(bookingRefFile)}
                                    alt="Preview"
                                    style={s.previewImg}
                                />
                            )}

                            <button
                                style={bookingLoading ? s.disabledBtn : s.submitBtn}
                                type="submit"
                                disabled={bookingLoading}
                            >
                                {bookingLoading ? 'Processing...' : 'Confirm Appointment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MY APPOINTMENTS TAB ── */}
            {activeTab === 'appointments' && (
                <div style={s.section}>
                    <p style={s.sectionTitle}>My Appointments</p>
                    {myAppointments.length === 0 ? (
                        <p style={s.emptyMsg}>You have no appointments yet.</p>
                    ) : (
                        myAppointments.map(appt => (
                            <div key={appt._id} style={s.apptCard}>
                                <div style={s.apptRow}>
                                    <div>
                                        <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{appt.serviceType}</p>
                                        <p style={{ color: '#888', fontSize: '13px' }}>
                                            📅 {new Date(appt.appointmentDate).toLocaleString()}
                                        </p>
                                        {appt.priceQuote > 0 && (
                                            <p style={{ color: '#ffb700', fontSize: '13px', marginTop: '4px' }}>
                                                💰 Price Quote: ${appt.priceQuote}
                                            </p>
                                        )}
                                        {appt.customReferenceImage && (
                                            <img
                                                src={appt.customReferenceImage}
                                                alt="Reference"
                                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }}
                                            />
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={s.badge(appt.status)}>{appt.status.toUpperCase()}</span>
                                        {appt.status === 'pending' && (
                                            <button style={s.cancelBtn} onClick={() => handleCancelAppointment(appt._id)}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── MY SUBMISSIONS TAB ── */}
            {activeTab === 'submissions' && (
                <div style={s.section}>
                    <p style={s.sectionTitle}>Upload Your Own Reference Image</p>
                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
                        Don't see a style you like? Upload your own reference image below. The admin will review it and get back to you.
                    </p>

                    {/* Upload Form */}
                    <div style={s.uploadBox}>
                        <form ref={uploadRef} onSubmit={handleUpload}>
                            <FilePicker
                                label="Choose your reference image"
                                fileRef={null}
                                selectedFile={uploadFile}
                                onFileSelect={(file) => {
                                    setUploadFile(file);
                                    setPreviewUrl(URL.createObjectURL(file));
                                }}
                            />

                            {/* Image preview */}
                            {previewUrl && (
                                <img src={previewUrl} alt="Preview" style={s.previewImg} />
                            )}

                            <button
                                style={uploadLoading ? s.disabledBtn : s.submitBtn}
                                type="submit"
                                disabled={uploadLoading}
                            >
                                {uploadLoading ? 'Submitting...' : 'Submit for Review'}
                            </button>
                        </form>
                    </div>

                    {/* My Submissions List */}
                    <p style={s.sectionTitle}>My Submitted Images</p>
                    {mySubmissions.length === 0 ? (
                        <p style={s.emptyMsg}>You have not submitted any images yet.</p>
                    ) : (
                        <div style={s.grid}>
                            {mySubmissions.map(img => (
                                <div key={img._id} style={s.card}>
                                    <img src={img.url} alt="My submission" style={s.cardImg} />
                                    <div style={s.cardBody}>
                                        <span style={s.badge(img.status)}>{img.status.toUpperCase()}</span>
                                        <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                                            Submitted: {new Date(img.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}