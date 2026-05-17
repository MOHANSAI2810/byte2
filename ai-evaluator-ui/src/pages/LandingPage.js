import { useEffect, useRef } from "react";

export default function LandingPage({ onGetStarted, onLogin }) {
  const scrollRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    scrollRefs.current.forEach((ref) => {
      if (ref) {
        ref.style.opacity = 0;
        ref.style.transform = 'translateY(30px)';
        ref.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(ref);
      }
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el) => {
    if (el && !scrollRefs.current.includes(el)) {
      scrollRefs.current.push(el);
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <div style={styles.logoIconBase}>
              <span style={{fontSize: '20px'}}>✦</span>
            </div>
            <span style={styles.logoText}>AI Evaluator</span>
          </div>
          <div style={styles.navLinks}>
            <button className="btn-premium-secondary" onClick={onLogin} style={{padding: '10px 24px'}}>Login</button>
            <button className="btn-premium-primary" onClick={onGetStarted} style={{padding: '10px 24px'}}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={styles.hero} ref={addToRefs}>
        <div style={styles.heroLeft}>
          <h1 style={styles.heroTitle}>
            AI Grading for<br/>
            Student Answer<br/>
            Sheets
          </h1>
          <p style={styles.heroSubtitle}>
            Upload student answer sheet — AI grades it —<br/>
            Get a detailed 6-section report + PDF.
          </p>
          <div style={styles.heroActions}>
            <button className="btn-premium-primary" onClick={onGetStarted}>Get Started</button>
            <button className="btn-premium-secondary" onClick={() => {}}>
              <span style={{marginRight: '6px', fontSize: '12px'}}>▶</span> Watch Demo
            </button>
          </div>
        </div>

        <div style={styles.heroRight}>
          <div className="glass-card-premium" style={styles.heroMainCard}>
            {/* Top Decor of Main Card */}
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center'}}>
               <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'}}>
                 <div style={{width: '24px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <span style={{color: '#4ce1ff', fontSize: '14px'}}>📦</span>
                 </div>
                 Upload Answer Sheet
               </div>
               <div style={{display: 'flex', gap: '6px'}}>
                 <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)'}}></div>
                 <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)'}}></div>
                 <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)'}}></div>
               </div>
            </div>

            {/* Steps inside the card */}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px'}}>
              
              {/* Step 1 */}
              <div className="glass-card-inner" style={styles.heroMiniCard}>
                <div style={{...styles.heroIconBox, background: 'linear-gradient(135deg, rgba(76,225,255,0.2), rgba(0,0,0,0))'}}>
                  <img src="/assets/upload_icon.png" alt="Upload" style={{width: '40px', height: '40px'}} />
                </div>
                <div style={{fontWeight: '600', fontSize: '13px'}}>Upload<br/>Answer Sheet</div>
              </div>

              {/* Arrow */}
              <div style={{color: 'rgba(255,255,255,0.3)', fontSize: '24px'}}>›</div>

              {/* Step 2 */}
              <div className="glass-card-inner" style={styles.heroMiniCard}>
                <div style={{...styles.heroIconBox, background: 'linear-gradient(135deg, #2a6dff, #4ce1ff)', border: 'none', boxShadow: '0 10px 20px rgba(42,109,255,0.4)'}}>
                  <span style={{fontSize: '28px', fontWeight: '800', color: '#fff'}}>AI</span>
                </div>
                <div style={{fontWeight: '600', fontSize: '13px'}}>AI Evaluates It</div>
              </div>

              {/* Arrow */}
              <div style={{color: 'rgba(255,255,255,0.3)', fontSize: '24px'}}>›</div>

              {/* Step 3 */}
              <div className="glass-card-inner" style={styles.heroMiniCard}>
                <div style={{position: 'absolute', top: '-10px', right: '-10px', background: '#3ccf4e', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', boxShadow: '0 4px 10px rgba(60,207,78,0.4)'}}>✓</div>
                <div style={{...styles.heroIconBox, background: 'rgba(255,255,255,0.05)'}}>
                  <span style={{fontSize: '20px', fontWeight: '800', color: '#b8c1ec'}}>18/20</span>
                </div>
                <div style={{fontWeight: '600', fontSize: '13px'}}>Full 6-Section<br/>Report</div>
              </div>

            </div>
          </div>
        </div>
      </header>

      <div style={styles.separator}></div>

      {/* Complete Evaluation Section */}
      <section style={styles.evalSection} ref={addToRefs}>
        <div style={styles.evalLeft}>
          <h2 style={styles.sectionTitle}>Complete Answer Sheet Evaluation</h2>
          <p style={styles.sectionDesc}>AI grades every question, pinpointing gaps, and generating a<br/>full 6-section report.</p>
          
          <div style={styles.metricsGrid}>
            <div className="glass-card-premium" style={styles.metricCard}>
              <div style={styles.metricHeader}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><span style={{color: '#4ce1ff'}}>📊</span> Score Breakdown</div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {[
                  { lbl: '1', val: 90, color: '#4ce1ff' },
                  { lbl: '3', val: 60, color: '#6874a6' },
                  { lbl: '5', val: 50, color: '#6874a6' },
                  { lbl: '6', val: 75, color: '#6874a6' },
                ].map((bar, i) => (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <span style={{fontSize: '12px', color: 'var(--text-dim)', width: '10px'}}>{bar.lbl}</span>
                    <div style={{flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden'}}>
                       <div style={{width: `${bar.val}%`, height: '100%', background: bar.color}}></div>
                    </div>
                    <span style={{fontSize: '10px', color: 'var(--text-dim)'}}>{bar.val}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card-premium" style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><span style={{color: '#d866ff'}}>🧠</span> Concept Gaps</div>
              </div>
              <p style={{fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.6'}}>
                Place three demonstrations here.<br/>
                AI generated feedback helps pinpoint specific conceptual<br/>
                misunderstandings for student improvement.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.evalRight}>
           {/* Illustration and Overlapping Elements */}
           <div style={styles.teacherGraphicWrap}>
             <img src="/assets/teacher_illustration.png" alt="Teacher grading" style={{width: '100%', maxWidth: '380px', objectFit: 'contain', zIndex: 1, position: 'relative'}} />
             
             {/* PalSomal Report Overlay */}
             <div className="glass-card-premium" style={styles.reportOverlay}>
                <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '12px'}}>
                   <div style={{fontSize: '13px', fontWeight: '600'}}>&lt; PalSomal Report</div>
                </div>
                <div style={{fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px'}}>Score Breakdown</div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#4ce1ff'}}></div>
                    <div>
                      <div style={{fontSize: '12px', fontWeight: 'bold'}}>Core Breakdowns</div>
                      <div style={{fontSize: '9px', color: 'rgba(255,255,255,0.5)'}}>Mathematical logic structure</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#d866ff'}}></div>
                    <div>
                      <div style={{fontSize: '12px', fontWeight: 'bold'}}>Writing Quality</div>
                      <div style={{fontSize: '9px', color: 'rgba(255,255,255,0.5)'}}>Grammar and linguistic flow</div>
                    </div>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={styles.benefitsSection} ref={addToRefs}>
        <div style={{textAlign: 'center', marginBottom: '60px'}}>
          <h2 style={styles.sectionTitle}>Key Benefits of AI Paper Evaluator</h2>
          <p style={styles.sectionDesc}>Transform the way you evaluate exams with our cutting-edge AI tool.</p>
        </div>

        <div style={styles.benefitsGrid}>
          {[
             {icon: 'a', title: 'Boost Productivity', desc: 'Save hours of grading time by automating the entire evaluation process.'},
             {icon: 'b', title: 'Accurate Grading', desc: 'AI compares answers with rubric to grade fairly & accurately.'},
             {icon: 'c', title: 'Actionable Insights', desc: 'Detailed reports highlight where students struggle and need help.'},
             {icon: 'd', title: 'Easy to Use', desc: 'Upload answer sheets in PDF or image format, get instant results.'}
          ].map((item, i) => (
             <div key={i} className="glass-card-premium" style={styles.benefitCard}>
                <div style={{width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)'}}>
                  <img src="/assets/upload_icon.png" alt="icon" style={{width: '32px', height: '32px', opacity: 0.8}} />
                </div>
                <h3 style={{fontSize: '18px', fontWeight: '700', marginBottom: '12px'}}>{item.title}</h3>
                <p style={{fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.6'}}>{item.desc}</p>
             </div>
          ))}
        </div>

        <div style={{textAlign: 'center', marginTop: '50px'}}>
           <button className="btn-premium-primary" onClick={onGetStarted}>Start Uploading — AI Grades It ✨</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{color: 'rgba(255,255,255,0.3)', fontSize: '13px'}}>&copy; 2026 AI Paper Evaluator. Intelligence inside.</div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
    padding: '0 24px',
    position: 'relative',
    zIndex: 1,
  },
  nav: {
    padding: '30px 0',
  },
  navInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    padding: '12px 24px',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '12px'
  },
  logoIconBase: {
    width: '36px', height: '36px',
    background: 'linear-gradient(135deg, #2a6dff, #4ce1ff)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(42,109,255,0.4)',
  },
  logoText: {
    fontFamily: 'Outfit', fontWeight: '800', fontSize: '20px',
    letterSpacing: '-0.5px'
  },
  navLinks: {
    display: 'flex', gap: '12px'
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '60px',
    padding: '80px 0 100px',
    flexWrap: 'wrap',
  },
  heroLeft: {
    flex: '1 1 500px',
  },
  heroTitle: {
    fontSize: 'clamp(56px, 6vw, 76px)',
    fontWeight: '800',
    lineHeight: '1.05',
    marginBottom: '24px',
    letterSpacing: '-2px',
    color: '#ffffff',
    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: 'var(--text-dim)',
    lineHeight: '1.5',
    marginBottom: '40px',
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  heroRight: {
    flex: '1 1 550px',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
  },
  heroMainCard: {
    width: '100%',
    padding: '40px',
  },
  heroMiniCard: {
    flex: 1,
    padding: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    position: 'relative',
  },
  heroIconBox: {
    width: '64px', height: '64px',
    borderRadius: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  separator: {
    width: '100%', height: '1px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.1), rgba(255,255,255,0))',
    margin: '20px 0',
  },
  evalSection: {
    padding: '100px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '40px',
    flexWrap: 'wrap',
  },
  evalLeft: {
    flex: '1 1 500px',
  },
  sectionTitle: {
    fontSize: '38px',
    fontWeight: '800',
    marginBottom: '16px',
    letterSpacing: '-1px',
  },
  sectionDesc: {
    fontSize: '18px',
    color: 'var(--text-dim)',
    marginBottom: '40px',
    lineHeight: '1.6',
  },
  metricsGrid: {
    display: 'flex', gap: '20px', flexWrap: 'wrap'
  },
  metricCard: {
    flex: '1 1 200px',
    padding: '30px',
  },
  metricHeader: {
    fontSize: '16px', fontWeight: '700', marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '12px',
  },
  evalRight: {
    flex: '1 1 500px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '500px',
  },
  teacherGraphicWrap: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  reportOverlay: {
    position: 'absolute',
    top: '20%',
    left: '-10%',
    width: '280px',
    padding: '24px',
    zIndex: 2,
    transform: 'rotate(-4deg)',
  },
  benefitsSection: {
    padding: '100px 0',
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },
  benefitCard: {
    padding: '40px 30px',
  },
  footer: {
    padding: '60px 0',
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    marginTop: '60px',
  }
};
