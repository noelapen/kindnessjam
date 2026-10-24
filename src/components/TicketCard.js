import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

// Local Assets
import logoImg from '../../images/logo.png'
import iraImg from '../../images/irakhan.png'
import anshuImg from '../../images/anshu.png'
import anishriyaImg from '../../images/anishriya.png'

export default function TicketCard({ ticket, qrRef, cardRef }) {
  const [qrError, setQrError] = useState('')
  const canvasRef = useRef(null)

  const passId = ticket?.regNo
    ? ticket.regNo.startsWith('KJ-')
      ? ticket.regNo
      : `KJ-${ticket.regNo}`
    : 'KJ-0002'

  useEffect(() => {
    let active = true
    const qrData = ticket?.token || ticket?.regNo || 'KINDNESS-JAM'

    QRCode.toCanvas(canvasRef.current, qrData, {
      errorCorrectionLevel: 'M',
      width: 108,
      margin: 1.5,
      color: { dark: '#000000', light: '#FFFFFF' },
    }).then(() => {
      if (active) setQrError('')
    }).catch((error) => {
      if (active) setQrError(error.message || 'QR error')
    })

    return () => { active = false }
  }, [ticket?.token, ticket?.regNo])

  return (
    <article
      ref={cardRef}
      style={{
        width: '410px',
        margin: '0 auto',
        backgroundColor: '#0F33C4',
        borderRadius: '26px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      className="shadow-2xl"
    >
      {/* Blue Poster Body */}
      <div style={{ padding: '24px 22px 14px 22px' }}>
        
        {/* ROW 1: Header Brand & KU Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 800, 
            letterSpacing: '0.05em', 
            lineHeight: '15px', 
            textTransform: 'uppercase' 
          }}>
            KINDNESS UNLIMITED<br />PRESENTS
          </div>

          <div style={{ 
            width: '64px', 
            height: '54px', 
            backgroundColor: '#ffffff', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '3px', 
            boxSizing: 'border-box', 
            flexShrink: 0 
          }}>
            <img 
              src={logoImg} 
              alt="Kindness Unlimited" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* ROW 2: Title and Date Box */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
          <div>
            <div style={{ fontSize: '35px', fontWeight: 900, lineHeight: '36px', letterSpacing: '-0.02em' }}>
              The Kindness Jam
              <span style={{ color: '#D4F634' }}> 2026</span>
            </div>

            {/* Registered Attendee Pill */}
            <div style={{ 
              marginTop: '10px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: 'rgba(255, 255, 255, 0.16)', 
              border: '1px solid rgba(255, 255, 255, 0.25)', 
              padding: '3px 10px', 
              borderRadius: '6px' 
            }}>
              <span style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.75)', letterSpacing: '0.04em' }}>
                PASS FOR:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                {ticket?.name || 'Guest Pass'}
              </span>
            </div>
          </div>

          {/* Green Date Box (Enlarged) */}
          <div style={{ 
            backgroundColor: '#D4F634', 
            color: '#000000', 
            width: '100px', 
            padding: '10px 6px', 
            borderRadius: '8px', 
            textAlign: 'center', 
            boxSizing: 'border-box', 
            flexShrink: 0, 
            marginTop: '2px' 
          }}>
            <div style={{ fontSize: '13px', fontWeight: 900, lineHeight: '14px', letterSpacing: '0.06em' }}>
              NOV
            </div>
            <div style={{ fontSize: '38px', fontWeight: 900, lineHeight: '36px', margin: '4px 0 3px 0' }}>
              28
            </div>
            <div style={{ fontSize: '9px', fontWeight: 900, lineHeight: '11px', whiteSpace: 'nowrap' }}>
              SAT, 3:30 PM
            </div>
          </div>
        </div>

        {/* 3 Circular Artists Row */}
        <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
          {/* Ira Khan */}
          <div>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', overflow: 'hidden', margin: '0 auto', backgroundColor: '#e2e8f0' }}>
              <img src={iraImg} alt="Ira Khan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '6px', lineHeight: '15px' }}>Ira Khan</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', lineHeight: '12px', marginTop: '2px' }}>Founder & CEO<br />Agatsu Foundation</div>
          </div>

          {/* Anshu Gupta */}
          <div>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', overflow: 'hidden', margin: '0 auto', backgroundColor: '#e2e8f0' }}>
              <img src={anshuImg} alt="Anshu Gupta" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '6px', lineHeight: '15px' }}>Anshu Gupta</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', lineHeight: '12px', marginTop: '2px' }}>Founder of Goonj</div>
          </div>

          {/* Anish and Riya */}
          <div>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', overflow: 'hidden', margin: '0 auto', backgroundColor: '#e2e8f0' }}>
              <img src={anishriyaImg} alt="Anish and Riya" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '6px', lineHeight: '15px' }}>Anish and Riya</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', lineHeight: '12px', marginTop: '2px' }}>Acapella - Beat Box<br />Better Halves</div>
          </div>
        </div>

        {/* ...and many more artists Banner */}
        <div style={{ 
          marginTop: '16px', 
          backgroundColor: '#D4F634', 
          color: '#000000', 
          padding: '6px', 
          borderRadius: '4px', 
          textAlign: 'center', 
          fontWeight: 900, 
          fontSize: '14px', 
          letterSpacing: '-0.01em', 
          lineHeight: '18px' 
        }}>
          ...and many more artists
        </div>

        {/* Bottom Section: Venue & Partner (Left) vs Coral Pass (Right) */}
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          
          {/* Venue & Partner */}
          <div style={{ flex: 1, paddingRight: '4px' }}>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 900, 
              textTransform: 'uppercase', 
              letterSpacing: '0.03em', 
              lineHeight: '15px' 
            }}>
              AN EVENING OF MUSIC, FUN<br />& CELEBRATION
            </div>

            <div style={{ 
              marginTop: '9px', 
              fontSize: '11px', 
              lineHeight: '15px', 
              color: 'rgba(255,255,255,0.95)' 
            }}>
              <span style={{ fontWeight: 800 }}>Venue:</span> D’monte Park Recreation Club Ground, St. Andrew’s Road, Bandra West, Mumbai
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', lineHeight: '12px' }}>
                Communication partner:
              </span>
              <span style={{ 
                backgroundColor: '#ffffff', 
                color: '#000000', 
                padding: '2px 7px', 
                borderRadius: '4px', 
                fontSize: '10px', 
                fontWeight: 900, 
                lineHeight: '13px', 
                display: 'inline-block' 
              }}>
                #Schbang.
              </span>
            </div>
          </div>

          {/* Coral QR Pass Box */}
          <div 
            ref={qrRef}
            style={{ 
              backgroundColor: '#FA7B62', 
              borderRadius: '20px', 
              padding: '9px 10px 8px 10px', 
              textAlign: 'center', 
              flexShrink: 0, 
              width: '140px', 
              boxSizing: 'border-box' 
            }}
          >
            <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em', lineHeight: '11px' }}>
              PASS ID: {passId}
            </div>
            
            {/* Square Inner QR Box */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '2px', 
              padding: '4px', 
              margin: '5px auto', 
              width: '112px', 
              height: '112px', 
              boxSizing: 'border-box', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <canvas ref={canvasRef} style={{ width: '104px', height: '104px', display: 'block' }} />
            </div>

            {qrError && <div style={{ fontSize: '7px', color: '#ffffff' }}>{qrError}</div>}

            <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em', lineHeight: '11px' }}>
              SCAN TO ENTER
            </div>
          </div>

        </div>

      </div>

      {/* Undulating Wavy Edge Divider */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', lineHeight: 0, marginBottom: '-1px' }}>
        <svg 
          viewBox="0 0 500 45" 
          preserveAspectRatio="none" 
          style={{ position: 'relative', display: 'block', width: '100%', height: '22px', color: '#D4F634' }}
        >
          <path 
            d="M0,20 C150,45 350,-5 500,20 L500,45 L0,45 Z" 
            fill="currentColor" 
          />
        </svg>
      </div>

      {/* Yellow Footer */}
      <footer style={{ 
        backgroundColor: '#D4F634', 
        color: '#000000', 
        padding: '10px 14px 16px 14px', 
        textAlign: 'center' 
      }}>
        <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.02em', lineHeight: '12px' }}>
          THE FUN STARTS AT 3:30 PM!!!
        </div>
        <div style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.01em', margin: '3px 0 5px 0', lineHeight: '11px' }}>
          LET US ALL CELEBRATE UNDER THE OPEN SKY
        </div>

        <div style={{ 
          fontSize: '8px', 
          fontWeight: 800, 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '3px', 
          lineHeight: '13px' 
        }}>
          <span>AND DO NOT FORGET YOUR:</span>
          <span style={{ backgroundColor: 'rgba(0,0,0,0.08)', padding: '1px 4px', borderRadius: '3px' }}>HAT ✅</span>
          <span style={{ backgroundColor: 'rgba(0,0,0,0.08)', padding: '1px 4px', borderRadius: '3px' }}>MAT ✅</span>
          <span style={{ backgroundColor: 'rgba(0,0,0,0.08)', padding: '1px 4px', borderRadius: '3px' }}>WATER ✅</span>
          <span style={{ backgroundColor: 'rgba(0,0,0,0.08)', padding: '1px 4px', borderRadius: '3px' }}>KIND HEART ✅✅</span>
        </div>

        <div style={{ marginTop: '6px', fontSize: '9px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: '11px' }}>
          SEE YOU THERE!!
        </div>
      </footer>
    </article>
  )
}