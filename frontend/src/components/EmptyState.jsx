import { Link } from 'react-router-dom'

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  actionText, 
  actionLink,
  className = ""
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionText && actionLink && (
        <Link to={actionLink} className="empty-action-btn">
          {actionText}
        </Link>
      )}
    </div>
  )
}
