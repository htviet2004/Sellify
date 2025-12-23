import Icon from './Icon';

export default function PageHeader({ 
  title, 
  subtitle, 
  resultsCount, 
  breadcrumb = null,
  className = ""
}) {
  return (
    <div className={`page-header ${className}`}>
      {breadcrumb && (
        <nav className="breadcrumb">
          {breadcrumb.map((item, index) => (
            <div key={index} className="breadcrumb-item">
              {item.link ? (
                <a href={item.link}>{item.text}</a>
              ) : (
                <span>{item.text}</span>
              )}
              {index < breadcrumb.length - 1 && (
                <span className="breadcrumb-icon">
                  <Icon name="angle-right" size={12} />
                </span>
              )}
            </div>
          ))}
        </nav>
      )}
      
      <h1>{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {resultsCount !== undefined && (
        <p className="results-count">Tìm thấy {resultsCount} sản phẩm</p>
      )}
    </div>
  )
}
