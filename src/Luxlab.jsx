import React, { useState } from 'react';
import Login from './Login';
import AdminDashboard from './Admin';
import UserDashboard from './UserDashboard';
import './App.css';

const RevealSection = ({ children }) => <div className="reveal">{children}</div>;

export default function Luxlab() {
    const [view, setView] = useState('salon');
    const [showLogin, setShowLogin] = useState(false);
    const [authToken, setAuthToken] = useState(null);
    const [authRole, setAuthRole] = useState(null);

    // Salon visit form state
    const [salonName, setSalonName] = useState('');
    const [salonEmail, setSalonEmail] = useState('');
    const [salonPhone, setSalonPhone] = useState('');
    const [salonService, setSalonService] = useState('');
    const [salonDate, setSalonDate] = useState('');
    const [salonTime, setSalonTime] = useState('');
    const [salonSuccess, setSalonSuccess] = useState(false);

    const luxImages = [
        "https://res.cloudinary.com/doqevvxhi/image/upload/long_cpo5nv",
        "https://res.cloudinary.com/doqevvxhi/image/upload/download_19_qyjses",
        "https://res.cloudinary.com/doqevvxhi/image/upload/download_16_n9kud9",
        "https://res.cloudinary.com/doqevvxhi/image/upload/Afrohair-waves_mnneiq",
        "https://res.cloudinary.com/doqevvxhi/image/upload/Afrohair-fade_eeo4kn",
        "https://res.cloudinary.com/doqevvxhi/image/upload/Afrohair-fade2_i9wobw",
        "https://res.cloudinary.com/doqevvxhi/image/upload/v1779188120/sibhdy9mpyqhu78wduff.jpg"
    ];

    // ── Admin Dashboard ──────────────────────────────────────────────────
    if (view === 'adminDashboard') {
        return (
            <div className="luxlab-root">
                <AdminDashboard
                    authToken={authToken}
                    authRole={authRole}
                    onExit={() => {
                        setAuthToken(null);
                        setAuthRole(null);
                        setView('salon');
                    }}
                />
            </div>
        );
    }

    // ── User Dashboard ───────────────────────────────────────────────────
    if (view === 'userDashboard') {
        return (
            <div className="luxlab-root">
                <UserDashboard
                    authToken={authToken}
                    authRole={authRole}
                    onExit={() => {
                        setAuthToken(null);
                        setAuthRole(null);
                        setView('salon');
                    }}
                />
            </div>
        );
    }

    // ── Salon visit form submit ──────────────────────────────────────────
    const handleSalonSubmit = (e) => {
        e.preventDefault();

        if (!salonName || !salonEmail || !salonPhone || !salonService || !salonDate || !salonTime) {
            alert('Please fill in all fields before confirming.');
            return;
        }

        const subject = `New Salon Appointment Request — ${salonName}`;
        const body =
`Hello LuxLab,

I would like to book a salon visit appointment. Here are my details:

Name: ${salonName}
Email: ${salonEmail}
Phone: ${salonPhone}
Service: ${salonService}
Preferred Date: ${salonDate}
Preferred Time: ${salonTime}

Please confirm my appointment at your earliest convenience.

Thank you,
${salonName}`;

        window.location.href = `mailto:keji@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        setSalonSuccess(true);
        setSalonName('');
        setSalonEmail('');
        setSalonPhone('');
        setSalonService('');
        setSalonDate('');
        setSalonTime('');
        setTimeout(() => setSalonSuccess(false), 6000);
    };

    // ── VIP / Home Service redirect ──────────────────────────────────────
    const handleHomeServiceClick = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setShowLogin(true);
        } else {
            const role = localStorage.getItem('role');
            const savedToken = localStorage.getItem('token');
            setAuthToken(savedToken);
            setAuthRole(role);
            if (role === 'admin') {
                setView('adminDashboard');
            } else {
                setView('userDashboard');
            }
        }
    };

    return (
        <div className="luxlab-root">

            {/* Login Modal Overlay */}
            {showLogin && (
                <div className="login-overlay">
                    <Login
                        onBack={() => setShowLogin(false)}
                        onLoginSuccess={(role, token) => {
                            setAuthToken(token);
                            setAuthRole(role);
                            setShowLogin(false);
                            if (role === 'admin') {
                                setView('adminDashboard');
                            } else {
                                setView('userDashboard');
                            }
                        }}
                    />
                </div>
            )}

            {/* Header & Navigation */}
            <header>
                <div className="logo" onClick={() => window.scrollTo(0, 0)}>
                    <video className="logo-video" autoPlay muted loop playsInline>
                        <source src="https://res.cloudinary.com/doqevvxhi/video/upload/v1779354454/luxlab-home_ruc3zp.mp4" type="video/mp4" />
                    </video>
                    <span className='Lab'>LUXLAB</span>
                </div>
                <nav className="navbar">
                    <a href="#about">The Studio</a>
                    <a href="#service">Menu</a>
                    <a href="#booking">Book Now</a>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <video autoPlay muted loop playsInline className='videoSect'>
                    <source src="https://res.cloudinary.com/doqevvxhi/video/upload/v1779354454/luxlab-home_ruc3zp.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay">
                    <h1>LUXLAB</h1>
                    <p style={{letterSpacing: '3px', fontSize: '0.9rem', color: 'var(--gold)'}}>ELITE GROOMING STUDIO</p>
                </div>
            </section>

            {/* About Section */}
            <RevealSection>
                <section id="about" style={{padding: '80px 10%', textAlign: 'center'}}>
                    <h2 className="section-title">Elevating The Craft</h2>
                    <p style={{lineHeight: '1.8', color: '#888', maxWidth: '800px', margin: 'auto'}}>
                        LuxLab is a sanctuary where heritage barbering meets modern luxury. We provide more than just a cut;
                        we provide the confidence required for the modern world.
                    </p>
                </section>
            </RevealSection>

            {/* Infinite Scrolling Marquee Gallery */}
            <div className="marquee">
                <div className="marquee-track">
                    {[...luxImages, ...luxImages].map((img, i) => (
                        <img key={i} src={img} alt={`Gallery ${i}`} />
                    ))}
                </div>
            </div>

            {/* Services Section */}
            <section id="service" className="services">
                <RevealSection>
                    <h2 className="section-title">The Signature Menu</h2>
                    <div className="grid">
                        <ServiceItem img={luxImages[0]} title="The Rounded Afro" price="$10" />
                        <ServiceItem img={luxImages[1]} title="Shadow Fade" price="$12" />
                        <ServiceItem img={luxImages[2]} title="High Taper Fade" price="$15" />
                        <ServiceItem img={luxImages[3]} title="Skin Fade" price="$12" />
                        <ServiceItem img={luxImages[4]} title="Classic Low Taper" price="$10" />
                        <ServiceItem img={luxImages[5]} title="Classic Low-cut Fade" price="$17"/>
                        <ServiceItem img={luxImages[6]} title="Classic Low-cut Fade" price="$17"/>
                    </div>
                </RevealSection>
            </section>

            {/* Booking Section */}
            <section id="booking" className="booking">
                <RevealSection>
                    <div className="form-box">
                        <div className="tab-group">
                            <div
                                className={`tab ${view === 'salon' ? 'active' : ''}`}
                                onClick={() => setView('salon')}
                            >
                                SALON VISIT
                            </div>
                            <div
                                className="tab"
                                onClick={handleHomeServiceClick}
                            >
                                HOME SERVICE
                            </div>
                        </div>

                        {/* Success message */}
                        {salonSuccess && (
                            <div style={{ background: '#001a0a', borderLeft: '4px solid #00c853', padding: '12px 16px', margin: '16px 0', borderRadius: '0 6px 6px 0', color: '#00c853', fontSize: '14px', fontWeight: '600' }}>
                                ✅ Your email app has opened with your booking details addressed to LuxLab. Just hit Send to confirm your appointment!
                            </div>
                        )}

                        <form onSubmit={handleSalonSubmit}>
                            <input
                                placeholder="GUEST NAME"
                                required
                                value={salonName}
                                onChange={e => setSalonName(e.target.value)}
                            />
                            <input
                                type="email"
                                placeholder="YOUR EMAIL ADDRESS"
                                required
                                value={salonEmail}
                                onChange={e => setSalonEmail(e.target.value)}
                            />
                            <input
                                placeholder="PHONE NUMBER"
                                required
                                value={salonPhone}
                                onChange={e => setSalonPhone(e.target.value)}
                            />
                            {/* FIX: VIP Home Session removed from here */}
                            <select
                                required
                                value={salonService}
                                onChange={e => setSalonService(e.target.value)}
                            >
                                <option value="" disabled>SELECT SERVICE</option>
                                <option value="Afro-Fade Specialist">Afro-Fade Specialist</option>
                                <option value="Beard Sculpt & Grooming">Beard Sculpt & Grooming</option>
                                <option value="Shadow Fade">Shadow Fade</option>
                                <option value="High Taper Fade">High Taper Fade</option>
                                <option value="Skin Fade">Skin Fade</option>
                                <option value="Classic Low Taper">Classic Low Taper</option>
                            </select>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <input
                                    type="date"
                                    required
                                    value={salonDate}
                                    onChange={e => setSalonDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <input
                                    type="time"
                                    required
                                    value={salonTime}
                                    onChange={e => setSalonTime(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn-gold">
                                Confirm Appointment
                            </button>
                        </form>

                        {/* FIX: VIP Home Session now a redirect button below the form */}
                        <div style={{
                            marginTop: '20px',
                            padding: '16px',
                            background: 'rgba(255, 183, 0, 0.05)',
                            border: '1px solid rgba(255, 183, 0, 0.2)',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <p style={{
                                fontSize: '13px',
                                color: '#888',
                                marginBottom: '10px',
                                letterSpacing: '1px'
                            }}>
                                PREFER A HOME VISIT INSTEAD?
                            </p>
                            <button
                                onClick={handleHomeServiceClick}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--gold, #ffb700)',
                                    color: 'var(--gold, #ffb700)',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    letterSpacing: '1px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ✦ BOOK VIP HOME SERVICE
                            </button>
                            <p style={{
                                fontSize: '11px',
                                color: '#555',
                                marginTop: '8px'
                            }}>
                                Login or register to book a home visit appointment
                            </p>
                        </div>

                    </div>
                </RevealSection>
            </section>

            {/* Footer */}
            <footer style={{padding: '50px', textAlign: 'center', borderTop: '1px solid #222'}}>
                <p style={{letterSpacing: '4px', color: 'var(--gold)'}}>LUXLAB</p>
                <p style={{fontSize: '0.7rem', opacity: '0.4'}}>© 2026 LUXLAB STUDIO</p>
            </footer>

        </div>
    );
}

function ServiceItem({img, title, price}) {
    return (
        <div className="card">
            <img src={img} alt={title} />
            <div className="card-info">
                <h3>{title}</h3>
                <p style={{color: 'var(--gold)', fontWeight: 'bold'}}>{price}</p>
            </div>
        </div>
    );
}