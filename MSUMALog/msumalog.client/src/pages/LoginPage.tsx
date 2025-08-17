import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { basicLogin } from '../api/client'; // เพิ่มบรรทัดนี้

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
    const [agreePdpa, setAgreePdpa] = useState(false);
    const [showPdpa, setShowPdpa] = useState(false);
    const [loading, setLoading] = useState(false);
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!agreePdpa) {
            setError('คุณต้องยอมรับเงื่อนไข PDPA ก่อน');
            return;
        }

        const emailOk = /\S+@\S+\.\S+/.test(email);
        if (!emailOk) {
            setError('กรุณากรอกอีเมลให้ถูกต้อง');
            return;
        }
        if (emailOk && password) {
            setLoading(true);
            try {
                await basicLogin(email, password); // ใช้ client
                navigate('/home');
            } catch (err: any) {
                setError(err?.response?.data || err?.message || 'Login failed');
            } finally {
                setLoading(false);
            }
        } else {
            setError('กรุณากรอกข้อมูลให้ครบ');
        }
    };

    const loginGoogle = () => {
        // require PDPA acceptance before redirecting to Google
        if (!agreePdpa) {
            setError('คุณต้องยอมรับเงื่อนไข PDPA ก่อนที่จะใช้ Google Sign-In');
            // optionally open PDPA modal to let user read/accept
            setShowPdpa(true);
            return;
        }
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
                width: '100%', maxWidth: '420px', padding: '2rem',
                backgroundColor: 'white', borderRadius: '8px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <img src="/images/Circle/Svg/128px.svg" alt="Logo" style={{ width: 96, height: 96, objectFit: 'contain' }} />
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>เข้าสู่ระบบ MSU-MALOG</h2>
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

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                            <input
                                type="checkbox"
                                checked={agreePdpa}
                                onChange={(e) => setAgreePdpa(e.target.checked)}
                                style={{ width: 16, height: 16 }}
                            />
                            ฉันยอมรับเงื่อนไข PDPA
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowPdpa(true)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}
                        >
                            ดูรายละเอียด PDPA
                        </button>
                    </div>

                    <button type="submit" disabled={!agreePdpa || loading} style={{
                        padding: '.75rem', border: 'none', borderRadius: '4px',
                        backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: (!agreePdpa || loading) ? 'not-allowed' : 'pointer',
                        opacity: (!agreePdpa || loading) ? 0.6 : 1
                    }}>
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
                    </button>
                </form>

                <div style={{ margin: '1.5rem 0', textAlign: 'center', fontSize: '.8rem', color: '#888' }}>
                    <span style={{ background: '#fff', padding: '0 .5rem' }}>OR</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    <button
                        onClick={loginGoogle}
                        type="button"
                        disabled={!agreePdpa || loading}
                        style={{
                            padding: '.7rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: (!agreePdpa || loading) ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '.5rem',
                            opacity: (!agreePdpa || loading) ? 0.6 : 1
                        }}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: 18, height: 18 }} />
                        Sign in with Google
                    </button>
                    {!agreePdpa && (
                        <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
                            กรุณายอมรับเงื่อนไข PDPA ก่อนใช้ Google Sign-In
                        </div>
                    )}
                </div>
            </div>

            {/* PDPA Modal */}
            {showPdpa && (
                <div style={{
                    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                }} onClick={() => setShowPdpa(false)}>
                   {/* start */}
                   <div
  style={{
    width: 720,
    maxWidth: '100%',
    background: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  }}
  onClick={(e) => e.stopPropagation()}
>
  <h3>ข้อตกลงและเงื่อนไขการใช้งาน และนโยบายการคุ้มครองข้อมูลส่วนบุคคล (Agrement and PDPA)</h3>
  {/* เพิ่มการจำกัดความสูงและเปิด scroll */}
  <div style={{ marginTop: 8, color: '#374151', fontSize: 14, lineHeight: 1.6, maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
    <p>
      ระบบ MSU-MALOG จัดทำขึ้นเพื่อให้บุคลากรสามารถรายงานปัญหาที่เกี่ยวข้องกับระบบ
      โดยอาจมีการแนบข้อมูล เช่น รูปภาพ ไฟล์ หรือวิดีโอ เพื่อประกอบการรายงาน
    </p>
    <ul>
      <li>
        <strong>วัตถุประสงค์:</strong> ใช้เพื่อการตรวจสอบและแก้ไขปัญหาที่เกี่ยวข้องกับระบบทางการแพทย์
      </li>
      <li>
        <strong>ข้อมูลที่เก็บ:</strong> ชื่อ นามสกุล อีเมล และรูปโปรไฟล์ (จาก Google Login) รวมถึงไฟล์/รูป/วิดีโอที่ผู้ใช้งานรายงาน
      </li>
      <li>
        <strong>การใช้และการเปิดเผย:</strong> ข้อมูลจะถูกใช้และเปิดเผยเฉพาะแก่บุคคลที่เกี่ยวข้องภายในองค์กร
        และ/หรือบริษัท Vendor ที่ได้รับมอบหมายเท่านั้น <br />
        ข้อมูลจะไม่ถูกเปิดเผยต่อสาธารณะหรือบุคคลที่ไม่เกี่ยวข้อง
      </li>
      <li>
        <strong>สิทธิของผู้ใช้งาน:</strong> มีสิทธิขอเข้าถึง แก้ไข หรือเพิกถอนข้อมูลส่วนบุคคล ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล
      </li>
      <li>
        <strong>การยอมรับ:</strong> การเข้าใช้งานระบบถือว่าผู้ใช้งานได้อ่านและยอมรับข้อตกลงนี้แล้ว
      </li>
    </ul>

    <p style={{ marginTop: 12, color: '#b91c1c' }}>
      ⚠️ ข้อควรระวัง: ห้ามใส่ข้อมูลส่วนบุคคลของบุคคลอื่นหรือผู้ป่วย โดยไม่จำเป็น หรือหากไม่ได้รับความยินยอมจากผู้ป่วย
      โปรดระมัดระวังในการใช้งาน หากจำเป็นต้องแนบรูปหรือข้อมูลที่มีบุคคลอื่น ควรทำการเบลอหรือปกปิดข้อมูลที่อ่อนไหวก่อนทุกครั้ง
    </p>

    <hr style={{ margin: '20px 0' }} />

    <h4>PDPA & Terms of Use (English Version)</h4>
    <p>
      The MSU-MALOG  is designed to allow staff to report issues related to  systems.
      Supporting files such as images, documents, or videos may be attached to facilitate the report.
    </p>
    <ul>
      <li>
        <strong>Purpose:</strong> To review and resolve issues related to medical systems.
      </li>
      <li>
        <strong>Collected Data:</strong> First name, Last name, Email, and Profile Image (via Google Login),
        as well as any attached files/images/videos submitted by the user.
      </li>
      <li>
        <strong>Usage and Disclosure:</strong> Data will be used and disclosed only to authorized personnel
        within the organization and/or assigned vendors. <br />
        Data will not be made public or shared with unauthorized parties.
      </li>
      <li>
        <strong>User Rights:</strong> Users have the right to access, correct, or request deletion of their
        personal data in accordance with data protection laws.
      </li>
      <li>
        <strong>Acceptance:</strong> By using the system, the user acknowledges and accepts these terms.
      </li>
    </ul>

    <p style={{ marginTop: 12, color: '#b91c1c' }}>
      ⚠️ Caution: Do not include unnecessary personal information of other individuals or patients without
      proper consent. Please exercise care when using the system. If it is necessary to attach images or files containing other persons, sensitive information must be blurred or masked before submission.
    </p>
  </div>
  <div style={{ marginTop: 14, textAlign: 'right' }}>
    <button
      onClick={() => setShowPdpa(false)}
      style={{
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        background: '#fff',
        cursor: 'pointer',
      }}
    >
      ปิด
    </button>
  </div>
</div>
                   {/* end */}
                </div>
            )}
        </div>
    );
}

export default LoginPage;
