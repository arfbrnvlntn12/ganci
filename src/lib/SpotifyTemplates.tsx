import React from 'react';
import { KeychainItem } from '../types';

export const drawSpotifyTemplateOnCanvas = (
  ctx: CanvasRenderingContext2D,
  item: KeychainItem,
  curX: number,
  curY: number,
  UNIT_W: number,
  UNIT_H: number,
  img: HTMLImageElement
) => {
  ctx.save();
  ctx.translate(curX, curY);

  const t = item.template || 'default';

  // 1. Draw Background
  if (t === 'cinematic') {
    // Blur background
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, UNIT_W, UNIT_H); ctx.clip();
    ctx.filter = 'blur(15px) brightness(0.8)';
    
    // Extender (fill canvas with stretched/blurred image)
    const scale = Math.max(UNIT_W / img.width, UNIT_H / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(img, (UNIT_W - sw)/2, (UNIT_H - sh)/2, sw, sh);
    ctx.restore();
  } else if (t === 'vibrant') {
    ctx.fillStyle = item.bgColor || '#4A3469'; // default purple if not set
    ctx.fillRect(0, 0, UNIT_W, UNIT_H);
  } else if (t === 'classic') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, UNIT_W, UNIT_H);
  } else if (t === 'curator') {
    ctx.fillStyle = '#000000'; // dark bg
    ctx.fillRect(0, 0, UNIT_W, UNIT_H);
  } else {
    // Default bg
    ctx.fillStyle = item.bgColor;
    ctx.fillRect(0, 0, UNIT_W, UNIT_H);
  }

  // 2. Draw Main Photo
  ctx.save();
  if (t === 'cinematic') {
    // exact identical layout padding
    const margin = 20;
    const pw = UNIT_W - (margin * 2); 
    const ph = pw; 
    const px = margin;
    const py = margin;
    
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 15);
    ctx.clip();
    
    // Apply transform for photo
    ctx.translate(px + pw/2, py + ph/2);
    ctx.translate(item.transform.x, item.transform.y);
    ctx.rotate(item.transform.rotate * Math.PI / 180);
    ctx.scale(item.transform.scale, item.transform.scale);
    ctx.drawImage(img, -item.imgW/2, -item.imgH/2, item.imgW, item.imgH);
  } else if (t === 'classic') {
    const pw = UNIT_W - 40;
    const ph = pw;
    const px = 20;
    const py = 30;
    
    // Draw thick border
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4);
    
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    
    ctx.translate(px + pw/2, py + ph/2);
    ctx.translate(item.transform.x, item.transform.y);
    ctx.rotate(item.transform.rotate * Math.PI / 180);
    ctx.scale(item.transform.scale, item.transform.scale);
    ctx.drawImage(img, -item.imgW/2, -item.imgH/2, item.imgW, item.imgH);
  } else if (t === 'vibrant') {
    // Photo fills top half
    const pw = UNIT_W;
    const ph = UNIT_H * 0.65;
    
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    
    ctx.translate(pw/2, ph/2);
    ctx.translate(item.transform.x, item.transform.y);
    ctx.rotate(item.transform.rotate * Math.PI / 180);
    ctx.scale(item.transform.scale, item.transform.scale);
    ctx.drawImage(img, -item.imgW/2, -item.imgH/2, item.imgW, item.imgH);
  } else if (t === 'curator') {
    // square photo top leftish
    const pw = 150;
    const ph = 150;
    const px = 20;
    const py = 60;
    
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    
    ctx.translate(px + pw/2, py + ph/2);
    ctx.translate(item.transform.x, item.transform.y);
    ctx.rotate(item.transform.rotate * Math.PI / 180);
    ctx.scale(item.transform.scale, item.transform.scale);
    ctx.drawImage(img, -item.imgW/2, -item.imgH/2, item.imgW, item.imgH);
  }
  ctx.restore();

  // 3. Draw Overlay Elements (Text, Icons)
  if (t === 'cinematic') {
    const margin = 20;
    // 1. Background Overlay (dark gradient over the blurred photo)
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, UNIT_H);
    grad.addColorStop(0, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, UNIT_W, UNIT_H);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // iPhone text
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `12px ${item.fontFamily}`;
    ctx.fillText('iPhone', margin, 345);

    // AirPlay Icon
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(UNIT_W - margin - 10, 355, 10, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(UNIT_W - margin - 10, 355, 6, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(UNIT_W - margin - 10, 350); ctx.lineTo(UNIT_W - margin - 4, 360); ctx.lineTo(UNIT_W - margin - 16, 360); ctx.fill();

    // Song Title
    ctx.font = `bold 24px ${item.fontFamily}`;
    ctx.fillText(item.songTitle || 'NANTI KITA SEPERTI INI', margin, 370);
    
    // Artist
    ctx.font = `italic 18px ${item.fontFamily}`;
    ctx.fillText(item.artistName || 'Batas Senja', margin, 400);
    
    // progress bar
    const barY = 440;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(margin, barY, UNIT_W - (margin * 2), 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(margin, barY, (UNIT_W - (margin * 2)) * 0.3, 4);
    ctx.beginPath();
    ctx.arc(margin + (UNIT_W - (margin * 2)) * 0.3, barY + 2, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Times
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `11px ${item.fontFamily}`;
    ctx.fillText('1:27', margin, 452);
    ctx.textAlign = 'right';
    ctx.fillText('-3:22', UNIT_W - margin, 452);
    ctx.textAlign = 'left';
    
    // controls (Pause, Prev, Next)
    ctx.fillStyle = '#ffffff';
    const cy = 495;
    // Pause
    ctx.beginPath(); ctx.roundRect(UNIT_W/2 - 14, cy - 15, 10, 30, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(UNIT_W/2 + 4, cy - 15, 10, 30, 2); ctx.fill();
    // Prev
    ctx.beginPath(); ctx.moveTo(UNIT_W/2 - 40, cy); ctx.lineTo(UNIT_W/2 - 20, cy - 12); ctx.lineTo(UNIT_W/2 - 20, cy + 12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(UNIT_W/2 - 60, cy); ctx.lineTo(UNIT_W/2 - 40, cy - 12); ctx.lineTo(UNIT_W/2 - 40, cy + 12); ctx.fill();
    // Next
    ctx.beginPath(); ctx.moveTo(UNIT_W/2 + 40, cy); ctx.lineTo(UNIT_W/2 + 20, cy - 12); ctx.lineTo(UNIT_W/2 + 20, cy + 12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(UNIT_W/2 + 60, cy); ctx.lineTo(UNIT_W/2 + 40, cy - 12); ctx.lineTo(UNIT_W/2 + 40, cy + 12); ctx.fill();
    
    // Volume slider
    const volY = 550;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.moveTo(margin + 4, volY - 3); ctx.lineTo(margin + 8, volY - 3); ctx.lineTo(margin + 12, volY - 7); ctx.lineTo(margin + 12, volY + 9); ctx.lineTo(margin + 8, volY + 5); ctx.lineTo(margin + 4, volY + 5); ctx.fill();
    
    ctx.beginPath(); ctx.moveTo(UNIT_W - margin - 20, volY - 3); ctx.lineTo(UNIT_W - margin - 16, volY - 3); ctx.lineTo(UNIT_W - margin - 12, volY - 7); ctx.lineTo(UNIT_W - margin - 12, volY + 9); ctx.lineTo(UNIT_W - margin - 16, volY + 5); ctx.lineTo(UNIT_W - margin - 20, volY + 5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(UNIT_W - margin - 12, volY + 1, 5, -Math.PI/3, Math.PI/3); ctx.stroke();
    ctx.beginPath(); ctx.arc(UNIT_W - margin - 12, volY + 1, 9, -Math.PI/3, Math.PI/3); ctx.stroke();
    
    const sLeft = margin + 25;
    const sWidth = UNIT_W - (margin * 2) - 55;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(sLeft, volY, sWidth, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sLeft, volY, sWidth * 0.7, 3);
    ctx.beginPath();
    ctx.arc(sLeft + sWidth * 0.7, volY + 1.5, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (t === 'classic') {
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    ctx.font = `bold 22px ${item.fontFamily}`;
    ctx.fillText(item.songTitle || 'SONG TITLE', 20, 390);
    
    ctx.font = `italic 18px ${item.fontFamily}`;
    ctx.fillText(item.artistName || 'Artist Name', 20, 415);
    
    // heart
    ctx.fillStyle = '#1DB954';
    ctx.beginPath();
    ctx.arc(UNIT_W - 30, 400, 10, 0, Math.PI*2);
    ctx.fill();
    
    // progress bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(20, 450, UNIT_W - 40, 4);
    
    ctx.font = `bold 12px ${item.fontFamily}`;
    ctx.fillText('1:11', 20, 460);
    ctx.textAlign = 'right';
    ctx.fillText('3:31', UNIT_W - 20, 460);
    
    // circle play button
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(UNIT_W/2, 490, 20, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(UNIT_W/2 - 5, 480); ctx.lineTo(UNIT_W/2 + 8, 490); ctx.lineTo(UNIT_W/2 - 5, 500); ctx.fill();
    
    // Spotify Code (mock lines)
    ctx.fillStyle = '#000000';
    const numLines = 20;
    for(let i=0; i<numLines; i++) {
        const h = 10 + Math.random() * 20;
        ctx.fillRect(70 + i*12, 530 - h/2, 4, h);
    }
    // spotify logo circle
    ctx.beginPath();
    ctx.arc(40, 530, 20, 0, Math.PI*2);
    ctx.fill();
    
  } else if (t === 'vibrant') {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    ctx.font = `bold 22px ${item.fontFamily}`;
    ctx.fillText(item.songTitle || 'SONG TITLE', 20, 410);
    
    ctx.font = `italic 18px ${item.fontFamily}`;
    ctx.fillText(item.artistName || 'Artist Name', 20, 435);
    
    // heart
    ctx.fillStyle = '#1DB954';
    ctx.beginPath();
    ctx.arc(UNIT_W - 30, 420, 10, 0, Math.PI*2);
    ctx.fill();
    
    // progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(20, 480, UNIT_W - 40, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 480, (UNIT_W - 40) * 0.1, 4);
    ctx.beginPath();
    ctx.arc(20 + (UNIT_W - 40) * 0.1, 482, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = `12px ${item.fontFamily}`;
    ctx.fillText('0:02', 20, 495);
    ctx.textAlign = 'right';
    ctx.fillText('-3:28', UNIT_W - 20, 495);
    
    // big circle play button
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(UNIT_W/2, 540, 30, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillRect(UNIT_W/2 - 8, 530, 6, 20);
    ctx.fillRect(UNIT_W/2 + 2, 530, 6, 20);
    
  } else if (t === 'curator') {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    ctx.font = `bold 10px ${item.fontFamily}`;
    ctx.fillText('PLAYLIST', 190, 60);
    
    ctx.font = `bold 26px ${item.fontFamily}`;
    const lines = (item.songTitle || 'I LOVE YOU SO').split(' ');
    ctx.fillText(lines.slice(0, Math.ceil(lines.length/2)).join(' '), 190, 80);
    if(lines.length > 1) {
        ctx.fillText(lines.slice(Math.ceil(lines.length/2)).join(' '), 190, 110);
    }
    
    ctx.font = `10px ${item.fontFamily}`;
    ctx.fillText('Created by ' + (item.artistName || 'cassie roberto'), 190, 150);
    
    // Play button
    ctx.fillStyle = '#1DB954';
    ctx.beginPath();
    ctx.roundRect(190, 180, 80, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 12px ${item.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('PLAY', 230, 188);
    
    // Tracklist
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888888';
    ctx.font = `bold 10px ${item.fontFamily}`;
    ctx.fillText('TITLE', 40, 240);
    ctx.fillText('ARTIST', 240, 240);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `12px ${item.fontFamily}`;
    ctx.fillText('1. I Fall In Love...', 40, 270);
    ctx.fillText('Chet Baker', 240, 270);
    ctx.fillText('2. Eddie My Love', 40, 300);
    ctx.fillText('The Chordettes', 240, 300);
    ctx.fillText('3. At Last', 40, 330);
    ctx.fillText('Etta James', 240, 330);
    
    // bottom player
    ctx.fillStyle = '#282828';
    ctx.fillRect(0, 420, UNIT_W, UNIT_H - 420);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 470, UNIT_W - 40, 4);
    
    ctx.beginPath();
    ctx.arc(UNIT_W/2, 520, 25, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#282828';
    ctx.fillRect(UNIT_W/2 - 6, 510, 4, 20);
    ctx.fillRect(UNIT_W/2 + 2, 510, 4, 20);
  }

  ctx.restore();
};

export const SpotifyTemplatePreview: React.FC<{ item: KeychainItem, ratio: number, imgRef: any }> = ({ item, ratio, imgRef }) => {
  const t = item.template || 'default';
  
  if (t === 'default') return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {/* Cinematic Variant */}
      {t === 'cinematic' && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)', zIndex: 1 }} />
          <div className="w-full h-full text-white text-left relative" style={{ fontFamily: item.fontFamily, zIndex: 2 }}>
            
            <div style={{ position: 'absolute', left: 20 * ratio, top: 345 * ratio, fontSize: 12 * ratio, color: 'rgba(255,255,255,0.7)' }}>
              iPhone
            </div>

            <svg style={{ position: 'absolute', right: 20 * ratio, top: 345 * ratio }} width={20*ratio} height={20*ratio} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21L17 14H7L12 21Z" fill="currentColor" stroke="none" />
              <path d="M12 4C15.866 4 19 7.13401 19 11" stroke="currentColor" />
              <path d="M12 7C14.2091 7 16 8.79086 16 11" stroke="currentColor" />
            </svg>

            <h3 style={{ position: 'absolute', left: 20 * ratio, top: 370 * ratio, fontSize: 24 * ratio, fontWeight: 'bold', margin: 0, lineHeight: 1 }}>
              {item.songTitle || 'NANTI KITA SEPERTI INI'}
            </h3>

            <p style={{ position: 'absolute', left: 20 * ratio, top: 400 * ratio, fontSize: 18 * ratio, fontStyle: 'italic', margin: 0, color: 'rgba(255,255,255,0.8)' }}>
              {item.artistName || 'Batas Senja'}
            </p>

            {/* Progress bar */}
            <div style={{ position: 'absolute', left: 20 * ratio, top: 440 * ratio, width: (UNIT_W - 40) * ratio, height: 4 * ratio, background: 'rgba(255,255,255,0.3)', borderRadius: 2 * ratio }}>
              <div style={{ width: '30%', height: '100%', background: '#fff', borderRadius: 2 * ratio, position: 'relative' }}>
                 <div style={{ position: 'absolute', right: -3*ratio, top: -1*ratio, width: 6*ratio, height: 6*ratio, background: '#fff', borderRadius: '50%' }} />
              </div>
            </div>

            {/* Times */}
            <div style={{ position: 'absolute', left: 20 * ratio, top: 452 * ratio, fontSize: 11 * ratio, color: 'rgba(255,255,255,0.6)' }}>1:27</div>
            <div style={{ position: 'absolute', right: 20 * ratio, top: 452 * ratio, fontSize: 11 * ratio, color: 'rgba(255,255,255,0.6)' }}>-3:22</div>

            {/* Controls */}
            <div style={{ position: 'absolute', top: 480 * ratio, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40 * ratio }}>
              {/* Prev */}
              <div className="flex" style={{ transform: 'scale(1.5)' }}>
                 <div style={{ width: 0, height: 0, borderTop: `${6*ratio}px solid transparent`, borderBottom: `${6*ratio}px solid transparent`, borderRight: `${10*ratio}px solid #fff` }} />
                 <div style={{ width: 0, height: 0, borderTop: `${6*ratio}px solid transparent`, borderBottom: `${6*ratio}px solid transparent`, borderRight: `${10*ratio}px solid #fff` }} />
              </div>
              {/* Pause */}
              <div style={{ width: 14 * ratio, height: 30 * ratio, display: 'flex', justifyContent: 'space-between' }}>
                 <div style={{ width: 5*ratio, background: '#fff', borderRadius: 2*ratio }} />
                 <div style={{ width: 5*ratio, background: '#fff', borderRadius: 2*ratio }} />
              </div>
              {/* Next */}
              <div className="flex" style={{ transform: 'scale(1.5)' }}>
                 <div style={{ width: 0, height: 0, borderTop: `${6*ratio}px solid transparent`, borderBottom: `${6*ratio}px solid transparent`, borderLeft: `${10*ratio}px solid #fff` }} />
                 <div style={{ width: 0, height: 0, borderTop: `${6*ratio}px solid transparent`, borderBottom: `${6*ratio}px solid transparent`, borderLeft: `${10*ratio}px solid #fff` }} />
              </div>
            </div>

            {/* Volume */}
            <div style={{ position: 'absolute', top: 546 * ratio, left: 24 * ratio, right: 30 * ratio, display: 'flex', alignItems: 'center', gap: 10 * ratio }}>
              <svg width={14*ratio} height={14*ratio} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.5}}>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon>
              </svg>
              <div style={{ height: 3 * ratio, background: 'rgba(255,255,255,0.3)', borderRadius: 2 * ratio, flex: 1 }}>
                <div style={{ width: '70%', height: '100%', background: '#fff', borderRadius: 2 * ratio, position: 'relative' }}>
                   <div style={{ position: 'absolute', right: -4*ratio, top: -2.5*ratio, width: 8*ratio, height: 8*ratio, background: '#fff', borderRadius: '50%' }} />
                </div>
              </div>
              <svg width={18*ratio} height={18*ratio} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.5}}>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </div>
          </div>
        </>
      )}

      {/* Classic Variant */}
      {t === 'classic' && (
        <div className="w-full h-full text-black text-left relative flex flex-col" style={{ padding: 20 * ratio, fontFamily: item.fontFamily }}>
          <div className="flex-1"></div>
          <div style={{ marginBottom: 10 * ratio, position: 'relative' }}>
            <h3 style={{ fontSize: 18 * ratio, fontWeight: 'bold', margin: '4px 0', lineHeight: 1 }}>{item.songTitle || 'SONG TITLE'}</h3>
            <p style={{ fontSize: 14 * ratio, fontStyle: 'italic', margin: 0 }}>{item.artistName || 'Artist Name'}</p>
            <div style={{ position: 'absolute', right: 0, top: 10*ratio, color: '#1DB954' }}>💚</div>
          </div>
          <div style={{ height: 3 * ratio, background: '#000', borderRadius: 2 * ratio, margin: `${10*ratio}px 0` }} />
          <div className="flex justify-between" style={{ fontSize: 8 * ratio, fontWeight: 'bold' }}>
            <span>1:11</span>
            <span>3:31</span>
          </div>
          <div className="flex justify-center items-center" style={{ marginTop: 5 * ratio }}>
            <div style={{ width: 24*ratio, height: 24*ratio, background: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ width: 0, height: 0, borderTop: `${4*ratio}px solid transparent`, borderBottom: `${4*ratio}px solid transparent`, borderLeft: `${6*ratio}px solid #fff`, marginLeft: 2*ratio }} />
            </div>
          </div>
          <div className="flex justify-center items-center" style={{ marginTop: 10 * ratio, gap: 5*ratio }}>
            <div style={{ width: 20*ratio, height: 20*ratio, background: '#1DB954', borderRadius: '50%' }} />
            <div className="flex items-center gap-1" style={{ height: 20*ratio }}>
               {Array.from({length: 15}).map((_, i) => (
                 <div key={i} style={{ width: 2*ratio, height: `${(Math.random() * 10 + 5) * ratio}px`, background: '#000', borderRadius: ratio }} />
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Vibrant Variant */}
      {t === 'vibrant' && (
        <div className="w-full h-full text-white text-left relative flex flex-col" style={{ padding: 20 * ratio, fontFamily: item.fontFamily }}>
          <div className="flex-1"></div>
          <div style={{ marginBottom: 10 * ratio, position: 'relative' }}>
            <h3 style={{ fontSize: 18 * ratio, fontWeight: 'bold', margin: '4px 0', lineHeight: 1 }}>{item.songTitle || 'SONG TITLE'}</h3>
            <p style={{ fontSize: 14 * ratio, fontStyle: 'italic', margin: 0, opacity: 0.9 }}>{item.artistName || 'Artist Name'}</p>
            <div style={{ position: 'absolute', right: 0, top: 10*ratio, color: '#1DB954' }}>💚</div>
          </div>
          <div style={{ height: 3 * ratio, background: 'rgba(255,255,255,0.3)', borderRadius: 2 * ratio, margin: `${10*ratio}px 0` }}>
            <div style={{ width: '10%', height: '100%', background: '#fff', borderRadius: 2 * ratio, position: 'relative' }}>
               <div style={{ position: 'absolute', right: -4*ratio, top: -2*ratio, width: 8*ratio, height: 8*ratio, background: '#fff', borderRadius: '50%' }} />
            </div>
          </div>
          <div className="flex justify-between" style={{ fontSize: 10 * ratio, opacity: 0.9 }}>
            <span>0:02</span>
            <span>-3:28</span>
          </div>
          <div className="flex justify-center items-center" style={{ marginTop: 15 * ratio }}>
            <div style={{ width: 36*ratio, height: 36*ratio, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ width: 10 * ratio, height: 14 * ratio, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: 3*ratio, background: '#000' }} />
                  <div style={{ width: 3*ratio, background: '#000' }} />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Curator Variant */}
      {t === 'curator' && (
        <div className="w-full h-full text-white text-left relative flex flex-col" style={{ fontFamily: item.fontFamily }}>
          <div style={{ padding: `${30*ratio}px ${10*ratio}px ${10*ratio}px ${160*ratio}px` }}>
            <p style={{ fontSize: 8 * ratio, fontWeight: 'bold', margin: 0 }}>PLAYLIST</p>
            <h3 style={{ fontSize: 18 * ratio, fontWeight: 'black', margin: '4px 0', lineHeight: 1.1 }}>{item.songTitle || 'I LOVE YOU SO'}</h3>
            <p style={{ fontSize: 8 * ratio, margin: 0, opacity: 0.8, marginTop: 10*ratio }}>Created by {item.artistName || 'cassie roberto'}</p>
            <div style={{ background: '#1DB954', borderRadius: 15*ratio, width: 60*ratio, height: 20*ratio, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10*ratio, fontSize: 8*ratio, fontWeight: 'bold' }}>PLAY</div>
          </div>
          <div style={{ padding: `0 ${20*ratio}px`, marginTop: 20*ratio }}>
            <div className="flex" style={{ fontSize: 8*ratio, color: '#888', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: 5*ratio, marginBottom: 5*ratio }}>
               <span style={{ width: '50%' }}>TITLE</span>
               <span>ARTIST</span>
            </div>
            <div className="flex" style={{ fontSize: 10*ratio, marginBottom: 5*ratio }}>
               <span style={{ width: '50%' }}>1. I Fall In Love...</span>
               <span style={{ color: '#aaa' }}>Chet Baker</span>
            </div>
            <div className="flex" style={{ fontSize: 10*ratio, marginBottom: 5*ratio }}>
               <span style={{ width: '50%' }}>2. Eddie My Love</span>
               <span style={{ color: '#aaa' }}>The Chordettes</span>
            </div>
          </div>
          <div className="flex-1"></div>
          <div style={{ background: '#282828', height: 80*ratio, padding: 10*ratio }}>
             <div style={{ height: 3 * ratio, background: '#fff', borderRadius: 2 * ratio, margin: `${10*ratio}px 0` }} />
             <div className="flex justify-center items-center" style={{ marginTop: 10 * ratio }}>
                <div style={{ width: 24*ratio, height: 24*ratio, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{ width: 8 * ratio, height: 10 * ratio, display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ width: 2.5*ratio, background: '#000' }} />
                      <div style={{ width: 2.5*ratio, background: '#000' }} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
