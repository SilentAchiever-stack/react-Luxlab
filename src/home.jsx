import React, { useState, useEffect } from 'react';
import './index.css';

export default function HomeAppointmentPage({ switchToAdmin }) {
    const [showcaseImages, setShowcaseImages] = useState([]);
    const [serviceType, setServiceType] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    // Fetch the standard portfolio gallery looks uploaded by administration
  useEffect(() => {
    const token = localStorage.getItem('token');
    // Swapped port 5000 to port 3000 to match your Express server configuration
    fetch('http://localhost:3000/api/image/get', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data && Array.isArray(data)) {
            setShowcaseImages(data);
        }
    })
    .catch(err => console.error("Error fetching display gallery:", err));
}, []);
    // Form Submission: Appends variables dynamically into FormData layout for Multer processing
    const handleBookingSubmit = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('serviceType', serviceType);
        formData.append('appointmentDate', appointmentDate);
        if (selectedFile) {
            formData.append('image', selectedFile); // Key matches uploadMiddleWare.single('image')
        }

        fetch('http://localhost:3000/api/image/appointments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Content-Type headers are omitted intentionally so the browser builds standard boundary breaks
            },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setStatusMessage('Appointment and design inspiration locked in!');
                setServiceType('');
                setAppointmentDate('');
                setSelectedFile(null);
            } else {
                setStatusMessage(`Submission failure: ${data.message}`);
            }
        })
        .catch(err => setStatusMessage(`Network pipeline failure: ${err.message}`));
    };

    return (
        <div className="salon-container">
            <header className="header-nav">
                <div className="logo">Barbie Salon Co.</div>
                <button className="nav-btn" onClick={switchToAdmin}>Admin Dashboard →</button>
            </header>

            <h2 className="gallery-title">Book Custom Home Appointment</h2>
            <div className="booking-form-box">
                <form onSubmit={handleBookingSubmit}>
                    <div className="form-group">
                        <label>Style/Service Classification</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="e.g., Taper Fade, Pixie Cut"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Target Booking Calendar Date</label>
                        <input 
                            type="datetime-local" 
                            className="form-control" 
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Upload Custom Style Inspo (Optional)</label>
                        <input 
                            type="file" 
                            className="form-control" 
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                    </div>
                    <button type="submit" className="submit-btn">File Appointment Request</button>
                </form>
                {statusMessage && <p style={{ marginTop: '15px', color: '#ff007f', fontWeight: 'bold' }}>{statusMessage}</p>}
            </div>

            <h2 className="gallery-title">Official Inspo & Look Showcase</h2>
            <div className="image-grid">
                {/* Dynamically maps out images uploaded from the server database */}
                {showcaseImages.map((img) => (
                    <div key={img._id} className="showcase-card">
                        <div className="image-wrapper">
                            <img src={img.url || img.path} alt="Salon Style Asset" />
                        </div>
                        <div className="card-details">
                            <h3>{img.title || "Salon Exclusive look"}</h3>
                            <p>Code Reference: {img._id}</p>
                        </div>
                    </div>
                ))}

                {/* OPEN SLOTS: Static structures ready to display your next batch of uploads */}
                <div className="showcase-card">
                    <div className="image-wrapper">
                        <div className="placeholder-box">[ Taper Fade Slot 02 ]</div>
                    </div>
                    <div className="card-details">
                        <h3>Upcoming Premium Variant</h3>
                        <p>Awaiting Admin Asset Payload</p>
                    </div>
                </div>

                <div className="showcase-card">
                    <div className="image-wrapper">
                        <div className="placeholder-box">[ Custom Inspo Slot 03 ]</div>
                    </div>
                    <div className="card-details">
                        <h3>Upcoming Avant Garde Look</h3>
                        <p>Awaiting Admin Asset Payload</p>
                    </div>
                </div>
            </div>
        </div>
    );
}