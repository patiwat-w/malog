import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = ((): string => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        // use test backend when developing locally
        return 'https://localhost:7154';
    }
    // in non-local environments use same origin (production)
    return window.location.origin;
})();

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const abort = new AbortController();
        const checkSession = async () => {
            try {
                const res = await fetch('/auth/me', {
                    credentials: 'include',
                    signal: abort.signal
                });

                // ถ้าไม่ได้ auth ควรเป็น 401/403 -> ไม่ redirect
                if (!res.ok) {
                    // Debug (ลบภายหลัง)
                    // console.log('[auth/me] status', res.status);
                    return;
                }

                // พยายาม parse JSON (ถ้าได้ HTML แสดงว่ากำลังโดน fallback)
                let data: any = null;
                try {
                    data = await res.json();
                } catch {
                    // console.warn('auth/me returned non-JSON');
                }

                // เงื่อนไขชัดเจนขึ้น ต้องมี email (หรือ flag authenticated)
                if (data && data.email) {
                    navigate('/home', { replace: true });
                }
            } catch (e) {
                // ignore
            } finally {
                if (!abort.signal.aborted) setChecking(false);
            }
        };
        checkSession();
        return () => abort.abort();
    }, [navigate]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const emailOk = /\S+@\S+\.\S+/.test(email);
        if (!emailOk) {
            alert('กรุณากรอกอีเมลให้ถูกต้อง');
            return;
        }
        if (emailOk && password) {
            fetch('/auth/basic-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            })
                .then(async r => {
                    if (r.ok) {
                        navigate('/home');
                    } else {
                        const txt = await r.text();
                        throw new Error(txt || 'Login failed');
                    }
                })
                .catch(err => setError(err.message));
        } else {
            alert('กรุณากรอกข้อมูลให้ครบ');
        }
    };

    const loginGoogle = () => {
        const returnUrl = encodeURIComponent(`${window.location.origin}/home`);
        window.location.href = `${API_BASE}/auth/google?returnUrl=${returnUrl}`;
    };


    if (checking) {
        return <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', fontFamily: 'sans-serif'
        }}>Checking session...</div>;
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '100vh',
            backgroundColor: '#f0f2f5', padding: '1rem'
        }}>
            <div style={{
                width: '100%', maxWidth: '400px', padding: '2rem',
                backgroundColor: 'white', borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>Login</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '.9rem' }}>{error}</div>}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold', color: '#555' }}>Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold', color: '#555' }}>Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" style={{
                        padding: '.75rem', border: 'none', borderRadius: '4px',
                        backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer'
                    }}>Login</button>
                </form>

                <div style={{ margin: '1.5rem 0', textAlign: 'center', fontSize: '.8rem', color: '#888' }}>
                    <span style={{ background: '#fff', padding: '0 .5rem' }}>OR</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    <button onClick={loginGoogle} type="button" style={{
                        padding: '.7rem', border: '1px solid #ddd', borderRadius: '4px',
                        backgroundColor: 'white', cursor: 'pointer', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem'
                    }}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: 18, height: 18 }} />
                        Sign in with Google
                    </button>

                </div>
            </div>
        </div>
    );
}

export default LoginPage;
