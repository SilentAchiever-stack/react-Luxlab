import React, { useState, useEffect, useRef } from 'react';
import './index.css';

export default function AdminDashboard({ onExit, authToken, authRole }) {
    const [galleryImages, setGalleryImages] = useState([]);
    const [pendingImages, setPendingImages] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [adminUploadFile, setAdminUploadFile] = useState(null);
    const [adminUploadName, setAdminUploadName] = useState('');
    const [adminUploadPrice, setAdminUploadPrice] = useState('');
    const [actionLog, setActionLog] = useState('');
    const [activeTab, setActiveTab] = useState('gallery');
    const [uploading, setUploading] = useState(false);
    const formRef = useRef(null);

    const BASE = `${import.meta.env.VITE_API_URL}/api/image`;
const BASE_APPT = `${import.meta.env.VITE_API_URL}/api/appointments`;

    const authHeaders = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };

    useEffect(() => {
        if (!authToken || authRole?.trim().toLowerCase() !== 'admin') {
            setActionLog('Access Denied. Please log in as Admin.');
            return;
        }
        fetchGallery();
        fetchPending();
        fetchAppointments();
    }, [authToken, authRole]);

    const fetchGallery = () => {
        fetch(`${BASE}/get`, { headers: authHeaders })
            .then(res => res.json())
            .then(data => {
                const results = data.data || (Array.isArray(data) ? data : []);
                setGalleryImages(results.filter(img => img.uploadedByRole === 'admin'));
            })
            .catch(err => setActionLog(`Failed to load gallery: ${err.message}`));
    };

    const fetchPending = () => {
        fetch(`${BASE}/pending`, { headers: authHeaders })
            .then(res => res.json())
            .then(data => setPendingImages(data.data || []))
            .catch(err => setActionLog(`Failed to load pending: ${err.message}`));
    };

    const fetchAppointments = () => {
        fetch(`${BASE_APPT}/all`, { headers: authHeaders })
            .then(res => res.json())
            .then(data => setAppointments(data.data || []))
            .catch(err => setActionLog(`Failed to load appointments: ${err.message}`));
    };

    const getAppointmentImage = (appt) => {
        if (appt.customReferenceImage) return appt.customReferenceImage;
        const match = galleryImages.find(img =>
            img.name?.toLowerCase() === appt.serviceType?.toLowerCase()
        );
        if (match) return match.url;
        return null;
    };

    // ── Mailto helper ────────────────────────────────────────────────────
    const sendNotificationEmail = (appt, status) => {
        const userEmail = appt.userId?.email;
        if (!userEmail) {
            setActionLog('⚠️ Could not send email — user email not found.');
            return;
        }

        const userName = appt.userId?.username || 'Valued Client';
        const service = appt.serviceType || 'your service';
        const date = appt.appointmentDate
            ? new Date(appt.appointmentDate).toLocaleString()
            : 'the scheduled time';

        let subject = '';
        let body = '';

        if (status === 'approved') {
            subject = `✅ Your LuxLab Appointment Has Been Approved!`;
            body =
`Dear ${userName},

Great news! Your appointment at LuxLab has been approved.

Here are your booking details:
- Service: ${service}
- Date & Time: ${date}
- Status: APPROVED ✅

Please arrive 5 minutes early. We look forward to seeing you!

If you have any questions, reply to this email or contact us directly.

Warm regards,
LuxLab Studio Team`;
        } else {
            subject = `LuxLab Appointment Update`;
            body =
`Dear ${userName},

We regret to inform you that your appointment at LuxLab could not be confirmed at this time.

Booking details:
- Service: ${service}
- Date & Time: ${date}
- Status: DECLINED ❌

We apologise for any inconvenience. Please feel free to book another appointment at a different date or time.

Warm regards,
LuxLab Studio Team`;
        }

        // Open admin's email app pre-filled and addressed to the user
        window.location.href = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // ── Approve appointment + send email ─────────────────────────────────
    const handleUpdateStatus = (id, status, appt) => {
        fetch(`${BASE_APPT}/${id}/status`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ status })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setAppointments(prev => prev.map(a =>
                    a._id === id ? { ...a, status } : a
                ));
                setActionLog(`✅ Appointment ${status}. Opening email to notify client...`);
                // FIX: open mailto to notify the user after status update
                setTimeout(() => sendNotificationEmail(appt, status), 800);
            } else {
                setActionLog(`Failed: ${data.message}`);
            }
        })
        .catch(err => setActionLog(`Error: ${err.message}`));
    };

    const handleAdminUpload = (e) => {
        e.preventDefault();
        if (!authToken) { setActionLog('Upload rejected: Invalid session.'); return; }
        if (!adminUploadFile) { setActionLog('Please select an image first.'); return; }
        if (!adminUploadName) { setActionLog('Please enter a hairstyle name.'); return; }
        if (!adminUploadPrice) { setActionLog('Please enter a price.'); return; }

        setUploading(true);
        const formData = new FormData();
        formData.append('image', adminUploadFile);
        formData.append('name', adminUploadName);
        formData.append('price', adminUploadPrice);

        fetch(`${BASE}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        })
        .then(async res => {
            if (!res.ok) throw new Error('Upload failed');
            return res.json();
        })
        .then(() => {
            setActionLog('✅ Hairstyle uploaded successfully!');
            setAdminUploadName('');
            setAdminUploadPrice('');
            setAdminUploadFile(null);
            if (formRef.current) formRef.current.reset();
            fetchGallery();
        })
        .catch(err => setActionLog(`Upload failed: ${err.message}`))
        .finally(() => setUploading(false));
    };

    const handleDelete = (id) => {
        fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setGalleryImages(prev => prev.filter(img => img._id !== id));
                setActionLog('🗑️ Image deleted.');
            } else {
                setActionLog(`Delete failed: ${data.message}`);
            }
        })
        .catch(err => setActionLog(`Error: ${err.message}`));
    };

    const handleApprove = (id) => {
        fetch(`${BASE}/${id}/approve`, { method: 'PATCH', headers: authHeaders })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setPendingImages(prev => prev.filter(img => img._id !== id));
                setActionLog('✅ Image approved.');
            } else {
                setActionLog(`Approve failed: ${data.message}`);
            }
        })
        .catch(err => setActionLog(`Error: ${err.message}`));
    };

    const handleReject = (id) => {
        fetch(`${BASE}/${id}/reject`, { method: 'PATCH', headers: authHeaders })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setPendingImages(prev => prev.filter(img => img._id !== id));
                setActionLog('🗑️ Image rejected and deleted.');
            } else {
                setActionLog(`Reject failed: ${data.message}`);
            }
        })
        .catch(err => setActionLog(`Error: ${err.message}`));
    };

    const handleDeleteAppointment = (id) => {
        fetch(`${BASE_APPT}/${id}`, { method: 'DELETE', headers: authHeaders })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setAppointments(prev => prev.filter(a => a._id !== id));
                setActionLog('🗑️ Appointment deleted.');
            } else {
                setActionLog(`Failed: ${data.message}`);
            }
        })
        .catch(err => setActionLog(`Error: ${err.message}`));
    };

    const handleLogout = () => {
        localStorage.clear();
        if (onExit) onExit();
    };

    const s = {
        container: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#111', borderBottom: '1px solid #222' },
        logo: { fontSize: '20px', fontWeight: '800', color: '#ff007f', letterSpacing: '2px' },
        navBtn: { padding: '8px 16px', background: 'transparent', color: '#ccc', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px', fontSize: '13px' },
        logoutBtn: { padding: '8px 16px', background: '#ff007f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px', fontSize: '13px' },
        actionLog: { margin: '20px 40px', background: '#1a1a1a', borderLeft: '4px solid #ff007f', padding: '12px 16px', borderRadius: '0 6px 6px 0', fontSize: '14px', fontWeight: '600' },
        tabs: { display: 'flex', gap: '4px', padding: '20px 40px 0', borderBottom: '1px solid #222' },
        tab: (active) => ({ padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', letterSpacing: '1px', border: 'none', borderRadius: '6px 6px 0 0', background: active ? '#ff007f' : '#1a1a1a', color: active ? '#fff' : '#888', transition: 'all 0.2s' }),
        section: { padding: '30px 40px' },
        sectionTitle: { fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#fff', letterSpacing: '1px' },
        uploadForm: { background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '24px', marginBottom: '30px' },
        formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' },
        formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1', minWidth: '160px' },
        label: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' },
        input: { padding: '10px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' },
        uploadBtn: { padding: '10px 24px', background: '#ff007f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' },
        card: { background: '#111', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' },
        cardImg: { width: '100%', height: '200px', objectFit: 'cover' },
        cardBody: { padding: '14px' },
        cardName: { fontSize: '15px', fontWeight: '700', marginBottom: '4px' },
        cardPrice: { fontSize: '14px', color: '#ff007f', fontWeight: '700', marginBottom: '12px' },
        cardMeta: { fontSize: '12px', color: '#666', marginBottom: '6px' },
        deleteBtn: { width: '100%', padding: '8px', background: 'transparent', border: '1px solid #ff3333', color: '#ff3333', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginTop: '8px' },
        approveBtn: { flex: 1, padding: '8px', background: '#00c853', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' },
        rejectBtn: { flex: 1, padding: '8px', background: 'transparent', border: '1px solid #ff3333', color: '#ff3333', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
        declineBtn: { flex: 1, padding: '8px', background: 'transparent', border: '1px solid #ff3333', color: '#ff3333', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
        btnRow: { display: 'flex', gap: '8px', marginTop: '10px' },
        badge: (status) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: status === 'pending' ? '#332200' : status === 'approved' ? '#003322' : '#330011', color: status === 'pending' ? '#ffb700' : status === 'approved' ? '#00c853' : '#ff3333' }),
        noImg: { width: '100%', height: '200px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '13px' },
        emptyMsg: { color: '#444', fontSize: '14px', textAlign: 'center', padding: '40px' }
    };

    return (
        <div style={s.container}>
            <header style={s.header}>
                <div style={s.logo}>LUXLAB ADMIN</div>
                <div>
                    <button style={s.navBtn} onClick={onExit}>← Back to Site</button>
                    <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </header>

            {actionLog && <div style={s.actionLog}>{actionLog}</div>}

            <div style={s.tabs}>
                <button style={s.tab(activeTab === 'gallery')} onClick={() => setActiveTab('gallery')}>
                    GALLERY ({galleryImages.length})
                </button>
                <button style={s.tab(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
                    PENDING REVIEW ({pendingImages.length})
                </button>
                <button style={s.tab(activeTab === 'appointments')} onClick={() => setActiveTab('appointments')}>
                    APPOINTMENTS ({appointments.length})
                </button>
            </div>

            {/* ── GALLERY TAB ── */}
            {activeTab === 'gallery' && (
                <div style={s.section}>
                    <p style={s.sectionTitle}>Upload New Hairstyle</p>
                    <div style={s.uploadForm}>
                        <form ref={formRef} onSubmit={handleAdminUpload}>
                            <div style={s.formRow}>
                                <div style={s.formGroup}>
                                    <label style={s.label}>Hairstyle Name</label>
                                    <input
                                        style={s.input}
                                        type="text"
                                        placeholder="e.g. Shadow Fade"
                                        value={adminUploadName}
                                        onChange={e => setAdminUploadName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={s.formGroup}>
                                    <label style={s.label}>Price ($)</label>
                                    <input
                                        style={s.input}
                                        type="text"
                                        placeholder="e.g. 15"
                                        value={adminUploadPrice}
                                        onChange={e => setAdminUploadPrice(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={s.formGroup}>
                                    <label style={s.label}>Image File</label>
                                    <input
                                        style={s.input}
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setAdminUploadFile(e.target.files[0])}
                                        required
                                    />
                                </div>
                                <button style={s.uploadBtn} type="submit" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <p style={s.sectionTitle}>Published Hairstyles</p>
                    {galleryImages.length === 0 ? (
                        <p style={s.emptyMsg}>No hairstyles uploaded yet.</p>
                    ) : (
                        <div style={s.grid}>
                            {galleryImages.map(img => (
                                <div key={img._id} style={s.card}>
                                    <img src={img.url} alt={img.name} style={s.cardImg} />
                                    <div style={s.cardBody}>
                                        <p style={s.cardName}>{img.name || 'Untitled'}</p>
                                        <p style={s.cardPrice}>${img.price || '0'}</p>
                                        <button style={s.deleteBtn} onClick={() => handleDelete(img._id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── PENDING REVIEW TAB ── */}
            {activeTab === 'pending' && (
                <div style={s.section}>
                    <p style={s.sectionTitle}>User Submitted Images — Pending Review</p>
                    {pendingImages.length === 0 ? (
                        <p style={s.emptyMsg}>No pending submissions.</p>
                    ) : (
                        <div style={s.grid}>
                            {pendingImages.map(img => (
                                <div key={img._id} style={s.card}>
                                    <img src={img.url} alt="User submission" style={s.cardImg} />
                                    <div style={s.cardBody}>
                                        <span style={s.badge('pending')}>PENDING</span>
                                        <p style={{...s.cardMeta, marginTop: '8px'}}>
                                            <strong>From:</strong> {img.uploadedBy?.username || img.uploadedBy?.email || 'Unknown user'}
                                        </p>
                                        <p style={s.cardMeta}>
                                            <strong>Email:</strong> {img.uploadedBy?.email || 'N/A'}
                                        </p>
                                        <p style={s.cardMeta}>
                                            <strong>Submitted:</strong> {new Date(img.createdAt).toLocaleDateString()}
                                        </p>
                                        <div style={s.btnRow}>
                                            <button style={s.approveBtn} onClick={() => handleApprove(img._id)}>
                                                ✓ Approve
                                            </button>
                                            <button style={s.rejectBtn} onClick={() => handleReject(img._id)}>
                                                ✗ Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── APPOINTMENTS TAB ── */}
            {activeTab === 'appointments' && (
                <div style={s.section}>
                    <p style={s.sectionTitle}>Live Appointment Requests</p>
                    {appointments.length === 0 ? (
                        <p style={s.emptyMsg}>No appointment requests yet.</p>
                    ) : (
                        <div style={s.grid}>
                            {appointments.map(appt => {
                                const imgUrl = getAppointmentImage(appt);
                                return (
                                    <div key={appt._id} style={s.card}>
                                        {imgUrl ? (
                                            <img src={imgUrl} alt="Appointment reference" style={s.cardImg} />
                                        ) : (
                                            <div style={s.noImg}>No Reference Image</div>
                                        )}
                                        <div style={s.cardBody}>
                                            <span style={s.badge(appt.status)}>{appt.status?.toUpperCase()}</span>
                                            <p style={{...s.cardName, marginTop: '8px'}}>{appt.serviceType || 'Standard Cut'}</p>
                                            <p style={s.cardMeta}>
                                                <strong>Client:</strong> {appt.userId?.username || 'Unknown'}
                                            </p>
                                            <p style={s.cardMeta}>
                                                <strong>Email:</strong> {appt.userId?.email || 'N/A'}
                                            </p>
                                            <p style={s.cardMeta}>
                                                <strong>Booked-Date:</strong> {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleString() : 'Not specified'}
                                            </p>
                                            {appt.priceQuote > 0 && (
                                                <p style={s.cardMeta}>
                                                    <strong>Price Quote:</strong> ${appt.priceQuote}
                                                </p>
                                            )}
                                            {appt.customReferenceImage && (
                                                <p style={s.cardMeta}>
                                                    📎 User attached a custom reference image
                                                </p>
                                            )}
                                            {/* FIX: Approve and Decline now also send email to user */}
                                            {appt.status === 'pending' && (
                                                <div style={s.btnRow}>
                                                    <button
                                                        style={s.approveBtn}
                                                        onClick={() => handleUpdateStatus(appt._id, 'approved', appt)}
                                                    >
                                                        ✓ Approve & Notify
                                                    </button>
                                                    <button
                                                        style={s.declineBtn}
                                                        onClick={() => handleUpdateStatus(appt._id, 'declined', appt)}
                                                    >
                                                        ✗ Decline & Notify
                                                    </button>
                                                </div>
                                            )}
                                            <button style={s.deleteBtn} onClick={() => handleDeleteAppointment(appt._id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}