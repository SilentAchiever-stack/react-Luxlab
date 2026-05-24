import React, { useState } from 'react';

export default function Login({ onLoginSuccess, onBack }) {
    const [isNewUser, setIsNewUser] = useState(false); 
    const [isResetMode, setIsResetMode] = useState(false); 

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');          
    const [newPassword, setNewPassword] = useState(''); 
    
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const switchMode = (mode) => {
        setErrorMsg(''); 
        setSuccessMsg(''); 
        setUsername('');
        setEmail(''); 
        setPassword(''); 
        setNewPassword('');

        if (mode === 'register') {
            setIsNewUser(true); setIsResetMode(false);
        } else if (mode === 'forgot') {
            setIsNewUser(false); setIsResetMode(true);
        } else {
            setIsNewUser(false); setIsResetMode(false);
        }
    };

    const handleSubmit = (e) => {
        console.log('API URL:', import.meta.env.VITE_API_URL);
        e.preventDefault();
        setErrorMsg(''); 
        setSuccessMsg('');
        setLoading(true);

        let targetUrl = '';
        let payload = {};
        let httpMethod = 'POST';
        let headers = { 'Content-Type': 'application/json' };

        if (isResetMode) {
            targetUrl = `${import.meta.env.VITE_API_URL}/api/users/ForgotUserPassword`;
            payload = { email, newPassword };
            httpMethod = 'PATCH';
        } else if (isNewUser) {
            targetUrl =  `${import.meta.env.VITE_API_URL}/api/users/create`;;
            payload = { username, email, password };
        } else {
            targetUrl = `${import.meta.env.VITE_API_URL}/api/users/login`;
            payload = { email, password };
        }

        fetch(targetUrl, {
            method: httpMethod,
            headers: headers,
            body: JSON.stringify(payload)
        })
        .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Action failed');
            return data;
        })
        .then((data) => {
            const userRole = (data.user?.role || data.role)?.toLowerCase();
            // FIX: backend returns 'accessToken' not 'token'
            const userToken = data.accessToken || data.token || data.user?.token;

            console.log("Full response:", data);
            console.log("userToken:", userToken);
            console.log("userRole:", userRole);

            if (userToken) {
                localStorage.setItem('token', userToken);
                localStorage.setItem('role', userRole);
            }

            // Pass both role AND token directly to parent
            if (onLoginSuccess) {
                onLoginSuccess(userRole, userToken);
            }
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    };

    const styles = {
        wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'rgba(11, 11, 11, 0.95)', color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px', width: '100%' },
        card: { width: '100%', maxWidth: '420px', background: '#141414', border: '1px solid #33261a', borderRadius: '12px', padding: '40px 30px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' },
        title: { fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '10px', letterSpacing: '-0.5px' },
        accentText: { color: '#ffb700' },
        subtitle: { fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '30px' },
        alert: { background: 'rgba(255, 69, 0, 0.1)', borderLeft: '4px solid #ff4500', color: '#ff7a59', padding: '12px 15px', fontSize: '14px', fontWeight: '600', marginBottom: '20px', borderRadius: '0 4px 4px 0' },
        successAlert: { background: 'rgba(255, 183, 0, 0.1)', borderLeft: '4px solid #ffb700', color: '#ffd043', padding: '12px 15px', fontSize: '14px', fontWeight: '600', marginBottom: '20px', borderRadius: '0 4px 4px 0' },
        inputGroup: { marginBottom: '20px', position: 'relative' },
        labelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' },
        label: { display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#b3a394' },
        inlineLink: { color: '#ffb700', background: 'none', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '0', textDecoration: 'none' },
        input: { width: '100%', padding: '12px 16px', background: '#1e1a17', border: '1px solid #4a331c', borderRadius: '6px', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
        button: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ff7b00 0%, #ffb700 100%)', color: '#140c00', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', transition: 'opacity 0.2s', textShadow: '0 1px 1px rgba(255,255,255,0.2)' },
        toggleContainer: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#888' },
        toggleLink: { color: '#ffb700', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: '700', cursor: 'pointer', padding: '0', marginLeft: '5px', textDecoration: 'underline' },
        backButton: { width: '100%', padding: '14px', background: 'transparent', color: '#b3a394', border: '1px solid #4a331c', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '15px', transition: 'color 0.2s, borderColor 0.2s' }
    };

    const getFormMeta = () => {
        if (isResetMode) return { subtitle: 'Account Recovery Protection', btnText: 'Verify & Update' };
        if (isNewUser) return { subtitle: 'Create Your Account Credentials', btnText: 'Register Account' };
        return { subtitle: 'Administrative System Gatekeeper', btnText: 'Verify Authority' };
    };

    const meta = getFormMeta();

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h1 style={styles.title}>LUXLAB <span style={styles.accentText}>Portal</span></h1>
                <p style={styles.subtitle}>{meta.subtitle}</p>

                {errorMsg && <div style={styles.alert}>{errorMsg}</div>}
                {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

                <form onSubmit={handleSubmit}>
                    {isNewUser && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Select Personal Username</label>
                            <input type="text" style={styles.input} placeholder="YourUsername" value={username} onChange={(e) => setUsername(e.target.value)} required={isNewUser} />
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>{isResetMode ? 'Enter Registered Email for Recovery' : 'Registered System Email'}</label>
                        <input type="email" style={styles.input} placeholder="user@barbiesalon.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    {!isResetMode && (
                        <div style={styles.inputGroup}>
                            <div style={styles.labelRow}>
                                <label style={styles.label}>{isNewUser ? 'Create Security Passphrase' : 'Security Passphrase Key'}</label>
                                {!isNewUser && (
                                    <button type="button" style={styles.inlineLink} onClick={() => switchMode('forgot')}>Forgot Password?</button>
                                )}
                            </div>
                            <input type="password" style={styles.input} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required={!isResetMode} />
                        </div>
                    )}

                    {isResetMode && (
                        <div style={styles.inputGroup}>
                            <div style={styles.labelRow}>
                                <label style={styles.label}>Create Fresh Passphrase</label>
                                <button type="button" style={styles.inlineLink} onClick={() => switchMode('login')}>Back to Login</button>
                            </div>
                            <input type="password" style={styles.input} placeholder="Enter fresh new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required={isResetMode} />
                        </div>
                    )}

                    <button type="submit" style={{ ...styles.button, opacity: loading ? '0.6' : '1' }} disabled={loading}>
                        {loading ? 'Processing Server Handshake...' : meta.btnText}
                    </button>
                </form>

                <div style={styles.toggleContainer}>
                    {isResetMode ? (
                        <>Remembered your access key? <button type="button" style={styles.toggleLink} onClick={() => switchMode('login')}>Sign In</button></>
                    ) : isNewUser ? (
                        <>Already have an account? <button type="button" style={styles.toggleLink} onClick={() => switchMode('login')}>Sign In Here</button></>
                    ) : (
                        <>Need a brand new account? <button type="button" style={styles.toggleLink} onClick={() => switchMode('register')}>Register Here</button></>
                    )}
                </div>

                {onBack && (
                    <button type="button" style={styles.backButton} onClick={onBack}>← Return to Main Site</button>
                )}
            </div>
        </div>
    );
}