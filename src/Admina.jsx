import React, { useState, useEffect } from 'react';
import './index.css';

export default function AdminDashboard({ switchToUser }) {
    const [incomingAppointments, setIncomingAppointments] = useState([]);
    const [adminUploadFile, setAdminUploadFile] = useState(null);
    const [adminUploadTitle, setAdminUploadTitle] = useState('');
    const [actionLog, setActionLog] = useState('');

    // Load user requests from database pipelines using useEffect hooks
    useEffect(() => {
   const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log("DEBUG: Token:", token, "Role:", role); // Check your F12 console!

    if (!token) {
        setActionLog('Authentication error: No session found.');
        return;
    }

    // Ensure the check matches the string exactly
    if (role !== 'admin') {
        setActionLog(`Authorization error: Access denied for role: ${role}`);
        return;
    }
        // Fetch appointments containing user-uploaded custom design files
        fetch('http://localhost:3000/api/image/get', { 
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(async res => {
            if (!res.ok) {
                // If 401/403, the backend is rejecting the token
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Server responded with status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data && Array.isArray(data)) {
                setIncomingAppointments(data);
            } else if (data && Array.isArray(data.appointments)) {
                setIncomingAppointments(data.appointments);
            }
        })
        .catch(err => {
            console.error("Error executing layout generation loop:", err);
            setActionLog(`Failed to load items: ${err.message}`);
        });
    }, []);

    // Handles administrative system upload updates to general look catalog
    const handleAdminUpload = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (!token) {
            setActionLog('Upload failed: Active session token missing.');
            return;
        }

        if (!adminUploadFile) {
            setActionLog('Validation error: Please choose an image file first.');
            return;
        }

        const formData = new FormData();
        formData.append('title', adminUploadTitle);
        formData.append('image', adminUploadFile); 

        fetch('http://localhost:3000/api/image/upload', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}` 
            },
            body: formData
        })
        .then(async res => {
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Server status error response: ${res.status}`);
            }
            return res.json();
        })
        .then(() => {
            setActionLog('Global Look Matrix updated successfully!');
            setAdminUploadTitle('');
            setAdminUploadFile(null); 
            e.target.reset();
        })
        .catch(err => {
            console.error("Network upload execution breakdown:", err);
            setActionLog(`Upload failed: ${err.message}`);
        });
    };

    // POLICY ENFORCEMENT: Purges bad/off-topic uploads
    const executePolicyPurge = (id) => {
        const token = localStorage.getItem('token');

        if (!token) {
            setActionLog('Purge execution denied: Invalid credentials.');
            return;
        }

        fetch(`http://localhost:3000/api/image/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setIncomingAppointments(prev => prev.filter(item => item._id !== id));
                setActionLog('Policy protection alert: Resource successfully purged.');
            } else {
                setActionLog(`Access verification failure: ${data.message}`);
            }
        })
        .catch(err => setActionLog(`Processing error: ${err.message}`));
    };

    // Destroys the token and forces the app to re-evaluate the login state
    const handleLogout = () => {
        localStorage.clear();
        window.location.reload(); 
    };

    return (
        <div className="salon-container">
            <header className="header-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="logo">Barbie Operations Dashboard</div>
                <div>
                    <button className="nav-btn" onClick={switchToUser} style={{ marginRight: '15px' }}>
                        ← Back to User Site
                    </button>
                    <button 
                        className="nav-btn" 
                        onClick={handleLogout} 
                        style={{ background: '#ff007f', color: '#fff', border: 'none' }}
                    >
                        Lock System (Logout)
                    </button>
                </div>
            </header>

            {actionLog && (
                <div style={{ background: '#222', borderLeft: '4px solid #ff007f', padding: '15px', marginBottom: '30px', fontWeight: 'bold' }}>
                    {actionLog}
                </div>
            )}

            <h2 className="gallery-title">Publish New Style Showcase Image</h2>
            <div className="booking-form-box" style={{ margin: '0 0 50px 0', maxWidth: '100%' }}>
                <form onSubmit={handleAdminUpload} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label>Style/Catalog Title</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="e.g., Premium Neon Fade"
                            value={adminUploadTitle}
                            onChange={(e) => setAdminUploadTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label>Media Asset File Selection</label>
                        <input 
                            type="file" 
                            className="form-control" 
                            onChange={(e) => setAdminUploadFile(e.target.files[0])}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn" style={{ flex: 1, padding: '12px' }}>Upload Look</button>
                </form>
            </div>

            <h2 className="gallery-title">Live Appointment Requests & Custom Image Submissions</h2>
            <div className="image-grid">
                {incomingAppointments.map((req) => (
                    <div key={req._id} className="showcase-card" style={{ borderColor: '#333' }}>
                        <div className="image-wrapper">
                            {req.customReferenceImage ? (
                                <img src={req.customReferenceImage} alt="User submission upload" />
                            ) : (
                                <div className="placeholder-box" style={{color: '#ff3333'}}>No Reference Provided</div>
                            )}
                        </div>
                        <div className="card-details">
                            <h3>Style: {req.serviceType || 'Standard cut'}</h3>
                            <p><strong>Owner Hash ID:</strong> {req.userId}</p>
                            <p><strong>Target Date:</strong> {new Date(req.appointmentDate).toLocaleString()}</p>
                            
                            <button 
                                className="btn-delete"
                                onClick={() => executePolicyPurge(req._id)}
                            >
                                Purge Off-Topic / Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}