import { useState, useRef, useCallback } from 'react';

const DEVICES = [
  {
    id: 'mobile',
    label: 'Mobile',
    icon: '\u{1F4F1}',
    width: 320,
    height: 640,
    frameWidth: 348,
    frameHeight: 700,
    borderRadius: 36,
  },
  {
    id: 'tablet',
    label: 'Tablet',
    icon: '\u{1F4CB}',
    width: 480,
    height: 640,
    frameWidth: 508,
    frameHeight: 700,
    borderRadius: 24,
  },
  {
    id: 'desktop',
    label: 'Desktop',
    icon: '\u{1F5A5}',
    width: 640,
    height: 480,
    frameWidth: 668,
    frameHeight: 520,
    borderRadius: 12,
  },
];

function PreviewPanel({ previewUrl, refreshKey }) {
  const [device, setDevice] = useState('mobile');
  const [loading, setLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const iframeRef = useRef(null);

  const currentDevice = DEVICES.find((d) => d.id === device) || DEVICES[0];

  const handleRefresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
    setLoading(true);
    if (iframeRef.current) {
      // Force reload by resetting src
      const src = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = src;
      }, 50);
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const isMobile = device === 'mobile';

  return (
    <div className="editor-center" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      padding: '16px',
      background: 'var(--bg-secondary, #F3F4F6)',
      overflow: 'auto',
    }}>
      {/* Controls bar */}
      <div className="preview-controls" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 700,
        marginBottom: 16,
      }}>
        <div className="device-toggle" style={{
          display: 'flex',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--border, #E5E7EB)',
        }}>
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: device === d.id ? '#7c3aed' : '#FFFFFF',
                color: device === d.id ? '#FFFFFF' : 'var(--text-secondary, #6B7280)',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14 }}>{d.icon}</span>
              {d.label}
            </button>
          ))}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleRefresh}
          disabled={!previewUrl}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid var(--border, #E5E7EB)',
            borderRadius: 6,
            cursor: previewUrl ? 'pointer' : 'not-allowed',
            background: '#FFFFFF',
            color: 'var(--text-secondary, #6B7280)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            opacity: previewUrl ? 1 : 0.5,
          }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.3s',
            transform: loading ? 'rotate(360deg)' : 'rotate(0deg)',
          }}>
            &#8635;
          </span>
          Refresh Preview
        </button>
      </div>

      {/* Device frame */}
      <div style={{
        position: 'relative',
        width: currentDevice.frameWidth,
        height: currentDevice.frameHeight,
        flexShrink: 0,
        transition: 'all 0.3s ease',
      }}>
        {/* Outer phone border */}
        <div style={{
          position: 'absolute',
          inset: 0,
          border: isMobile ? '8px solid #1F2937' : device === 'tablet' ? '6px solid #374151' : '4px solid #4B5563',
          borderRadius: currentDevice.borderRadius,
          background: '#1F2937',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          {/* Notch (mobile only) */}
          {isMobile && (
            <div className="phone-notch" style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 24,
              background: '#1F2937',
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: '#374151',
              }} />
            </div>
          )}

          {/* Screen area */}
          <div className="phone-screen" style={{
            position: 'absolute',
            top: isMobile ? 24 : device === 'tablet' ? 8 : 4,
            left: isMobile ? 4 : device === 'tablet' ? 4 : 4,
            right: isMobile ? 4 : device === 'tablet' ? 4 : 4,
            bottom: isMobile ? 24 : device === 'tablet' ? 8 : 4,
            borderRadius: isMobile ? 8 : 4,
            overflow: 'hidden',
            background: '#FFFFFF',
          }}>
            {/* Loading overlay */}
            {loading && previewUrl && (
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(2px)',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  border: '3px solid #E5E7EB',
                  borderTopColor: '#7c3aed',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ fontSize: 12, color: 'var(--text-muted, #9CA3AF)', marginTop: 8 }}>
                  Loading preview...
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {previewUrl ? (
              <iframe
                ref={iframeRef}
                key={`${refreshKey}-${refreshCount}`}
                src={previewUrl}
                title="Campaign Preview"
                sandbox="allow-scripts allow-same-origin allow-popups"
                onLoad={handleIframeLoad}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            ) : (
              <div className="preview-placeholder" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: 24,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              }}>
                <div style={{
                  fontSize: 48,
                  marginBottom: 12,
                  opacity: 0.3,
                }}>
                  &#128247;
                </div>
                <div style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'var(--text-secondary, #6B7280)',
                  marginBottom: 4,
                }}>
                  Preview not available
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-muted, #9CA3AF)',
                  lineHeight: 1.5,
                }}>
                  Save the layout to generate a preview link.
                </div>
              </div>
            )}
          </div>

          {/* Home bar (mobile only) */}
          {isMobile && (
            <div style={{
              position: 'absolute',
              bottom: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: 4,
              borderRadius: 2,
              background: '#4B5563',
            }} />
          )}
        </div>
      </div>

      {/* Dimensions label */}
      <div style={{
        marginTop: 8,
        fontSize: 11,
        color: 'var(--text-muted, #9CA3AF)',
        fontFamily: 'monospace',
      }}>
        {currentDevice.width} x {currentDevice.height}
      </div>
    </div>
  );
}

export default PreviewPanel;
