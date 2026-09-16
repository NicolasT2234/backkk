// Modal de confirmacion reutilizable.
// Mantiene exactamente las mismas clases CSS del HTML original
// (card, header, image, content, title, message, actions, desactivate, cancel)
// para que los estilos de alquiler.css / multas.css / noticias.css apliquen igual.

function ConfirmModal({ show, title, message, confirmText, onConfirm, onCancel }) {
  if (!show) return null

  return (
    <div
      style={{
        display: "flex",
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="card">
        <div className="header">
          <div className="image">
            <svg aria-hidden="true" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                strokeLinejoin="round"
                strokeLinecap="round"
              ></path>
            </svg>
          </div>
          <div className="content">
            <span className="title">{title}</span>
            <p className="message">{message}</p>
          </div>
          <div className="actions">
            <button className="desactivate" type="button" onClick={onConfirm}>
              {confirmText}
            </button>
            <button className="cancel" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
