import { useState } from 'react'

function Contact() {
  // useState #1 — controlled textarea (required by practical)
  const [message, setMessage] = useState('')

  // useState #2 — toggle help tooltip visibility (required by practical)
  const [showTip, setShowTip] = useState(false)

  const handleSubmit = () => {
    if (message.trim()) {
      alert(`✅ Message sent!\n\n"${message}"`)
      setMessage('')
    } else {
      alert('⚠️ Please write a message before sending.')
    }
  }

  return (
    <div className="page">
      <h2 style={{ color: '#0d6efd', marginBottom: '1.2rem' }}>Contact Me</h2>

      {/* Name input */}
      <div className="form-group">
        <label htmlFor="name">Your Name</label>
        <input id="name" type="text" placeholder="e.g. Rushil Nariya" />
      </div>

      {/* Message — controlled input tied to useState #1 */}
      <div className="form-group">
        <label htmlFor="message">
          Your Message
          {/* Button uses useState #2 to show/hide tooltip */}
          <button className="tip-btn" onClick={() => setShowTip(!showTip)}>
            {showTip ? 'Hide tip ▲' : 'Need help? ▼'}
          </button>
        </label>

        {/* Tooltip — visible only when showTip is true */}
        {showTip && (
          <p className="tooltip">
            💡 Write a brief message about what you'd like to discuss or collaborate on.
          </p>
        )}

        <textarea
          id="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
        />

        {/* Live character count */}
        <span className="char-count">{message.length} / 300 characters</span>
      </div>

      <button className="submit-btn" onClick={handleSubmit}>
        Send Message
      </button>

      {/* Live preview — updates in real time as user types */}
      {message && (
        <div className="live-preview">
          <strong>Live preview:</strong> {message}
        </div>
      )}
    </div>
  )
}

export default Contact